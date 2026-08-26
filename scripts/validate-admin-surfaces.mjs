import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const fail = (message) => { console.error(`Admin surface validation failed: ${message}`); process.exit(1); };
const expect = (condition, message) => { if (!condition) fail(message); };

const workerV5 = read('src/worker-v5.js');
const workerV4 = read('src/worker-v4.js');
const dashboard = read('public/admin-dashboard.html');
const login = read('public/admin.html');
const reset = read('public/admin-reset.html');
const recovery = read('public/admin-recovery.html');
const settings = read('public/admin-settings.html');
const globalJs = read('public/admin-global-interactions.js');
const globalCss = read('public/admin-global-interactions.css');
const headers = read('public/_headers');
const wrangler = read('wrangler.jsonc');

for (const route of [
  "path === '/api/admin/session'",
  "path.startsWith('/api/admin/password-reset')",
  "path === '/api/admin/passkeys/authentication/options'",
  "path === '/api/admin/passkeys/authentication/verify'"
]) {
  expect(workerV5.includes(route), `active Worker does not retire ${route}`);
}
expect(workerV5.includes("path === '/admin-reset.html'") && workerV5.includes('/admin-recovery.html?mode=reset'), 'legacy reset page is not upgraded to the protected recovery centre');
expect(workerV5.includes("code: 'LEGACY_AUTH_RETIRED'"), 'legacy auth routes do not return the retired-auth sentinel');
expect(workerV5.includes('adminRecoveryRoute') && workerV5.includes("path === '/admin-recovery.html'"), 'protected backup recovery is not wired into the active Worker');
expect(wrangler.includes('"main": "./src/worker-v5.js"'), 'Worker v5 is not the active deployment entry');
expect(
  wrangler.includes('"/admin.html"') && wrangler.includes('"/admin-dashboard.html"') && wrangler.includes('"/admin-settings.html"') &&
  wrangler.includes('"/admin-recovery.html"') && wrangler.includes('"/admin-reset.html"'),
  'all admin HTML routes must run Worker-first'
);

const forbiddenLegacyVisibleAuth = [
  'Login as Administrator',
  'Sign in with Passkey',
  'Forgot password?',
  'Reset My Password by Email'
];
for (const marker of forbiddenLegacyVisibleAuth) {
  expect(!dashboard.includes(marker), `dashboard source still contains legacy auth marker: ${marker}`);
  expect(!login.includes(marker), `admin login source still contains legacy auth marker: ${marker}`);
  expect(!reset.includes(marker), `legacy reset fallback still contains obsolete auth marker: ${marker}`);
}
expect(!dashboard.includes('type="password"'), 'dashboard must not expose a password field; backup password entry belongs only in the protected recovery centre');
expect(!login.includes('type="password"'), 'primary admin login must not expose a backup password field');

expect(dashboard.includes('Continue with Google') && dashboard.includes('/api/admin/google/oauth/start'), 'dashboard fallback does not preserve Google as primary sign-in');
expect(login.includes('Continue with Google') && login.includes('/api/admin/google/oauth/start'), 'admin login does not preserve Google as primary sign-in');
expect(login.includes('/admin-recovery.html') && login.includes('Open secure recovery'), 'admin login does not expose protected backup recovery');
expect(dashboard.includes('/admin-recovery.html?mode=setup') && dashboard.includes('Backup Recovery Setup'), 'dashboard does not expose authenticated backup recovery setup');
expect(reset.includes('Password Recovery Upgraded') && reset.includes('/admin-recovery.html?mode=reset'), 'legacy reset fallback is not upgraded to protected recovery');
expect(recovery.includes('Backup administrator recovery') && recovery.includes('password') && recovery.includes('one-time'), 'backup recovery page core UI is incomplete');
expect(dashboard.includes('/admin-settings.html') && dashboard.includes('Settings Control Centre'), 'dashboard does not expose Settings Control Centre in source');
expect(dashboard.includes('/admin-global-interactions.js') && dashboard.includes('/admin-global-interactions.css'), 'dashboard is missing shared help/3D assets');
expect(login.includes('/admin-global-interactions.js') && login.includes('/admin-global-interactions.css'), 'admin login is missing shared help/3D assets');
expect(reset.includes('/admin-global-interactions.js') && reset.includes('/admin-global-interactions.css'), 'legacy reset fallback is missing shared help/3D assets');
expect(recovery.includes('/admin-global-interactions.js') && recovery.includes('/admin-global-interactions.css'), 'recovery centre is missing shared help/3D assets');
expect(workerV4.includes('/admin-global-interactions.js') && workerV4.includes('/admin-global-interactions.css'), 'Worker-generated Google login is missing shared help/3D assets');
expect(workerV4.includes('/admin-recovery.html'), 'Worker-generated Google login does not expose backup recovery');

expect(settings.includes('/admin-settings-help.js') && settings.includes('/admin-settings-interactions-v2.js') && settings.includes('/admin-settings-3d.css'), 'settings-specific help/3D assets are incomplete');
expect(globalJs.includes("document.addEventListener('dblclick'") && globalJs.includes("event.key === 'F1'"), 'shared admin help does not support double-click and F1');
expect(globalJs.includes('MutationObserver') && globalJs.includes('--global-rx') && globalJs.includes("matchMedia('(hover: hover) and (pointer: fine)')"), 'shared admin interaction engine is missing dynamic or pointer-safe 3D behavior');
expect(globalCss.includes('.admin-global-3d') && globalCss.includes('perspective:1400px') && globalCss.includes('@media (prefers-reduced-motion:reduce)'), 'shared admin 3D styles or reduced-motion protections are incomplete');

for (const asset of ['/admin-global-interactions.js', '/admin-global-interactions.css', '/admin-recovery.html', '/admin-recovery.js', '/admin-recovery.css']) {
  expect(headers.includes(`${asset}\n  Cache-Control: no-store, no-cache, must-revalidate, max-age=0`), `${asset} is not explicitly no-store`);
}

console.log('Admin surfaces validated: Google-primary authentication, preconfigured password+email-code break-glass recovery, retired legacy password/direct-passkey routes, Worker-first protection, source/build dashboard consistency, shared double-click help, 3D interactions, reduced-motion/touch safeguards and no-store delivery are aligned across admin entry, dashboard, settings, recovery and legacy reset fallback.');
