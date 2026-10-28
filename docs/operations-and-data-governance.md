# Operations, incident response and data governance

This is a proposed **operations playbook**, not evidence that alerts or automated escalations have been configured.

## Daily checks
- View the read-only `/api/health` endpoint. Confirm D1, KV and whichever media backend is selected.
- Review the admin dashboard error log, lead-submission activity and notifications status.
- Check GitHub Actions for failing validation or release workflows.
- Inspect Cloudflare request/error trends, quota governor and storage usage in the authorized dashboard.
- Never paste API keys, backup recovery tokens, customers' uploaded files or Google OAuth secrets into public issues.

## Incident response
1. Confirm whether only the public site, quotation API, admin OAuth or storage is affected.
2. Record approximate start time, affected paths, request IDs, sanitized error summaries and deployment SHA.
3. If customers cannot submit quotes, place a clear public fallback contact method in the site; do not claim submissions succeeded when they failed.
4. If an upload/storage incident occurs, do not keep retrying blind POST requests that could create duplicate leads.
5. Restrict access to customer records and investigate potential personal-data exposure under the organization’s approved incident policy.
6. For deployment-related regressions, use the release/rollback runbook, then re-run health and quotation staging checks.
7. After resolution, record cause, mitigations, follow-up work and whether stakeholders need to be notified.

## Suggested telemetry dimensions
Request method and route template; anonymized failure category; HTTP status; latency bucket; selected storage backend; upload rejection reason; deployment version. Avoid logging full URL query strings, client contact details, RFQ text, document names or authentication material.

## Alert rules to configure in the provider console
- Sustained 5xx error-rate spike
- Repeated quotation failures
- Unavailable D1/KV/R2 binding
- Excessive quota-governor load shedding
- Repeated OAuth callback errors or backup-recovery failures
- Failed deployment validation

These are **configuration requirements**, not active alerts until someone connects them to Cloudflare and the delivery channel.

## Data-handling approval questions
- What is the approved data-retention period for enquiries, quote attachments, analytics and admin logs?
- Who can export/download confidential RFQ files and how are downloads audited?
- What is the policy for deleted customer records and backups?
- Who is the designated contact for access, correction and deletion requests?
- What are the company’s approved notification and incident-escalation timelines?
- Is external analytics enabled only under the applicable privacy notice and consent settings?

No default legal retention term is assumed in source code without authorization.
