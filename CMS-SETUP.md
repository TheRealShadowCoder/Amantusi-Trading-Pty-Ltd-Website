# Amantusi Catering CMS & Admin Security

The Amantusi Worker now self-initializes its core CMS and administrator security storage. The goal is that a fresh Cloudflare deployment can provide working administrator login, session storage, menu publishing and media storage without requiring hand-written resource IDs in the repository.

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

`wrangler.jsonc` declares these Cloudflare resources:

- `CMS_KV` — published CMS content, administrator credentials, signed-session key material, failed-login counters, reset tokens and security events
- `CMS_MEDIA` — uploaded catering images

Wrangler automatic provisioning is used by declaring the bindings without hard-coded resource IDs or bucket names. On an authenticated permanent deployment, Cloudflare can provision the resources and bind them to the Worker.

The administrator security module also self-generates a random session-signing secret and stores it server-side in KV. It is never sent to the browser and does not need to be committed to GitHub.

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

## Deployment

Permanent deployment requires the GitHub repository to have:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

When those are present, the GitHub Action runs a normal `wrangler deploy` against the real Cloudflare account. If they are absent, the workflow uses a temporary Cloudflare preview for visual/testing purposes only.

```bash
npm install
npm run deploy
```

## CMS capabilities

The administrator can add/edit catering items, upload JPG/PNG/WEBP images, update descriptions and pricing, use price labels such as `From R95 pp` or `Request pricing`, hide/show items, add categories, reorder items, update brochure copy, update company-profile information, publish content to KV, store images in R2 and export/import JSON backups.

## Password reset flow

1. Open `/admin.html` and choose **Forgot password?**.
2. Enter an authorized administrator email.
3. The Worker returns a generic response regardless of authorization status.
4. If email delivery is configured and the account is authorized, a random reset token is created and only its digest is stored in KV.
5. The account receives a one-time link to `/admin-reset.html`.
6. The administrator chooses a new password of at least 14 characters.
7. The token is deleted after successful use and previous sessions for that account are invalidated.

## Production hardening still recommended

Once the Worker is attached to the permanent Cloudflare account, complete the alert-provider configuration, add the permanent Cloudflare GitHub secrets, confirm the owner WhatsApp number, and optionally migrate the initial bootstrap credential to a Cloudflare Worker Secret. The CMS itself no longer depends on `ADMIN_PASSWORD`, `SESSION_SECRET` or `AUTH_PEPPER` environment variables in order to start.
