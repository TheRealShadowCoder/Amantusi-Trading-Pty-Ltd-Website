# Amantusi Catering CMS & Admin Security

The production target is now the dedicated permanent Cloudflare Worker:

- Cloudflare account ID: `c699a25ded4880f486b14d5f125ba92e`
- Worker name: `amantusi-trading-pty-ltd-website`
- GitHub repository: `TheRealShadowCoder/Amantusi-Trading-Pty-Ltd-Website`
- Production branch: `main`

The repository must never deploy to a temporary Cloudflare account. Every successful push to `main` is intended to update this same Worker.

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

R2 is optional. If an `CMS_MEDIA` R2 binding is added later, new uploads can use R2; otherwise image uploads use KV and are served through `/media/*`.

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

That token **must belong to Cloudflare account `c699a25ded4880f486b14d5f125ba92e`** and must have permission to edit Workers and the resources required by this Worker. A token belonging to any temporary Cloudflare account will fail authentication and must not be used.

`wrangler.jsonc` pins the permanent Cloudflare account ID and Worker name, so a normal deployment always targets `amantusi-trading-pty-ltd-website` in the permanent account.

The GitHub workflow performs:

1. JavaScript syntax validation.
2. Wrangler dry-run validation.
3. Deployment to the permanent Worker.
4. Discovery of the production `workers.dev` URL returned by Wrangler.
5. Live homepage smoke test.
6. Live `/api/admin/status` health check for CMS storage and Admin Security v3.

The workflow does not create a temporary Cloudflare account.

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

## Current production blocker

If GitHub Actions reports that the API token is associated with another Cloudflare account, replace the GitHub `CLOUDFLARE_API_TOKEN` repository secret with a token created inside account `c699a25ded4880f486b14d5f125ba92e`. Once the correct token is installed, re-run the deployment. No further account or Worker-name migration should be required.
