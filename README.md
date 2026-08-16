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
