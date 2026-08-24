const SESSION_COOKIE = 'amantusi_admin';
const SESSION_HOURS = 8;
const FLOW_TTL_SECONDS = 600;
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_REDIRECT_PATH = '/api/admin/google/oauth/callback';
const GOOGLE_ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);
const PBKDF2_ITERATIONS = 210000;
const AUTH_VERSION = 3;
const enc = new TextEncoder();
const dec = new TextDecoder();

const ACCOUNTS = Object.freeze({
  'zodwangema37@gmail.com': { role: 'owner', label: 'Owner' },
  's.k.businessline@gmail.com': { role: 'superadmin', label: 'Administrator' }
});

let jwksCache = { expiresAt: 0, keys: [] };

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...headers
    }
  });
}

function redirect(location, status = 302, headers = {}) {
  return new Response(null, {
    status,
    headers: {
      location,
      'cache-control': 'no-store',
      pragma: 'no-cache',
      ...headers
    }
  });
}

function oauthErrorPage(message, status = 500) {
  const safe = String(message || 'Google Sign-In could not be completed.')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Amantusi Admin | Google Sign-In</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#071923;font-family:Arial,sans-serif;color:#071923}.card{width:min(92vw,460px);background:#fff;border-radius:24px;padding:28px;box-sizing:border-box}.card h1{margin:0 0 12px}.card p{line-height:1.55;color:#33444f}.card a{display:block;margin-top:20px;padding:14px 18px;border-radius:14px;background:#071923;color:#fff;text-align:center;text-decoration:none;font-weight:700}</style></head><body><main class="card"><h1>Google Sign-In</h1><p>${safe}</p><a href="/admin.html">Return to Amantusi Admin</a></main></body></html>`, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff'
    }
  });
}

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; }
  catch (_) { return false; }
}

function base64url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64url(value) {
  const raw = String(value || '');
  const padded = raw.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((raw.length + 3) % 4);
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

function decodeJwtPart(value) {
  return JSON.parse(dec.decode(fromBase64url(value)));
}

function randomToken(size = 32) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

async function sha256Base64url(value) {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(String(value)));
  return base64url(new Uint8Array(digest));
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(String(secret)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return base64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(value))));
}

function maxAgeFrom(headers) {
  const value = headers.get('cache-control') || '';
  const match = value.match(/max-age=(\d+)/i);
  return match ? Math.max(60, Math.min(Number(match[1]) || 3600, 86400)) : 3600;
}

async function googleJwks() {
  if (jwksCache.keys.length && jwksCache.expiresAt > Date.now() + 30000) return jwksCache.keys;
  const response = await fetch(GOOGLE_JWKS_URL, {
    headers: { accept: 'application/json' },
    cf: { cacheTtl: 3600, cacheEverything: true }
  });
  if (!response.ok) throw new Error('Google signing keys are temporarily unavailable.');
  const payload = await response.json();
  const keys = Array.isArray(payload?.keys) ? payload.keys : [];
  if (!keys.length) throw new Error('Google signing keys were empty.');
  jwksCache = {
    keys,
    expiresAt: Date.now() + maxAgeFrom(response.headers) * 1000
  };
  return keys;
}

async function verifyGoogleIdToken(token, clientId, expectedNonce) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw new Error('Invalid Google credential.');
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeJwtPart(encodedHeader);
  const claims = decodeJwtPart(encodedPayload);
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Unsupported Google credential signature.');

  const keys = await googleJwks();
  const jwk = keys.find((item) => item.kid === header.kid && item.kty === 'RSA');
  if (!jwk) {
    jwksCache.expiresAt = 0;
    throw new Error('Google signing key was not recognized. Try again.');
  }

  const publicKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const validSignature = await crypto.subtle.verify(
    { name: 'RSASSA-PKCS1-v1_5' },
    publicKey,
    fromBase64url(encodedSignature),
    enc.encode(`${encodedHeader}.${encodedPayload}`)
  );
  if (!validSignature) throw new Error('Google credential signature verification failed.');

  const now = Math.floor(Date.now() / 1000);
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audiences.includes(clientId)) throw new Error('Google credential audience mismatch.');
  if (!GOOGLE_ISSUERS.has(String(claims.iss || ''))) throw new Error('Google credential issuer mismatch.');
  if (!Number(claims.exp) || Number(claims.exp) <= now) throw new Error('Google credential has expired.');
  if (Number(claims.iat || 0) > now + 300) throw new Error('Google credential issue time is invalid.');
  if (String(claims.nonce || '') !== String(expectedNonce || '')) throw new Error('Google sign-in replay protection failed.');
  if (!(claims.email_verified === true || claims.email_verified === 'true')) throw new Error('Google email address is not verified.');
  if (!claims.sub || !claims.email) throw new Error('Google credential is missing required identity claims.');
  return claims;
}

async function ensureSessionCredential(env, email) {
  const key = `auth:credential:${email}`;
  const raw = await env.CMS_KV.get(key);
  let record = null;
  try { record = raw ? JSON.parse(raw) : null; } catch (_) {}
  if (record?.verifier && Number(record.version) > 0) return record;

  record = {
    salt: randomToken(18),
    iterations: PBKDF2_ITERATIONS,
    verifier: randomToken(32),
    version: 1,
    authVersion: AUTH_VERSION,
    federatedOnly: true,
    updatedAt: new Date().toISOString()
  };
  await env.CMS_KV.put(key, JSON.stringify(record));
  return record;
}

async function issueSession(env, email) {
  const record = await ensureSessionCredential(env, email);
  const payload = base64url(enc.encode(JSON.stringify({
    email,
    version: Number(record.version) || 1,
    exp: Date.now() + SESSION_HOURS * 3600000,
    nonce: randomToken(12)
  })));
  const signature = await hmac(record.verifier, payload);
  return `${payload}.${signature}`;
}

async function bindGoogleSubject(env, email, subject) {
  const key = `auth:google-sub:${email}`;
  const existing = await env.CMS_KV.get(key);
  if (existing && existing !== subject) throw new Error('This Google account does not match the administrator identity already bound to Amantusi.');
  if (!existing) await env.CMS_KV.put(key, subject);
}

async function markGoogleOnly(env, email) {
  await Promise.all([
    env.CMS_KV.put(`auth:google-only:${email}`, '1'),
    env.CMS_KV.put(`auth:bootstrap-disabled:${email}`, new Date().toISOString())
  ]);
}

async function createLegacyFlow(env) {
  const flowId = randomToken(18);
  const nonce = randomToken(24);
  await env.CMS_KV.put(`auth:google-flow:${flowId}`, JSON.stringify({ nonce, createdAt: Date.now() }), {
    expirationTtl: FLOW_TTL_SECONDS
  });
  return { flowId, nonce };
}

async function takeLegacyFlow(env, flowId) {
  const key = `auth:google-flow:${flowId}`;
  const raw = await env.CMS_KV.get(key);
  if (!raw) return null;
  await env.CMS_KV.delete(key);
  try { return JSON.parse(raw); } catch (_) { return null; }
}

async function createOauthFlow(env) {
  const state = randomToken(24);
  const nonce = randomToken(24);
  const codeVerifier = randomToken(48);
  const codeChallenge = await sha256Base64url(codeVerifier);
  await env.CMS_KV.put(`auth:google-oauth:${state}`, JSON.stringify({
    nonce,
    codeVerifier,
    createdAt: Date.now()
  }), { expirationTtl: FLOW_TTL_SECONDS });
  return { state, nonce, codeVerifier, codeChallenge };
}

async function takeOauthFlow(env, state) {
  const key = `auth:google-oauth:${state}`;
  const raw = await env.CMS_KV.get(key);
  if (!raw) return null;
  await env.CMS_KV.delete(key);
  try { return JSON.parse(raw); } catch (_) { return null; }
}

function oauthRedirectUri(request) {
  return `${new URL(request.url).origin}${GOOGLE_REDIRECT_PATH}`;
}

async function googleOauthStart(request, env) {
  if (!env.CMS_KV) return oauthErrorPage('Admin storage is unavailable.', 503);
  const clientId = String(env.GOOGLE_SIGNIN_CLIENT_ID || '').trim();
  const clientSecret = String(env.GOOGLE_OAUTH_CLIENT_SECRET || '').trim();
  if (!clientId || !clientSecret) {
    return oauthErrorPage('Google OAuth is not fully configured on the server. The administrator must add the OAuth client secret before Google login can continue.', 503);
  }

  const flow = await createOauthFlow(env);
  const auth = new URL(GOOGLE_AUTH_URL);
  auth.searchParams.set('client_id', clientId);
  auth.searchParams.set('redirect_uri', oauthRedirectUri(request));
  auth.searchParams.set('response_type', 'code');
  auth.searchParams.set('scope', 'openid email profile');
  auth.searchParams.set('state', flow.state);
  auth.searchParams.set('nonce', flow.nonce);
  auth.searchParams.set('code_challenge', flow.codeChallenge);
  auth.searchParams.set('code_challenge_method', 'S256');
  auth.searchParams.set('prompt', 'select_account');
  auth.searchParams.set('access_type', 'online');
  auth.searchParams.set('include_granted_scopes', 'false');
  return redirect(auth.toString());
}

async function exchangeAuthorizationCode(request, env, code, flow) {
  const body = new URLSearchParams({
    code,
    client_id: String(env.GOOGLE_SIGNIN_CLIENT_ID || '').trim(),
    client_secret: String(env.GOOGLE_OAUTH_CLIENT_SECRET || '').trim(),
    redirect_uri: oauthRedirectUri(request),
    grant_type: 'authorization_code',
    code_verifier: String(flow.codeVerifier || '')
  });
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      accept: 'application/json'
    },
    body: body.toString()
  });
  let payload = {};
  try { payload = await response.json(); } catch (_) {}
  if (!response.ok || !payload.id_token) {
    const detail = String(payload.error_description || payload.error || 'Google token exchange failed.');
    throw new Error(detail);
  }
  return payload;
}

async function googleOauthCallback(request, env) {
  if (!env.CMS_KV) return oauthErrorPage('Admin storage is unavailable.', 503);
  const url = new URL(request.url);
  if (url.searchParams.get('error')) {
    return oauthErrorPage(`Google did not complete sign-in: ${url.searchParams.get('error_description') || url.searchParams.get('error')}`, 400);
  }

  const state = String(url.searchParams.get('state') || '');
  const code = String(url.searchParams.get('code') || '');
  if (!state || !code) return oauthErrorPage('Google returned an incomplete authorization response.', 400);

  const flow = await takeOauthFlow(env, state);
  if (!flow?.nonce || !flow?.codeVerifier) return oauthErrorPage('This Google sign-in request expired or was already used. Start again.', 400);

  const clientId = String(env.GOOGLE_SIGNIN_CLIENT_ID || '').trim();
  const clientSecret = String(env.GOOGLE_OAUTH_CLIENT_SECRET || '').trim();
  if (!clientId || !clientSecret) return oauthErrorPage('Google OAuth server credentials are not configured.', 503);

  try {
    const tokens = await exchangeAuthorizationCode(request, env, code, flow);
    const claims = await verifyGoogleIdToken(tokens.id_token, clientId, flow.nonce);
    const email = String(claims.email || '').trim().toLowerCase();
    const account = ACCOUNTS[email];
    if (!account) return oauthErrorPage('This Google account is not authorized for Amantusi Admin.', 403);

    await bindGoogleSubject(env, email, String(claims.sub));
    const token = await issueSession(env, email);
    await markGoogleOnly(env, email);

    return redirect('/admin-dashboard.html', 302, {
      'set-cookie': `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`
    });
  } catch (error) {
    console.error(JSON.stringify({ type: 'google_admin_oauth_error', message: String(error?.message || error) }));
    return oauthErrorPage('Google sign-in could not be verified. Return to Admin and try again.', 401);
  }
}

async function googleConfig(request, env) {
  if (!env.CMS_KV) return json({ error: 'Admin storage is unavailable.' }, 503);
  const clientId = String(env.GOOGLE_SIGNIN_CLIENT_ID || '').trim();
  if (!clientId) return json({ error: 'Google Sign-In is not configured yet.', code: 'GOOGLE_SIGNIN_NOT_CONFIGURED' }, 503);
  const flow = await createLegacyFlow(env);
  return json({ clientId, ...flow, expiresIn: FLOW_TTL_SECONDS, preferredFlow: 'redirect' });
}

async function googleSession(request, env) {
  if (!sameOrigin(request)) return json({ error: 'Origin rejected.' }, 403);
  if (!env.CMS_KV) return json({ error: 'Admin storage is unavailable.' }, 503);
  const clientId = String(env.GOOGLE_SIGNIN_CLIENT_ID || '').trim();
  if (!clientId) return json({ error: 'Google Sign-In is not configured yet.' }, 503);

  let body = {};
  try { body = await request.json(); } catch (_) { return json({ error: 'Invalid request.' }, 400); }
  const flow = await takeLegacyFlow(env, String(body.flowId || ''));
  if (!flow?.nonce) return json({ error: 'Google sign-in expired. Start again.' }, 400);

  try {
    const claims = await verifyGoogleIdToken(body.credential, clientId, flow.nonce);
    const email = String(claims.email || '').trim().toLowerCase();
    const account = ACCOUNTS[email];
    if (!account) return json({ error: 'This Google account is not authorized for Amantusi Admin.' }, 403);

    await bindGoogleSubject(env, email, String(claims.sub));
    const token = await issueSession(env, email);
    await markGoogleOnly(env, email);

    return json({
      ok: true,
      authenticated: true,
      provider: 'google',
      email,
      role: account.role,
      label: account.label
    }, 200, {
      'set-cookie': `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`
    });
  } catch (error) {
    console.error(JSON.stringify({ type: 'google_admin_auth_error', message: String(error?.message || error) }));
    return json({ error: 'Google sign-in could not be verified.' }, 401);
  }
}

async function passwordLoginBlocked(request, env) {
  if (!env.CMS_KV) return null;
  let body = {};
  try { body = await request.clone().json(); } catch (_) { return null; }
  const email = String(body.email || '').trim().toLowerCase();
  if (!ACCOUNTS[email]) return null;
  const googleOnly = await env.CMS_KV.get(`auth:google-only:${email}`);
  if (googleOnly !== '1') return null;
  return json({
    error: 'Password login is disabled for this administrator. Use Google Sign-In or a registered passkey.',
    googleOnly: true
  }, 403);
}

export async function googleAuthRoute(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (path === '/api/admin/google/oauth/start' && request.method === 'GET') return googleOauthStart(request, env);
  if (path === GOOGLE_REDIRECT_PATH && request.method === 'GET') return googleOauthCallback(request, env);
  if (path === '/api/admin/google/config' && request.method === 'GET') return googleConfig(request, env);
  if (path === '/api/admin/google/session' && request.method === 'POST') return googleSession(request, env);
  if (path === '/api/admin/session' && request.method === 'POST') return passwordLoginBlocked(request, env);
  return null;
}
