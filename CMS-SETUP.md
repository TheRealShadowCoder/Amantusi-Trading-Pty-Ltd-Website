# Amantusi Catering CMS & Admin Security

The Amantusi Worker now uses a KV-first production architecture so the core CMS and administrator security backend can start with one Cloudflare storage binding. This supports administrator login, sessions, menu publishing, security counters, reset tokens and uploaded catering images without requiring an R2 bucket for the initial production release.

## Pages

- `/catering-menu.html` — digital catering menu
- `/catering-brochure.html` — catering services brochure
- `/company-profile.html` — company profile and brand identity
- `/admin.html` — protected administrator CMS
- `/admin-reset.html` — one-time password reset destination

## Authorized administrators

- `zodwangema37@gmail.com` — Owner
- `s.k.businessline@gmail.com` — Administrator

Both identities have full CMS privileges.

## Core backend

`wrangler.jsonc` declares one automatically provisionable Cloudflare binding:

- `CMS_KV` — published CMS content, administrator credentials, signed-session key material, failed-login counters, reset tokens, security events and the baseline media store for catering images.

The application is still written so an `CMS_MEDIA` R2 binding can be added later. If R2 is connected, new uploads automatically use R2 first; otherwise image uploads are stored in KV and served through `/media/*`.

The administrator security module self-generates a random session-signing secret and stores it server-side in KV. It is never sent to the browser and does not need to be committed to GitHub.

## Initial administrator password

The plaintext initial administrator password is not stored in GitHub or browser JavaScript.

The repository contains only a salted PBKDF2-SHA256 bootstrap verifier. On the first successful sign-in for each approved administrator account, the Worker creates a fresh per-account salt and verifier in KV. Subsequent password changes are stored only as salted password verifiers in KV.

For a permanent high-assurance production deployment, the bootstrap mechanism can later be replaced with a Cloudflare Worker Secret after the permanent account is connected. The current implementation is designed so login works immediately when KV is available while still avoiding plaintext credentials in source.

## Security behaviour

- Email + password are required.
- Sessions are signed server-side and expire after 8 hours.
- A password change increments the credential version and invalidates older sessions for that account.
- Failed sign-ins are tracked per attempted administrator email + source IP.
- The 4th failed attempt in the attempt window creates a security incident and attempts configured notifications.
- From the 5th failed attempt, that IP/account combination is temporarily locked for 15 minutes.
- Security incidents are retained temporarily in KV.
- The attempted password is never stored in the alert record.
- Password reset tokens are random, one-time use and expire after 15 minutes.
- Password reset requests return a generic response to avoid exposing which email addresses are authorized.

## Email security alerts and password resets

Email delivery is optional until a provider is configured. The Worker currently supports the Resend HTTP API through these Worker secrets:

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put ALERT_FROM_EMAIL
```

When configured:

- failed-login threshold alerts are sent to both approved administrators
- a password reset link is sent only to the approved account that requested it
- password-change alerts are sent to both administrators

Without these email secrets, administrator login and CMS publishing still work, but email reset delivery and email alerts remain disabled.

## WhatsApp security alerts

WhatsApp alerts remain optional and activate when all of these Worker secrets are configured:

```bash
npx wrangler secret put WHATSAPP_ACCESS_TOKEN
npx wrangler secret put WHATSAPP_PHONE_NUMBER_ID
npx wrangler secret put OWNER_WHATSAPP_NUMBER
npx wrangler secret put WHATSAPP_GRAPH_VERSION
npx wrangler secret put WHATSAPP_ALERT_TEMPLATE
npx wrangler secret put WHATSAPP_TEMPLATE_LANGUAGE
```

The owner number must be supplied in international format and the configured WhatsApp template must be an approved business-initiated template compatible with the Worker payload.

## Permanent deployment

Permanent GitHub deployment requires these repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

When they are present, the GitHub Action runs a normal `wrangler deploy` against the permanent Cloudflare account. When they are absent, the production workflow exits safely instead of creating a new temporary account for every commit.

```bash
npm install
npm run deploy
```

Wrangler can automatically provision the declared `CMS_KV` namespace during deployment when the authenticated Cloudflare account permits resource provisioning.

## CMS capabilities

The administrator can add/edit catering items, upload JPG/PNG/WEBP images, update descriptions and pricing, use price labels such as `From R95 pp` or `Request pricing`, hide/show items, add categories, reorder items, update brochure copy, update company-profile information, publish content to KV, upload images through the KV media fallback, and export/import JSON backups.

## Password reset flow

1. Open `/admin.html` and choose **Forgot password?**.
2. Enter an authorized administrator email.
3. The Worker returns a generic response regardless of authorization status.
4. If email delivery is configured and the account is authorized, a random reset token is created and only its digest is stored in KV.
5. The account receives a one-time link to `/admin-reset.html`.
6. The administrator chooses a new password of at least 14 characters.
7. The token is deleted after successful use and previous sessions for that account are invalidated.

## Production completion checklist

The application code and KV-first backend are ready. To make the existing Cloudflare Worker a permanent production deployment, attach it to the intended Cloudflare account and configure the GitHub `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Then configure the optional Resend and WhatsApp credentials if email password recovery and breach notifications are required. The CMS itself no longer depends on `ADMIN_PASSWORD`, `SESSION_SECRET`, `AUTH_PEPPER` or R2 in order to start.
