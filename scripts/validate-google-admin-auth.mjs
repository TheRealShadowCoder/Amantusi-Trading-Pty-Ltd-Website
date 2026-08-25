import fs from 'node:fs';

const legacyBackend = fs.readFileSync('src/google-auth.js', 'utf8');
const backend = fs.readFileSync('src/google-oidc-fragment.js', 'utf8');
const canonical = fs.readFileSync('src/google-auth-canonical.js', 'utf8');
const worker = fs.readFileSync('src/worker-v5.js', 'utf8');
const callbackClient = fs.readFileSync('public/google-oidc-callback.js', 'utf8');
const login = fs.readFileSync('public/admin.html', 'utf8');
const css = fs.readFileSync('public/admin-google-login.css', 'utf8');

function requireText(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`Google admin auth validation failed: missing ${label}`);
}

for (const [needle, label] of [
  ['https://www.googleapis.com/oauth2/v3/certs', 'Google JWKS verification'],
  ['https://accounts.google.com/o/oauth2/v2/auth', 'Google authorization endpoint'],
  ["response_type', 'id_token'", 'OIDC ID-token response'],
  ["response_mode', 'fragment'", 'fragment response mode'],
  ['auth:google-oidc:', 'one-time OIDC state storage'],
  ['claims.nonce', 'nonce verification'],
  ["header.alg !== 'RS256'", 'RS256 enforcement'],
  ['claims.email_verified', 'verified email check'],
  ['GOOGLE_ISSUERS', 'issuer verification'],
  ['audiences.includes(clientId)', 'audience verification'],
  ['auth:google-sub:', 'stable Google subject binding'],
  ['auth:google-only:', 'Google-only account policy'],
  ["SameSite=Strict", 'strict session cookie'],
  ["request.method === 'POST'", 'same-origin callback completion POST'],
  ['/google-oidc-callback.js', 'same-origin callback client']
]) requireText(backend, needle, label);

for (const forbidden of ['oauth2.googleapis.com/token', 'GOOGLE_OAUTH_CLIENT_SECRET', 'code_verifier', 'code_challenge']) {
  if (backend.includes(forbidden)) throw new Error(`Google admin auth validation failed: auth-only OIDC flow still depends on ${forbidden}.`);
}

requireText(canonical, 'GOOGLE_CANONICAL_ORIGIN', 'canonical production origin');
requireText(canonical, 'google-oidc-fragment.js', 'canonical OIDC handler import');
requireText(worker, 'google-auth-canonical.js', 'canonical Google auth Worker import');

for (const [needle, label] of [
  ["location.hash.startsWith('#')", 'fragment parsing'],
  ['history.replaceState', 'ID-token URL cleanup'],
  ["method: 'POST'", 'same-origin ID-token forwarding'],
  ["location.replace('/admin-dashboard.html')", 'authenticated dashboard redirect']
]) requireText(callbackClient, needle, label);

for (const [needle, label] of [
  ['href="/api/admin/google/oauth/start"', 'static OAuth start link'],
  ['Continue with Google', 'Google login copy']
]) requireText(login, needle, label);

for (const forbidden of ['accounts.google.com/gsi/client', '/vendor/google-gsi.js', '/admin-google-login.js', 'id="admin-password"', 'Login as Administrator']) {
  if (login.includes(forbidden)) throw new Error(`Google admin auth validation failed: obsolete browser login dependency remains (${forbidden}).`);
}

for (const [needle, label] of [
  ['.google-auth-shell', 'Google auth UI styles'],
  ['.google-oauth-button', 'Google OAuth redirect button styles'],
  ['color:#071923', 'dark Google login text'],
  ['color:#33444f', 'readable secondary login text']
]) requireText(css, needle, label);

requireText(legacyBackend, 'googleAuthRoute', 'legacy compatibility routes');
console.log('Google admin auth validated: canonical OIDC ID-token redirect, no GIS dependency, no client-secret/token-exchange dependency, state/nonce/JWKS checks, same-origin callback forwarding and Google-only admin routing are wired.');
