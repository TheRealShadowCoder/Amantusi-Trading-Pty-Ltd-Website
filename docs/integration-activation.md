# Amantusi: activate Google admin sign-in, recovery email and private R2

This is a **staged configuration change**, not an assertion that all three providers are working. The production Worker is `amantusi-trading-pty-ltd-website` in Cloudflare account `3b4dba2eec2c69b95eae20d70941e9b2`.

## 1. Google administration

The deployed production route `/api/admin/google/oauth/start` currently begins an **OIDC implicit ID-token** sign-in. Its `/api/admin/google/oauth/callback` handler uses a same-origin POST to validate Google's JWKS signature, issuer, client-ID audience, expiration, state and nonce, and restricts access to pre-approved administrators. This active path **does not use `GOOGLE_OAUTH_CLIENT_SECRET`**. A client secret alone would not repair an incorrect Google Console redirect or wrong allowed account. The token flow should eventually be assessed for migration to the authorization-code + PKCE model with appropriately managed secrets.

Google Cloud Console (choose the existing OAuth client matching the configured `GOOGLE_SIGNIN_CLIENT_ID`):

1. Open [Google Auth platform — Clients](https://console.cloud.google.com/auth/clients) and select the existing *Web application* client. Do **not** create a second client ID without first planning an update to the Worker secret.
2. Verify the exact **Authorized redirect URI** is `https://amantusi-trading-pty-ltd-website.dolomite-computer.workers.dev/api/admin/google/oauth/callback` (exact case and no extra trailing slash).
3. Verify the OAuth application's audience/publishing status permits the administrator's Google account. If the app is in testing, add the intended admin account as a test user.
4. Open [the admin page](https://amantusi-trading-pty-ltd-website.dolomite-computer.workers.dev/admin.html) in an ordinary browser and choose **Continue with Google**. An authorized administrator must personally sign in. Confirm return to the protected dashboard and successful `/api/admin/me`. Do not send ID tokens, cookies or passwords in chat.
5. If login fails, capture the **error code** (e.g. `redirect_uri_mismatch`, `access_denied`) without exposing token-containing URLs. Backend source tests are not substitutes for authorized sign-in.

If the business later adopts a server-side *authorization-code* exchange, generate its OAuth client secret in Google Cloud Console and store it securely as `GOOGLE_OAUTH_CLIENT_SECRET` in GitHub Actions and Cloudflare Worker secrets. That change requires code review; do not confuse it with today's deployed secretless flow.

## 2. Email recovery via Resend

No `RESEND_API_KEY` or `ALERT_FROM_EMAIL` Worker binding exists. The recovery API intentionally returns unavailable until both are configured; it must never email a recovery code to an unverified destination or bypass the two-factor backup password step.

1. Open [Resend Domains](https://resend.com/domains), add a domain you own, and complete its verified DNS requirements. The sender cannot be invented or borrowed from someone else's domain.
2. Create a domain-restricted **Sending access** key at [Resend API Keys](https://resend.com/api-keys). Keep the key private.
3. Select a real sender on the verified domain, e.g. `Amantusi Recovery <security@YOUR-VERIFIED-DOMAIN>`; this is an example, not an existing address.
4. Add **GitHub Actions repository secrets** [here](https://github.com/TheRealShadowCoder/Amantusi-Trading-Pty-Ltd-Website/settings/secrets/actions) named `RESEND_API_KEY` and `ALERT_FROM_EMAIL`. The existing controlled deployment workflow synchronizes them into Cloudflare Worker secrets and keeps the values out of the repository.
5. Rerun the production deployment workflow after saving the two secrets (or use authorized `wrangler secret put RESEND_API_KEY` and `wrangler secret put ALERT_FROM_EMAIL` securely with the matching Cloudflare account; don't put them in tracked files or chat).
6. Read `/api/admin/recovery/config`; check `emailDelivery: true`. Then, with an authorized admin account, test the recovery setup/request and *actual email receipt* in the verified destination. A configured flag is not proof of delivery.

For the email-sender domain, verify SPF/DKIM/DMARC according to Resend's displayed DNS records; do not hardcode unverified records.

## 3. Activate private Cloudflare R2

Cloudflare's account API currently responds to a read request for `/r2/buckets` with **HTTP 403, error 10042 — Please enable R2 through the Cloudflare Dashboard**. The connector has read/write R2 scopes, so this is an account activation issue, not a missing connector scope.

1. Go to [Cloudflare dashboard](https://dash.cloudflare.com/), select the account for this Worker, then **Storage & databases → R2 → Overview**.
2. Activate the R2 subscription and complete any checkout/payment verification yourself. R2 includes free monthly usage but can incur usage-based charges.
3. Once activated, create a **private** bucket named `amantusi-private-media`. Do not enable public bucket access or add an open public domain: RFQ attachments may contain private information.
4. The staged `wrangler.jsonc` already maps `CMS_MEDIA` to that bucket. After the bucket exists, run the validation workflow on the PR, review and merge it, and deploy using the existing GitHub production workflow.
5. Confirm `/api/health` reports `r2:true` and `mediaBackend:'r2'`. Perform an approved test upload and authenticated download against the real storage before certifying it. Do **not** upload a customer's documents just to test.
6. Historical media uploaded into `CMS_KV` still uses the existing KV read fallback. The lead-file database stores the original backend so older RFQ attachments can remain accessible.

## Verification

Read-only public status probe (does **not** log in, send email, mutate records or inspect credentials):

```bash
PUBLIC_URL=https://amantusi-trading-pty-ltd-website.dolomite-computer.workers.dev node scripts/verify-integrations-readiness.mjs
```

For a release gate **after the provider setup is finished**:

```bash
STRICT_INTEGRATIONS=1 PUBLIC_URL=https://amantusi-trading-pty-ltd-website.dolomite-computer.workers.dev node scripts/verify-integrations-readiness.mjs
```

The strict probe checks configured provider bindings, not actual user login or email delivery. Complete those manual tests separately. No raw passwords, Resend keys, authorization codes, identity tokens or cookies should appear in logs or GitHub commits.
