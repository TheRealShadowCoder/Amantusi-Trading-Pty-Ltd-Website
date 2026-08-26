import workerV4 from './worker-v4.js';
import { getAdminSession } from './security-v3.js';
import { googleAuthRoute } from './google-auth-canonical.js';
import { googleOauthStartFixed } from './google-oidc-startfix.js';
import { googleOauthDiagnostics } from './google-auth-diagnostics.js';
import { adminSettingsRoute } from './admin-settings-control.js';

function noStore(response, mode = 'settings') {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  headers.set('X-Amantusi-Admin-Mode', mode);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function redirect(location, mode = 'google-only') {
  return noStore(new Response(null, { status: 302, headers: { location } }), mode);
}

function googleOnlyAuthResponse() {
  return noStore(new Response(JSON.stringify({
    error: 'Direct password/passkey sign-in is disabled for Amantusi Admin. Use Continue with Google.',
    code: 'GOOGLE_ONLY_AUTH',
    login: '/admin.html'
  }), {
    status: 410,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  }), 'google-only');
}

function isRetiredDirectAuthPath(path) {
  return path === '/api/admin/session' ||
    path.startsWith('/api/admin/password-reset') ||
    path === '/api/admin/passkeys/authentication/options' ||
    path === '/api/admin/passkeys/authentication/verify';
}

export default {
  async fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;

    if (path === '/api/admin/google/oauth/diagnostics' && request.method === 'GET') {
      return googleOauthDiagnostics(env);
    }

    if (path === '/api/admin/google/oauth/start' && request.method === 'GET') {
      return googleOauthStartFixed(env);
    }

    if (path === '/api/admin/google/oauth/callback') {
      const response = await googleAuthRoute(request, env);
      if (response) return response;
    }

    // Google-only mode is authoritative on every deployed admin surface.
    // Retire legacy password reset and direct passkey sign-in before older Worker
    // layers can reach historical credential code.
    if (request.method === 'POST' && isRetiredDirectAuthPath(path)) {
      return googleOnlyAuthResponse();
    }

    if (path === '/admin-reset.html' && request.method === 'GET') {
      return redirect('/admin.html?reason=password-reset-retired', 'google-only-retired-reset');
    }

    const settingsApi = await adminSettingsRoute(request, env);
    if (settingsApi) return noStore(settingsApi, 'settings-api');

    if (path === '/admin-settings.html' && request.method === 'GET') {
      const admin = await getAdminSession(request, env);
      if (!admin) return redirect('/admin.html', 'settings-auth');
      const response = await workerV4.fetch(request, env, ctx);
      return noStore(response, 'settings');
    }

    return workerV4.fetch(request, env, ctx);
  }
};