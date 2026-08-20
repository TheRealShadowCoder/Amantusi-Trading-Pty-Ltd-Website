import { json, getAdminSession } from './security-v3.js';

let cachedCloudRunToken = { token: '', expiresAt: 0 };
let cachedPrivateKey = { pem: '', key: null };

function base64url(input) {
  const bytes = input instanceof Uint8Array ? input : new TextEncoder().encode(String(input));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeJwtExpiry(token) {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = part + '='.repeat((4 - part.length % 4) % 4);
    const payload = JSON.parse(atob(padded));
    return Number(payload.exp || 0) * 1000;
  } catch (_) {
    return 0;
  }
}

function pemToBytes(pem) {
  const base64 = String(pem || '')
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  if (!base64) throw new Error('GCP WIF private key is not configured.');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function privateSigningKey(env) {
  const pem = String(env.GCP_WIF_PRIVATE_KEY || '');
  if (!pem) throw new Error('GCP_WIF_PRIVATE_KEY is missing.');
  if (cachedPrivateKey.pem === pem && cachedPrivateKey.key) return cachedPrivateKey.key;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToBytes(pem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  cachedPrivateKey = { pem, key };
  return key;
}

async function externalSubjectToken(env) {
  const issuer = String(env.GCP_WIF_ISSUER || '');
  const audience = String(env.GCP_WIF_TOKEN_AUDIENCE || 'amantusi-cloudflare-worker');
  const keyId = String(env.GCP_WIF_KEY_ID || 'amantusi-cloudflare-1');
  if (!issuer) throw new Error('GCP_WIF_ISSUER is missing.');

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: keyId }));
  const payload = base64url(JSON.stringify({
    iss: issuer,
    sub: 'amantusi-cloudflare-worker',
    aud: audience,
    iat: now - 5,
    nbf: now - 5,
    exp: now + 240,
    jti: crypto.randomUUID()
  }));
  const unsigned = `${header}.${payload}`;
  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    await privateSigningKey(env),
    new TextEncoder().encode(unsigned)
  );
  return `${unsigned}.${base64url(new Uint8Array(signature))}`;
}

async function federatedAccessToken(env) {
  const projectNumber = String(env.GCP_PROJECT_NUMBER || '');
  const pool = String(env.GCP_WIF_POOL || 'amantusi-cloudflare-pool');
  const provider = String(env.GCP_WIF_PROVIDER || 'amantusi-cloudflare');
  if (!projectNumber) throw new Error('GCP_PROJECT_NUMBER is missing.');

  const providerResource = `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${pool}/providers/${provider}`;
  const body = new URLSearchParams({
    audience: providerResource,
    grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
    requested_token_type: 'urn:ietf:params:oauth:token-type:access_token',
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
    subject_token: await externalSubjectToken(env)
  });

  const response = await fetch('https://sts.googleapis.com/v1/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(`Google STS exchange failed (${response.status}): ${String(payload.error_description || payload.error || 'unknown error').slice(0, 300)}`);
  }
  return payload.access_token;
}

async function cloudRunIdToken(env) {
  if (cachedCloudRunToken.token && cachedCloudRunToken.expiresAt > Date.now() + 300_000) return cachedCloudRunToken.token;

  const serviceAccount = String(env.GCP_INVOKER_SERVICE_ACCOUNT || '');
  const audience = String(env.GCP_CLOUD_RUN_URL || '').replace(/\/$/, '');
  if (!serviceAccount || !audience) throw new Error('Google overflow invoker configuration is incomplete.');

  const accessToken = await federatedAccessToken(env);
  const endpoint = `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(serviceAccount)}:generateIdToken`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({ audience, includeEmail: true })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.token) {
    throw new Error(`Google ID-token generation failed (${response.status}): ${String(payload.error?.message || 'unknown error').slice(0, 300)}`);
  }

  cachedCloudRunToken = {
    token: payload.token,
    expiresAt: decodeJwtExpiry(payload.token) || Date.now() + 45 * 60_000
  };
  return payload.token;
}

export function overflowConfigured(env) {
  return String(env.GCP_OVERFLOW_ENABLED || 'false').toLowerCase() === 'true'
    && Boolean(env.GCP_WIF_PRIVATE_KEY)
    && Boolean(env.GCP_PROJECT_NUMBER)
    && Boolean(env.GCP_INVOKER_SERVICE_ACCOUNT)
    && Boolean(env.GCP_CLOUD_RUN_URL);
}

export async function invokeOverflowTask(env, task, { timeoutMs = 12_000 } = {}) {
  if (!overflowConfigured(env)) return { ok: false, disabled: true, error: 'overflow-not-configured' };
  const allowed = new Set(['document-preview', 'integration-batch', 'report-prep']);
  if (!allowed.has(String(task?.type || ''))) return { ok: false, error: 'unsupported-task' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), timeoutMs);
  try {
    const token = await cloudRunIdToken(env);
    const response = await fetch(`${String(env.GCP_CLOUD_RUN_URL).replace(/\/$/, '')}/task`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'user-agent': 'amantusi-cloudflare-overflow/1.0'
      },
      body: JSON.stringify(task),
      signal: controller.signal
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, status: response.status, error: payload.error || 'cloud-run-rejected' };
    return { ok: true, status: response.status, payload };
  } catch (error) {
    return { ok: false, error: String(error?.message || error).slice(0, 500) };
  } finally {
    clearTimeout(timer);
  }
}

export async function overflowRoute(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/admin/overflow/status' && url.pathname !== '/api/admin/overflow/task') return null;

  const admin = await getAdminSession(request, env);
  if (!admin) return json({ error: 'Administrator login required.' }, 401);

  if (url.pathname.endsWith('/status') && request.method === 'GET') {
    return json({
      ok: true,
      configured: overflowConfigured(env),
      provider: 'google-cloud-run',
      privateIam: true,
      serviceUrl: env.GCP_CLOUD_RUN_URL || null,
      pool: env.GCP_WIF_POOL || null,
      providerId: env.GCP_WIF_PROVIDER || null
    });
  }

  if (url.pathname.endsWith('/task') && request.method === 'POST') {
    let body = {};
    try { body = await request.json(); } catch (_) { return json({ error: 'Invalid JSON request.' }, 400); }
    const type = String(body.type || '');
    const result = await invokeOverflowTask(env, { type, payload: body.payload || null });
    return json(result, result.ok ? 200 : (result.disabled ? 503 : 502));
  }

  return json({ error: 'Method not allowed.' }, 405);
}
