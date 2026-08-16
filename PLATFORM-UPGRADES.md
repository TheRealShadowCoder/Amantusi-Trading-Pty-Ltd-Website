# Amantusi Digital Procurement Platform v2

This release upgrades the Amantusi website from an immersive corporate/CMS site into a procurement operations platform while keeping the existing public experience.

## Production architecture

- Cloudflare Worker: `amantusi-trading-pty-ltd-website`
- Static public experience and admin UI: Workers Static Assets
- CMS/authentication/rate-limit state: Cloudflare KV (`CMS_KV`)
- Operational records: Cloudflare D1 (`DB`)
- Catering media, RFQ attachments and specifications: Cloudflare R2 (`CMS_MEDIA`)
- Worker Logs: Cloudflare observability
- Source/deployment: GitHub `main` -> validation -> same permanent Worker

Wrangler automatic resource provisioning is used for D1 and R2. The resources are created/linked on deployment when the Cloudflare API token has the necessary account permissions.

## Server-side quotation capture

`POST /api/quote` accepts the public quotation form as multipart form data, validates required fields, rate-limits abusive submissions, creates a D1 lead record and returns an `AMT-YYYYMMDD-XXXXXX` reference.

RFQ/specification attachments support PDF, Word, Excel, CSV, text, JPG, PNG and WebP. Limits are 5 files, 10 MB per file and 30 MB combined. Files are stored in R2 when available, with KV as a resilience fallback.

## Lead and quotation operations

The admin workspace includes:

- operations metrics
- lead/RFQ search and status filtering
- enquiry detail and requirements
- secure RFQ file download
- internal lead notes
- activity timeline
- quotation records and status changes
- supplier database
- product and procurement pricing database

Lead statuses: New, Reviewing, Sourcing, Quoted, Awaiting Approval, Approved, Fulfilment, Delivered, Closed, Lost.

Quotation statuses: Draft, Sent, Accepted, Rejected, Expired.

## Passkeys / MFA

The admin platform supports WebAuthn passkeys using `@simplewebauthn/server`.

- An authenticated administrator can register/remove passkeys.
- Administrators can sign in directly with a registered passkey.
- An administrator may enable passkey MFA so a valid password must be followed by WebAuthn verification.
- User verification is required.
- Discoverable credentials are requested.
- Password reset clears the MFA-required flag as an account-recovery safety mechanism; passkeys themselves can then be reviewed after login.

## SEO and analytics

Public pages receive server-side generated:

- unique title and description
- canonical URL
- Open Graph metadata
- Twitter metadata
- Organization/WebPage/Caterer JSON-LD
- dynamic XML sitemap
- dynamic robots.txt
- optional Google Search Console verification meta tag

The admin SEO & Integrations panel stores non-secret public settings in KV:

- public custom-domain URL
- GA4 Measurement ID
- Google Search Console verification token

First-party analytics runs independently of GA4 and stores page/CTA/lead events in D1 without storing the visitor's raw IP address. GA4 is optional and loads only after visitor consent.

## Notifications

Lead/status/quotation notification hooks support:

- Resend email
- Meta WhatsApp Business template messages

The platform does not fail a lead submission when a notification provider is not configured.

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

Worker responses add CSP, HSTS, anti-clickjacking, MIME-sniffing protection, referrer policy, permissions policy, COOP and noindex protection for admin/API administration routes.

Admin mutations require a valid signed administrator session and same-origin requests. Public quotation submission is rate-limited.

## Monitoring

- `/api/health` verifies KV, D1 and R2 availability.
- first-party client errors are stored in D1.
- Worker/API requests emit structured logs and request IDs.
- Cloudflare Worker Logs observability is enabled.
- the admin system panel displays storage, notification, recovery, passkey and recent application-event status.

## Production QA

Every production deployment validates JavaScript and Wrangler configuration, verifies the permanent Cloudflare account, deploys the same Worker, then runs:

- homepage/admin/API smoke tests
- D1/R2/KV health checks
- Playwright desktop/mobile production tests
- Lighthouse performance/accessibility/best-practices/SEO budgets
- report artifact upload

## Private source repository

The application is intended to be proprietary. Repository visibility must be changed to **Private** in GitHub repository settings. The current ChatGPT GitHub connector can edit repository contents but does not expose repository-visibility mutation, so this final ownership setting must be changed directly in GitHub Settings -> General -> Danger Zone -> Change repository visibility.
