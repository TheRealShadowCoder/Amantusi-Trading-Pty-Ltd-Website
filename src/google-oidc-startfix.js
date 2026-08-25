const FLOW_TTL_SECONDS = 600;
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_REDIRECT_URI = 'https://amantusi-trading-pty-ltd-website.dolomite-computer.workers.dev/api/admin/google/oauth/callback';

function base64url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function randomToken(size = 32) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

function errorPage(message, status = 503) {
  const safe = String(message || 'Google Sign-In is unavailable.')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return new Response(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Google Sign-In</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#071923;font-family:Arial,sans-serif}.card{width:min(92vw,460px);background:#fff;color:#071923;border-radius:24px;padding:28px;box-sizing:border-box}.card p{color:#33444f}.card a{display:block;margin-top:20px;padding:14px 18px;border-radius:14px;background:#071923;color:#fff;text-align:center;text-decoration:none;font-weight:700}</style></head><body><main class="card"><h1>Google Sign-In</h1><p>${safe}</p><a href="/admin.html">Return to Amantusi Admin</a></main></body></html>`, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }
  });
}

export async function googleOauthStartFixed(env) {
  if (!env.CMS_KV) return errorPage('Admin storage is unavailable.');
  const clientId = String(env.GOOGLE_SIGNIN_CLIENT_ID || '').trim();
  if (!clientId) return errorPage('Google Sign-In is not configured.');

  const state = randomToken(24);
  const nonce = randomToken(24);
  await env.CMS_KV.put(`auth:google-oidc:${state}`, JSON.stringify({ nonce, createdAt: Date.now() }), {
    expirationTtl: FLOW_TTL_SECONDS
  });

  const auth = new URL(GOOGLE_AUTH_URL);
  auth.searchParams.set('client_id', clientId);
  auth.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
  auth.searchParams.set('response_type', 'id_token token');
  auth.searchParams.set('response_mode', 'fragment');
  auth.searchParams.set('scope', 'openid email profile');
  auth.searchParams.set('state', state);
  auth.searchParams.set('nonce', nonce);
  auth.searchParams.set('prompt', 'select_account');
  auth.searchParams.set('include_granted_scopes', 'false');

  return new Response(null, {
    status: 302,
    headers: {
      location: auth.toString(),
      'cache-control': 'no-store',
      pragma: 'no-cache'
    }
  });
}
