import { json, getAdminSession } from './security-v3.js';

const STATE_KEY = 'quota:state';
const CACHE_TTL_MS = 60_000;
const MODES = new Set(['NORMAL', 'CONSERVE', 'CRITICAL', 'EMERGENCY']);

let cached = { expiresAt: 0, state: null };

const DEFAULT_STATE = Object.freeze({
  mode: 'NORMAL',
  source: 'default',
  updatedAt: null,
  workerRequests: null,
  workerRequestRatio: null,
  kvReads: null,
  kvWrites: null,
  d1RowsRead: null,
  d1RowsWritten: null
});

function normalizeState(value) {
  const input = value && typeof value === 'object' ? value : {};
  const mode = MODES.has(String(input.mode || '').toUpperCase()) ? String(input.mode).toUpperCase() : 'NORMAL';
  return {
    ...DEFAULT_STATE,
    ...input,
    mode,
    source: String(input.source || 'kv').slice(0, 80),
    updatedAt: input.updatedAt || null
  };
}

function overrideMode(env) {
  const mode = String(env.QUOTA_MODE_OVERRIDE || 'AUTO').toUpperCase();
  return MODES.has(mode) ? mode : null;
}

export async function getQuotaState(env, { force = false } = {}) {
  const forced = overrideMode(env);
  if (forced) return { ...DEFAULT_STATE, mode: forced, source: 'env-override', updatedAt: new Date().toISOString() };

  const now = Date.now();
  if (!force && cached.state && cached.expiresAt > now) return cached.state;

  let state = DEFAULT_STATE;
  if (env.CMS_KV) {
    try {
      const stored = await env.CMS_KV.get(STATE_KEY, { type: 'json', cacheTtl: 60 });
      if (stored) state = normalizeState(stored);
    } catch (error) {
      console.warn(JSON.stringify({ type: 'quota_state_read_failed', message: String(error?.message || error) }));
    }
  }

  cached = { state, expiresAt: now + CACHE_TTL_MS };
  return state;
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

  if (category === 'optional' && mode !== 'NORMAL') {
    return { state, category, allowed: false, reason: 'optional-work-shed' };
  }
  if (category === 'background' && (mode === 'CRITICAL' || mode === 'EMERGENCY')) {
    return { state, category, allowed: false, reason: 'background-work-shed' };
  }
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
  if (state?.updatedAt) headers.set('X-Amantusi-Cost-State-At', String(state.updatedAt));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export function allowOptionalTelemetry(state) {
  return !state || state.mode === 'NORMAL';
}

export async function quotaStatusRoute(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/admin/quota') return null;
  const admin = await getAdminSession(request, env);
  if (!admin) return json({ error: 'Administrator login required.' }, 401);
  if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405);

  const state = await getQuotaState(env, { force: true });
  return json({
    ok: true,
    state,
    policy: {
      normal: 'All platform functions enabled.',
      conserve: 'Optional telemetry is shed.',
      critical: 'Optional telemetry and background overflow tasks are shed.',
      emergency: 'Only business-critical platform traffic is prioritized.'
    },
    freeTierReference: {
      workersRequestsPerDay: 100000,
      kvReadsPerDay: 100000,
      kvWritesPerDay: 1000,
      d1RowsReadPerDay: 5000000,
      d1RowsWrittenPerDay: 100000
    }
  });
}
