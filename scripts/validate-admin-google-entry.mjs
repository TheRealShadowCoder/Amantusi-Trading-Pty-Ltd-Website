import fs from 'node:fs';

const worker = fs.readFileSync('src/worker-v4.js', 'utf8');

for (const [needle, label] of [
  ["getAdminSession", 'session-aware admin entry'],
  ["googleLoginPage", 'dedicated Google login page'],
  ["Continue with Google", 'Google-first login copy'],
  ["/admin-google-login.js", 'Google login client'],
  ["https://accounts.google.com/gsi/client", 'Google Identity Services loader'],
  ["if (path === '/admin.html' && request.method === 'GET')", 'admin entry interception'],
  ["if (!admin)", 'unauthenticated Google-only gate']
]) {
  if (!worker.includes(needle)) throw new Error(`Admin Google entry validation failed: missing ${label}`);
}

if (worker.includes('Admin password') || worker.includes('Login as Administrator')) {
  throw new Error('Admin Google entry validation failed: password-first copy must not appear in the dedicated entry page.');
}

console.log('Admin Google entry validated: unauthenticated /admin.html is served as a dedicated Google-first page before the legacy static login can render.');
