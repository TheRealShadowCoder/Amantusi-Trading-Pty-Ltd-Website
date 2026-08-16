# Amantusi Catering CMS & Admin Security Setup

The Amantusi website includes a catering CMS, brochure/profile editor and a protected multi-administrator security system.

## Public and admin pages

- `/catering-menu.html` — digital catering menu
- `/catering-brochure.html` — print-friendly catering brochure
- `/company-profile.html` — digital company profile and brand identity
- `/admin.html` — secure administrator content manager
- `/admin-reset.html` — one-time password reset destination

## Authorized full administrators

The Worker currently authorizes these two email identities with full CMS privileges:

- `zodwangema37@gmail.com` — Owner
- `s.k.businessline@gmail.com` — Administrator

Both accounts can edit and publish all CMS content. Each account can request a password reset only through a one-time link sent to its own authorized email address.

## Security behaviour

- Email + password are required to sign in.
- Passwords are not committed to GitHub or exposed in browser JavaScript.
- The initial password is supplied as the Cloudflare secret `ADMIN_PASSWORD`.
- On the first valid bootstrap login, a keyed password verifier is stored in Workers KV for both approved administrator accounts.
- Per-account password resets can then create independent passwords.
- Admin sessions are signed and expire after 8 hours.
- Password reset links expire after 15 minutes and are one-time use.
- Changing a password increments the account credential version, invalidating existing sessions for that account.
- Failed sign-ins are tracked per attempted email + source IP.
- The 4th failed attempt in the current attempt window triggers a security incident notification.
- From the 5th failed attempt, that source IP + attempted account is temporarily locked for 15 minutes.
- Alert records are also retained temporarily in KV.
- The production admin page does not offer the old unauthenticated local-preview bypass.

## 1. Create Workers KV

The same namespace stores published CMS JSON plus authentication state, reset tokens and security counters.

```bash
npx wrangler kv namespace create CMS_KV
```

Add the returned namespace ID to `wrangler.jsonc`:

```jsonc
"kv_namespaces": [
  {
    "binding": "CMS_KV",
    "id": "YOUR_KV_NAMESPACE_ID"
  }
]
```

## 2. Create R2 media storage

```bash
npx wrangler r2 bucket create amantusi-catering-media
```

Add the binding:

```jsonc
"r2_buckets": [
  {
    "binding": "CMS_MEDIA",
    "bucket_name": "amantusi-catering-media"
  }
]
```

## 3. Add the core security secrets

Never place the actual values in GitHub, `wrangler.jsonc`, HTML, JavaScript or documentation.

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
npx wrangler secret put AUTH_PEPPER
```

For `ADMIN_PASSWORD`, enter the agreed bootstrap administrator password privately in Cloudflare. Do not commit it.

For `SESSION_SECRET` and `AUTH_PEPPER`, use separate long random values.

After both account verifiers have been created in KV, the bootstrap password is no longer used for accounts that already have credential records. It may then be rotated or removed according to your operating procedure.

## 4. Configure email alerts and password-reset delivery

The Worker uses the Resend HTTP API for security alerts and password reset links.

Create and verify a sending domain in Resend, then add:

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put ALERT_FROM_EMAIL
```

`ALERT_FROM_EMAIL` must be a sender address permitted by the configured email provider, for example an address on a verified Amantusi domain.

Security emails after the failed-login threshold are sent to both authorized administrator emails. Password reset links are sent only to the authorized account that requested the reset.

## 5. Configure WhatsApp security alerts

WhatsApp alerts are sent only when all Meta WhatsApp Cloud API settings below are present.

```bash
npx wrangler secret put WHATSAPP_ACCESS_TOKEN
npx wrangler secret put WHATSAPP_PHONE_NUMBER_ID
npx wrangler secret put OWNER_WHATSAPP_NUMBER
npx wrangler secret put WHATSAPP_GRAPH_VERSION
npx wrangler secret put WHATSAPP_ALERT_TEMPLATE
npx wrangler secret put WHATSAPP_TEMPLATE_LANGUAGE
```

Notes:

- `OWNER_WHATSAPP_NUMBER` must be the owner's intended security-alert WhatsApp number in international format.
- `WHATSAPP_GRAPH_VERSION` is deliberately configurable instead of being hard-coded.
- `WHATSAPP_ALERT_TEMPLATE` should be the approved WhatsApp message template used for business-initiated security alerts.
- The current code expects one text variable in the template body containing the incident summary.
- `WHATSAPP_TEMPLATE_LANGUAGE` may normally be set to `en` if that is the approved template language.

## 6. Deploy

```bash
npm install
npm run deploy
```

Then open `/admin.html` on the deployed Worker.

## CMS capabilities

The administrator can:

- add and edit catering menu items
- upload JPG, PNG and WEBP menu images
- change descriptions and pricing
- use numerical prices or labels such as `From R95 pp` or `Request pricing`
- hide or show menu items
- add categories
- reorder menu items
- change catering title and brochure wording
- change company profile details
- publish content to Workers KV
- store uploaded images in R2
- export and import JSON backups

## Password reset flow

1. Open `/admin.html` and choose **Forgot password?**.
2. Enter the authorized administrator email.
3. The response is intentionally generic whether or not the address is authorized.
4. For an authorized account, the Worker generates a random reset token and stores only its SHA-256 digest in KV.
5. A one-time reset link is emailed to that administrator.
6. The administrator chooses a new password of at least 14 characters.
7. The reset token is deleted after successful use and old sessions for that account are invalidated.

## Security-alert flow

On the 4th failed login attempt in the attempt window, the Worker builds an incident record containing the attempted administrator email, timestamp, source IP, Cloudflare location metadata when available and browser/user-agent information. The attempted password is never included in the alert.

Email and WhatsApp delivery are attempted independently, so one provider failing does not block the other notification attempt.

## Important deployment note

The GitHub repository intentionally contains no administrator password, email API key, WhatsApp token or session secret. These values must exist in the Cloudflare Worker environment before the related security features become active.
