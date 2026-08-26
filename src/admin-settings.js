import { getAdminSession, json } from './security-v3.js';

export const PROTECTED_ROOT_EMAIL = 's.k.businessline@gmail.com';
const SETTINGS_KEY = 'admin:settings:v1';
const AUDIT_PREFIX = 'admin:settings:audit:';
const AUDIT_HEAD_KEY = 'admin:settings:audit-head';
const SETTINGS_VERSION = 1;
const CONTROL_COUNT = 1000;
const DOMAIN_COUNT = 50;
const MAX_CHANGES_PER_REQUEST = 250;
const enc = new TextEncoder();

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; }
  catch (_) { return false; }
}

function validControlId(value) {
  const match = /^s(\d{3,4})$/.exec(String(value || ''));
  if (!match) return false;
  const number = Number(match[1]);
  return Number.isInteger(number) && number >= 1 && number <= CONTROL_COUNT;
}

function cleanScalar(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(-1000000, Math.min(1000000, value));
  if (typeof value === 'string') return value.slice(0, 240);
  if (value === null) return null;
  throw new Error('Unsupported setting value.');
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(String(value)));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function readState(env) {
  const raw = await env.CMS_KV?.get(SETTINGS_KEY);
  if (!raw) {
    return {
      version: SETTINGS_VERSION,
      defaultEnabled: true,
      overrides: {},
      updatedAt: null,
      updatedBy: null
    };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      version: Number(parsed.version) || SETTINGS_VERSION,
      defaultEnabled: parsed.defaultEnabled !== false,
      overrides: parsed.overrides && typeof parsed.overrides === 'object' ? parsed.overrides : {},
      updatedAt: parsed.updatedAt || null,
      updatedBy: parsed.updatedBy || null
    };
  } catch (_) {
    return {
      version: SETTINGS_VERSION,
      defaultEnabled: true,
      overrides: {},
      updatedAt: null,
      updatedBy: null
    };
  }
}

async function writeState(env, state) {
  await env.CMS_KV.put(SETTINGS_KEY, JSON.stringify(state));
}

function rootProtection() {
  return Object.freeze({
    email: PROTECTED_ROOT_EMAIL,
    permanentAccess: true,
    immutable: true,
    roleFloor: 'superadmin',
    cannotRemove: true,
    cannotSuspend: true,
    cannotDemote: true,
    cannotExpire: true,
    cannotDisableGoogleAccess: true,
    cannotDisableRecovery: true,
    protectedBy: 'server-invariant'
  });
}

async function appendAudit(env, admin, action, details = {}) {
  const at = new Date().toISOString();
  const previousHash = (await env.CMS_KV.get(AUDIT_HEAD_KEY)) || '';
  const record = {
    at,
    actor: admin.email,
    role: admin.role,
    action,
    details,
    previousHash
  };
  const hash = await sha256(JSON.stringify(record));
  record.hash = hash;
  const key = `${AUDIT_PREFIX}${Date.now().toString().padStart(13, '0')}:${crypto.randomUUID()}`;
  await Promise.all([
    env.CMS_KV.put(key, JSON.stringify(record), { expirationTtl: 60 * 60 * 24 * 365 }),
    env.CMS_KV.put(AUDIT_HEAD_KEY, hash)
  ]);
  return record;
}

async function listAudit(env, limit = 80) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 80, 100));
  const listed = await env.CMS_KV.list({ prefix: AUDIT_PREFIX, limit: safeLimit });
  const rows = await Promise.all((listed.keys || []).map(async ({ name }) => {
    try { return JSON.parse(await env.CMS_KV.get(name)); }
    catch (_) { return null; }
  }));
  return rows.filter(Boolean).sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

function environmentHealth(env) {
  return {
    kv: Boolean(env.CMS_KV),
    database: Boolean(env.DB),
    assets: Boolean(env.ASSETS),
    googleSignIn: Boolean(String(env.GOOGLE_SIGNIN_CLIENT_ID || '').trim()),
    cloudRunOverflow: Boolean(String(env.GCP_CLOUD_RUN_URL || '').trim()),
    cloudflareWorker: true,
    passkeys: true,
    auditChain: true,
    settingsPersistence: Boolean(env.CMS_KV)
  };
}

async function requireAdmin(request, env) {
  const admin = await getAdminSession(request, env);
  if (!admin) return { response: json({ error: 'Administrator login required.' }, 401) };
  if (!env.CMS_KV) return { response: json({ error: 'Admin settings storage is unavailable.' }, 503) };
  return { admin };
}

async function getSettings(request, env, admin) {
  const state = await readState(env);
  const disabledCount = Object.values(state.overrides).filter((value) => value === false).length;
  const customCount = Object.keys(state.overrides).length;
  return json({
    ok: true,
    version: SETTINGS_VERSION,
    controls: CONTROL_COUNT,
    domains: DOMAIN_COUNT,
    defaultEnabled: state.defaultEnabled,
    overrides: state.overrides,
    updatedAt: state.updatedAt,
    updatedBy: state.updatedBy,
    enabledCount: CONTROL_COUNT - disabledCount,
    disabledCount,
    customCount,
    currentAdmin: {
      email: admin.email,
      role: admin.role,
      label: admin.label,
      protectedRoot: admin.email === PROTECTED_ROOT_EMAIL
    },
    rootProtection: rootProtection(),
    environment: environmentHealth(env)
  });
}

async function saveSettings(request, env, admin) {
  if (!sameOrigin(request)) return json({ error: 'Origin rejected.' }, 403);
  let body;
  try { body = await request.json(); }
  catch (_) { return json({ error: 'Invalid JSON payload.' }, 400); }

  const changes = Array.isArray(body?.changes) ? body.changes : [];
  if (!changes.length) return json({ error: 'No settings changes supplied.' }, 400);
  if (changes.length > MAX_CHANGES_PER_REQUEST) return json({ error: `Maximum ${MAX_CHANGES_PER_REQUEST} changes per request.` }, 413);

  const state = await readState(env);
  const applied = [];
  for (const item of changes) {
    const id = String(item?.id || '').trim();
    if (!validControlId(id)) return json({ error: `Unknown admin setting: ${id || 'empty'}` }, 400);
    let value;
    try { value = cleanScalar(item.value); }
    catch (error) { return json({ error: error.message, id }, 400); }
    state.overrides[id] = value;
    applied.push({ id, value });
  }

  state.version = SETTINGS_VERSION;
  state.defaultEnabled = true;
  state.updatedAt = new Date().toISOString();
  state.updatedBy = admin.email;
  await writeState(env, state);
  await appendAudit(env, admin, 'settings.update', { count: applied.length, ids: applied.map((item) => item.id) });
  return json({ ok: true, applied, updatedAt: state.updatedAt, updatedBy: state.updatedBy, rootProtection: rootProtection() });
}

async function bulkAction(request, env, admin) {
  if (!sameOrigin(request)) return json({ error: 'Origin rejected.' }, 403);
  let body;
  try { body = await request.json(); }
  catch (_) { return json({ error: 'Invalid JSON payload.' }, 400); }
  const action = String(body?.action || '');
  const state = await readState(env);

  if (action === 'enable-all') {
    state.defaultEnabled = true;
    state.overrides = {};
  } else if (action === 'reset') {
    state.defaultEnabled = true;
    state.overrides = {};
  } else {
    return json({ error: 'Unsupported bulk settings action.' }, 400);
  }

  state.updatedAt = new Date().toISOString();
  state.updatedBy = admin.email;
  await writeState(env, state);
  await appendAudit(env, admin, `settings.${action}`, { controls: CONTROL_COUNT });
  return json({ ok: true, action, enabledCount: CONTROL_COUNT, rootProtection: rootProtection() });
}

async function exportSettings(env, admin) {
  const state = await readState(env);
  const audit = await listAudit(env, 100);
  return json({
    exportedAt: new Date().toISOString(),
    exportedBy: admin.email,
    catalogue: { version: SETTINGS_VERSION, controls: CONTROL_COUNT, domains: DOMAIN_COUNT },
    rootProtection: rootProtection(),
    environment: environmentHealth(env),
    state,
    audit
  });
}

async function importSettings(request, env, admin) {
  if (!sameOrigin(request)) return json({ error: 'Origin rejected.' }, 403);
  let body;
  try { body = await request.json(); }
  catch (_) { return json({ error: 'Invalid JSON payload.' }, 400); }
  const source = body?.state || body;
  const overrides = source?.overrides;
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) return json({ error: 'Import does not contain a valid settings state.' }, 400);
  const safe = {};
  for (const [id, raw] of Object.entries(overrides)) {
    if (!validControlId(id)) continue;
    try { safe[id] = cleanScalar(raw); } catch (_) {}
  }
  const state = {
    version: SETTINGS_VERSION,
    defaultEnabled: true,
    overrides: safe,
    updatedAt: new Date().toISOString(),
    updatedBy: admin.email
  };
  await writeState(env, state);
  await appendAudit(env, admin, 'settings.import', { importedCount: Object.keys(safe).length });
  return json({ ok: true, importedCount: Object.keys(safe).length, rootProtection: rootProtection() });
}

export async function adminSettingsRoute(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!path.startsWith('/api/admin/settings')) return null;

  const auth = await requireAdmin(request, env);
  if (auth.response) return auth.response;
  const { admin } = auth;

  if (path === '/api/admin/settings' && request.method === 'GET') return getSettings(request, env, admin);
  if (path === '/api/admin/settings' && request.method === 'PUT') return saveSettings(request, env, admin);
  if (path === '/api/admin/settings/bulk' && request.method === 'POST') return bulkAction(request, env, admin);
  if (path === '/api/admin/settings/audit' && request.method === 'GET') return json({ ok: true, audit: await listAudit(env, url.searchParams.get('limit')) });
  if (path === '/api/admin/settings/export' && request.method === 'GET') return exportSettings(env, admin);
  if (path === '/api/admin/settings/import' && request.method === 'POST') return importSettings(request, env, admin);
  if (path === '/api/admin/settings/root-protection' && request.method === 'GET') return json({ ok: true, rootProtection: rootProtection() });
  if (path === '/api/admin/settings/health' && request.method === 'GET') return json({ ok: true, environment: environmentHealth(env), rootProtection: rootProtection() });

  return json({ error: 'Admin settings route not found.' }, 404);
}
