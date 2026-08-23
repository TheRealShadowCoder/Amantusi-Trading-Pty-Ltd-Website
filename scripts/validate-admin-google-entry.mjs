import fs from 'node:fs';

const worker = fs.readFileSync('src/worker-v4.js', 'utf8');

for (const [needle, label] of [
  ["getAdminSession", 'session-aware admin entry'],
  ["googleLoginPage", 'dedicated Google login page'],
  ["Continue with Google", 'Google-first login copy'],
  ["/admin-google-login.js", 'Google login client'],
  ["https://accounts.google.com/gsi/client", 'Google Identity Services loader'],
  ["(path === '/admin.html' || path === '/admin-dashboard.html')", 'dual admin route interception'],
  ["redirect('/admin-dashboard.html')", 'authenticated admin redirect'],
  ["redirect('/admin.html')", 'unauthenticated dashboard redirect'],
  ["if (!admin)", 'unauthenticated Google-only gate']
]) {
  if (!worker.includes(needle)) throw new Error(`Admin Google entry validation failed: missing ${label}`);
}

if (worker.includes('Admin password') || worker.includes('Login as Administrator')) {
  throw new Error('Admin Google entry validation failed: password-first copy must not appear in the dedicated entry page.');
}

console.log('Admin Google entry validated: /admin.html is Google-first, authenticated users route to the CMS dashboard, and unauthenticated dashboard access is redirected to Google login.');
