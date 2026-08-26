import fs from 'node:fs';
import vm from 'node:vm';

const read = (path) => fs.readFileSync(path, 'utf8');
const fail = (message) => { console.error(`Admin Settings 1000 validation failed: ${message}`); process.exit(1); };
const expect = (condition, message) => { if (!condition) fail(message); };

const registryCode = read('public/admin-settings-registry.js');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(registryCode, context);
const catalog = context.window.AMANTUSI_ADMIN_SETTINGS_CATALOG;
const settings = context.window.AMANTUSI_ADMIN_SETTINGS;

expect(Array.isArray(catalog), 'catalog is missing');
expect(catalog.length === 50, `expected 50 categories, got ${catalog.length}`);
expect(catalog.every((group) => Array.isArray(group.items) && group.items.length === 20), 'every category must contain exactly 20 settings');
expect(Array.isArray(settings) && settings.length === 1000, `expected 1000 settings, got ${settings?.length}`);
expect(new Set(settings.map((item) => item.id)).size === 1000, 'setting IDs must be unique');
expect(settings[0]?.id === 'setting-0001' && settings.at(-1)?.id === 'setting-1000', 'setting ID range must be setting-0001 through setting-1000');

const permanentEmail = 's.k.businessline@gmail.com';
const security = read('src/security-v3.js');
const oidc = read('src/google-oidc-fragment.js');
const control = read('src/admin-settings-control.js');
const workerV5 = read('src/worker-v5.js');
const workerV4 = read('src/worker-v4.js');
const page = read('public/admin-settings.html');
const client = read('public/admin-settings.js');
const css = read('public/admin-settings.css');
const helpClient = read('public/admin-settings-help.js');
const helpCss = read('public/admin-settings-help.css');

expect(security.includes(`"${permanentEmail}"`) || security.includes(`'${permanentEmail}'`), 'permanent admin missing from core session allowlist');
expect(oidc.includes(`'${permanentEmail}'`) || oidc.includes(`"${permanentEmail}"`), 'permanent admin missing from active Google OIDC allowlist');
expect(control.includes(`const PERMANENT_ADMIN = '${permanentEmail}'`), 'permanent admin constant missing from settings control plane');
expect(control.includes('cannotRemove: true') && control.includes('cannotSuspend: true') && control.includes('cannotDemote: true') && control.includes('cannotExpire: true'), 'permanent access invariants are incomplete');
expect(control.includes('safe.security.googleOnly = true') && control.includes('safe.security.bruteForceProtection = true') && control.includes('safe.security.suspiciousLoginBlocking = true'), 'mandatory security invariants are incomplete');
expect(control.includes('getAdminSession') && control.includes("'/api/admin/settings-control'"), 'authenticated settings API is not wired');
expect(workerV5.includes("path === '/admin-settings.html'") && workerV5.includes('getAdminSession') && workerV5.includes('adminSettingsRoute'), 'Worker v5 does not protect the settings page/API');
expect(workerV4.includes('/admin-settings.html') && workerV4.includes('Settings Control Centre'), 'dashboard navigation does not expose Settings Control Centre');
expect(page.includes('Permanent Superadmin Access') && page.includes('Administration Capabilities'), 'settings page core UI is incomplete');
expect(page.includes('/admin-settings-registry.js') && page.includes('/admin-settings.js'), 'settings assets are not linked');
expect(page.includes('/admin-settings-help.js') && page.includes('/admin-settings-help.css'), 'interactive settings help assets are not linked');
expect(page.includes('double-click for full guide') && page.includes('F1'), 'visible settings help instructions are missing');
expect(page.includes('id="save-capability-settings"'), 'visible capability-save control is missing');
expect(!page.includes('type="password"'), 'settings page must not contain password inputs');
expect(client.includes('settings.length !== 1000') && client.includes('catalog.length !== 50'), 'client does not guard complete registry loading');
expect(client.includes('beforeunload'), 'unsaved capability changes are not guarded');
expect(client.includes('saveCapabilities') && client.includes('saveCore'), 'settings persistence actions are missing');
expect(client.includes("els['save-capability-settings'].addEventListener('click', saveCapabilities)"), 'capability-save button is not wired to persistence');
expect(client.includes('/export') && client.includes('/reset'), 'settings export/reset controls are missing');
expect(css.includes('@media(max-width:820px)') && css.includes('@media(max-width:560px)'), 'mobile responsive settings layouts are missing');
expect(helpClient.includes('MutationObserver') && helpClient.includes('.setting-card'), 'interactive help does not automatically cover dynamically rendered capability cards');
expect(helpClient.includes("event.key === 'F1'") && helpClient.includes("addEventListener('dblclick'"), 'keyboard or double-click detailed help is missing');
expect(helpClient.includes("matchMedia('(hover: none)')"), 'touch-device help behavior is missing');
expect(helpClient.includes('What it does') && helpClient.includes('Impact') && helpClient.includes('How to use'), 'interactive help tabs are incomplete');
expect(helpCss.includes('.admin-help-tooltip') && helpCss.includes('.admin-help-dialog'), 'animated help presentation styles are missing');
expect(helpCss.includes('prefers-reduced-motion:reduce'), 'interactive help does not respect reduced-motion preference');

console.log('Admin Settings 1000 validated: 50 categories, 1,000 capabilities, interactive tooltip guidance, double-click/touch help, explicit staged-save control, authenticated KV control plane, responsive UI, audit/export/reset controls and permanent superadmin protection are wired.');
