import fs from 'node:fs';

const backend = fs.readFileSync('src/google-auth.js', 'utf8');
const worker = fs.readFileSync('src/worker-v4.js', 'utf8');
const client = fs.readFileSync('public/admin-google-login.js', 'utf8');
const css = fs.readFileSync('public/admin-google-login.css', 'utf8');
const deploy = fs.readFileSync('.github/workflows/deploy-cloudflare.yml', 'utf8');

function requireText(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`Google admin auth validation failed: missing ${label}`);
}

for (const [needle, label] of [
  ['https://www.googleapis.com/oauth2/v3/certs', 'Google JWKS verification'],
  ["header.alg !== 'RS256'", 'RS256 enforcement'],
  ['claims.email_verified', 'verified email check'],
  ['claims.nonce', 'nonce verification'],
  ['GOOGLE_ISSUERS', 'issuer verification'],
  ['audiences.includes(clientId)', 'audience verification'],
  ['auth:google-sub:', 'stable Google subject binding'],
  ['auth:google-only:', 'Google-only account policy'],
  ["SameSite=Strict", 'strict session cookie']
]) requireText(backend, needle, label);

for (const [needle, label] of [
  ["googleAuthRoute", 'Google auth Worker route'],
  ['https://accounts.google.com/gsi/client', 'Google Identity Services loader'],
  ["google-password-hidden", 'password-first UI suppression'],
  ["/admin-google-login.js", 'Google login client injection'],
  ["frame-src", 'Google iframe CSP allowance']
]) requireText(worker, needle, label);

for (const [needle, label] of [
  ["/api/admin/google/config", 'Google config endpoint'],
  ["/api/admin/google/session", 'Google session endpoint'],
  ['nonce: flow.nonce', 'client nonce wiring'],
  ["text: 'continue_with'", 'Google button copy'],
  ['revealEmergencyPassword', 'safe emergency fallback']
]) requireText(client, needle, label);

requireText(css, '.google-auth-shell', 'Google auth UI styles');
requireText(deploy, 'GOOGLE_SIGNIN_CLIENT_ID', 'Cloudflare Google client ID sync');

if (backend.includes('GOOGLE_OAUTH_CLIENT_SECRET')) {
  throw new Error('Google admin auth validation failed: authentication-only flow must not require a Google client secret.');
}

console.log('Google admin auth validated: Google Identity Services, nonce/JWKS verification, allowlist binding, Google-only policy and emergency fallback are wired.');
