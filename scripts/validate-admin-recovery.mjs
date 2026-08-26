import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const fail = (message) => { console.error(`Admin recovery validation failed: ${message}`); process.exit(1); };
const expect = (condition, message) => { if (!condition) fail(message); };

const recovery = read('src/admin-recovery.js');
const worker = read('src/worker-v5.js');
const login = read('public/admin.html');
const dashboard = read('public/admin-dashboard.html');
const reset = read('public/admin-reset.html');
const page = read('public/admin-recovery.html');
const client = read('public/admin-recovery.js');
const css = read('public/admin-recovery.css');
const headers = read('public/_headers');
const wrangler = read('wrangler.jsonc');
const notifications = read('src/notifications.js');

expect(recovery.includes('const BACKUP_PBKDF2_ITERATIONS = 100000'), 'backup password KDF must stay within the Cloudflare WebCrypto PBKDF2 limit');
expect(!recovery.includes('BACKUP_PBKDF2_ITERATIONS = 210000'), 'legacy 210,000-iteration PBKDF2 must not be used by recovery');
expect(recovery.includes("hash: 'SHA-256'") && recovery.includes("name: 'PBKDF2'"), 'backup password verifier must use PBKDF2-SHA256');
expect(recovery.includes('randomToken(18)') && recovery.includes('twoFactorRequired: true'), 'backup password storage must use a random salt and require second factor');
expect(recovery.includes('CODE_TTL_SECONDS = 600') && recovery.includes('CODE_ATTEMPT_MAX = 5'), 'one-time code expiry/attempt limits are missing');
expect(recovery.includes('REQUEST_RATE_MAX = 4') && recovery.includes('LOGIN_ATTEMPT_MAX = 5') && recovery.includes('LOGIN_LOCK_SECONDS = 900'), 'recovery abuse protection is incomplete');
expect(recovery.includes("sendEmail(env, [email]") && notifications.includes('RESEND_API_KEY') && notifications.includes('ALERT_FROM_EMAIL'), 'recovery email delivery is not connected to the existing email provider');
expect(recovery.includes("purpose === 'login'") && recovery.includes("purpose === 'setup'") && recovery.includes("'reset'"), 'login/setup/reset one-time-code purposes are not isolated');
expect(recovery.includes('getAdminSession(request, env)') && recovery.includes('Google administrator session required to create backup recovery.'), 'initial backup setup must require an authenticated Google admin session');
expect(recovery.includes("if (!ACCOUNTS[email] || !(await backupPassword(env, email)))"), 'forgot-password reset must not create a backup method for an uninitialized account');
expect(recovery.includes('backupPasswordMatches') && recovery.includes("createCodeFlow(request, env, email, 'login')"), 'backup login must require both password verification and emailed code');
expect(recovery.includes('issueAdminSession(env, email, true)') && recovery.includes('previous sessions were invalidated'), 'password recovery must rotate/invalidate prior sessions');
expect(recovery.includes('HttpOnly; Secure; SameSite=Strict'), 'recovery-issued admin session cookie is not hardened');
expect(recovery.includes("recoveryEngine: 'break-glass-v1'") && recovery.includes("backup: 'password+email-code'"), 'recovery diagnostics/config metadata is missing');

expect(worker.includes("import { adminRecoveryRoute } from './admin-recovery.js'"), 'active Worker does not import the recovery engine');
expect(worker.includes('const recoveryApi = await adminRecoveryRoute(request, env)'), 'active Worker does not route recovery APIs');
expect(worker.indexOf('const recoveryApi = await adminRecoveryRoute(request, env)') < worker.indexOf('isRetiredDirectAuthPath(path)'), 'recovery APIs must be evaluated before legacy-auth retirement guard');
expect(worker.includes("path === '/admin-recovery.html'") && worker.includes("'backup-recovery'"), 'recovery page is not served Worker-first/no-store');
expect(worker.includes("path === '/admin-reset.html'") && worker.includes('/admin-recovery.html?mode=reset'), 'legacy reset page does not upgrade to the new recovery centre');
expect(worker.includes("path === '/api/admin/session'") && worker.includes("path.startsWith('/api/admin/password-reset')"), 'legacy direct password/reset endpoints must remain retired');
expect(worker.includes("path === '/api/admin/passkeys/authentication/options'") && worker.includes("path === '/api/admin/passkeys/authentication/verify'"), 'direct passkey login bypass must remain retired');

expect(login.includes('/admin-recovery.html') && login.includes('Open secure recovery'), 'admin login does not expose protected backup recovery');
expect(dashboard.includes('/admin-recovery.html?mode=setup') && dashboard.includes('Backup Recovery Setup'), 'authenticated dashboard does not expose backup recovery setup');
expect(reset.includes('/admin-recovery.html?mode=reset') && reset.includes('Password Recovery Upgraded'), 'legacy reset fallback is not pointed at the new recovery flow');
expect(page.includes('id="backup-login-start"') && page.includes('id="backup-login-verify"'), 'backup password + email-code sign-in UI is incomplete');
expect(page.includes('id="backup-reset-start"') && page.includes('id="backup-reset-confirm"'), 'forgotten-password recovery UI is incomplete');
expect(page.includes('id="backup-setup-panel"') && page.includes('id="backup-setup-confirm"'), 'authenticated recovery setup UI is incomplete');
expect(page.includes('autocomplete="one-time-code"') && page.includes('pattern="[0-9]{8}"'), 'one-time-code inputs are not constrained correctly');
expect(page.includes('/admin-recovery.js') && page.includes('/admin-recovery.css'), 'recovery page assets are not linked');
expect(client.includes('/api/admin/recovery/login/start') && client.includes('/api/admin/recovery/login/verify'), 'backup sign-in client flow is not wired');
expect(client.includes('/api/admin/recovery/reset/request') && client.includes('/api/admin/recovery/reset/confirm'), 'forgot-password client flow is not wired');
expect(client.includes('/api/admin/recovery/setup/request') && client.includes('/api/admin/recovery/setup/confirm'), 'authenticated setup client flow is not wired');
expect(client.includes("location.assign('/admin-dashboard.html')"), 'successful recovery does not return to the dashboard');
expect(css.includes('@media(prefers-reduced-motion:reduce)') && css.includes('@media(max-width:640px)'), 'recovery UI lacks accessibility/mobile safeguards');

expect(wrangler.includes('"/admin-recovery.html"'), 'recovery page is not Worker-first in Cloudflare assets routing');
for (const asset of ['/admin-recovery.html', '/admin-recovery.js', '/admin-recovery.css']) {
  expect(headers.includes(`${asset}\n  Cache-Control: no-store, no-cache, must-revalidate, max-age=0`), `${asset} is not explicitly no-store`);
}

console.log('Admin recovery validated: Google-primary setup, preinitialized break-glass password, PBKDF2-100k verifier, mandatory emailed one-time code, short-lived/replay-resistant code flows, rate limits, login lockout, session rotation after forgotten-password reset, Worker-first routing, no-store delivery, mobile/reduced-motion UI and retired legacy auth bypasses are wired.');
