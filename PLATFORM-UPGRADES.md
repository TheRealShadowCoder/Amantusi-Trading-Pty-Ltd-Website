# Amantusi Digital Procurement Platform v2

This release upgrades the Amantusi website from an immersive corporate/CMS site into a procurement operations platform while keeping the existing public experience.

## Production architecture

- Cloudflare Worker: `amantusi-trading-pty-ltd-website`
- Static public experience and admin UI: Workers Static Assets
- CMS/authentication/rate-limit state: Cloudflare KV (`CMS_KV`)
- Operational records: permanent Cloudflare D1 database (`DB`)
- Current uploaded-media/RFQ storage: KV fallback
- R2 media/RFQ integration: implemented and ready, pending the account-level R2 enable switch in Cloudflare
- Worker Logs: Cloudflare observability
- Source/deployment: GitHub `main` -> validation -> same permanent Worker

The D1 database is pinned by name and ID in `wrangler.jsonc`, so deployments always reuse the same operational database. The Worker already prefers `CMS_MEDIA` R2 whenever that binding is present; enabling R2 and restoring the binding switches new uploads to R2 without redesigning the application.

## Server-side quotation capture

`POST /api/quote` accepts the public quotation form as multipart form data, validates required fields, rate-limits abusive submissions, creates a D1 lead record and returns an `AMT-YYYYMMDD-XXXXXX` reference.

RFQ/specification attachments support PDF, Word, Excel, CSV, text, JPG, PNG and WebP. Limits are 5 files, 10 MB per file and 30 MB combined. Files use R2 when the binding is enabled, with KV as the current production fallback.

## Lead and quotation operations

The admin workspace includes operations metrics, lead/RFQ search and status filtering, enquiry detail and requirements, secure RFQ file download, internal lead notes, an activity timeline, quotation records/status changes, a supplier database, and a product/procurement pricing database.

Lead statuses: New, Reviewing, Sourcing, Quoted, Awaiting Approval, Approved, Fulfilment, Delivered, Closed, Lost.

Quotation statuses: Draft, Sent, Accepted, Rejected, Expired.

## Passkeys / MFA

The admin platform supports WebAuthn passkeys using `@simplewebauthn/server`.

- An authenticated administrator can register/remove passkeys.
- Administrators can sign in directly with a registered passkey.
- An administrator may enable passkey MFA so a valid password must be followed by WebAuthn verification.
- User verification is required and discoverable credentials are requested.
- Password reset clears the MFA-required flag as an account-recovery safety mechanism; passkeys can then be reviewed after login.

## SEO and analytics

Public pages receive server-side generated unique titles/descriptions, canonical URLs, Open Graph and Twitter metadata, Organization/WebPage/Caterer JSON-LD, a dynamic XML sitemap, dynamic robots.txt and optional Google Search Console verification metadata.

Admin -> SEO & Integrations stores the public custom-domain URL, GA4 Measurement ID and Google Search Console verification token. First-party analytics runs independently of GA4 and stores page/CTA/lead events in D1 without storing the visitor's raw IP address. GA4 is optional and loads only after visitor consent.

## Notifications

Lead/status/quotation notification hooks support Resend email and Meta WhatsApp Business template messages. The platform does not fail a lead submission when a provider is not configured.

Cloudflare Worker secrets used by these integrations:

- `RESEND_API_KEY`
- `ALERT_FROM_EMAIL`
- optional `LEAD_NOTIFICATION_EMAILS`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `OWNER_WHATSAPP_NUMBER`
- `WHATSAPP_GRAPH_VERSION`
- `WHATSAPP_ALERT_TEMPLATE`
- optional `WHATSAPP_TEMPLATE_LANGUAGE`

## Security hardening

Worker responses add CSP, HSTS, anti-clickjacking, MIME-sniffing protection, referrer policy, permissions policy, COOP and noindex protection for admin/API administration routes. Admin mutations require a valid signed administrator session and same-origin requests. Public quotation submission is rate-limited.

The production dependency tree is checked separately with `npm audit --omit=dev --audit-level=high`; the current production audit reports zero vulnerabilities. Development-only Lighthouse/QA dependencies may report advisories without being bundled into the deployed Worker.

## Monitoring

- `/api/health` verifies KV/D1 and reports the active media backend.
- first-party client errors are stored in D1.
- Worker/API requests emit structured logs and request IDs.
- Cloudflare Worker Logs observability is enabled.
- the admin system panel displays storage, notification, recovery, passkey and recent application-event status.

## Production QA

Every production deployment validates dependencies, JavaScript and Wrangler configuration, verifies the permanent Cloudflare account, deploys the same Worker, then runs homepage/admin/platform smoke tests, Playwright desktop/mobile production tests, Lighthouse budgets and report artifact upload.

Current validated Lighthouse scores on the permanent production Worker: Performance 63, Accessibility 99, Best Practices 100, SEO 100. The production Playwright suite passed 9 checks with one intentional desktop skip for a mobile-only navigation test.

## Remaining external activation/configuration

R2 must be enabled once in the Cloudflare account dashboard before the `CMS_MEDIA` binding can be restored. Google Search Console/GA4 require values from the business's Google account. Resend/Meta notifications require their provider credentials as Worker secrets.

## Private source repository

The application is intended to be proprietary. Repository visibility must be changed to **Private** in GitHub repository settings. The connected GitHub tool can edit repository contents but does not expose repository-visibility mutation, so this final ownership setting must be changed directly in GitHub Settings -> General -> Danger Zone -> Change repository visibility.
