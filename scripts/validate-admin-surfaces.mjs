import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const fail = (message) => { console.error(`Admin surface validation failed: ${message}`); process.exit(1); };
const expect = (condition, message) => { if (!condition) fail(message); };

const workerV5 = read('src/worker-v5.js');
const workerV4 = read('src/worker-v4.js');
const dashboard = read('public/admin-dashboard.html');
const login = read('public/admin.html');
const reset = read('public/admin-reset.html');
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
expect(workerV5.includes("path === '/admin-reset.html'") && workerV5.includes('password-reset-retired'), 'retired reset page is not redirected by the active Worker');
expect(workerV5.includes("code: 'GOOGLE_ONLY_AUTH'"), 'legacy auth routes do not return the Google-only sentinel');
expect(wrangler.includes('"main": "./src/worker-v5.js"'), 'Worker v5 is not the active deployment entry');
expect(wrangler.includes('"/admin.html"') && wrangler.includes('"/admin-dashboard.html"') && wrangler.includes('"/admin-settings.html"') && wrangler.includes('"/admin-reset.html"'), 'all admin HTML routes must run Worker-first');

const forbiddenVisibleAuth = [
  'type="password"',
  'Login as Administrator',
  'Sign in with Passkey',
  'Forgot password?',
  'Reset My Password by Email'
];
for (const marker of forbiddenVisibleAuth) {
  expect(!dashboard.includes(marker), `dashboard source still contains legacy auth marker: ${marker}`);
  expect(!login.includes(marker), `admin login source still contains legacy auth marker: ${marker}`);
  expect(!reset.includes(marker), `retired reset source still contains legacy auth marker: ${marker}`);
}

expect(dashboard.includes('Continue with Google') && dashboard.includes('/api/admin/google/oauth/start'), 'dashboard fallback is not Google-only');
expect(login.includes('Continue with Google') && login.includes('/api/admin/google/oauth/start'), 'admin login is not Google-only');
expect(reset.includes('Password Reset Retired') && reset.includes('Continue with Google'), 'retired reset fallback is not Google-only');
expect(dashboard.includes('/admin-settings.html') && dashboard.includes('Settings Control Centre'), 'dashboard does not expose Settings Control Centre in source');
expect(dashboard.includes('/admin-global-interactions.js') && dashboard.includes('/admin-global-interactions.css'), 'dashboard is missing shared help/3D assets');
expect(login.includes('/admin-global-interactions.js') && login.includes('/admin-global-interactions.css'), 'admin login is missing shared help/3D assets');
expect(reset.includes('/admin-global-interactions.js') && reset.includes('/admin-global-interactions.css'), 'retired reset fallback is missing shared help/3D assets');
expect(workerV4.includes('/admin-global-interactions.js') && workerV4.includes('/admin-global-interactions.css'), 'Worker-generated Google login is missing shared help/3D assets');

expect(settings.includes('/admin-settings-help.js') && settings.includes('/admin-settings-interactions-v2.js') && settings.includes('/admin-settings-3d.css'), 'settings-specific help/3D assets are incomplete');
expect(globalJs.includes("document.addEventListener('dblclick'") && globalJs.includes("event.key === 'F1'"), 'shared admin help does not support double-click and F1');
expect(globalJs.includes('MutationObserver') && globalJs.includes('--global-rx') && globalJs.includes("matchMedia('(hover: hover) and (pointer: fine)')"), 'shared admin interaction engine is missing dynamic or pointer-safe 3D behavior');
expect(globalCss.includes('.admin-global-3d') && globalCss.includes('perspective:1400px') && globalCss.includes('@media (prefers-reduced-motion:reduce)'), 'shared admin 3D styles or reduced-motion protections are incomplete');

for (const asset of ['/admin-global-interactions.js', '/admin-global-interactions.css']) {
  expect(headers.includes(`${asset}\n  Cache-Control: no-store, no-cache, must-revalidate, max-age=0`), `${asset} is not explicitly no-store`);
}

console.log('Admin surfaces validated: Google-only authentication, retired legacy password/direct-passkey entry routes, Worker-first protection, source-level dashboard consistency, shared double-click help, 3D interactions, reduced-motion/touch safeguards and no-store delivery are aligned across admin entry, dashboard, settings and retired reset fallback.');
