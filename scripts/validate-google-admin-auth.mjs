import fs from 'node:fs';

const legacyBackend = fs.readFileSync('src/google-auth.js', 'utf8');
const backend = fs.readFileSync('src/google-auth-secretless.js', 'utf8');
const worker = fs.readFileSync('src/worker-v4.js', 'utf8');
const login = fs.readFileSync('public/admin.html', 'utf8');
const css = fs.readFileSync('public/admin-google-login.css', 'utf8');
const deploy = fs.readFileSync('.github/workflows/deploy-cloudflare.yml', 'utf8');

function requireText(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`Google admin auth validation failed: missing ${label}`);
}

for (const [needle, label] of [
  ['https://www.googleapis.com/oauth2/v3/certs', 'Google JWKS verification'],
  ['https://accounts.google.com/o/oauth2/v2/auth', 'Google authorization endpoint'],
  ['https://oauth2.googleapis.com/token', 'Google token endpoint'],
  ["response_type', 'code'", 'authorization code response type'],
  ["code_challenge_method', 'S256'", 'PKCE S256 challenge'],
  ['code_verifier', 'PKCE verifier exchange'],
  ['auth:google-oauth:', 'one-time OAuth state storage'],
  ['claims.nonce', 'nonce verification'],
  ["header.alg !== 'RS256'", 'RS256 enforcement'],
  ['claims.email_verified', 'verified email check'],
  ['GOOGLE_ISSUERS', 'issuer verification'],
  ['audiences.includes(clientId)', 'audience verification'],
  ['auth:google-sub:', 'stable Google subject binding'],
  ['auth:google-only:', 'Google-only account policy'],
  ["SameSite=Strict", 'strict session cookie'],
  ["/api/admin/google/oauth/start", 'OAuth start route'],
  ['GOOGLE_REDIRECT_PATH', 'OAuth callback route'],
  ["const optionalSecret = String(env.GOOGLE_OAUTH_CLIENT_SECRET || '').trim()", 'optional OAuth client secret'],
  ["if (optionalSecret) body.set('client_secret', optionalSecret)", 'optional-only client secret exchange']
]) requireText(backend, needle, label);

if (backend.includes('if (!clientId || !clientSecret)') || backend.includes('if (!clientId || !optionalSecret)')) {
  throw new Error('Google admin auth validation failed: active PKCE OAuth path still hard-requires a client secret.');
}

for (const [needle, label] of [
  ["from './google-auth-secretless.js'", 'secretless PKCE Worker import'],
  ['googleAuthRoute', 'Google auth Worker route'],
  ['googleLoginPage', 'dedicated Google-first admin page'],
  ['getAdminSession', 'session-aware admin routing'],
  ['/api/admin/google/oauth/start', 'redirect-based Google login link']
]) requireText(worker, needle, label);

for (const [needle, label] of [
  ['href="/api/admin/google/oauth/start"', 'static OAuth start link'],
  ['Continue with Google', 'Google login copy']
]) requireText(login, needle, label);

for (const forbidden of [
  'accounts.google.com/gsi/client',
  '/vendor/google-gsi.js',
  '/admin-google-login.js',
  'id="admin-password"',
  'Login as Administrator'
]) {
  if (login.includes(forbidden)) throw new Error(`Google admin auth validation failed: obsolete browser login dependency remains (${forbidden}).`);
}

for (const [needle, label] of [
  ['.google-auth-shell', 'Google auth UI styles'],
  ['.google-oauth-button', 'Google OAuth redirect button styles'],
  ['color:#071923', 'dark Google login text'],
  ['color:#33444f', 'readable secondary login text']
]) requireText(css, needle, label);

requireText(deploy, 'GOOGLE_SIGNIN_CLIENT_ID', 'Google client ID deployment support');
requireText(legacyBackend, 'googleAuthRoute', 'legacy Google/password compatibility routes');

console.log('Google admin auth validated: secretless PKCE authorization-code redirect, optional client secret, state/nonce protections, JWKS verification, allowlist binding, readable UI and Google-only admin routing are wired.');
