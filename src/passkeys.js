import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server';
import { json, getAdminSession, login as passwordLoginBase } from './security-v3.js';
import {
  ensureDatabase, listPasskeys, getPasskey, savePasskey, updatePasskeyCounter, deletePasskey
} from './database.js';

const ACCOUNTS = Object.freeze({
  'zodwangema37@gmail.com': { role: 'owner', label: 'Owner' },
  's.k.businessline@gmail.com': { role: 'superadmin', label: 'Administrator' }
});
const SESSION_COOKIE = 'amantusi_admin';
const SESSION_HOURS = 8;
const FLOW_TTL = 300;
const enc = new TextEncoder();

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; }
  catch (_) { return false; }
}

const emailOf = (value) => String(value || '').trim().toLowerCase();

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

function randomToken(size = 24) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey('raw', enc.encode(String(secret)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return base64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(value))));
}

async function issueSession(env, email) {
  const raw = await env.CMS_KV?.get(`auth:credential:${email}`);
  if (!raw) throw new Error('Password credential must be initialized before passkey sign-in.');
  const record = JSON.parse(raw);
  if (!record?.verifier) throw new Error('Administrator credential is unavailable.');
  const payload = base64url(enc.encode(JSON.stringify({
    email,
    version: Number(record.version) || 1,
    exp: Date.now() + SESSION_HOURS * 3600000,
    nonce: randomToken(12)
  })));
  const signature = await hmac(record.verifier, payload);
  return `${payload}.${signature}`;
}

function rpConfig(request, env) {
  const current = new URL(request.url);
  const origin = String(env.PASSKEY_ORIGIN || current.origin).replace(/\/$/, '');
  const rpID = String(env.PASSKEY_RP_ID || new URL(origin).hostname);
  return { origin, rpID, rpName: 'Amantusi Trading Admin' };
}

async function stableWebAuthnUserId(env, email) {
  const key = `auth:webauthn-user:${email}`;
  let value = await env.CMS_KV.get(key);
  if (!value) {
    value = randomToken(18);
    await env.CMS_KV.put(key, value);
  }
  return value;
}

async function storeFlow(env, type, flowId, data) {
  await env.CMS_KV.put(`webauthn:${type}:${flowId}`, JSON.stringify(data), { expirationTtl: FLOW_TTL });
}

async function takeFlow(env, type, flowId) {
  const key = `webauthn:${type}:${flowId}`;
  const raw = await env.CMS_KV.get(key);
  if (!raw) return null;
  await env.CMS_KV.delete(key);
  try { return JSON.parse(raw); } catch (_) { return null; }
}

function parseTransports(value) {
  try { return JSON.parse(value || '[]'); } catch (_) { return []; }
}

export async function loginWithMfa(request, env) {
  const response = await passwordLoginBase(request, env);
  if (!response.ok) return response;
  let payload = {};
  try { payload = await response.clone().json(); } catch (_) { return response; }
  const email = emailOf(payload.email);
  if (!email || !env.DB || !env.CMS_KV) return response;
  await ensureDatabase(env);
  const policy = await env.CMS_KV.get(`auth:mfa-required:${email}`);
  if (policy !== '1') return response;
  const passkeys = await listPasskeys(env, email);
  if (!passkeys.length) {
    await env.CMS_KV.delete(`auth:mfa-required:${email}`);
    return response;
  }
  return json({
    ok: true,
    authenticated: false,
    mfaRequired: true,
    email,
    role: payload.role,
    label: payload.label,
    message: 'Password accepted. Complete passkey verification.'
  }, 202);
}

export async function registrationOptions(request, env) {
  if (!sameOrigin(request)) return json({ error: 'Origin rejected.' }, 403);
  const admin = await getAdminSession(request, env);
  if (!admin) return json({ error: 'Administrator login required.' }, 401);
  if (!env.DB || !env.CMS_KV) return json({ error: 'Passkey storage is unavailable.' }, 503);
  await ensureDatabase(env);

  const { rpID, rpName, origin } = rpConfig(request, env);
  const existing = await listPasskeys(env, admin.email);
  const userID = await stableWebAuthnUserId(env, admin.email);
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: admin.email,
    userDisplayName: admin.label || admin.email,
    userID: fromBase64url(userID),
    attestationType: 'none',
    supportedAlgorithmIDs: [-7, -257],
    excludeCredentials: existing.map((credential) => ({
      id: credential.id,
      transports: parseTransports(credential.transports)
    })),
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'required'
    }
  });

  const flowId = randomToken(18);
  await storeFlow(env, 'reg', flowId, {
    email: admin.email,
    challenge: options.challenge,
    webauthnUserID: options.user.id,
    origin,
    rpID
  });
  return json({ flowId, options });
}

export async function registrationVerify(request, env) {
  if (!sameOrigin(request)) return json({ error: 'Origin rejected.' }, 403);
  const admin = await getAdminSession(request, env);
  if (!admin) return json({ error: 'Administrator login required.' }, 401);
  if (!env.DB || !env.CMS_KV) return json({ error: 'Passkey storage is unavailable.' }, 503);

  let body;
  try { body = await request.json(); } catch (_) { return json({ error: 'Invalid request.' }, 400); }
  const flow = await takeFlow(env, 'reg', String(body.flowId || ''));
  if (!flow || flow.email !== admin.email) return json({ error: 'Passkey registration expired. Start again.' }, 400);

  try {
    const verification = await verifyRegistrationResponse({
      response: body.credential,
      expectedChallenge: flow.challenge,
      expectedOrigin: flow.origin,
      expectedRPID: flow.rpID,
      requireUserVerification: true
    });
    if (!verification.verified || !verification.registrationInfo) return json({ error: 'Passkey verification failed.' }, 400);
    const info = verification.registrationInfo;
    const credential = info.credential;
    await savePasskey(env, {
      id: credential.id,
      email: admin.email,
      webauthnUserID: flow.webauthnUserID,
      publicKey: base64url(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports || body.credential?.response?.transports || [],
      deviceType: info.credentialDeviceType,
      backedUp: info.credentialBackedUp
    });
    return json({ ok: true, verified: true, credentialId: credential.id });
  } catch (error) {
    console.error(JSON.stringify({ type: 'passkey_registration_error', message: String(error?.message || error) }));
    return json({ error: 'Passkey registration could not be verified.' }, 400);
  }
}

export async function authenticationOptions(request, env) {
  if (!sameOrigin(request)) return json({ error: 'Origin rejected.' }, 403);
  if (!env.DB || !env.CMS_KV) return json({ error: 'Passkey storage is unavailable.' }, 503);
  let body = {};
  try { body = await request.json(); } catch (_) {}
  const email = emailOf(body.email);
  if (!ACCOUNTS[email]) return json({ error: 'Passkey sign-in is unavailable for this account.' }, 400);
  await ensureDatabase(env);
  const passkeys = await listPasskeys(env, email);
  if (!passkeys.length) return json({ error: 'No passkey is registered for this account.' }, 400);

  const { rpID, origin } = rpConfig(request, env);
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'required',
    allowCredentials: passkeys.map((credential) => ({
      id: credential.id,
      transports: parseTransports(credential.transports)
    }))
  });
  const flowId = randomToken(18);
  await storeFlow(env, 'auth', flowId, { email, challenge: options.challenge, origin, rpID });
  return json({ flowId, options });
}

export async function authenticationVerify(request, env) {
  if (!sameOrigin(request)) return json({ error: 'Origin rejected.' }, 403);
  if (!env.DB || !env.CMS_KV) return json({ error: 'Passkey storage is unavailable.' }, 503);
  let body;
  try { body = await request.json(); } catch (_) { return json({ error: 'Invalid request.' }, 400); }
  const flow = await takeFlow(env, 'auth', String(body.flowId || ''));
  if (!flow || !ACCOUNTS[flow.email]) return json({ error: 'Passkey sign-in expired. Start again.' }, 400);
  const credentialId = String(body.credential?.id || '');
  const stored = await getPasskey(env, flow.email, credentialId);
  if (!stored) return json({ error: 'Passkey not recognized.' }, 401);

  try {
    const verification = await verifyAuthenticationResponse({
      response: body.credential,
      expectedChallenge: flow.challenge,
      expectedOrigin: flow.origin,
      expectedRPID: flow.rpID,
      requireUserVerification: true,
      credential: {
        id: stored.id,
        publicKey: fromBase64url(stored.public_key),
        counter: Number(stored.counter || 0),
        transports: parseTransports(stored.transports)
      }
    });
    if (!verification.verified) return json({ error: 'Passkey verification failed.' }, 401);
    await updatePasskeyCounter(env, flow.email, stored.id, verification.authenticationInfo.newCounter);
    const token = await issueSession(env, flow.email);
    const account = ACCOUNTS[flow.email];
    return json({ ok: true, authenticated: true, email: flow.email, role: account.role, label: account.label, passkey: true }, 200, {
      'set-cookie': `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`
    });
  } catch (error) {
    console.error(JSON.stringify({ type: 'passkey_authentication_error', message: String(error?.message || error) }));
    return json({ error: 'Passkey sign-in could not be verified.' }, 401);
  }
}

export async function passkeyList(request, env) {
  const admin = await getAdminSession(request, env);
  if (!admin) return json({ error: 'Administrator login required.' }, 401);
  const credentials = await listPasskeys(env, admin.email);
  const required = (await env.CMS_KV.get(`auth:mfa-required:${admin.email}`)) === '1';
  return json({ credentials, mfaRequired: required });
}

export async function passkeyDelete(request, env, credentialId) {
  if (!sameOrigin(request)) return json({ error: 'Origin rejected.' }, 403);
  const admin = await getAdminSession(request, env);
  if (!admin) return json({ error: 'Administrator login required.' }, 401);
  await deletePasskey(env, admin.email, credentialId);
  const remaining = await listPasskeys(env, admin.email);
  if (!remaining.length) await env.CMS_KV.delete(`auth:mfa-required:${admin.email}`);
  return json({ ok: true, remaining: remaining.length });
}

export async function mfaPolicy(request, env) {
  if (!sameOrigin(request)) return json({ error: 'Origin rejected.' }, 403);
  const admin = await getAdminSession(request, env);
  if (!admin) return json({ error: 'Administrator login required.' }, 401);
  let body = {};
  try { body = await request.json(); } catch (_) {}
  const enabled = Boolean(body.enabled);
  if (enabled) {
    const passkeys = await listPasskeys(env, admin.email);
    if (!passkeys.length) return json({ error: 'Register a passkey before enabling passkey MFA.' }, 400);
    await env.CMS_KV.put(`auth:mfa-required:${admin.email}`, '1');
  } else {
    await env.CMS_KV.delete(`auth:mfa-required:${admin.email}`);
  }
  return json({ ok: true, mfaRequired: enabled });
}

export async function clearMfaAfterPasswordReset(env, email) {
  if (env.CMS_KV && ACCOUNTS[emailOf(email)]) {
    await env.CMS_KV.delete(`auth:mfa-required:${emailOf(email)}`);
  }
}
