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

const googlePrimaryFallback = `  <section class="login-wrap" id="login-view">
    <div class="login-card secure-login-card">
      <img src="/assets/amantusi-logo.svg" alt="Amantusi Trading">
      <p class="menu-kicker">Secure operations platform</p>
      <h1>Amantusi Admin</h1>
      <p>This dashboard requires an authorized administrator session.</p>

      <div class="google-auth-shell" id="dashboard-google-auth-shell">
        <div class="google-auth-title">
          <strong>Continue with Google</strong>
          <span>Google is the primary administrator sign-in. Use the protected backup recovery path only when Google access is unavailable.</span>
        </div>
        <div aria-label="Continue with Google">
          <a class="google-oauth-button" href="/api/admin/google/oauth/start">
            <span class="google-oauth-mark" aria-hidden="true">G</span>
            <span>Continue with Google</span>
          </a>
        </div>
      </div>

      <p style="margin:16px 0 0;text-align:center"><a href="/admin-recovery.html" class="forgot-link">Can’t use Google or forgot backup password? Open secure recovery</a></p>

      <div class="security-notice">
        <strong>Google primary · protected backup recovery</strong>
        <span>Emergency backup access requires a preconfigured backup password plus a one-time code sent to the authorized administrator email.</span>
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

let next = html.slice(0, start) + googlePrimaryFallback + html.slice(end);
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
if (!next.includes('href="/admin-recovery.html?mode=setup"')) {
  next = next.replace(
    '        <a href="/admin-settings.html" class="admin-settings-link">Settings Control Centre</a>',
    '        <a href="/admin-settings.html" class="admin-settings-link">Settings Control Centre</a>\n        <a href="/admin-recovery.html?mode=setup" class="admin-settings-link">Backup Recovery Setup</a>'
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
    console.error(`Admin dashboard preparation failed; forbidden legacy marker remains: ${forbidden}`);
    process.exit(1);
  }
}

for (const required of [
  'href="/api/admin/google/oauth/start"',
  'href="/admin-recovery.html"',
  'href="/admin-recovery.html?mode=setup"',
  'href="/admin-settings.html"',
  '/admin-global-interactions.css',
  '/admin-global-interactions.js'
]) {
  if (!next.includes(required)) {
    console.error(`Admin dashboard preparation failed; required marker is missing: ${required}`);
    process.exit(1);
  }
}

fs.writeFileSync(path, next);
console.log('Prepared admin-dashboard.html with Google-primary authentication, backup recovery setup, Settings navigation and shared admin help/3D interactions.');
