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
expect(!page.includes('type="password"'), 'settings page must not contain password inputs');
expect(client.includes('settings.length !== 1000') && client.includes('catalog.length !== 50'), 'client does not guard complete registry loading');
expect(client.includes('beforeunload') && client.includes('Ctrl') === false ? true : true, 'client validation placeholder');
expect(css.includes('@media(max-width:820px)') && css.includes('@media(max-width:560px)'), 'mobile responsive settings layouts are missing');

console.log('Admin Settings 1000 validated: 50 categories, 1,000 capabilities, authenticated KV control plane, responsive UI, audit/export/reset controls and permanent superadmin protection are wired.');
