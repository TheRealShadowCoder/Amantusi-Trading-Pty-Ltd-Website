import { json, getAdminSession } from './security-v3.js';
import { sendEmail } from './notifications.js';

const SESSION_COOKIE = 'amantusi_admin';
const SESSION_HOURS = 8;
const BACKUP_PBKDF2_ITERATIONS = 100000;
const CODE_TTL_SECONDS = 600;
const CODE_ATTEMPT_MAX = 5;
const REQUEST_RATE_WINDOW_SECONDS = 3600;
const REQUEST_RATE_MAX = 4;
const LOGIN_ATTEMPT_WINDOW_SECONDS = 1800;
const LOGIN_ATTEMPT_MAX = 5;
const LOGIN_LOCK_SECONDS = 900;
const PASSWORD_MIN_LENGTH = 14;
const PASSWORD_MAX_LENGTH = 128;
const AUTH_VERSION = 4;

const ACCOUNTS = Object.freeze({
  'zodwangema37@gmail.com': { role: 'owner', label: 'Owner' },
  's.k.businessline@gmail.com': { role: 'superadmin', label: 'Administrator' }
});
const ADMIN_EMAILS = Object.freeze(Object.keys(ACCOUNTS));

const enc = new TextEncoder();
const dec = new TextDecoder();
const emailOf = (value) => String(value || '').trim().toLowerCase();

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

function randomToken(size = 32) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

function randomCode() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(bytes[0] % 100000000).padStart(8, '0');
}

async function sha(value) {
  return base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(String(value)))));
}

function constantTimeEqual(a, b) {
  const left = String(a || '');
  const right = String(b || '');
  const length = Math.max(left.length, right.length);
  let mismatch = left.length ^ right.length;
  for (let i = 0; i < length; i++) mismatch |= (left.charCodeAt(i) || 0) ^ (right.charCodeAt(i) || 0);
  return mismatch === 0;
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

function requestIp(request) {
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

async function readJson(request) {
  try { return await request.json(); }
  catch (_) { return null; }
}

function passwordKey(email) {
  return `auth:backup-password:${email}`;
}

async function backupPassword(env, email) {
  const raw = await env.CMS_KV?.get(passwordKey(email));
  if (!raw) return null;
  try { return JSON.parse(raw); }
  catch (_) { return null; }
}

async function derivePasswordVerifier(password, salt, iterations = BACKUP_PBKDF2_ITERATIONS) {
  const key = await crypto.subtle.importKey('raw', enc.encode(String(password)), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    hash: 'SHA-256',
    salt: fromBase64url(salt),
    iterations: Math.min(BACKUP_PBKDF2_ITERATIONS, Math.max(1, Number(iterations) || BACKUP_PBKDF2_ITERATIONS))
  }, key, 256);
  return base64url(new Uint8Array(bits));
}

function passwordPolicy(password) {
  const value = String(password || '');
  if (value.length < PASSWORD_MIN_LENGTH || value.length > PASSWORD_MAX_LENGTH) {
    return `Backup password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters.`;
  }
  const hasLetter = /[A-Za-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSymbol = /[^A-Za-z0-9\s]/.test(value);
  if (!hasLetter || !hasNumber || (!hasSymbol && value.length < 20)) {
    return 'Use letters and numbers, plus a symbol unless the password is at least 20 characters long.';
  }
  return '';
}

async function storeBackupPassword(env, email, password) {
  const current = await backupPassword(env, email);
  const salt = randomToken(18);
  const record = {
    salt,
    iterations: BACKUP_PBKDF2_ITERATIONS,
    verifier: await derivePasswordVerifier(password, salt),
    version: (Number(current?.version) || 0) + 1,
    updatedAt: new Date().toISOString(),
    twoFactorRequired: true
  };
  await env.CMS_KV.put(passwordKey(email), JSON.stringify(record));
  return record;
}

async function backupPasswordMatches(password, record) {
  if (!record?.salt || !record?.verifier || !password) return false;
  const verifier = await derivePasswordVerifier(password, record.salt, record.iterations);
  return constantTimeEqual(verifier, record.verifier);
}

async function requestRateKey(request, purpose, scope) {
  return `auth:recovery-rate:${purpose}:${await sha(`${requestIp(request)}|${scope}`)}`;
}

async function consumeRequestRate(request, env, purpose, email) {
  const scopes = [`ip:${requestIp(request)}`, `email:${email || 'unknown'}`];
  for (const scope of scopes) {
    const key = await requestRateKey(request, purpose, scope);
    const count = Number(await env.CMS_KV.get(key)) || 0;
    if (count >= REQUEST_RATE_MAX) return false;
  }
  for (const scope of scopes) {
    const key = await requestRateKey(request, purpose, scope);
    const count = Number(await env.CMS_KV.get(key)) || 0;
    await env.CMS_KV.put(key, String(count + 1), { expirationTtl: REQUEST_RATE_WINDOW_SECONDS });
  }
  return true;
}

async function loginAttemptKey(request, email) {
  return `auth:backup-login-attempt:${await sha(`${requestIp(request)}|${email || 'unknown'}`)}`;
}

async function loginAttemptState(request, env, email) {
  const key = await loginAttemptKey(request, email);
  const raw = await env.CMS_KV.get(key);
  let state = {};
  try { state = raw ? JSON.parse(raw) : {}; } catch (_) {}
  return { key, count: Number(state.count) || 0, lockedUntil: Number(state.lockedUntil) || 0 };
}

async function failBackupLogin(request, env, email) {
  const current = await loginAttemptState(request, env, email);
  const count = current.count + 1;
  const lockedUntil = count >= LOGIN_ATTEMPT_MAX ? Date.now() + LOGIN_LOCK_SECONDS * 1000 : current.lockedUntil;
  await env.CMS_KV.put(current.key, JSON.stringify({ count, lockedUntil, lastAttemptAt: new Date().toISOString() }), {
    expirationTtl: LOGIN_ATTEMPT_WINDOW_SECONDS
  });
  return { count, lockedUntil };
}

async function clearBackupLoginAttempts(request, env, email) {
  await env.CMS_KV.delete(await loginAttemptKey(request, email));
}

function flowKey(flowId) {
  return `auth:recovery-flow:${flowId}`;
}

function activeFlowKey(purpose, email) {
  return `auth:recovery-active:${purpose}:${email}`;
}

async function createCodeFlow(request, env, email, purpose) {
  const previous = await env.CMS_KV.get(activeFlowKey(purpose, email));
  if (previous) await env.CMS_KV.delete(flowKey(previous));

  const flowId = randomToken(24);
  const code = randomCode();
  const codeHash = await sha(`${flowId}|${email}|${purpose}|${code}`);
  const flow = {
    email,
    purpose,
    codeHash,
    attempts: 0,
    createdAt: Date.now(),
    expiresAt: Date.now() + CODE_TTL_SECONDS * 1000,
    ipHash: await sha(requestIp(request))
  };
  await env.CMS_KV.put(flowKey(flowId), JSON.stringify(flow), { expirationTtl: CODE_TTL_SECONDS });
  await env.CMS_KV.put(activeFlowKey(purpose, email), flowId, { expirationTtl: CODE_TTL_SECONDS });

  const subject = purpose === 'login'
    ? 'Amantusi Admin backup sign-in code'
    : purpose === 'setup'
      ? 'Amantusi Admin backup password setup code'
      : 'Amantusi Admin password recovery code';
  const text = [
    'AMANTUSI ADMIN SECURITY CODE',
    '',
    `Your one-time verification code is: ${code}`,
    '',
    `Purpose: ${purpose === 'login' ? 'Backup administrator sign-in' : purpose === 'setup' ? 'Set or change backup password' : 'Reset forgotten backup password'}`,
    `Account: ${email}`,
    'This code expires in 10 minutes and can be used only once.',
    'Do not share this code with anyone.',
    '',
    'If you did not request this action, ignore this email and continue using Google sign-in.'
  ].join('\n');

  const delivery = await sendEmail(env, [email], subject, text, `admin-recovery-${purpose}-${flowId}`);
  if (!delivery?.sent) {
    await env.CMS_KV.delete(flowKey(flowId));
    await env.CMS_KV.delete(activeFlowKey(purpose, email));
    return { ok: false, error: 'Recovery email could not be delivered. Check the configured admin email provider.' };
  }
  return { ok: true, flowId };
}

async function verifyCodeFlow(env, flowId, code, purpose) {
  const key = flowKey(flowId);
  const raw = await env.CMS_KV.get(key);
  if (!raw) return { ok: false, error: 'Verification code expired or is invalid.' };
  let flow;
  try { flow = JSON.parse(raw); } catch (_) { flow = null; }
  if (!flow || flow.purpose !== purpose || Number(flow.expiresAt) <= Date.now()) {
    await env.CMS_KV.delete(key);
    return { ok: false, error: 'Verification code expired or is invalid.' };
  }

  const expected = await sha(`${flowId}|${flow.email}|${purpose}|${String(code || '').trim()}`);
  if (!constantTimeEqual(expected, flow.codeHash)) {
    flow.attempts = (Number(flow.attempts) || 0) + 1;
    if (flow.attempts >= CODE_ATTEMPT_MAX) {
      await env.CMS_KV.delete(key);
      await env.CMS_KV.delete(activeFlowKey(purpose, flow.email));
      return { ok: false, error: 'Too many incorrect codes. Request a new verification code.' };
    }
    await env.CMS_KV.put(key, JSON.stringify(flow), { expirationTtl: Math.max(60, Math.ceil((flow.expiresAt - Date.now()) / 1000)) });
    return { ok: false, error: 'Verification code is incorrect.' };
  }

  await env.CMS_KV.delete(key);
  const activeKey = activeFlowKey(purpose, flow.email);
  if ((await env.CMS_KV.get(activeKey)) === flowId) await env.CMS_KV.delete(activeKey);
  return { ok: true, flow };
}

async function sessionCredential(env, email, rotate = false) {
  const key = `auth:credential:${email}`;
  const raw = await env.CMS_KV.get(key);
  let current = null;
  try { current = raw ? JSON.parse(raw) : null; } catch (_) {}
  if (!rotate && current?.verifier && Number(current.version) > 0) return current;

  const record = {
    salt: randomToken(18),
    iterations: 0,
    verifier: randomToken(32),
    version: (Number(current?.version) || 0) + 1,
    authVersion: AUTH_VERSION,
    federatedOnly: true,
    updatedAt: new Date().toISOString()
  };
  await env.CMS_KV.put(key, JSON.stringify(record));
  return record;
}

async function issueAdminSession(env, email, rotate = false) {
  const record = await sessionCredential(env, email, rotate);
  const payload = base64url(enc.encode(JSON.stringify({
    email,
    version: Number(record.version) || 1,
    exp: Date.now() + SESSION_HOURS * 3600000,
    nonce: randomToken(12)
  })));
  const signature = await hmac(record.verifier, payload);
  return `${payload}.${signature}`;
}

async function notifyRecoveryChange(env, email, action) {
  const text = [
    'AMANTUSI ADMIN SECURITY NOTICE',
    '',
    `${action} for ${email}.`,
    `Time: ${new Date().toISOString()}`,
    '',
    'Google remains the primary sign-in method. Backup access always requires both the backup password and a one-time code sent to the authorized administrator email.'
  ].join('\n');
  await Promise.allSettled(ADMIN_EMAILS.map((recipient) => sendEmail(
    env,
    [recipient],
    'Amantusi Admin backup recovery changed',
    text,
    `admin-recovery-change-${email}-${Date.now()}-${recipient}`
  )));
}

function sessionCookie(token) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`;
}

function genericResetResponse() {
  return {
    ok: true,
    flowId: randomToken(24),
    message: 'If backup recovery is configured for that authorized administrator account, a verification code has been sent.'
  };
}

async function config(request, env) {
  const admin = env.CMS_KV ? await getAdminSession(request, env) : null;
  const currentAdminConfigured = admin ? Boolean(await backupPassword(env, admin.email)) : null;
  return json({
    enabled: Boolean(env.CMS_KV),
    emailDelivery: Boolean(env.RESEND_API_KEY && env.ALERT_FROM_EMAIL),
    primary: 'google',
    backup: 'password+email-code',
    recoveryEngine: 'break-glass-v1',
    passwordMinLength: PASSWORD_MIN_LENGTH,
    codeDigits: 8,
    codeTtlMinutes: CODE_TTL_SECONDS / 60,
    authenticated: Boolean(admin),
    currentAdminConfigured
  });
}

async function setupRequest(request, env) {
  const admin = await getAdminSession(request, env);
  if (!admin) return json({ error: 'Google administrator session required to create backup recovery.' }, 401);
  if (!env.RESEND_API_KEY || !env.ALERT_FROM_EMAIL) return json({ error: 'Recovery email delivery is not configured.' }, 503);
  if (!(await consumeRequestRate(request, env, 'setup', admin.email))) return json({ error: 'Too many recovery-code requests. Try again later.' }, 429);
  const created = await createCodeFlow(request, env, admin.email, 'setup');
  return created.ok
    ? json({ ok: true, flowId: created.flowId, message: 'A setup code was sent to your authorized administrator email.' })
    : json({ error: created.error }, 503);
}

async function setupConfirm(request, env) {
  const admin = await getAdminSession(request, env);
  if (!admin) return json({ error: 'Google administrator session required to create backup recovery.' }, 401);
  const body = await readJson(request);
  if (!body) return json({ error: 'Invalid request.' }, 400);
  const policyError = passwordPolicy(body.password);
  if (policyError) return json({ error: policyError }, 400);
  const verified = await verifyCodeFlow(env, String(body.flowId || ''), body.code, 'setup');
  if (!verified.ok || verified.flow.email !== admin.email) return json({ error: verified.error || 'Verification failed.' }, 400);
  await storeBackupPassword(env, admin.email, body.password);
  await notifyRecoveryChange(env, admin.email, 'Backup administrator password was created or changed');
  return json({ ok: true, configured: true, message: 'Backup recovery is ready. Emergency sign-in will require this password plus an emailed one-time code.' });
}

async function resetRequest(request, env) {
  if (!env.RESEND_API_KEY || !env.ALERT_FROM_EMAIL) return json({ error: 'Recovery email delivery is not configured.' }, 503);
  const body = await readJson(request) || {};
  const email = emailOf(body.email);
  const generic = genericResetResponse();
  if (!(await consumeRequestRate(request, env, 'reset', email))) return json(generic);
  if (!ACCOUNTS[email] || !(await backupPassword(env, email))) return json(generic);
  const created = await createCodeFlow(request, env, email, 'reset');
  if (!created.ok) return json({ error: created.error }, 503);
  return json({ ok: true, flowId: created.flowId, message: 'If backup recovery is configured for that authorized administrator account, a verification code has been sent.' });
}

async function resetConfirm(request, env) {
  const body = await readJson(request);
  if (!body) return json({ error: 'Invalid request.' }, 400);
  const policyError = passwordPolicy(body.password);
  if (policyError) return json({ error: policyError }, 400);
  const verified = await verifyCodeFlow(env, String(body.flowId || ''), body.code, 'reset');
  if (!verified.ok || !ACCOUNTS[verified.flow?.email]) return json({ error: verified.error || 'Verification failed.' }, 400);
  const email = verified.flow.email;
  if (!(await backupPassword(env, email))) return json({ error: 'Backup recovery has not been initialized for this administrator.' }, 400);
  await storeBackupPassword(env, email, body.password);
  const token = await issueAdminSession(env, email, true);
  await notifyRecoveryChange(env, email, 'Forgotten backup administrator password was reset; previous sessions were invalidated');
  const account = ACCOUNTS[email];
  return json({
    ok: true,
    authenticated: true,
    recovered: true,
    email,
    role: account.role,
    label: account.label,
    message: 'Backup password reset successfully. You are signed in.'
  }, 200, { 'set-cookie': sessionCookie(token) });
}

async function loginStart(request, env) {
  if (!env.RESEND_API_KEY || !env.ALERT_FROM_EMAIL) return json({ error: 'Recovery email delivery is not configured.' }, 503);
  const body = await readJson(request);
  if (!body) return json({ error: 'Invalid request.' }, 400);
  const email = emailOf(body.email);
  const current = await loginAttemptState(request, env, email);
  if (current.lockedUntil > Date.now()) {
    const retryAfter = Math.ceil((current.lockedUntil - Date.now()) / 1000);
    return json({ error: 'Too many failed backup sign-in attempts.', retryAfter }, 429, { 'Retry-After': String(retryAfter) });
  }

  const account = ACCOUNTS[email];
  const record = account ? await backupPassword(env, email) : null;
  const valid = Boolean(account && record && await backupPasswordMatches(body.password, record));
  if (!valid) {
    await failBackupLogin(request, env, email);
    return json({ error: 'Incorrect backup email or password.' }, 401);
  }
  await clearBackupLoginAttempts(request, env, email);
  if (!(await consumeRequestRate(request, env, 'login', email))) return json({ error: 'Too many verification-code requests. Try again later.' }, 429);
  const created = await createCodeFlow(request, env, email, 'login');
  return created.ok
    ? json({ ok: true, flowId: created.flowId, message: 'Password accepted. A one-time sign-in code was sent to your authorized administrator email.' })
    : json({ error: created.error }, 503);
}

async function loginVerify(request, env) {
  const body = await readJson(request);
  if (!body) return json({ error: 'Invalid request.' }, 400);
  const verified = await verifyCodeFlow(env, String(body.flowId || ''), body.code, 'login');
  if (!verified.ok || !ACCOUNTS[verified.flow?.email]) return json({ error: verified.error || 'Verification failed.' }, 400);
  const email = verified.flow.email;
  const token = await issueAdminSession(env, email, false);
  const account = ACCOUNTS[email];
  return json({
    ok: true,
    authenticated: true,
    provider: 'backup-password-email-code',
    email,
    role: account.role,
    label: account.label
  }, 200, { 'set-cookie': sessionCookie(token) });
}

export async function adminRecoveryRoute(request, env) {
  const path = new URL(request.url).pathname;
  if (!path.startsWith('/api/admin/recovery/')) return null;
  if (!sameOrigin(request)) return json({ error: 'Origin rejected.' }, 403);
  if (!env.CMS_KV) return json({ error: 'Administrator recovery storage is unavailable.' }, 503);

  if (path === '/api/admin/recovery/config' && request.method === 'GET') return config(request, env);
  if (path === '/api/admin/recovery/setup/request' && request.method === 'POST') return setupRequest(request, env);
  if (path === '/api/admin/recovery/setup/confirm' && request.method === 'POST') return setupConfirm(request, env);
  if (path === '/api/admin/recovery/reset/request' && request.method === 'POST') return resetRequest(request, env);
  if (path === '/api/admin/recovery/reset/confirm' && request.method === 'POST') return resetConfirm(request, env);
  if (path === '/api/admin/recovery/login/start' && request.method === 'POST') return loginStart(request, env);
  if (path === '/api/admin/recovery/login/verify' && request.method === 'POST') return loginVerify(request, env);
  return json({ error: 'Recovery route not found.' }, 404);
}
