# Amantusi Catering CMS Setup

The website now includes a catering and digital-branding content system.

## Public pages

- `/catering-menu.html` — editable digital catering menu
- `/catering-brochure.html` — print-friendly catering services brochure
- `/company-profile.html` — digital company profile and brand identity
- `/admin.html` — administrator content manager

## Production content storage

The public menu works immediately from `public/data/catering.json`.

For the administrator to publish changes for every visitor, connect these Cloudflare resources:

1. **Workers KV** to store the menu, brochure copy and company profile JSON.
2. **R2** to store catering images uploaded by the administrator.
3. **Worker secrets** for the administrator password and session-signing secret.

The website does not hard-code the production admin password.

## 1. Create the KV namespace

Run from the repository root while authenticated to the correct Cloudflare account:

```bash
npx wrangler kv namespace create CMS_KV
```

Copy the generated namespace ID into `wrangler.jsonc`:

```jsonc
"kv_namespaces": [
  {
    "binding": "CMS_KV",
    "id": "YOUR_KV_NAMESPACE_ID"
  }
]
```

## 2. Create the R2 bucket

```bash
npx wrangler r2 bucket create amantusi-catering-media
```

Add the binding to `wrangler.jsonc`:

```jsonc
"r2_buckets": [
  {
    "binding": "CMS_MEDIA",
    "bucket_name": "amantusi-catering-media"
  }
]
```

## 3. Add administrator secrets

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
```

Use a strong private password for `ADMIN_PASSWORD`. Use a long random value for `SESSION_SECRET`. Never commit either value to GitHub.

## 4. Deploy

```bash
npm install
npm run deploy
```

Then open `/admin.html` on the deployed Worker and log in using the password stored in `ADMIN_PASSWORD`.

## Admin capabilities

The CMS can:

- add and edit catering menu items
- upload JPG, PNG and WEBP menu images
- change descriptions and pricing
- use numerical prices or labels such as `From R95 pp` or `Request pricing`
- hide or show menu items
- add categories
- reorder menu items
- change the catering title and brochure wording
- change company profile details
- publish content to Workers KV
- store uploaded images in R2
- export and import JSON backups

## Preview mode

If KV, R2 or Worker secrets have not yet been configured, `/admin.html` offers a local preview editor. Preview changes are stored only in that browser and are useful for designing the menu before the permanent Cloudflare CMS resources are connected.
