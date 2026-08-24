import fs from 'node:fs';

const login = fs.readFileSync('public/admin.html', 'utf8');
const dashboard = fs.readFileSync('public/admin-dashboard.html', 'utf8');
const worker = fs.readFileSync('src/worker-v4.js', 'utf8');
const wrangler = fs.readFileSync('wrangler.jsonc', 'utf8');
const deploy = fs.readFileSync('.github/workflows/deploy-cloudflare.yml', 'utf8');

for (const [needle, label] of [
  ['Continue with Google', 'Google-first copy'],
  ['id="google-auth-shell"', 'Google auth shell'],
  ['id="google-signin-button"', 'Google button mount'],
  ['href="/api/admin/google/oauth/start"', 'Google OAuth redirect link']
]) {
  if (!login.includes(needle)) throw new Error(`Static Google admin validation failed: missing ${label}`);
}

for (const forbidden of [
  'accounts.google.com/gsi/client',
  '/vendor/google-gsi.js',
  '/admin-google-login.js',
  'id="login-form"',
  'id="admin-password"',
  'Login as Administrator',
  'Forgot password?'
]) {
  if (login.includes(forbidden)) throw new Error(`Static Google admin validation failed: obsolete or password UI remains in public/admin.html (${forbidden})`);
}

if (!dashboard.includes('id="admin-view"') || !dashboard.includes('Admin Dashboard')) {
  throw new Error('Static Google admin validation failed: preserved admin dashboard asset is incomplete.');
}

for (const [needle, label] of [
  ["path === '/admin-dashboard.html'", 'dashboard session guard'],
  ["redirect('/admin.html')", 'unauthenticated dashboard redirect'],
  ["redirect('/admin-dashboard.html')", 'authenticated login redirect'],
  ['/api/admin/google/oauth/start', 'Worker-rendered OAuth start link']
]) {
  if (!worker.includes(needle)) throw new Error(`Static Google admin validation failed: missing ${label}.`);
}

if (!wrangler.includes('"/admin-dashboard.html"')) {
  throw new Error('Static Google admin validation failed: admin-dashboard.html is not Worker-first.');
}
if (wrangler.includes('"/vendor/google-gsi.js"')) {
  throw new Error('Static Google admin validation failed: obsolete GIS proxy route remains Worker-first.');
}

for (const [needle, label] of [
  ['public/deployment.json', 'deployment build marker'],
  ['x.sha!==process.env.GITHUB_SHA', 'exact SHA live verification'],
  ['Assert Google-only static admin entry', 'pre-deploy Google-only assertion'],
  ['Verify exact live build and Google admin entry', 'post-deploy Google verification'],
  ['continue-on-error: true\n        run: npm audit', 'non-blocking dependency audit'],
  ['GOOGLE_OAUTH_CLIENT_SECRET', 'OAuth secret deployment support']
]) {
  if (!deploy.includes(needle)) throw new Error(`Static Google admin validation failed: missing ${label}.`);
}

console.log('Static Google admin validated: dependency-free Google OAuth redirect login, protected CMS dashboard, Worker-first routing and exact-SHA Cloudflare deployment verification are wired.');
