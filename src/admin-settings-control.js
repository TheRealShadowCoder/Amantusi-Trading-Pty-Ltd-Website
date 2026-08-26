import { getAdminSession, json } from './security-v3.js';

const SETTINGS_KEY = 'admin:control-centre:v1';
const AUDIT_PREFIX = 'admin:settings-audit:';
const AUDIT_HEAD_KEY = 'admin:settings-audit-head:v1';
const MAX_AUDIT_EVENTS = 120;
const PERMANENT_ADMIN = 's.k.businessline@gmail.com';
const IDENTITIES = Object.freeze({
  's.k.businessline@gmail.com': Object.freeze({ role: 'superadmin', label: 'Permanent Superadmin', permanent: true, protected: true }),
  'zodwangema37@gmail.com': Object.freeze({ role: 'owner', label: 'Owner', permanent: false, protected: true })
});

const enc = new TextEncoder();
const dec = new TextDecoder();

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; }
  catch (_) { return false; }
}

function defaultState() {
  return {
    version: 1,
    updatedAt: null,
    updatedBy: null,
    profile: {
      displayName: 'Amantusi Administrator',
      language: 'en-ZA',
      timezone: 'Africa/Johannesburg',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      currency: 'ZAR'
    },
    appearance: {
      mode: 'system',
      density: 'comfortable',
      reducedMotion: false,
      highContrast: false,
      interfaceScale: 100
    },
    notifications: {
      security: true,
      business: true,
      catering: true,
      enquiries: true,
      quotes: true,
      suppliers: true,
      products: true,
      deployments: true,
      dailyDigest: false,
      weeklyDigest: true,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '06:00'
    },
    security: {
      googleOnly: true,
      passkeyCriticalActions: false,
      mfaCriticalActions: true,
      newDeviceVerification: true,
      suspiciousLoginBlocking: true,
      bruteForceProtection: true,
      botProtection: true,
      emergencyLockdown: false,
      sessionHours: 8,
      idleMinutes: 60,
      concurrentSessions: 5,
      auditRetentionDays: 90
    },
    governance: {
      fourEyesCriticalActions: true,
      dualApprovalOwnership: true,
      dualApprovalPermanentDeletion: true,
      dualApprovalMajorExports: true,
      dualApprovalSecurityRelaxation: true,
      requireChangeReason: true,
      quarterlyAccessReview: true
    },
    infrastructure: {
      cloudflareHealthChecks: true,
      googleCloudHealthChecks: true,
      databaseHealthChecks: true,
      kvHealthChecks: true,
      deploymentVerification: true,
      automaticCachePurge: true,
      maintenanceMode: false
    },
    capabilityStates: {},
    savedViews: [],
    pinnedSettings: [],
    featureFlags: {},
    custom: {}
  };
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(base, patch, depth = 0) {
  if (depth > 5 || !isPlainObject(patch)) return base;
  const output = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (!/^[a-zA-Z0-9_.:-]{1,80}$/.test(key)) continue;
    if (isPlainObject(value) && isPlainObject(base?.[key])) output[key] = deepMerge(base[key], value, depth + 1);
    else if (['string','number','boolean'].includes(typeof value) || value === null) output[key] = typeof value === 'string' ? value.slice(0, 1000) : value;
    else if (Array.isArray(value)) output[key] = value.slice(0, 100).map((item) => typeof item === 'string' ? item.slice(0, 200) : item).filter((item) => ['string','number','boolean'].includes(typeof item));
  }
  return output;
}

function enforceSafety(state) {
  const safe = deepMerge(defaultState(), state || {});
  // These invariants are deliberately not configurable from the UI.
  safe.security.googleOnly = true;
  safe.security.bruteForceProtection = true;
  safe.security.suspiciousLoginBlocking = true;
  safe.security.mfaCriticalActions = true;
  safe.governance.requireChangeReason = true;
  safe.identityPolicy = {
    permanentAdmin: PERMANENT_ADMIN,
    permanentAccess: true,
    cannotRemove: true,
    cannotSuspend: true,
    cannotDemote: true,
    cannotExpire: true
  };
  return safe;
}

async function loadState(env) {
  let parsed = null;
  try { parsed = JSON.parse(await env.CMS_KV.get(SETTINGS_KEY) || 'null'); } catch (_) {}
  return enforceSafety(parsed || defaultState());
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(String(value)));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function audit(env, admin, action, detail = {}) {
  const previous = await env.CMS_KV.get(AUDIT_HEAD_KEY) || '';
  const event = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    actor: admin.email,
    role: admin.role,
    action: String(action || '').slice(0, 100),
    detail,
    previousHash: previous
  };
  event.hash = await sha256(`${previous}\n${JSON.stringify(event)}`);
  const key = `${AUDIT_PREFIX}${Date.now()}:${event.id}`;
  await Promise.all([
    env.CMS_KV.put(key, JSON.stringify(event), { expirationTtl: 60 * 60 * 24 * 180 }),
    env.CMS_KV.put(AUDIT_HEAD_KEY, event.hash)
  ]);
  return event;
}

async function listAudit(env, limit = 50) {
  const requested = Math.max(1, Math.min(Number(limit) || 50, MAX_AUDIT_EVENTS));
  const listing = await env.CMS_KV.list({ prefix: AUDIT_PREFIX, limit: requested });
  const events = await Promise.all((listing.keys || []).map(async ({ name }) => {
    try { return JSON.parse(await env.CMS_KV.get(name)); } catch (_) { return null; }
  }));
  return events.filter(Boolean).sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

function identities() {
  return Object.entries(IDENTITIES).map(([email, policy]) => ({ email, ...policy }));
}

function diagnostics(env, admin, state) {
  return {
    authenticated: true,
    actor: { email: admin.email, role: admin.role, label: admin.label },
    permanentAccess: {
      email: PERMANENT_ADMIN,
      active: true,
      protectedByCode: true,
      policy: 'cannot-remove-suspend-demote-expire'
    },
    bindings: {
      kv: Boolean(env.CMS_KV),
      database: Boolean(env.DB),
      assets: Boolean(env.ASSETS),
      googleClient: Boolean(env.GOOGLE_SIGNIN_CLIENT_ID),
      cloudRun: Boolean(env.GCP_CLOUD_RUN_URL)
    },
    security: {
      googleOnly: state.security.googleOnly,
      suspiciousLoginBlocking: state.security.suspiciousLoginBlocking,
      bruteForceProtection: state.security.bruteForceProtection,
      mfaCriticalActions: state.security.mfaCriticalActions,
      emergencyLockdown: state.security.emergencyLockdown
    },
    generatedAt: new Date().toISOString()
  };
}

function capabilityIdValid(id) {
  return /^setting-(?:0(?:00[1-9]|0[1-9]\d|[1-9]\d{2})|1000)$/.test(String(id || ''));
}

function sanitizeCapabilityPatch(patch) {
  const out = {};
  if (!isPlainObject(patch)) return out;
  for (const [id, value] of Object.entries(patch)) {
    if (!capabilityIdValid(id)) continue;
    if (typeof value === 'boolean') out[id] = { enabled: value, status: value ? 'enabled' : 'disabled' };
    else if (isPlainObject(value)) {
      const enabled = value.enabled !== false;
      out[id] = {
        enabled,
        status: ['enabled','disabled','configured','attention'].includes(value.status) ? value.status : (enabled ? 'enabled' : 'disabled'),
        note: String(value.note || '').slice(0, 300)
      };
    }
  }
  return out;
}

async function authorized(request, env) {
  if (!env.CMS_KV) return { response: json({ error: 'Admin storage is unavailable.' }, 503) };
  const admin = await getAdminSession(request, env);
  if (!admin) return { response: json({ error: 'Authentication required.' }, 401) };
  return { admin };
}

async function getControl(request, env, admin) {
  const state = await loadState(env);
  const url = new URL(request.url);
  const includeAudit = url.searchParams.get('audit') !== '0';
  return json({
    ok: true,
    state,
    identities: identities(),
    diagnostics: diagnostics(env, admin, state),
    audit: includeAudit ? await listAudit(env, 40) : [],
    limits: { settings: 1000, categories: 50, auditReturned: 40 },
    immutable: ['identityPolicy','security.googleOnly','security.bruteForceProtection','security.suspiciousLoginBlocking','security.mfaCriticalActions','governance.requireChangeReason']
  });
}

async function updateControl(request, env, admin) {
  if (!sameOrigin(request)) return json({ error: 'Cross-origin settings updates are not allowed.' }, 403);
  let body = {};
  try { body = await request.json(); } catch (_) { return json({ error: 'Invalid JSON body.' }, 400); }
  const current = await loadState(env);
  const allowed = ['profile','appearance','notifications','security','governance','infrastructure','featureFlags','savedViews','pinnedSettings','custom'];
  const patch = {};
  for (const key of allowed) if (body[key] !== undefined) patch[key] = body[key];
  let next = deepMerge(current, patch);
  if (body.capabilityStates !== undefined) next.capabilityStates = { ...current.capabilityStates, ...sanitizeCapabilityPatch(body.capabilityStates) };
  next = enforceSafety(next);
  next.updatedAt = new Date().toISOString();
  next.updatedBy = admin.email;
  await env.CMS_KV.put(SETTINGS_KEY, JSON.stringify(next));
  await audit(env, admin, 'settings-update', {
    changedSections: Object.keys(patch),
    capabilityCount: Object.keys(body.capabilityStates || {}).length,
    reason: String(body.reason || 'Settings Control Centre update').slice(0, 300)
  });
  return json({ ok: true, state: next, permanentAccess: next.identityPolicy });
}

async function resetControl(request, env, admin) {
  if (!sameOrigin(request)) return json({ error: 'Cross-origin settings reset is not allowed.' }, 403);
  let body = {};
  try { body = await request.json(); } catch (_) {}
  if (String(body.confirm || '') !== 'RESET_SETTINGS') return json({ error: 'Explicit reset confirmation is required.' }, 400);
  const next = enforceSafety(defaultState());
  next.updatedAt = new Date().toISOString();
  next.updatedBy = admin.email;
  await env.CMS_KV.put(SETTINGS_KEY, JSON.stringify(next));
  await audit(env, admin, 'settings-reset', { reason: String(body.reason || 'Administrator reset').slice(0, 300) });
  return json({ ok: true, state: next });
}

async function exportControl(env, admin) {
  const state = await loadState(env);
  const payload = JSON.stringify({
    exportedAt: new Date().toISOString(),
    exportedBy: admin.email,
    state,
    identities: identities(),
    diagnostics: diagnostics(env, admin, state),
    audit: await listAudit(env, 100)
  }, null, 2);
  return new Response(payload, {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': 'attachment; filename="amantusi-admin-settings-export.json"',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff'
    }
  });
}

export async function adminSettingsRoute(request, env) {
  const path = new URL(request.url).pathname;
  if (!path.startsWith('/api/admin/settings-control')) return null;
  const auth = await authorized(request, env);
  if (auth.response) return auth.response;
  const admin = auth.admin;

  if (path === '/api/admin/settings-control' && request.method === 'GET') return getControl(request, env, admin);
  if (path === '/api/admin/settings-control' && request.method === 'PUT') return updateControl(request, env, admin);
  if (path === '/api/admin/settings-control/reset' && request.method === 'POST') return resetControl(request, env, admin);
  if (path === '/api/admin/settings-control/audit' && request.method === 'GET') return json({ ok: true, audit: await listAudit(env, new URL(request.url).searchParams.get('limit') || 80) });
  if (path === '/api/admin/settings-control/export' && request.method === 'GET') {
    await audit(env, admin, 'settings-export', {});
    return exportControl(env, admin);
  }
  return json({ error: 'Settings Control Centre route not found.' }, 404);
}

export const PERMANENT_ADMIN_EMAIL = PERMANENT_ADMIN;
