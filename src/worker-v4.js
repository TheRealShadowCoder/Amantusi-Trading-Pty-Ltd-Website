import core from './worker.js';
import { getAdminSession } from './security-v3.js';
import {
  evaluateQuotaPolicy,
  quotaRejectedResponse,
  addQuotaHeaders,
  quotaStatusRoute,
  allowOptionalTelemetry
} from './quota-governor.js';
import { overflowRoute } from './google-overflow.js';
import { googleAuthRoute } from './google-auth-secretless.js';

function wrapperHeaders(response, requestId, started) {
  const headers = new Headers(response.headers);
  headers.set('X-Amantusi-Request-Id', headers.get('X-Amantusi-Request-Id') || requestId);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), publickey-credentials-create=(self), publickey-credentials-get=(self)');
  headers.set('Server-Timing', headers.get('Server-Timing') || `app;dur=${Date.now() - started}`);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function noStoreAdmin(response, mode = 'google-only') {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  headers.set('X-Amantusi-Admin-Mode', mode);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function redirect(location) {
  return noStoreAdmin(new Response(null, {
    status: 302,
    headers: { location }
  }), 'google-only');
}

function googleLoginPage() {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#071923">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>Amantusi Admin | Google Sign-In</title>
  <link rel="icon" href="/assets/amantusi-logo.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/catering.css">
  <link rel="stylesheet" href="/admin-security.css">
  <link rel="stylesheet" href="/admin-google-login.css">
</head>
<body class="admin-body">
  <section class="login-wrap" id="login-view">
    <div class="login-card secure-login-card">
      <img src="/assets/amantusi-logo.svg" alt="Amantusi Trading">
      <p class="menu-kicker">Secure operations platform</p>
      <h1>Amantusi Admin</h1>
      <p>Manage enquiries, quotations, suppliers, products, catering content and company information from one protected workspace.</p>
      <div class="google-auth-shell" id="google-auth-shell">
        <div class="google-auth-title">
          <strong>Continue with Google</strong>
          <span>Sign in on Google's secure website, then return automatically to Amantusi Admin. No website password is required.</span>
        </div>
        <div id="google-signin-button" aria-label="Continue with Google">
          <a id="google-oauth-start" class="google-oauth-button" href="/api/admin/google/oauth/start">
            <span class="google-oauth-mark" aria-hidden="true">G</span>
            <span>Continue with Google</span>
          </a>
        </div>
        <p id="google-login-status">You will be redirected securely to Google to choose your authorized administrator account.</p>
      </div>
      <div class="security-notice">
        <strong>Google-protected administration</strong>
        <span>Google authenticates your account on its own domain. Amantusi verifies the signed ID token, one-time state, nonce, PKCE challenge and administrator allowlist before opening the operations workspace.</span>
      </div>
    </div>
  </section>
</body>
</html>`;
  return noStoreAdmin(new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'content-security-policy': "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'"
    }
  }), 'google-only');
}

function injectAuthenticatedAdminControls(response) {
  if (!response.ok) return noStoreAdmin(response, 'dashboard');
  const transformed = new HTMLRewriter()
    .on('head', {
      element(element) {
        element.append('<link rel="stylesheet" href="/admin-cost.css"><style>body:has(#admin-view) #login-view{display:none!important}</style>', { html: true });
      }
    })
    .on('body', {
      element(element) {
        element.append('<script src="/admin-cost.js" defer></script><script>window.__AMANTUSI_GOOGLE_ONLY__=true;</script>', { html: true });
      }
    })
    .transform(response);
  return noStoreAdmin(transformed, 'dashboard');
}

export default {
  async fetch(request, env, ctx) {
    const started = Date.now();
    const requestId = crypto.randomUUID();
    const path = new URL(request.url).pathname;

    // Authentication routes must not be blocked by optional quota shedding.
    const googleAuth = await googleAuthRoute(request, env);
    if (googleAuth) return wrapperHeaders(googleAuth, requestId, started);

    const decision = await evaluateQuotaPolicy(request, env);
    if (!decision.allowed) {
      return addQuotaHeaders(wrapperHeaders(quotaRejectedResponse(decision), requestId, started), decision.state);
    }

    if ((path === '/admin.html' || path === '/admin-dashboard.html') && request.method === 'GET') {
      const admin = await getAdminSession(request, env);
      if (path === '/admin.html') {
        if (admin) {
          return addQuotaHeaders(wrapperHeaders(redirect('/admin-dashboard.html'), requestId, started), decision.state);
        }
        return addQuotaHeaders(wrapperHeaders(googleLoginPage(), requestId, started), decision.state);
      }
      if (!admin) {
        return addQuotaHeaders(wrapperHeaders(redirect('/admin.html'), requestId, started), decision.state);
      }
    }

    const quotaRoute = await quotaStatusRoute(request, env);
    if (quotaRoute) return addQuotaHeaders(wrapperHeaders(quotaRoute, requestId, started), decision.state);

    const overflow = await overflowRoute(request, env);
    if (overflow) return addQuotaHeaders(wrapperHeaders(overflow, requestId, started), decision.state);

    let response = await core.fetch(request, env, {
      ...ctx,
      waitUntil(promise) {
        if (allowOptionalTelemetry(decision.state)) ctx?.waitUntil?.(promise);
      }
    });

    if (path === '/admin-dashboard.html') {
      response = injectAuthenticatedAdminControls(response);
    }

    return addQuotaHeaders(response, decision.state);
  }
};
