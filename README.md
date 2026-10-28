# Amantusi Trading Pty Ltd Digital Procurement Platform

Official corporate website and procurement operations platform for **Amantusi Trading Pty Ltd**.

## Company details

- Registration: 2016/443097/07
- CSD No: MAAA0100552
- Email: zodwangema37@gmail.com
- Cell: 073 247 6716

## Platform capabilities

The public experience covers government procurement, FMCG and institutional supply, catering, cleaning and hygiene, office supply and general trading. The platform also includes server-side RFQ capture and attachments, lead/quotation tracking, supplier and product databases, a protected CMS, passkeys/MFA, first-party analytics, technical SEO, Cloudflare D1/R2/KV storage, monitoring and automated production QA.

## Production architecture

- Cloudflare Worker: `amantusi-trading-pty-ltd-website`
- CMS and authentication state: Cloudflare KV
- Leads, quotations, suppliers, products and analytics: Cloudflare D1
- Media and RFQ attachments: Cloudflare R2
- Deployment: GitHub `main` -> validation -> permanent Cloudflare Worker
- QA: Playwright desktop/mobile tests and Lighthouse budgets

```bash
npm install
npm run check
npx wrangler dev
```

Production deployment requires the GitHub Actions secret `CLOUDFLARE_API_TOKEN` scoped to the permanent Amantusi Cloudflare account. See `PLATFORM-UPGRADES.md` and `CMS-SETUP.md` for configuration and external integration details.

## Public-sector experience additions (2026-10-27)

- Accessible sector landing pages: `government-procurement.html`, `fmcg-supply.html`, `cleaning-hygiene.html`, `office-institutional.html`, `general-trading.html`, and `corporate-catering.html`.
- Printable procurement resource: `procurement-checklist.html`.
- RFQ form enhancement module (`quote-enhancements.js`): client-side 5-file / 10 MB / 30 MB checks, reference confirmations, explicit seven-day local draft opt-in and clearing on successful submission. Server validation remains authoritative.
- Catering menu enhancements (`catering-upgrades.js`): keyword filtering, per-category counts, select-to-enquire basket, event brief bridge, keyboard gallery and enlargeable images.
- Shared accessible footer links, skip navigation, active page indicators, improved 404 and back-to-top controls.
- Admin enhancements: label associations, mobile layout rules and authenticated CSV export with spreadsheet formula escaping.
- Proposed ideas and exact status: `docs/300-visual-and-functional-upgrades.md` and `docs/300-upgrade-delivery-ledger.md`.

### Public validation

The PR validation workflow runs `node scripts/validate-site-smoke.mjs`, `npm run check`, and a desktop/mobile Playwright suite using a temporary static file server. The browser suite uses a **mock quote endpoint**; it does not attest to live storage, authentication or outbound notifications. Run the Worker and authenticated staging tests before merging.

```bash
npm install
node scripts/validate-site-smoke.mjs
npm run check
npx playwright install chromium
# start a static development server on port 4173
python3 -m http.server 4173 --bind 127.0.0.1 --directory public
# in a separate terminal
BASE_URL=http://127.0.0.1:4173 npx playwright test tests/public-static.spec.mjs
```

### Optional customer acknowledgement email

This is deliberately disabled unless the deployment explicitly enables
`SEND_CUSTOMER_RECEIPT_EMAIL=true`, with valid `RESEND_API_KEY`
and `ALERT_FROM_EMAIL` secrets configured. The acknowledgement contains only a
request reference and a clear note that a quotation is **not** an accepted
order, inventory reservation or delivery guarantee. Disabled or unsuccessful
email delivery is accurately reported as `notificationChannels.receipt=false`
by the RFQ endpoint.

Enabling customer email requires checking consent, email authentication,
delivery rate limits and the company's approved data-handling notice.

## Gmail-only automated recovery mail

The production email sender is the Google Gmail API with the narrow `gmail.send` scope. Recovery recipients can be separate verified Gmail accounts. See [docs/gmail-recovery-setup.md](docs/gmail-recovery-setup.md) for required one-time authorization, private Worker secret names and activation tests. Nothing is enabled until the account holder authorizes a Gmail sender. Existing admin login is unchanged.
