const SESSION_COOKIE = "amantusi_admin";
const SESSION_HOURS = 8;
const FAILED_ALERT_THRESHOLD = 4;
const LOCK_THRESHOLD = 5;
const ATTEMPT_WINDOW_SECONDS = 3600;
const LOCK_SECONDS = 900;
const RESET_TTL_SECONDS = 900;
const RESET_RATE_WINDOW_SECONDS = 3600;
const RESET_RATE_MAX = 3;

const ACCOUNTS = Object.freeze({
  "zodwangema37@gmail.com": { role: "owner", label: "Owner" },
  "s.k.businessline@gmail.com": { role: "superadmin", label: "Administrator" }
});
const EMAILS = Object.freeze(Object.keys(ACCOUNTS));

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers
    }
  });
}

function emailOf(value) {
  return String(value || "").trim().toLowerCase();
}

function cookies(request) {
  const raw = request.headers.get("cookie") || "";
  return Object.fromEntries(raw.split(";").map((p) => p.trim()).filter(Boolean).map((p) => {
    const i = p.indexOf("=");
    return i < 0 ? [p, ""] : [p.slice(0, i), p.slice(i + 1)];
  }));
}

function b64(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64text(text) {
  return b64(new TextEncoder().encode(text));
}

function decodeB64text(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  return new TextDecoder().decode(Uint8Array.from(atob(padded), (c) => c.charCodeAt(0)));
}

function randomToken(size = 32) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return b64(bytes);
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return b64(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))));
}

async function sha(value) {
  return b64(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))));
}

function equal(a, b) {
  a = String(a || "");
  b = String(b || "");
  if (a.length !== b.length) return false;
  let n = 0;
  for (let i = 0; i < a.length; i += 1) n |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return n === 0;
}

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; }
  catch (_) { return false; }
}

function ip(request) {
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

function context(request) {
  const cf = request.cf || {};
  return {
    ip: ip(request),
    country: cf.country || "unknown",
    city: cf.city || "unknown",
    region: cf.region || "unknown",
    userAgent: request.headers.get("User-Agent") || "unknown",
    at: new Date().toISOString()
  };
}

function credentialKey(email) {
  return `auth:credential:${email}`;
}

async function credential(env, email) {
  if (!env.CMS_KV) return null;
  const raw = await env.CMS_KV.get(credentialKey(email));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (_) { return null; }
}

async function storeCredential(env, email, verifier, version) {
  const record = {
    verifier,
    version: Math.max(1, Number(version) || 1),
    updatedAt: new Date().toISOString()
  };
  await env.CMS_KV.put(credentialKey(email), JSON.stringify(record));
  return record;
}

async function verifier(env, email, password) {
  return hmac(env.AUTH_PEPPER, `password:${email}:${password}`);
}

async function seedAccounts(env, password) {
  for (const email of EMAILS) {
    if (await credential(env, email)) continue;
    await storeCredential(env, email, await verifier(env, email, password), 1);
  }
}

async function sessionToken(env, email, version) {
  const account = ACCOUNTS[email];
  const payload = b64text(JSON.stringify({
    email,
    role: account.role,
    version,
    exp: Date.now() + SESSION_HOURS * 3600000
  }));
  return `${payload}.${await hmac(env.SESSION_SECRET, payload)}`;
}

async function sessionData(env, token) {
  if (!env.SESSION_SECRET || !token?.includes(".")) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || !equal(await hmac(env.SESSION_SECRET, payload), sig)) return null;
  try {
    const data = JSON.parse(decodeB64text(payload));
    return Number(data.exp) > Date.now() ? data : null;
  } catch (_) {
    return null;
  }
}

export async function getAdminSession(request, env) {
  if (!env.CMS_KV) return null;
  const data = await sessionData(env, cookies(request)[SESSION_COOKIE]);
  if (!data?.email || !ACCOUNTS[data.email]) return null;
  const record = await credential(env, data.email);
  if (!record || Number(record.version) !== Number(data.version)) return null;
  return { email: data.email, ...ACCOUNTS[data.email], version: Number(data.version) };
}

async function attemptKey(request, email) {
  return `auth:attempt:${await sha(`${ip(request)}|${email}`)}`;
}

async function attemptState(request, env, email) {
  const key = await attemptKey(request, email);
  const raw = await env.CMS_KV.get(key);
  let state = {};
  try { state = raw ? JSON.parse(raw) : {}; } catch (_) {}
  return {
    key,
    count: Number(state.count) || 0,
    lockedUntil: Number(state.lockedUntil) || 0,
    alerted: Boolean(state.alerted)
  };
}

async function failLogin(request, env, email) {
  const current = await attemptState(request, env, email);
  const count = current.count + 1;
  const lockedUntil = count >= LOCK_THRESHOLD ? Date.now() + LOCK_SECONDS * 1000 : current.lockedUntil;
  const alert = count >= FAILED_ALERT_THRESHOLD && !current.alerted;
  const state = { count, lockedUntil, alerted: current.alerted || alert, lastAttemptAt: new Date().toISOString() };
  await env.CMS_KV.put(current.key, JSON.stringify(state), { expirationTtl: ATTEMPT_WINDOW_SECONDS });
  if (alert) await alertSecurity(request, env, email, state);
  return state;
}

async function clearAttempts(request, env, email) {
  await env.CMS_KV.delete(await attemptKey(request, email));
}

async function sendEmail(env, to, subject, text, key = "") {
  if (!env.RESEND_API_KEY || !env.ALERT_FROM_EMAIL) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "User-Agent": "AmantusiTradingSecurity/1.0",
      ...(key ? { "Idempotency-Key": key.slice(0, 240) } : {})
    },
    body: JSON.stringify({ from: env.ALERT_FROM_EMAIL, to, subject, text })
  });
  return response.ok;
}

async function sendWhatsApp(env, text) {
  const version = env.WHATSAPP_GRAPH_VERSION;
  const token = env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = env.WHATSAPP_PHONE_NUMBER_ID;
  const to = String(env.OWNER_WHATSAPP_NUMBER || "").replace(/\D/g, "");
  const template = env.WHATSAPP_ALERT_TEMPLATE;
  const language = env.WHATSAPP_TEMPLATE_LANGUAGE || "en";
  if (!version || !token || !phoneId || !to || !template) return false;

  const response = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: template,
        language: { code: language },
        components: [{ type: "body", parameters: [{ type: "text", text: text.slice(0, 900) }] }]
      }
    })
  });
  return response.ok;
}

async function alertSecurity(request, env, attemptedEmail, state) {
  const c = context(request);
  const lock = state.lockedUntil > Date.now()
    ? `This IP/account combination is locked until ${new Date(state.lockedUntil).toISOString()}.`
    : "No temporary lock is active yet.";
  const text = [
    "AMANTUSI ADMIN SECURITY ALERT",
    "Potential unauthorized access was detected.",
    "",
    `Attempted admin email: ${attemptedEmail}`,
    `Failed attempts: ${state.count}`,
    `Time: ${c.at}`,
    `IP: ${c.ip}`,
    `Location: ${c.city}, ${c.region}, ${c.country}`,
    `User agent: ${c.userAgent}`,
    lock,
    "",
    "No attempted password is included in this alert."
  ].join("\n");
  const key = `security-${await sha(`${c.ip}|${attemptedEmail}|${Math.floor(Date.now() / 1800000)}`)}`;
  await Promise.allSettled([
    sendEmail(env, EMAILS, "Amantusi Admin Security Alert — Failed Login Attempts", text, key),
    sendWhatsApp(env, text)
  ]);
  await env.CMS_KV.put(`auth:event:${Date.now()}:${key.slice(-12)}`, JSON.stringify({
    type: "failed-login-threshold", attemptedEmail, count: state.count, lockedUntil: state.lockedUntil, ...c
  }), { expirationTtl: 2592000 });
}

export async function login(request, env) {
  if (!sameOrigin(request)) return json({ error: "Origin rejected." }, 403);
  if (!env.CMS_KV || !env.SESSION_SECRET || !env.AUTH_PEPPER) {
    return json({ error: "The production admin security backend is not configured yet." }, 503);
  }

  let body;
  try { body = await request.json(); }
  catch (_) { return json({ error: "Invalid request." }, 400); }

  const email = emailOf(body?.email);
  const password = String(body?.password || "");
  const current = await attemptState(request, env, email || "unknown");

  if (current.lockedUntil > Date.now()) {
    const retry = Math.ceil((current.lockedUntil - Date.now()) / 1000);
    return json({ error: "Too many failed login attempts.", retryAfter: retry }, 429, { "Retry-After": String(retry) });
  }

  const account = ACCOUNTS[email];
  let record = account ? await credential(env, email) : null;
  let valid = false;

  if (account && password && record?.verifier) {
    valid = equal(await verifier(env, email, password), record.verifier);
  } else if (account && password && !record && env.ADMIN_PASSWORD && equal(password, env.ADMIN_PASSWORD)) {
    await seedAccounts(env, password);
    record = await credential(env, email);
    valid = Boolean(record);
  }

  if (!valid || !record) {
    await failLogin(request, env, email || "unknown");
    return json({ error: "Incorrect email or password." }, 401);
  }

  await clearAttempts(request, env, email);
  const token = await sessionToken(env, email, Number(record.version) || 1);
  return json({
    ok: true,
    email,
    role: account.role,
    label: account.label,
    cmsStorage: Boolean(env.CMS_KV),
    mediaStorage: Boolean(env.CMS_MEDIA)
  }, 200, {
    "set-cookie": `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`
  });
}

export function logout() {
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
  return `auth:reset-rate:${await sha(`${ip(request)}|${email || "unknown"}`)}`;
}

export async function requestReset(request, env) {
  const generic = { ok: true, message: "If that address is authorized, a reset link will be sent." };
  if (!sameOrigin(request)) return json({ error: "Origin rejected." }, 403);
  if (!env.CMS_KV || !env.AUTH_PEPPER) return json(generic);

  let body = {};
  try { body = await request.json(); } catch (_) {}
  const email = emailOf(body.email);
  const rateKey = await resetRateKey(request, email);
  const count = Number(await env.CMS_KV.get(rateKey)) || 0;
  if (count < RESET_RATE_MAX) {
    await env.CMS_KV.put(rateKey, String(count + 1), { expirationTtl: RESET_RATE_WINDOW_SECONDS });
  }

  if (!ACCOUNTS[email] || count >= RESET_RATE_MAX || !env.RESEND_API_KEY || !env.ALERT_FROM_EMAIL) {
    return json(generic);
  }

  const token = randomToken();
  const record = {
    tokenHash: await sha(token),
    expiresAt: Date.now() + RESET_TTL_SECONDS * 1000,
    requestedAt: new Date().toISOString()
  };
  await env.CMS_KV.put(`auth:reset:${email}`, JSON.stringify(record), { expirationTtl: RESET_TTL_SECONDS });

  const link = new URL("/admin-reset.html", request.url);
  link.searchParams.set("email", email);
  link.searchParams.set("token", token);

  const text = [
    "Amantusi Admin Password Reset",
    "",
    `A reset was requested for ${email}.`,
    `Use this one-time link: ${link.toString()}`,
    "",
    "The link expires in 15 minutes.",
    "If you did not request this reset, ignore this email."
  ].join("\n");
  await sendEmail(env, [email], "Reset your Amantusi Admin password", text, `reset-${await sha(email + record.requestedAt)}`);
  return json(generic);
}

function passwordError(password) {
  if (password.length < 14) return "Use at least 14 characters.";
  if (password.length > 128) return "Password is too long.";
  return "";
}

export async function confirmReset(request, env) {
  if (!sameOrigin(request)) return json({ error: "Origin rejected." }, 403);
  if (!env.CMS_KV || !env.AUTH_PEPPER) return json({ error: "Password reset is not configured." }, 503);

  let body;
  try { body = await request.json(); }
  catch (_) { return json({ error: "Invalid request." }, 400); }

  const email = emailOf(body?.email);
  const token = String(body?.token || "");
  const newPassword = String(body?.newPassword || "");
  if (!ACCOUNTS[email]) return json({ error: "This password reset link is invalid or expired." }, 400);

  const error = passwordError(newPassword);
  if (error) return json({ error }, 400);

  const raw = await env.CMS_KV.get(`auth:reset:${email}`);
  let reset = null;
  try { reset = raw ? JSON.parse(raw) : null; } catch (_) {}
  if (!reset?.tokenHash || Number(reset.expiresAt) <= Date.now() || !equal(await sha(token), reset.tokenHash)) {
    return json({ error: "This password reset link is invalid or expired." }, 400);
  }

  const old = await credential(env, email);
  const version = (Number(old?.version) || 0) + 1;
  await storeCredential(env, email, await verifier(env, email, newPassword), version);
  await env.CMS_KV.delete(`auth:reset:${email}`);

  await sendEmail(
    env,
    EMAILS,
    "Amantusi Admin password changed",
    `The password for ${email} was changed at ${new Date().toISOString()}. Existing sessions for that account are invalidated. If this was unauthorized, contact the other administrator immediately.`
  );
  return json({ ok: true, message: "Password updated successfully. You can now sign in." });
}

export async function status(env) {
  let readyCredentials = false;
  if (env.CMS_KV) {
    const records = await Promise.all(EMAILS.map((e) => credential(env, e)));
    readyCredentials = records.every((r) => Boolean(r?.verifier));
  }
  return json({
    loginConfigured: Boolean(env.CMS_KV && env.SESSION_SECRET && env.AUTH_PEPPER && (readyCredentials || env.ADMIN_PASSWORD)),
    credentialsReady: readyCredentials,
    contentStorage: Boolean(env.CMS_KV),
    mediaStorage: Boolean(env.CMS_MEDIA),
    emailAlerts: Boolean(env.RESEND_API_KEY && env.ALERT_FROM_EMAIL),
    whatsappAlerts: Boolean(
      env.WHATSAPP_GRAPH_VERSION &&
      env.WHATSAPP_ACCESS_TOKEN &&
      env.WHATSAPP_PHONE_NUMBER_ID &&
      env.OWNER_WHATSAPP_NUMBER &&
      env.WHATSAPP_ALERT_TEMPLATE
    ),
    passwordReset: Boolean(env.CMS_KV && env.AUTH_PEPPER && env.RESEND_API_KEY && env.ALERT_FROM_EMAIL)
  });
}
