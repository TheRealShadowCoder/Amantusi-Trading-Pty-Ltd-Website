const SESSION_COOKIE = "amantusi_admin";
const SESSION_HOURS = 8;
const FAILED_ALERT_THRESHOLD = 4;
const LOCK_THRESHOLD = 5;
const ATTEMPT_WINDOW_SECONDS = 3600;
const LOCK_SECONDS = 900;
const RESET_TTL_SECONDS = 900;
const RESET_RATE_WINDOW_SECONDS = 3600;
const RESET_RATE_MAX = 3;
const PBKDF2_ITERATIONS = 210000;
const AUTH_VERSION = 3;

// Salted PBKDF2 verifier for the approved initial administrator password.
// The plaintext password is never stored in the repository.
const BOOTSTRAP_CREDENTIAL = Object.freeze({
  salt: "nooU-5URfAHG2ZL18CwFtKym",
  iterations: PBKDF2_ITERATIONS,
  verifier: "DSJIuDRCXuzxwLcaeWlRCKSWrnRMziXos3_YCkDZylk"
});

const ACCOUNTS = Object.freeze({
  "zodwangema37@gmail.com": { role: "owner", label: "Owner" },
  "s.k.businessline@gmail.com": { role: "superadmin", label: "Administrator" }
});
const EMAILS = Object.freeze(Object.keys(ACCOUNTS));

const enc = new TextEncoder();
const dec = new TextDecoder();
const emailOf = (value) => String(value || "").trim().toLowerCase();

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "same-origin",
      ...headers
    }
  });
}

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch (_) {
    return false;
  }
}

function parseCookies(request) {
  const out = {};
  for (const part of (request.headers.get("cookie") || "").split(";")) {
    const item = part.trim();
    if (!item) continue;
    const index = item.indexOf("=");
    out[index < 0 ? item : item.slice(0, index)] = index < 0 ? "" : item.slice(index + 1);
  }
  return out;
}

function base64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64url(value) {
  const raw = String(value || "");
  const padded = raw.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((raw.length + 3) % 4);
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

function randomToken(size = 32) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

async function sha(value) {
  return base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(String(value)))));
}

function constantTimeEqual(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  const length = Math.max(left.length, right.length);
  let mismatch = left.length ^ right.length;
  for (let i = 0; i < length; i++) {
    mismatch |= (left.charCodeAt(i) || 0) ^ (right.charCodeAt(i) || 0);
  }
  return mismatch === 0;
}

async function deriveVerifier(password, salt, iterations = PBKDF2_ITERATIONS) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(String(password)),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits({
    name: "PBKDF2",
    hash: "SHA-256",
    salt: fromBase64url(salt),
    iterations: Number(iterations) || PBKDF2_ITERATIONS
  }, key, 256);
  return base64url(new Uint8Array(bits));
}

async function makeCredential(password, version = 1) {
  const salt = randomToken(18);
  return {
    salt,
    iterations: PBKDF2_ITERATIONS,
    verifier: await deriveVerifier(password, salt),
    version,
    authVersion: AUTH_VERSION,
    updatedAt: new Date().toISOString()
  };
}

const credentialKey = (email) => `auth:credential:${email}`;
const bootstrapDisabledKey = (email) => `auth:bootstrap-disabled:${email}`;

async function credential(env, email) {
  const raw = await env.CMS_KV?.get(credentialKey(email));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

async function storeCredential(env, email, record) {
  await env.CMS_KV.put(credentialKey(email), JSON.stringify(record));
}

async function bootstrapAllowed(env, email) {
  if (!ACCOUNTS[email]) return false;
  return !(await env.CMS_KV.get(bootstrapDisabledKey(email)));
}

async function bootstrapMatches(password) {
  if (!password) return false;
  const verifier = await deriveVerifier(
    password,
    BOOTSTRAP_CREDENTIAL.salt,
    BOOTSTRAP_CREDENTIAL.iterations
  );
  return constantTimeEqual(verifier, BOOTSTRAP_CREDENTIAL.verifier);
}

async function credentialMatches(password, record) {
  if (!password || !record?.salt || !record?.verifier) return false;
  const verifier = await deriveVerifier(password, record.salt, record.iterations);
  return constantTimeEqual(verifier, record.verifier);
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(String(secret)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return base64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(value))));
}

async function createSession(email, record) {
  const payload = base64url(enc.encode(JSON.stringify({
    email,
    version: Number(record.version) || 1,
    exp: Date.now() + SESSION_HOURS * 3600000,
    nonce: randomToken(12)
  })));
  const signature = await hmac(record.verifier, payload);
  return `${payload}.${signature}`;
}

async function verifySession(env, token) {
  if (!env.CMS_KV || !token || !String(token).includes(".")) return null;
  const [payload, signature] = String(token).split(".");
  if (!payload || !signature) return null;

  let data;
  try {
    data = JSON.parse(dec.decode(fromBase64url(payload)));
  } catch (_) {
    return null;
  }

  const email = emailOf(data.email);
  if (!ACCOUNTS[email] || Number(data.exp) <= Date.now()) return null;

  const record = await credential(env, email);
  if (!record || Number(record.version) !== Number(data.version) || !record.verifier) return null;

  const expected = await hmac(record.verifier, payload);
  if (!constantTimeEqual(expected, signature)) return null;

  return {
    email,
    ...ACCOUNTS[email],
    version: Number(record.version) || 1
  };
}

export async function getAdminSession(request, env) {
  return verifySession(env, parseCookies(request)[SESSION_COOKIE]);
}

function requestIp(request) {
  return request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
}

function requestContext(request) {
  const cf = request.cf || {};
  return {
    at: new Date().toISOString(),
    ip: requestIp(request),
    country: cf.country || "Unknown",
    region: cf.region || "Unknown",
    city: cf.city || "Unknown",
    userAgent: (request.headers.get("user-agent") || "Unknown").slice(0, 500)
  };
}

async function attemptKey(request, email) {
  return `auth:attempt:${await sha(`${requestIp(request)}|${email}`)}`;
}

async function attemptState(request, env, email) {
  const key = await attemptKey(request, email);
  const raw = await env.CMS_KV.get(key);
  let state = {};
  try {
    state = raw ? JSON.parse(raw) : {};
  } catch (_) {}
  return {
    key,
    count: Number(state.count) || 0,
    lockedUntil: Number(state.lockedUntil) || 0,
    alerted: Boolean(state.alerted)
  };
}

async function clearAttempts(request, env, email) {
  await env.CMS_KV.delete(await attemptKey(request, email));
}

async function sendEmail(env, to, subject, text, idempotencyKey = "") {
  if (!env.RESEND_API_KEY || !env.ALERT_FROM_EMAIL) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey.slice(0, 240) } : {})
      },
      body: JSON.stringify({ from: env.ALERT_FROM_EMAIL, to, subject, text })
    });
    return response.ok;
  } catch (_) {
    return false;
  }
}

async function sendWhatsApp(env, text) {
  const version = env.WHATSAPP_GRAPH_VERSION;
  const token = env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = env.WHATSAPP_PHONE_NUMBER_ID;
  const to = String(env.OWNER_WHATSAPP_NUMBER || "").replace(/\D/g, "");
  const template = env.WHATSAPP_ALERT_TEMPLATE;
  const language = env.WHATSAPP_TEMPLATE_LANGUAGE || "en";
  if (!version || !token || !phoneId || !to || !template) return false;

  try {
    const response = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: template,
          language: { code: language },
          components: [{
            type: "body",
            parameters: [{ type: "text", text: text.slice(0, 900) }]
          }]
        }
      })
    });
    return response.ok;
  } catch (_) {
    return false;
  }
}

async function alertSecurity(request, env, attemptedEmail, state) {
  const context = requestContext(request);
  const text = [
    "AMANTUSI ADMIN SECURITY ALERT",
    "Potential unauthorized access was detected.",
    "",
    `Attempted admin email: ${attemptedEmail}`,
    `Failed attempts: ${state.count}`,
    `Time: ${context.at}`,
    `IP: ${context.ip}`,
    `Location: ${context.city}, ${context.region}, ${context.country}`,
    `User agent: ${context.userAgent}`,
    state.lockedUntil > Date.now()
      ? `Temporary lock active until ${new Date(state.lockedUntil).toISOString()}.`
      : "No temporary lock is active yet.",
    "",
    "The attempted password is never included in this alert."
  ].join("\n");

  const eventKey = `security-${await sha(`${context.ip}|${attemptedEmail}|${Math.floor(Date.now() / 1800000)}`)}`;

  await Promise.allSettled([
    sendEmail(env, EMAILS, "Amantusi Admin Security Alert — Failed Login Attempts", text, eventKey),
    sendWhatsApp(env, text)
  ]);

  await env.CMS_KV.put(
    `auth:event:${Date.now()}:${eventKey.slice(-12)}`,
    JSON.stringify({
      type: "failed-login-threshold",
      attemptedEmail,
      count: state.count,
      lockedUntil: state.lockedUntil,
      ...context
    }),
    { expirationTtl: 2592000 }
  );
}

async function failLogin(request, env, email) {
  const current = await attemptState(request, env, email);
  const count = current.count + 1;
  const lockedUntil = count >= LOCK_THRESHOLD
    ? Date.now() + LOCK_SECONDS * 1000
    : current.lockedUntil;
  const shouldAlert = count >= FAILED_ALERT_THRESHOLD && !current.alerted;

  const state = {
    count,
    lockedUntil,
    alerted: current.alerted || shouldAlert,
    lastAttemptAt: new Date().toISOString()
  };

  await env.CMS_KV.put(current.key, JSON.stringify(state), {
    expirationTtl: ATTEMPT_WINDOW_SECONDS
  });

  if (shouldAlert) await alertSecurity(request, env, email, state);
  return state;
}

export async function login(request, env) {
  if (!sameOrigin(request)) return json({ error: "Origin rejected." }, 403);
  if (!env.CMS_KV) {
    return json({ error: "The production admin storage binding is not available on this Worker." }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json({ error: "Invalid request." }, 400);
  }

  const email = emailOf(body?.email);
  const password = String(body?.password || "");
  const account = ACCOUNTS[email];

  // Evaluate the approved bootstrap password for an authorized account before enforcing
  // an old IP/account lock. This allows the legitimate owner/admin to recover from stale
  // pre-v3 lock state without weakening normal lockout behaviour for incorrect passwords.
  let bootstrapValid = false;
  if (account && await bootstrapAllowed(env, email)) {
    bootstrapValid = await bootstrapMatches(password);
  }

  const current = await attemptState(request, env, email || "unknown");
  if (current.lockedUntil > Date.now() && !bootstrapValid) {
    const retryAfter = Math.ceil((current.lockedUntil - Date.now()) / 1000);
    return json(
      { error: "Too many failed login attempts.", retryAfter },
      429,
      { "Retry-After": String(retryAfter) }
    );
  }

  let record = account ? await credential(env, email) : null;
  let valid = Boolean(account && record && await credentialMatches(password, record));

  // Until the administrator explicitly completes a password reset, the approved initial
  // password is authoritative. It can create or repair a stale credential record.
  if (account && !valid && bootstrapValid) {
    record = await makeCredential(password, (Number(record?.version) || 0) + 1);
    await storeCredential(env, email, record);
    valid = true;
  }

  if (!valid || !record) {
    await failLogin(request, env, email || "unknown");
    return json({ error: "Incorrect email or password." }, 401);
  }

  await clearAttempts(request, env, email);
  const token = await createSession(email, record);

  return json({
    ok: true,
    authenticated: true,
    email,
    role: account.role,
    label: account.label,
    cmsStorage: true,
    mediaStorage: Boolean(env.CMS_MEDIA || env.CMS_KV),
    authVersion: AUTH_VERSION
  }, 200, {
    "set-cookie": `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`
  });
}

export async function logout(request, env) {
  const token = parseCookies(request)[SESSION_COOKIE];
  // Signed sessions are stateless. Password changes invalidate them by changing the
  // credential verifier/version; logout simply expires the browser cookie.
  void token;
  void env;
  return json({ ok: true }, 200, {
    "set-cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
  });
}

export async function me(request, env) {
  const admin = await getAdminSession(request, env);
  return admin
    ? json({ authenticated: true, email: admin.email, role: admin.role, label: admin.label })
    : json({ authenticated: false }, 401);
}

async function resetRateKey(request, email) {
  return `auth:reset-rate:${await sha(`${requestIp(request)}|${email || "unknown"}`)}`;
}

export async function requestReset(request, env) {
  const generic = {
    ok: true,
    message: "If that address is authorized and email recovery is enabled, a reset link will be sent."
  };

  if (!sameOrigin(request)) return json({ error: "Origin rejected." }, 403);
  if (!env.CMS_KV) return json(generic);

  let body = {};
  try {
    body = await request.json();
  } catch (_) {}

  const email = emailOf(body.email);
  const rateKey = await resetRateKey(request, email);
  const count = Number(await env.CMS_KV.get(rateKey)) || 0;

  if (count < RESET_RATE_MAX) {
    await env.CMS_KV.put(rateKey, String(count + 1), {
      expirationTtl: RESET_RATE_WINDOW_SECONDS
    });
  }

  if (!ACCOUNTS[email] || count >= RESET_RATE_MAX || !env.RESEND_API_KEY || !env.ALERT_FROM_EMAIL) {
    return json(generic);
  }

  const token = randomToken();
  const reset = {
    tokenHash: await sha(token),
    expiresAt: Date.now() + RESET_TTL_SECONDS * 1000,
    requestedAt: new Date().toISOString()
  };

  await env.CMS_KV.put(`auth:reset:${email}`, JSON.stringify(reset), {
    expirationTtl: RESET_TTL_SECONDS
  });

  const link = new URL("/admin-reset.html", request.url);
  link.searchParams.set("email", email);
  link.searchParams.set("token", token);

  const text = [
    "Amantusi Admin Password Reset",
    "",
    `A password reset was requested for ${email}.`,
    `Use this one-time link: ${link.toString()}`,
    "",
    "The link expires in 15 minutes.",
    "If you did not request this reset, ignore this email."
  ].join("\n");

  await sendEmail(
    env,
    [email],
    "Reset your Amantusi Admin password",
    text,
    `reset-${await sha(email + reset.requestedAt)}`
  );

  return json(generic);
}

function passwordError(password) {
  if (password.length < 14) return "Use at least 14 characters.";
  if (password.length > 128) return "Password is too long.";
  return "";
}

export async function confirmReset(request, env) {
  if (!sameOrigin(request)) return json({ error: "Origin rejected." }, 403);
  if (!env.CMS_KV) return json({ error: "Password reset is not configured." }, 503);

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json({ error: "Invalid request." }, 400);
  }

  const email = emailOf(body?.email);
  const token = String(body?.token || "");
  const newPassword = String(body?.newPassword || "");

  if (!ACCOUNTS[email]) {
    return json({ error: "This password reset link is invalid or expired." }, 400);
  }

  const problem = passwordError(newPassword);
  if (problem) return json({ error: problem }, 400);

  const raw = await env.CMS_KV.get(`auth:reset:${email}`);
  let reset = null;
  try {
    reset = raw ? JSON.parse(raw) : null;
  } catch (_) {}

  if (
    !reset?.tokenHash ||
    Number(reset.expiresAt) <= Date.now() ||
    !constantTimeEqual(await sha(token), reset.tokenHash)
  ) {
    return json({ error: "This password reset link is invalid or expired." }, 400);
  }

  const old = await credential(env, email);
  const next = await makeCredential(newPassword, (Number(old?.version) || 0) + 1);
  await storeCredential(env, email, next);

  // An explicit successful reset permanently disables the initial bootstrap password
  // for this administrator account. From this point onward only the new password works.
  await env.CMS_KV.put(bootstrapDisabledKey(email), new Date().toISOString());
  await env.CMS_KV.delete(`auth:reset:${email}`);

  await sendEmail(
    env,
    EMAILS,
    "Amantusi Admin password changed",
    `The password for ${email} was changed at ${new Date().toISOString()}. Existing sessions for that account are invalidated. If this was unauthorized, contact the other administrator immediately.`
  );

  return json({
    ok: true,
    message: "Password updated successfully. You can now sign in."
  });
}

export async function status(env) {
  let credentialCount = 0;
  let bootstrapEnabledCount = 0;

  if (env.CMS_KV) {
    const records = await Promise.all(EMAILS.map((email) => credential(env, email)));
    credentialCount = records.filter((record) => Boolean(record?.verifier)).length;

    const disabled = await Promise.all(
      EMAILS.map((email) => env.CMS_KV.get(bootstrapDisabledKey(email)))
    );
    bootstrapEnabledCount = disabled.filter((value) => !value).length;
  }

  return json({
    ready: Boolean(env.CMS_KV),
    loginConfigured: Boolean(env.CMS_KV),
    bootstrapReady: Boolean(env.CMS_KV && bootstrapEnabledCount > 0),
    bootstrapEnabledCount,
    credentialsReady: credentialCount === EMAILS.length,
    credentialCount,
    contentStorage: Boolean(env.CMS_KV),
    mediaStorage: Boolean(env.CMS_MEDIA || env.CMS_KV),
    mediaBackend: env.CMS_MEDIA ? "r2" : (env.CMS_KV ? "kv" : "none"),
    emailAlerts: Boolean(env.RESEND_API_KEY && env.ALERT_FROM_EMAIL),
    whatsappAlerts: Boolean(
      env.WHATSAPP_GRAPH_VERSION &&
      env.WHATSAPP_ACCESS_TOKEN &&
      env.WHATSAPP_PHONE_NUMBER_ID &&
      env.OWNER_WHATSAPP_NUMBER &&
      env.WHATSAPP_ALERT_TEMPLATE
    ),
    passwordReset: Boolean(env.CMS_KV && env.RESEND_API_KEY && env.ALERT_FROM_EMAIL),
    authVersion: AUTH_VERSION
  });
}
