# Amantusi Trading Platform — Production Setup

Production Worker: `amantusi-trading-pty-ltd-website`  
Cloudflare account: `3b4dba2eec2c69b95eae20d70941e9b2`  
GitHub: `TheRealShadowCoder/Amantusi-Trading-Pty-Ltd-Website`  
Production branch: `main`

Every successful push to `main` validates and updates the same permanent Cloudflare Worker.

## Storage

- `CMS_KV`: CMS content, administrator credentials, rate-limit state, reset/passkey flow state and public site settings.
- `DB`: D1 operational database for leads, RFQ metadata, quotations, suppliers, products, passkeys, first-party analytics and application events.
- `CMS_MEDIA`: R2 storage for catering images and RFQ/specification files. KV remains a fallback in code for resilience.

D1/R2 are declared as binding-only resources in `wrangler.jsonc` and are automatically provisioned/linked by current Wrangler when the deployment API token has the required permissions.

## Admin authentication

Authorized administrator accounts are defined server-side in `src/security-v3.js`. Passwords are not stored in browser code. The initial credential is represented only by a salted PBKDF2 verifier and can initialize an approved account. A successful explicit password reset disables the bootstrap credential for that account.

Security v3 includes signed HttpOnly/Secure/SameSite sessions, 8-hour expiry, credential-version invalidation, failed-login monitoring, rate limiting and temporary lockout.

Passkeys add WebAuthn sign-in and optional password + passkey MFA. Configure a passkey from the Admin -> Backup / Security panel after login.

## Search Console and analytics

Admin -> SEO & Integrations stores:

- final public HTTPS domain
- GA4 Measurement ID (`G-...`)
- Google Search Console HTML-meta verification content value

The Worker injects these into public pages without requiring a new deployment. First-party analytics is always available through D1. GA4 loads only after visitor consent.

## Email and WhatsApp

Email/password recovery and automated lead notifications activate after setting the provider secrets documented in `PLATFORM-UPGRADES.md`. Provider credentials must be created in the relevant Resend/Meta accounts and stored as Cloudflare Worker secrets; never commit them to GitHub.

## Deployment secret

GitHub Actions requires only `CLOUDFLARE_API_TOKEN`. The token must authenticate to the permanent Amantusi Cloudflare account and have permissions required to deploy Workers and provision/use KV, D1 and R2.

## Health and QA

- `/api/health` checks KV/D1/R2 platform readiness.
- `/api/admin/status` checks administrator/CMS readiness.
- Cloudflare observability is enabled in Wrangler.
- Playwright and Lighthouse run after production deployment.
