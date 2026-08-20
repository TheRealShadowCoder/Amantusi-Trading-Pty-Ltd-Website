#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ID="${PROJECT_ID:-amantusi-trading-pty-ltd}"
REGION="${REGION:-us-central1}"
AR_REPO="${AR_REPO:-amantusi-containers}"
SERVICE="${SERVICE:-amantusi-overflow}"
RUNTIME_SA="${RUNTIME_SA:-amantusi-overflow-runtime}"
DEPLOYER_SA="${DEPLOYER_SA:-amantusi-github-deployer}"
POOL_ID="${POOL_ID:-amantusi-github-pool}"
PROVIDER_ID="${PROVIDER_ID:-amantusi-github}"
GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-TheRealShadowCoder/Amantusi-Trading-Pty-Ltd-Website}"
GITHUB_OWNER="${GITHUB_OWNER:-TheRealShadowCoder}"
DEPLOY_NOW="${DEPLOY_NOW:-1}"

say() { printf '\n==> %s\n' "$*"; }
exists() { "$@" >/dev/null 2>&1; }

say "Selecting Google Cloud project ${PROJECT_ID}"
gcloud config set project "${PROJECT_ID}" >/dev/null
PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')"
if [[ -z "${PROJECT_NUMBER}" ]]; then
  echo "Could not resolve project number for ${PROJECT_ID}." >&2
  exit 1
fi

say "Checking billing status"
BILLING_ENABLED="$(gcloud beta billing projects describe "${PROJECT_ID}" --format='value(billingEnabled)' 2>/dev/null || true)"
if [[ "${BILLING_ENABLED}" != "True" && "${BILLING_ENABLED}" != "true" ]]; then
  echo "Billing is not enabled for ${PROJECT_ID}. Google Cloud requires an active billing account even for Free Tier resources." >&2
  exit 2
fi

say "Enabling only the APIs required by this architecture"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com \
  cloudresourcemanager.googleapis.com \
  serviceusage.googleapis.com \
  --project="${PROJECT_ID}" >/dev/null

say "Creating Artifact Registry repository if needed"
if ! exists gcloud artifacts repositories describe "${AR_REPO}" --location="${REGION}" --project="${PROJECT_ID}"; then
  gcloud artifacts repositories create "${AR_REPO}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Amantusi cost-capped Cloud Run images" \
    --disable-vulnerability-scanning \
    --project="${PROJECT_ID}"
fi

say "Applying aggressive Artifact Registry cleanup policy"
POLICY_FILE="$(mktemp)"
cat >"${POLICY_FILE}" <<'JSON'
[
  {
    "name": "delete-old-versions",
    "action": {"type": "Delete"},
    "condition": {"tagState": "any", "olderThan": "7d"}
  },
  {
    "name": "keep-two-most-recent",
    "action": {"type": "Keep"},
    "mostRecentVersions": {"keepCount": 2}
  }
]
JSON
gcloud artifacts repositories set-cleanup-policies "${AR_REPO}" \
  --project="${PROJECT_ID}" \
  --location="${REGION}" \
  --policy="${POLICY_FILE}" \
  --no-dry-run >/dev/null
rm -f "${POLICY_FILE}"

say "Creating least-privilege service accounts"
if ! exists gcloud iam service-accounts describe "${RUNTIME_SA}@${PROJECT_ID}.iam.gserviceaccount.com" --project="${PROJECT_ID}"; then
  gcloud iam service-accounts create "${RUNTIME_SA}" \
    --display-name="Amantusi Cloud Run runtime" \
    --project="${PROJECT_ID}"
fi
if ! exists gcloud iam service-accounts describe "${DEPLOYER_SA}@${PROJECT_ID}.iam.gserviceaccount.com" --project="${PROJECT_ID}"; then
  gcloud iam service-accounts create "${DEPLOYER_SA}" \
    --display-name="Amantusi GitHub deployer" \
    --project="${PROJECT_ID}"
fi
RUNTIME_EMAIL="${RUNTIME_SA}@${PROJECT_ID}.iam.gserviceaccount.com"
DEPLOYER_EMAIL="${DEPLOYER_SA}@${PROJECT_ID}.iam.gserviceaccount.com"

say "Granting only deployment permissions"
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${DEPLOYER_EMAIL}" \
  --role="roles/run.admin" \
  --condition=None >/dev/null

gcloud artifacts repositories add-iam-policy-binding "${AR_REPO}" \
  --location="${REGION}" \
  --project="${PROJECT_ID}" \
  --member="serviceAccount:${DEPLOYER_EMAIL}" \
  --role="roles/artifactregistry.writer" >/dev/null

gcloud iam service-accounts add-iam-policy-binding "${RUNTIME_EMAIL}" \
  --project="${PROJECT_ID}" \
  --member="serviceAccount:${DEPLOYER_EMAIL}" \
  --role="roles/iam.serviceAccountUser" >/dev/null

say "Creating GitHub Workload Identity Federation pool"
if ! exists gcloud iam workload-identity-pools describe "${POOL_ID}" --location=global --project="${PROJECT_ID}"; then
  gcloud iam workload-identity-pools create "${POOL_ID}" \
    --location=global \
    --display-name="Amantusi GitHub Actions" \
    --description="Keyless GitHub Actions authentication for Amantusi" \
    --project="${PROJECT_ID}"
fi

say "Creating GitHub OIDC provider restricted to this repository and main branch"
if ! exists gcloud iam workload-identity-pools providers describe "${PROVIDER_ID}" --location=global --workload-identity-pool="${POOL_ID}" --project="${PROJECT_ID}"; then
  gcloud iam workload-identity-pools providers create-oidc "${PROVIDER_ID}" \
    --location=global \
    --workload-identity-pool="${POOL_ID}" \
    --display-name="Amantusi GitHub OIDC" \
    --issuer-uri="https://token.actions.githubusercontent.com/" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner,attribute.ref=assertion.ref" \
    --attribute-condition="assertion.repository=='${GITHUB_REPOSITORY}' && assertion.repository_owner=='${GITHUB_OWNER}' && assertion.ref=='refs/heads/main'" \
    --project="${PROJECT_ID}"
fi

say "Allowing only this GitHub repository to impersonate the deployer service account"
gcloud iam service-accounts add-iam-policy-binding "${DEPLOYER_EMAIL}" \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/attribute.repository/${GITHUB_REPOSITORY}" >/dev/null

if [[ "${DEPLOY_NOW}" == "1" ]]; then
  if [[ ! -f gcp/cloud-run-overflow/Dockerfile ]]; then
    echo "gcp/cloud-run-overflow/Dockerfile was not found. Run this script from the repository root, or set DEPLOY_NOW=0 for infrastructure-only setup." >&2
    exit 3
  fi

  say "Building the tiny container directly inside free Google Cloud Shell"
  IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/${SERVICE}:bootstrap"
  gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
  docker build --pull -t "${IMAGE}" gcp/cloud-run-overflow
  docker push "${IMAGE}"

  say "Deploying a private, scale-to-zero, max-one-instance Cloud Run service"
  gcloud run deploy "${SERVICE}" \
    --image="${IMAGE}" \
    --region="${REGION}" \
    --project="${PROJECT_ID}" \
    --service-account="${RUNTIME_EMAIL}" \
    --no-allow-unauthenticated \
    --ingress=all \
    --min=0 \
    --max=1 \
    --concurrency=80 \
    --cpu=1 \
    --memory=256Mi \
    --timeout=30s \
    --execution-environment=gen1 \
    --labels="app=amantusi-overflow,cost-profile=free-tier-guarded"
fi

WIF_PROVIDER="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/providers/${PROVIDER_ID}"
SERVICE_URL="$(gcloud run services describe "${SERVICE}" --region="${REGION}" --project="${PROJECT_ID}" --format='value(status.url)' 2>/dev/null || true)"

say "Setup complete"
printf '%s\n' \
  "GCP_PROJECT_ID=${PROJECT_ID}" \
  "GCP_PROJECT_NUMBER=${PROJECT_NUMBER}" \
  "GCP_REGION=${REGION}" \
  "GCP_ARTIFACT_REPOSITORY=${AR_REPO}" \
  "GCP_CLOUD_RUN_SERVICE=${SERVICE}" \
  "GCP_RUNTIME_SERVICE_ACCOUNT=${RUNTIME_EMAIL}" \
  "GCP_SERVICE_ACCOUNT=${DEPLOYER_EMAIL}" \
  "GCP_WORKLOAD_IDENTITY_PROVIDER=${WIF_PROVIDER}" \
  "GCP_CLOUD_RUN_URL=${SERVICE_URL}"

cat <<'EOF'

Cost guardrails applied:
- public Amantusi website remains on Cloudflare static assets
- container build runs inside the free Cloud Shell session, not Cloud Build
- Cloud Run is private
- Cloud Run min instances = 0
- Cloud Run max instances = 1
- 1 vCPU / 256 MiB / 30 s timeout / concurrency 80
- gen1 execution environment permits the 256 MiB memory target and suits infrequent scale-from-zero traffic
- Artifact Registry automatically removes old versions and keeps only 2 recent versions
- vulnerability scanning is not enabled by this bootstrap
- no VPC connector, NAT gateway, load balancer, Cloud SQL, Memorystore, GKE, or always-on VM is created

Important: Google Cloud budgets are alerts, not hard spending caps. These resource limits reduce exposure but cannot mathematically guarantee a zero bill under every possible provider/pricing change.
EOF
