# Gmail-only sending for Amantusi recovery codes

## Selected accounts

- **Recovery recipient:** `s.k.businessline@gmail.com` — corrected at the account owner's request.
- **Gmail sender:** `s.k.businessline@gmail.com` — the currently configured sending identity, pending send-only OAuth authorization.
- No separate recovery address has been activated. The earlier proposed alternate inbox is no longer the requested destination.

**Account behavior:** `s.k.businessline@gmail.com` is also one of the website's authorized Google administrator login accounts. For this administrator, the existing recovery system already addresses verification codes to that account's login email unless a *different, verified* recovery inbox has previously been enrolled. A recipient that is also the login mailbox is **not** an independent backup against losing access to that Google account. An owner or other administrator account uses its own login email by default; do not silently change another administrator's recovery recipient without that account owner's authenticated, code-verified action.

The app uses Google's Gmail API endpoint `users.messages.send` with OAuth2 refresh credentials and **only** the `gmail.send` email permission (plus basic email identity metadata during the one-time authorization). It cannot read a mailbox. The Worker must never log or commit OAuth secrets, refresh tokens or recovery codes.

## Step 1 — Google Cloud

1. The selected Gmail sender and requested recovery recipient are both `s.k.businessline@gmail.com`. Ensure the sender has the Gmail API enabled.
2. In [Google Cloud Console](https://console.cloud.google.com/), select the Google Cloud project used for this business or create a dedicated, owned project. Enable **Gmail API** (APIs & Services → Library → Gmail API → Enable).
3. In Google Auth Platform, create a **Web application** OAuth client for the sender authorization. Add the exact authorized redirect URI `http://127.0.0.1:8765/callback` to that client. Keep any existing admin sign-in OAuth client configuration untouched.
4. Configure the OAuth consent screen and add your Gmail sender as a test user if still in Testing. The Gmail `gmail.send` permission is a **sensitive** scope; public apps may require Google's verification, and refresh tokens for external apps in Testing can expire after seven days. For sustained production sending, complete the required Google publishing/verification process.

## Step 2 — One-time local Gmail authorization

In a *local terminal on your own computer* (not a GitHub runner or shared device), set the following environment variables to the OAuth client you just created:

- `GMAIL_OAUTH_CLIENT_ID` — OAuth client ID.
- `GMAIL_OAUTH_CLIENT_SECRET` — corresponding client secret.
- `GMAIL_SENDER_EMAIL` — set locally to `s.k.businessline@gmail.com`; the deployment uses the same sender in its non-secret Wrangler configuration.

Run `npm run setup:gmail` in this repository. The script starts a local callback at `http://127.0.0.1:8765/callback` and displays a Google authorization URL. Open it in a browser on the same computer, select the sender Gmail account, review the `gmail.send` request, and approve. The script confirms the Google account address matches `GMAIL_SENDER_EMAIL`, then prints the Gmail refresh token **only to your local terminal**. It does not automatically send any email.

**Never paste a refresh token, client secret, authorization code, access token, recovery code or account password into chat, email, source code, logs, or a GitHub issue.** Copy the new refresh token directly to the encrypted secret entry form.

## Step 3 — Configure the live Worker

Create these **three** encrypted repository secrets at [GitHub Actions → Secrets](https://github.com/TheRealShadowCoder/Amantusi-Trading-Pty-Ltd-Website/settings/secrets/actions):

- `GMAIL_OAUTH_CLIENT_ID`
- `GMAIL_OAUTH_CLIENT_SECRET`
- `GMAIL_REFRESH_TOKEN`
- `GMAIL_SENDER_EMAIL` is already declared as `s.k.businessline@gmail.com` in `wrangler.jsonc` as a non-secret environment variable. Do not create a competing Worker secret with this name.

The Cloudflare deployment workflow transfers the three OAuth secrets using `wrangler secret put`, and the declared sender email is deployed from `wrangler.jsonc`. None of the OAuth credentials are printed. Review and merge the Gmail-only pull request after tests pass, then deploy through the normal workflow. Changing these credentials is independent of the existing Google admin login.

## Step 4 — Verify Gmail recovery delivery to the requested mailbox

1. Sign in with the authorized Google administrator account `s.k.businessline@gmail.com`.
2. Open `/admin-recovery.html?mode=setup`.
3. Because this administrator account already uses `s.k.businessline@gmail.com` as its login identity, its recovery code destination **defaults to that same Gmail inbox**. Do not attempt to enroll the address as a *separate* inbox — the enrollment API intentionally requires a different address.
4. Once Gmail sending credentials have been authorized and securely deployed, request a backup setup code. Confirm an actual eight-digit code arrives at `s.k.businessline@gmail.com`, then enter it on the website within ten minutes and configure the backup password. Do not share codes or passwords.
5. If changing the recovery destination for a **different** administrator account, that administrator must be authenticated and complete the distinct-inbox code verification flow. Existing recovery changes also require the current backup password. No cross-account recovery address changes are automatic.

### Important security limitation

Using the **same Gmail for both Google login and password-recovery codes** provides less account-recovery independence. If the Gmail account itself becomes inaccessible, email-code backup recovery will be inaccessible too. A different recovery inbox is recommended for resilience, but this setup preserves the requested recipient without misrepresenting verification.

Check that a real message arrives. A configured Worker binding or passing mock tests does **not** prove Gmail delivery. Test only with your own authorized inbox.

## Common problems

- **Gmail API disabled:** Enable it in the Google Cloud project associated with your send-only OAuth client.
- **Redirect mismatch:** The client must include exactly `http://127.0.0.1:8765/callback`.
- **Scope blocked or unverified:** Adjust consent screen settings for test users or complete Google's verification requirements.
- **Missing refresh token:** Re-authorize with `access_type=offline` and `prompt=consent`.
- **Invalid grant after days:** External OAuth consent apps in Testing may issue short-lived refresh tokens; do not rely on that setup for permanent emergency access.
- **Wrong sender:** The Google account shown during authorization must exactly match `GMAIL_SENDER_EMAIL`.
- **Recovery email never arrives:** Verify the sender and API secrets, then inspect authorized server-side error status without logging tokens. Do not assume a successful HTTP response means inbox delivery.

### Security note

Personal Gmail accounts have sending limits and may not be suitable for high-volume website customer notifications. This system is meant for low-volume security codes. Google sign-in remains primary; alternate email recovery remains secondary and requires a backup password plus a verified, short-lived code.
