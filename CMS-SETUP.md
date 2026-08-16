# Amantusi Trading Platform — Production Setup

Production Worker: `amantusi-trading-pty-ltd-website`  
Cloudflare account: `3b4dba2eec2c69b95eae20d70941e9b2`  
GitHub: `TheRealShadowCoder/Amantusi-Trading-Pty-Ltd-Website`  
Production branch: `main`

Every successful push to `main` validates and updates the same permanent Cloudflare Worker.

## Storage

- `CMS_KV`: CMS content, administrator credentials, rate-limit state, reset/passkey flow state, site settings and current fallback storage for uploaded media/RFQ files.
- `DB`: permanent D1 database `amantusi-trading-pty-ltd-website-db` for leads, RFQ metadata, quotations, suppliers, products, passkeys, first-party analytics and application events.
- `CMS_MEDIA`: R2 integration is implemented in code but the Cloudflare account currently has R2 disabled. When R2 is enabled in the Cloudflare dashboard, add/re-enable the `CMS_MEDIA` R2 binding and new catering/RFQ uploads will automatically use R2 instead of the KV fallback.

The production D1 database is pinned in `wrangler.jsonc` by name and database ID so future deployments always reuse the same operational database.

## Admin authentication

Authorized administrator accounts are defined server-side in `src/security-v3.js`. Passwords are not stored in browser code. The initial credential is represented only by a salted PBKDF2 verifier and can initialize an approved account. A successful explicit password reset disables the bootstrap credential for that account.

Security v3 includes signed HttpOnly/Secure/SameSite sessions, 8-hour expiry, credential-version invalidation, failed-login monitoring, rate limiting and temporary lockout.

Passkeys add WebAuthn sign-in and optional password + passkey MFA. Configure a passkey from Admin -> Backup / Security after signing in.

## Search Console and analytics

Admin -> SEO & Integrations stores:

- final public HTTPS domain
- GA4 Measurement ID (`G-...`)
- Google Search Console HTML-meta verification content value

The Worker injects these into public pages without requiring a new deployment. First-party analytics is live through D1 independently of GA4. Optional GA4 loads only after visitor consent.

## Email and WhatsApp

Email/password recovery and automated lead/status/quotation notifications activate after setting the provider secrets documented in `PLATFORM-UPGRADES.md`. Provider credentials must be created in the relevant Resend/Meta accounts and stored as Cloudflare Worker secrets; never commit them to GitHub.

## Deployment and QA

GitHub Actions requires `CLOUDFLARE_API_TOKEN` scoped to the permanent Amantusi account. Each production deployment now performs:

1. dependency installation and a production-only `npm audit` gate;
2. JavaScript and Wrangler validation;
3. permanent Cloudflare-account verification;
4. deployment to the same Worker and pinned D1 database;
5. homepage/admin/platform health checks;
6. Playwright desktop/mobile tests;
7. Lighthouse performance, accessibility, best-practices and SEO budgets;
8. QA report artifact upload.

The current production dependency audit reports zero production vulnerabilities. Development QA packages are audited separately from code that ships in the Worker.

## Current production status

Platform v2 is deployed with KV + D1 + Cloudflare observability. Current media backend is `kv-fallback` until R2 is enabled at the Cloudflare account level. Technical SEO, first-party analytics, RFQ capture, lead/quotation tracking, supplier/product databases, passkeys, security headers, monitoring and automated QA are implemented and deployed.
