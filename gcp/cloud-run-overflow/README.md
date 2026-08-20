# Optional Google Cloud Run Overflow Service

This service is intentionally dormant until explicitly deployed and configured. It is for optional background/overflow work only; the public website must never depend on it.

## Cost-control deployment settings

Use request-based billing, zero minimum instances, high concurrency and a small maximum instance count.

Example deployment:

```bash
gcloud run deploy amantusi-overflow \
  --source ./gcp/cloud-run-overflow \
  --region africa-south1 \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 2 \
  --concurrency 80 \
  --cpu 1 \
  --memory 256Mi \
  --set-env-vars AMANTUSI_OVERFLOW_SHARED_SECRET=REPLACE_WITH_SECRET
```

For production, prefer authenticated Cloud Run invocation instead of `--allow-unauthenticated`. The shared-secret check is an additional application guard, not a replacement for IAM.

## Endpoints

- `GET /health` — lightweight health check.
- `POST /task` — accepts explicitly whitelisted optional task types.

## Design rule

If Cloud Run is unavailable, capped or disabled, the Amantusi website and RFQ workflow must continue operating normally through Cloudflare.
