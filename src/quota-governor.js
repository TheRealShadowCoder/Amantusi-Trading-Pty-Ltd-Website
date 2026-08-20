import { json, getAdminSession } from './security-v3.js';

const STATE_KEY = 'quota:state';
const CACHE_TTL_MS = 60_000;
const MODES = new Set(['NORMAL', 'CONSERVE', 'CRITICAL', 'EMERGENCY']);
const MODE_RANK = { NORMAL: 0, CONSERVE: 1, CRITICAL: 2, EMERGENCY: 3 };

let cached = { expiresAt: 0, state: null };

const DEFAULT_OVERRIDE = Object.freeze({ mode: 'AUTO', updatedAt: null, updatedBy: null });
const DEFAULT_STATE = Object.freeze({
  mode: 'NORMAL',
  source: 'default',
  updatedAt: null,
  workerRequests: null,
  workerRequestRatio: null,
  kvReads: null,
  kvWrites: null,
  d1RowsRead: null,
  d1RowsWritten: null,
  manualOverride: null
});

export const FREE_TIER_REFERENCE = Object.freeze({
  workersRequestsPerDay: 100000,
  kvReadsPerDay: 100000,
  kvWritesPerDay: 1000,
  d1RowsReadPerDay: 5000000,
  d1RowsWrittenPerDay: 100000
});

export const GOVERNOR_THRESHOLDS = Object.freeze({ conserve: 0.60, critical: 0.80, emergency: 0.93 });

function normalizeOverride(value) {
  const input = value && typeof value === 'object' ? value : {};
  const candidate = String(input.mode || 'AUTO').toUpperCase();
  return {
    mode: MODES.has(candidate) ? candidate : 'AUTO',
    updatedAt: input.updatedAt || null,
    updatedBy: input.updatedBy ? String(input.updatedBy).slice(0, 200) : null
  };
}

function normalizeState(value) {
  const input = value && typeof value === 'object' ? value : {};
  const mode = MODES.has(String(input.mode || '').toUpperCase()) ? String(input.mode).toUpperCase() : 'NORMAL';
  return {
    ...DEFAULT_STATE,
    ...input,
    mode,
    source: String(input.source || 'kv').slice(0, 80),
    updatedAt: input.updatedAt || null,
    manualOverride: input.manualOverride ? normalizeOverride(input.manualOverride) : null
  };
}

function envOverrideMode(env) {
  const mode = String(env.QUOTA_MODE_OVERRIDE || 'AUTO').toUpperCase();
  return MODES.has(mode) ? mode : null;
}

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; }
  catch (_) { return false; }
}

function optionalNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function readStoredState(env) {
  let state = DEFAULT_STATE;
  if (!env.CMS_KV) return state;
  try {
    const stored = await env.CMS_KV.get(STATE_KEY, { type: 'json', cacheTtl: 60 });
    if (stored) state = normalizeState(stored);
  } catch (error) {
    console.warn(JSON.stringify({ type: 'quota_state_read_failed', message: String(error?.message || error) }));
  }
  return state;
}

export async function getQuotaState(env, { force = false } = {}) {
  const now = Date.now();
  let state;
  if (!force && cached.state && cached.expiresAt > now) state = cached.state;
  else {
    state = await readStoredState(env);
    cached = { state, expiresAt: now + CACHE_TTL_MS };
  }

  const automaticMode = state.mode;
  const envForced = envOverrideMode(env);
  const manual = state.manualOverride ? normalizeOverride(state.manualOverride) : DEFAULT_OVERRIDE;
  const manualMode = manual.mode !== 'AUTO' ? manual.mode : null;
  const effectiveMode = envForced || manualMode || automaticMode;
  const effectiveSource = envForced ? 'env-override' : (manualMode ? 'manual-override' : state.source);

  return {
    ...state,
    automaticMode,
    mode: effectiveMode,
    source: effectiveSource,
    override: envForced
      ? { mode: envForced, type: 'environment', updatedAt: null, updatedBy: null }
      : manualMode
        ? { ...manual, type: 'manual' }
        : { ...DEFAULT_OVERRIDE, type: 'auto' }
  };
}

function featureState(state) {
  const mode = state?.mode || 'NORMAL';
  return {
    staticPublicSite: true,
    rfqAndAdmin: true,
    optionalTelemetry: mode === 'NORMAL',
    backgroundOverflow: mode === 'NORMAL' || mode === 'CONSERVE'
  };
}

function categoryFor(request) {
  const path = new URL(request.url).pathname;
  if (path === '/api/analytics' || path.startsWith('/api/telemetry') || path.startsWith('/api/events')) return 'optional';
  if (path === '/api/admin/overflow/task') return 'background';
  if (path === '/api/quote' || path.startsWith('/api/admin/') || path === '/api/health' || path === '/api/catering-content' || path.startsWith('/media/')) return 'critical';
  return 'normal';
}

export async function evaluateQuotaPolicy(request, env) {
  const state = await getQuotaState(env);
  const category = categoryFor(request);
  const mode = state.mode;
  if (category === 'optional' && mode !== 'NORMAL') return { state, category, allowed: false, reason: 'optional-work-shed' };
  if (category === 'background' && (mode === 'CRITICAL' || mode === 'EMERGENCY')) return { state, category, allowed: false, reason: 'background-work-shed' };
  return { state, category, allowed: true, reason: null };
}

export function quotaRejectedResponse(decision) {
  return json({
    ok: false,
    deferred: true,
    costMode: decision.state.mode,
    error: decision.category === 'optional'
      ? 'Optional telemetry is temporarily disabled to preserve free-tier capacity.'
      : 'Optional background processing is temporarily deferred to preserve business-critical capacity.'
  }, 503);
}

export function addQuotaHeaders(response, state) {
  const headers = new Headers(response.headers);
  headers.set('X-Amantusi-Cost-Mode', state?.mode || 'NORMAL');
  headers.set('X-Amantusi-Cost-Mode-Source', state?.source || 'default');
  if (state?.updatedAt) headers.set('X-Amantusi-Cost-State-At', String(state.updatedAt));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export function allowOptionalTelemetry(state) {
  return !state || state.mode === 'NORMAL';
}

async function setManualOverride(env, mode, adminEmail) {
  if (!env.CMS_KV) throw new Error('Quota control storage is unavailable.');
  const state = normalizeState(await readStoredState(env));
  const next = {
    ...state,
    manualOverride: mode === 'AUTO' ? null : {
      mode,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail || 'administrator'
    }
  };
  await env.CMS_KV.put(STATE_KEY, JSON.stringify(next));
  cached = { expiresAt: 0, state: null };
}

function quotaPayload(state) {
  const usedRaw = optionalNumber(state.workerRequests);
  const used = usedRaw !== null && usedRaw >= 0 ? usedRaw : null;
  const storedRatio = optionalNumber(state.workerRequestRatio);
  const ratio = storedRatio !== null
    ? Math.max(0, storedRatio)
    : (used !== null ? used / FREE_TIER_REFERENCE.workersRequestsPerDay : null);
  const remaining = used !== null ? Math.max(0, FREE_TIER_REFERENCE.workersRequestsPerDay - used) : null;

  return {
    ok: true,
    state: { ...state, workerRequestRatio: ratio },
    usage: { workerRequests: used, workerRequestRatio: ratio, workerRequestsRemaining: remaining },
    shed: featureState(state),
    thresholds: GOVERNOR_THRESHOLDS,
    policy: {
      normal: 'All platform functions enabled.',
      conserve: 'Optional telemetry is shed while business functions and overflow remain available.',
      critical: 'Optional telemetry and background overflow tasks are shed.',
      emergency: 'Only business-critical platform traffic is prioritized.'
    },
    freeTierReference: FREE_TIER_REFERENCE
  };
}

export async function quotaStatusRoute(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/admin/quota') return null;
  const admin = await getAdminSession(request, env);
  if (!admin) return json({ error: 'Administrator login required.' }, 401);

  if (request.method === 'GET') return json(quotaPayload(await getQuotaState(env, { force: true })));

  if (request.method === 'POST') {
    if (!sameOrigin(request)) return json({ error: 'Origin rejected.' }, 403);
    if (!env.CMS_KV) return json({ error: 'Quota control storage is unavailable.' }, 503);
    let body = {};
    try { body = await request.json(); } catch (_) { return json({ error: 'Invalid JSON request.' }, 400); }
    const requested = String(body.mode || '').toUpperCase();
    if (requested !== 'AUTO' && !MODES.has(requested)) return json({ error: 'Invalid quota mode.' }, 400);

    const current = await getQuotaState(env, { force: true });
    const automaticMode = current.automaticMode || 'NORMAL';
    const lowersProtection = requested !== 'AUTO' && MODE_RANK[requested] < MODE_RANK[automaticMode];
    if (lowersProtection && body.confirmRisk !== true) {
      return json({
        error: `Automatic protection currently recommends ${automaticMode}. Confirm before forcing ${requested}.`,
        requiresConfirmation: true,
        automaticMode,
        requestedMode: requested
      }, 409);
    }

    try { await setManualOverride(env, requested, admin.email); }
    catch (error) { return json({ error: String(error?.message || error) }, 503); }

    const updated = await getQuotaState(env, { force: true });
    return json({
      ...quotaPayload(updated),
      changed: true,
      message: requested === 'AUTO'
        ? `Automatic quota protection restored. Current mode: ${updated.mode}.`
        : `Manual cost mode set to ${requested}.`
    });
  }

  return json({ error: 'Method not allowed.' }, 405);
}