import fs from 'node:fs';

const path = 'public/admin-dashboard.html';
const html = fs.readFileSync(path, 'utf8');

const startMarker = '  <section class="login-wrap" id="login-view">';
const endMarker = '\n\n  <section class="admin-shell hidden" id="admin-view">';
const start = html.indexOf(startMarker);
const end = html.indexOf(endMarker);

if (start < 0 || end < 0 || end <= start) {
  console.error('Could not locate the admin dashboard login fallback block.');
  process.exit(1);
}

const googleOnlyFallback = `  <section class="login-wrap" id="login-view">
    <div class="login-card secure-login-card">
      <img src="/assets/amantusi-logo.svg" alt="Amantusi Trading">
      <p class="menu-kicker">Secure operations platform</p>
      <h1>Amantusi Admin</h1>
      <p>This dashboard requires your authorized Google administrator account.</p>

      <div class="google-auth-shell" id="dashboard-google-auth-shell">
        <div class="google-auth-title">
          <strong>Continue with Google</strong>
          <span>Use the protected Google sign-in selected for Amantusi Admin. Website passwords and direct passkey sign-in are not offered here.</span>
        </div>
        <div aria-label="Continue with Google">
          <a class="google-oauth-button" href="/api/admin/google/oauth/start">
            <span class="google-oauth-mark" aria-hidden="true">G</span>
            <span>Continue with Google</span>
          </a>
        </div>
      </div>

      <div class="security-notice">
        <strong>Google-protected administration</strong>
        <span>Authentication is handled by Google and verified by the Amantusi administrator allowlist before the dashboard opens.</span>
      </div>

      <!-- Compatibility nodes for legacy dashboard JavaScript. They are never visible authentication controls. -->
      <form id="login-form" hidden aria-hidden="true">
        <input id="admin-email" type="hidden" value="">
        <input id="admin-password" type="hidden" value="">
        <p id="login-error" hidden></p>
      </form>
      <button id="forgot-toggle" type="button" hidden aria-hidden="true"></button>
      <form id="reset-request-form" class="hidden" hidden aria-hidden="true">
        <input id="reset-email" type="hidden" value="">
        <p id="reset-request-status" hidden></p>
      </form>
    </div>
  </section>`;

let next = html.slice(0, start) + googleOnlyFallback + html.slice(end);
if (!next.includes('/admin-google-login.css')) {
  next = next.replace(
    '  <link rel="stylesheet" href="/admin-security.css">',
    '  <link rel="stylesheet" href="/admin-security.css">\n  <link rel="stylesheet" href="/admin-google-login.css">'
  );
}
if (!next.includes('/admin-global-interactions.css')) {
  next = next.replace(
    '  <link rel="stylesheet" href="/admin-google-login.css">',
    '  <link rel="stylesheet" href="/admin-google-login.css">\n  <link rel="stylesheet" href="/admin-global-interactions.css">'
  );
}
if (!next.includes('/admin-global-interactions.js')) {
  next = next.replace(
    '</body>',
    '  <script src="/admin-global-interactions.js" defer></script>\n</body>'
  );
}

for (const forbidden of [
  'type="password"',
  'Login as Administrator',
  'Sign in with Passkey',
  'Forgot password?',
  'Reset My Password by Email'
]) {
  if (next.includes(forbidden)) {
    console.error(`Google-only dashboard preparation failed; forbidden legacy marker remains: ${forbidden}`);
    process.exit(1);
  }
}

for (const required of [
  'href="/api/admin/google/oauth/start"',
  'href="/admin-settings.html"',
  '/admin-global-interactions.css',
  '/admin-global-interactions.js'
]) {
  if (!next.includes(required)) {
    console.error(`Google-only dashboard preparation failed; required marker is missing: ${required}`);
    process.exit(1);
  }
}

fs.writeFileSync(path, next);
console.log('Prepared admin-dashboard.html with Google-only authentication, Settings navigation and shared admin help/3D interactions.');
