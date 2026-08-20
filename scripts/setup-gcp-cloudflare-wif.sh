#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ID="${PROJECT_ID:-amantusi-trading-pty-ltd}"
PROJECT_NUMBER="${PROJECT_NUMBER:-1076590922680}"
REGION="${REGION:-us-central1}"
SERVICE="${SERVICE:-amantusi-overflow}"
POOL_ID="${POOL_ID:-amantusi-cloudflare-pool}"
PROVIDER_ID="${PROVIDER_ID:-amantusi-cloudflare}"
INVOKER_SA="${INVOKER_SA:-amantusi-cloudflare-invoker}"
SUBJECT="${SUBJECT:-amantusi-cloudflare-worker}"
TOKEN_AUDIENCE="${TOKEN_AUDIENCE:-amantusi-cloudflare-worker}"
ISSUER="${ISSUER:-https://amantusi-trading-pty-ltd-website.dolomite-computer.workers.dev/oidc/cloudflare}"
KEY_ID="${KEY_ID:-amantusi-cloudflare-1}"
GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-TheRealShadowCoder/Amantusi-Trading-Pty-Ltd-Website}"
KEY_DIR="${KEY_DIR:-$HOME/.amantusi-wif}"
PRIVATE_KEY="${KEY_DIR}/cloudflare-private.pem"
JWKS_FILE="${KEY_DIR}/cloudflare-jwks.json"

say(){ printf '\n==> %s\n' "$*"; }
exists(){ "$@" >/dev/null 2>&1; }

say "Selecting project ${PROJECT_ID}"
gcloud config set project "${PROJECT_ID}" >/dev/null
ACTUAL_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')"
if [[ "${ACTUAL_NUMBER}" != "${PROJECT_NUMBER}" ]]; then
  echo "Project number mismatch: expected ${PROJECT_NUMBER}, got ${ACTUAL_NUMBER}." >&2
  exit 1
fi

say "Enabling APIs required for external workload federation"
gcloud services enable \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com \
  run.googleapis.com \
  --project="${PROJECT_ID}" >/dev/null

say "Creating or reusing the Cloudflare signing key"
mkdir -p "${KEY_DIR}"
chmod 700 "${KEY_DIR}"
if [[ ! -s "${PRIVATE_KEY}" || ! -s "${JWKS_FILE}" ]]; then
  KEY_DIR="${KEY_DIR}" KEY_ID="${KEY_ID}" node <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const dir = process.env.KEY_DIR;
const kid = process.env.KEY_ID;
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});
const pub = crypto.createPublicKey(publicKey);
const jwk = pub.export({ format: 'jwk' });
jwk.use = 'sig';
jwk.alg = 'RS256';
jwk.kid = kid;
fs.writeFileSync(path.join(dir, 'cloudflare-private.pem'), privateKey, { mode: 0o600 });
fs.writeFileSync(path.join(dir, 'cloudflare-jwks.json'), JSON.stringify({ keys: [jwk] }, null, 2) + '\n', { mode: 0o600 });
NODE
fi
chmod 600 "${PRIVATE_KEY}" "${JWKS_FILE}"

say "Creating Workload Identity Pool"
if ! exists gcloud iam workload-identity-pools describe "${POOL_ID}" --location=global --project="${PROJECT_ID}"; then
  gcloud iam workload-identity-pools create "${POOL_ID}" \
    --location=global \
    --display-name="Amantusi Cloudflare" \
    --description="Keyless Cloudflare Worker identity for private Cloud Run invocation" \
    --project="${PROJECT_ID}"
fi

say "Creating/updating OIDC provider with self-uploaded public JWK"
if exists gcloud iam workload-identity-pools providers describe "${PROVIDER_ID}" --location=global --workload-identity-pool="${POOL_ID}" --project="${PROJECT_ID}"; then
  gcloud iam workload-identity-pools providers update-oidc "${PROVIDER_ID}" \
    --location=global \
    --workload-identity-pool="${POOL_ID}" \
    --issuer-uri="${ISSUER}" \
    --allowed-audiences="${TOKEN_AUDIENCE}" \
    --attribute-mapping="google.subject=assertion.sub" \
    --attribute-condition="assertion.sub=='${SUBJECT}'" \
    --jwk-json-path="${JWKS_FILE}" \
    --project="${PROJECT_ID}"
else
  gcloud iam workload-identity-pools providers create-oidc "${PROVIDER_ID}" \
    --location=global \
    --workload-identity-pool="${POOL_ID}" \
    --display-name="Amantusi Cloudflare" \
    --description="Accept only the Amantusi Cloudflare Worker subject" \
    --issuer-uri="${ISSUER}" \
    --allowed-audiences="${TOKEN_AUDIENCE}" \
    --attribute-mapping="google.subject=assertion.sub" \
    --attribute-condition="assertion.sub=='${SUBJECT}'" \
    --jwk-json-path="${JWKS_FILE}" \
    --project="${PROJECT_ID}"
fi

say "Creating dedicated Cloud Run invoker service account"
INVOKER_EMAIL="${INVOKER_SA}@${PROJECT_ID}.iam.gserviceaccount.com"
if ! exists gcloud iam service-accounts describe "${INVOKER_EMAIL}" --project="${PROJECT_ID}"; then
  gcloud iam service-accounts create "${INVOKER_SA}" \
    --display-name="Amantusi Cloudflare private invoker" \
    --description="May invoke only the Amantusi private overflow service" \
    --project="${PROJECT_ID}"
fi

PRINCIPAL="principal://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/subject/${SUBJECT}"

say "Allowing only the exact Cloudflare subject to impersonate the invoker"
gcloud iam service-accounts add-iam-policy-binding "${INVOKER_EMAIL}" \
  --project="${PROJECT_ID}" \
  --member="${PRINCIPAL}" \
  --role="roles/iam.workloadIdentityUser" >/dev/null

say "Granting the dedicated identity permission to invoke only this Cloud Run service"
gcloud run services add-iam-policy-binding "${SERVICE}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --member="serviceAccount:${INVOKER_EMAIL}" \
  --role="roles/run.invoker" >/dev/null

# Keep the service private even if a stale public binding was added previously.
gcloud run services remove-iam-policy-binding "${SERVICE}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --member="allUsers" \
  --role="roles/run.invoker" >/dev/null 2>&1 || true

gcloud run services remove-iam-policy-binding "${SERVICE}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --member="allAuthenticatedUsers" \
  --role="roles/run.invoker" >/dev/null 2>&1 || true

say "Checking private IAM policy"
POLICY="$(gcloud run services get-iam-policy "${SERVICE}" --region="${REGION}" --project="${PROJECT_ID}" --format=json)"
if printf '%s' "${POLICY}" | grep -Eq 'allUsers|allAuthenticatedUsers'; then
  echo "Cloud Run still contains a public invoker binding." >&2
  exit 2
fi

echo "Cloud Run has no public invoker binding."

say "Optionally storing the private signing key in GitHub"
if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  gh secret set GCP_WIF_PRIVATE_KEY --repo "${GITHUB_REPOSITORY}" < "${PRIVATE_KEY}"
  echo "GitHub secret GCP_WIF_PRIVATE_KEY was configured without printing its value."
else
  echo "GitHub CLI is not authenticated, so the private key was NOT uploaded anywhere."
fi

say "Setup complete"
printf '%s\n' \
  "GCP_PROJECT_ID=${PROJECT_ID}" \
  "GCP_PROJECT_NUMBER=${PROJECT_NUMBER}" \
  "GCP_WIF_POOL=${POOL_ID}" \
  "GCP_WIF_PROVIDER=${PROVIDER_ID}" \
  "GCP_WIF_ISSUER=${ISSUER}" \
  "GCP_WIF_TOKEN_AUDIENCE=${TOKEN_AUDIENCE}" \
  "GCP_WIF_KEY_ID=${KEY_ID}" \
  "GCP_INVOKER_SERVICE_ACCOUNT=${INVOKER_EMAIL}" \
  "PRIVATE_KEY_FILE=${PRIVATE_KEY}"

cat <<EOF

The private RSA key never left Cloud Shell unless the authenticated GitHub CLI uploaded it directly.
Only the public JWK was uploaded to Google Cloud.

If GitHub CLI was not authenticated, add the contents of:
  ${PRIVATE_KEY}
as the GitHub repository SECRET named:
  GCP_WIF_PRIVATE_KEY
Do not paste that private key into chat.

After the secret exists, the normal Cloudflare deployment workflow will synchronize it into the Worker as an encrypted Cloudflare secret.
EOF
