import fs from 'node:fs';

const login = fs.readFileSync('public/admin.html', 'utf8');
const dashboard = fs.readFileSync('public/admin-dashboard.html', 'utf8');
const client = fs.readFileSync('public/admin-google-login.js', 'utf8');
const worker = fs.readFileSync('src/worker-v4.js', 'utf8');
const wrangler = fs.readFileSync('wrangler.jsonc', 'utf8');
const deploy = fs.readFileSync('.github/workflows/deploy-cloudflare.yml', 'utf8');

for (const [needle, label] of [
  ['Continue with Google', 'Google-first copy'],
  ['id="google-auth-shell"', 'Google auth shell'],
  ['id="google-signin-button"', 'Google button mount'],
  ['/admin-google-login.js', 'Google login client']
]) {
  if (!login.includes(needle)) throw new Error(`Static Google admin validation failed: missing ${label}`);
}

if (login.includes('<script src="https://accounts.google.com/gsi/client"')) {
  throw new Error('Static Google admin validation failed: direct GIS script tag remains; resilient loader must own Google library loading.');
}

for (const forbidden of ['id="login-form"', 'id="admin-password"', 'Login as Administrator', 'Forgot password?']) {
  if (login.includes(forbidden)) throw new Error(`Static Google admin validation failed: legacy password UI remains in public/admin.html (${forbidden})`);
}

if (!dashboard.includes('id="admin-view"') || !dashboard.includes('Admin Dashboard')) {
  throw new Error('Static Google admin validation failed: preserved admin dashboard asset is incomplete.');
}

for (const [needle, label] of [
  ["location.replace('/admin-dashboard.html')", 'authenticated dashboard redirect'],
  ["'/vendor/google-gsi.js?hl=en'", 'same-origin Google GIS fallback']
]) {
  if (!client.includes(needle)) throw new Error(`Static Google admin validation failed: missing ${label}.`);
}

for (const [needle, label] of [
  ["path === '/admin-dashboard.html'", 'dashboard session guard'],
  ["path === '/vendor/google-gsi.js'", 'Google GIS Worker proxy'],
  ["redirect('/admin.html')", 'unauthenticated dashboard redirect'],
  ["redirect('/admin-dashboard.html')", 'authenticated login redirect']
]) {
  if (!worker.includes(needle)) throw new Error(`Static Google admin validation failed: missing ${label}.`);
}

for (const route of ['"/admin-dashboard.html"', '"/vendor/google-gsi.js"']) {
  if (!wrangler.includes(route)) throw new Error(`Static Google admin validation failed: ${route} is not Worker-first.`);
}

for (const [needle, label] of [
  ['public/deployment.json', 'deployment build marker'],
  ['x.sha!==process.env.GITHUB_SHA', 'exact SHA live verification'],
  ['Assert Google-only static admin entry', 'pre-deploy Google-only assertion'],
  ['Verify exact live build and Google admin entry', 'post-deploy Google verification'],
  ['continue-on-error: true\n        run: npm audit', 'non-blocking dependency audit']
]) {
  if (!deploy.includes(needle)) throw new Error(`Static Google admin validation failed: missing ${label}.`);
}

console.log('Static Google admin validated: Google-only login, resilient same-origin GIS fallback, protected CMS dashboard, Worker-first routing and exact-SHA deployment verification are wired.');
