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
import { googleAuthRoute } from './google-auth.js';

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

function appendSource(csp, directive, source) {
  const pattern = new RegExp(`(^|;\\s*)${directive}\\s+([^;]*)`, 'i');
  if (pattern.test(csp)) {
    return csp.replace(pattern, (match, prefix, values) => {
      if (String(values).includes(source)) return match;
      return `${prefix}${directive} ${values.trim()} ${source}`;
    });
  }
  return `${csp}; ${directive} 'self' ${source}`;
}

function allowGoogleIdentity(response) {
  const headers = new Headers(response.headers);
  let csp = headers.get('Content-Security-Policy') || "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'";
  csp = appendSource(csp, 'script-src', 'https://accounts.google.com/gsi/client');
  csp = appendSource(csp, 'connect-src', 'https://accounts.google.com/gsi/');
  csp = appendSource(csp, 'frame-src', 'https://accounts.google.com/gsi/');
  csp = appendSource(csp, 'style-src', 'https://accounts.google.com/gsi/style');
  headers.set('Content-Security-Policy', csp);
  headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function redirect(location) {
  return new Response(null, {
    status: 302,
    headers: {
      location,
      'cache-control': 'no-store, no-cache, must-revalidate',
      pragma: 'no-cache',
      expires: '0'
    }
  });
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
  <script src="https://accounts.google.com/gsi/client" async defer></script>
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
          <span>Use your authorized Amantusi Google account. No website password is required.</span>
        </div>
        <div id="google-signin-button" aria-label="Continue with Google"></div>
        <p id="google-login-status" aria-live="polite">Preparing secure Google Sign-In…</p>
      </div>
      <div class="security-notice">
        <strong>Google-protected administration</strong>
        <span>Google verifies your account first. Amantusi then validates the signed identity token, one-time nonce and administrator allowlist before opening the operations workspace.</span>
      </div>
    </div>
  </section>
  <script src="/admin-google-login.js" defer></script>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store, no-cache, must-revalidate',
      pragma: 'no-cache',
      expires: '0',
      'x-robots-tag': 'noindex, nofollow, noarchive'
    }
  });
}

function injectAuthenticatedAdminControls(response) {
  if (!response.ok) return response;
  return new HTMLRewriter()
    .on('head', {
      element(element) {
        element.append('<link rel="stylesheet" href="/admin-cost.css">', { html: true });
      }
    })
    .on('body', {
      element(element) {
        element.append('<script src="/admin-cost.js" defer></script>', { html: true });
      }
    })
    .transform(response);
}

export default {
  async fetch(request, env, ctx) {
    const started = Date.now();
    const requestId = crypto.randomUUID();
    const path = new URL(request.url).pathname;
    const decision = await evaluateQuotaPolicy(request, env);

    if (!decision.allowed) {
      return addQuotaHeaders(wrapperHeaders(quotaRejectedResponse(decision), requestId, started), decision.state);
    }

    const googleAuth = await googleAuthRoute(request, env);
    if (googleAuth) {
      return addQuotaHeaders(wrapperHeaders(googleAuth, requestId, started), decision.state);
    }

    if ((path === '/admin.html' || path === '/admin-dashboard.html') && request.method === 'GET') {
      const admin = await getAdminSession(request, env);
      if (path === '/admin.html') {
        if (admin) {
          return addQuotaHeaders(wrapperHeaders(redirect('/admin-dashboard.html'), requestId, started), decision.state);
        }
        let response = allowGoogleIdentity(googleLoginPage());
        response = wrapperHeaders(response, requestId, started);
        return addQuotaHeaders(response, decision.state);
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
    if (path === '/admin-dashboard.html') response = injectAuthenticatedAdminControls(response);
    return addQuotaHeaders(response, decision.state);
  }
};
