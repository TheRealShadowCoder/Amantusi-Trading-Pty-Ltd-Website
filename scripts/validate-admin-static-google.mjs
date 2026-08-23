import fs from 'node:fs';

const login = fs.readFileSync('public/admin.html', 'utf8');
const dashboard = fs.readFileSync('public/admin-dashboard.html', 'utf8');
const client = fs.readFileSync('public/admin-google-login.js', 'utf8');

for (const [needle, label] of [
  ['Continue with Google', 'Google-first copy'],
  ['id="google-auth-shell"', 'Google auth shell'],
  ['id="google-signin-button"', 'Google button mount'],
  ['https://accounts.google.com/gsi/client', 'Google Identity Services loader'],
  ['/admin-google-login.js', 'Google login client']
]) {
  if (!login.includes(needle)) throw new Error(`Static Google admin validation failed: missing ${label}`);
}

for (const forbidden of ['id="login-form"', 'id="admin-password"', 'Login as Administrator', 'Forgot password?']) {
  if (login.includes(forbidden)) throw new Error(`Static Google admin validation failed: legacy password UI remains in public/admin.html (${forbidden})`);
}

if (!dashboard.includes('id="admin-view"') || !dashboard.includes('Admin Dashboard')) {
  throw new Error('Static Google admin validation failed: preserved admin dashboard asset is incomplete.');
}

if (!client.includes("location.replace('/admin-dashboard.html')")) {
  throw new Error('Static Google admin validation failed: Google client does not route authenticated users to admin-dashboard.html.');
}

console.log('Static Google admin validated: /admin.html is password-free and Google-only; the full CMS is preserved at /admin-dashboard.html.');
