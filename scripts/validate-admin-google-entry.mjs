import fs from 'node:fs';

const worker = fs.readFileSync('src/worker-v4.js', 'utf8');
const backend = fs.readFileSync('src/google-auth.js', 'utf8');

for (const [needle, label] of [
  ["getAdminSession", 'session-aware admin entry'],
  ["googleLoginPage", 'dedicated Google login page'],
  ["Continue with Google", 'Google-first login copy'],
  ["/api/admin/google/oauth/start", 'Google OAuth redirect start link'],
  ["(path === '/admin.html' || path === '/admin-dashboard.html')", 'dual admin route interception'],
  ["redirect('/admin-dashboard.html')", 'authenticated admin redirect'],
  ["redirect('/admin.html')", 'unauthenticated dashboard redirect'],
  ["if (!admin)", 'unauthenticated Google-only gate']
]) {
  if (!worker.includes(needle)) throw new Error(`Admin Google entry validation failed: missing ${label}`);
}

for (const [needle, label] of [
  ["/api/admin/google/oauth/start", 'OAuth start endpoint'],
  ["/api/admin/google/oauth/callback", 'OAuth callback endpoint'],
  ["response_type', 'code'", 'authorization code flow'],
  ["GOOGLE_OAUTH_CLIENT_SECRET", 'server-side client secret']
]) {
  if (!backend.includes(needle)) throw new Error(`Admin Google entry validation failed: missing ${label}`);
}

for (const forbidden of ['Admin password', 'Login as Administrator', 'accounts.google.com/gsi/client', '/vendor/google-gsi.js', '/admin-google-login.js']) {
  if (worker.includes(forbidden)) throw new Error(`Admin Google entry validation failed: obsolete browser/password login dependency remains (${forbidden}).`);
}

console.log('Admin Google entry validated: /admin.html uses dependency-free Google OAuth redirect, authenticated users route to the CMS dashboard, and unauthenticated dashboard access returns to Google login.');
