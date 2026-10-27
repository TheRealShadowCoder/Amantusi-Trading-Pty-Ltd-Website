# Cloudflare Release, Verification and Rollback Runbook

## Release prerequisites
1. Confirm the branch targets the correct repository and `main` is unchanged until review approval.
2. CI: `node scripts/validate-site-smoke.mjs`, `node scripts/validate-public-routes.mjs`, `node scripts/validate-upload-security.mjs`, public Playwright mobile/desktop and `npm run check`.
3. Use `npx wrangler deploy --dry-run` to validate Worker packaging, but do not treat a dry run as an end-to-end integration test.
4. Stage and verify the Cloudflare D1 database, KV, R2 backend, notification integrations, and authorized Google OAuth recovery.
5. Review pricing copy, certification claims, current company details and privacy notice with a company representative.

## Deployment
- Use the repository's existing `.github/workflows/deploy-cloudflare.yml` rather than bypassing branch or environment controls.
- Inspect deployed version ID and GitHub commit. Keep the previous working deployment ID recorded.
- After deploy, run the read-only production probe: `PUBLIC_URL=https://your-deployed-domain.example node scripts/verify-live-site.mjs`. The URL must be an authorized hostname.
- Test a **designated test RFQ** from a nonproduction environment; never seed arbitrary production customer records just to prove a workflow.

## Rollback
- Stop rollout / scheduled changes if an important regression is confirmed.
- Review version history with `npx wrangler versions list`.
- Use Cloudflare's current documented rollback mechanism (`npx wrangler rollback` where supported), explicitly selecting the previously known-good version and verifying its identity in the dashboard.
- Rollbacks do not automatically undo schema/data changes, so avoid destructive migrations and establish independent database recovery plans.
- Repeat health, login, RFQ and public browser checks after rollback; communicate status using sanitized facts.

## Acceptance criteria
- Core public paths serve 200 responses and retain the expected security headers.
- `/sitemap.xml` and `/robots.txt` are valid and include/exclude the correct paths.
- Unauthorized admin endpoints remain unauthorized.
- Quotation API validates form inputs and limits; test storage reads/writes succeed.
- Google sign-in, recovery, and CMS actions work through authorized credentials.
- Mobile 320/375/768/1024 px, keyboard navigation and attachments are manually verified.
- Incident contacts and monitoring handoff are documented.

No deployment or rollback is performed by committing this document.
