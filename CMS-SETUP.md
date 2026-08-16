# Amantusi Catering CMS & Admin Security

The production target is the dedicated permanent Cloudflare Worker:

- Cloudflare account ID: `3b4dba2eec2c69b95eae20d70941e9b2`
- Worker name: `amantusi-trading-pty-ltd-website`
- GitHub repository: `TheRealShadowCoder/Amantusi-Trading-Pty-Ltd-Website`
- Production branch: `main`
- Current workers.dev URL: `https://amantusi-trading-pty-ltd-website.dolomite-computer.workers.dev`

Every successful push to `main` updates this same Worker. The repository does not use temporary Cloudflare account deployment.

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

The Worker uses a KV-first production architecture. `CMS_KV` stores:

- published catering/menu/profile content
- administrator credential verifiers
- signed-session key material
- failed-login counters and temporary lock state
- password reset tokens
- security events
- baseline uploaded catering images

The production deployment automatically provisioned the KV namespace `amantusi-trading-pty-ltd-website-cms-kv` and bound it to `CMS_KV`.

R2 is optional. If a `CMS_MEDIA` R2 binding is added later, new uploads can use R2; otherwise image uploads use KV and are served through `/media/*`.

The session-signing secret is generated server-side and stored in KV. It is never sent to the browser or committed to GitHub.

## Initial administrator password

The plaintext initial administrator password is not stored in GitHub or public JavaScript. The source contains only a salted PBKDF2-SHA256 verifier. Security v3 allows the approved bootstrap credential to initialise each approved administrator account. After an administrator explicitly changes their password through the reset flow, the bootstrap credential is disabled for that account.

## Security behaviour

- Email + password are required.
- Sessions are signed server-side and expire after 8 hours.
- Password changes invalidate older sessions for that account.
- Failed sign-ins are tracked by attempted administrator email and source IP.
- The 4th failed attempt creates a security incident and attempts configured notifications.
- From the 5th failed attempt, that IP/account combination is temporarily locked for 15 minutes.
- The attempted password is never stored in security event records.
- Password reset tokens are random, one-time use and expire after 15 minutes.
- Password reset requests use a generic response so authorized account addresses are not exposed.

## Email security alerts and password resets

Email delivery activates when these Cloudflare Worker secrets are configured:

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put ALERT_FROM_EMAIL
```

When configured, failed-login threshold alerts are sent to both approved administrators, reset links are sent only to the approved requesting account, and password-change alerts are sent to both administrators.

## WhatsApp security alerts

WhatsApp alerts activate when these Cloudflare Worker secrets are configured:

```bash
npx wrangler secret put WHATSAPP_ACCESS_TOKEN
npx wrangler secret put WHATSAPP_PHONE_NUMBER_ID
npx wrangler secret put OWNER_WHATSAPP_NUMBER
npx wrangler secret put WHATSAPP_GRAPH_VERSION
npx wrangler secret put WHATSAPP_ALERT_TEMPLATE
npx wrangler secret put WHATSAPP_TEMPLATE_LANGUAGE
```

The owner number must be in international format and the template must be an approved WhatsApp Business template compatible with the Worker payload.

## GitHub → Cloudflare production deployment

GitHub Actions needs one repository secret:

- `CLOUDFLARE_API_TOKEN`

That token must authenticate to Cloudflare account `3b4dba2eec2c69b95eae20d70941e9b2` and have permission to edit the Worker and required account resources.

`wrangler.jsonc` pins this account ID and the Worker name `amantusi-trading-pty-ltd-website`.

The GitHub workflow performs:

1. JavaScript syntax validation.
2. Wrangler dry-run validation.
3. Verification that the API token authenticates to account `3b4dba2eec2c69b95eae20d70941e9b2`.
4. Deployment to `amantusi-trading-pty-ltd-website`.
5. Discovery of the production `workers.dev` URL returned by Wrangler.
6. Live homepage smoke test.
7. Live `/api/admin/status` health check for CMS storage and Admin Security v3.

## CMS capabilities

Administrators can add/edit catering items, upload JPG/PNG/WEBP images, update descriptions and pricing, use labels such as `From R95 pp` or `Request pricing`, hide/show items, add categories, reorder items, update brochure copy, update company-profile information, publish content, and export/import JSON backups.

## Password reset flow

1. Open `/admin.html` and choose **Forgot password?**.
2. Enter an authorized administrator email.
3. The Worker returns a generic response regardless of authorization status.
4. If email delivery is configured, a random reset token is generated and only its digest is stored in KV.
5. The approved account receives the one-time `/admin-reset.html` link.
6. The administrator selects a new password of at least 14 characters.
7. The reset token is destroyed after successful use and previous sessions for the account are invalidated.

## Current production status

The permanent Worker deployment is active. The latest production health check reports the CMS KV binding, login backend, bootstrap authentication path and media storage are available. Email/WhatsApp alert delivery and emailed password-reset delivery remain disabled until their provider credentials are configured as Worker secrets.
