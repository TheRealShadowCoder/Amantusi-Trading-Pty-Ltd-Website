# Amantusi Trading Pty Ltd Website

Official corporate website for **Amantusi Trading Pty Ltd**.

## Company details

- Registration: 2016/443097/07
- CSD No: MAAA0100552
- Email: zodwangema37@gmail.com
- Cell: 073 247 6716

## Website focus

Elegant procurement and supply company website covering government procurement, FMCG and institutional supply, catering, cleaning and hygiene, office supply, general trading and RFQ enquiries.

## Cloudflare Workers

The static site is served from `public/` using Cloudflare Workers static assets.

```bash
npm install
npx wrangler dev
npx wrangler deploy
```

For permanent GitHub Actions deployment, add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as repository secrets, then use the included deployment workflow.
