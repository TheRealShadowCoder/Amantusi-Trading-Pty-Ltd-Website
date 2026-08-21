import core from './worker.js';
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
  let csp = headers.get('Content-Security-Policy') || "default-src 'self'";
  csp = appendSource(csp, 'script-src', 'https://accounts.google.com/gsi/client');
  csp = appendSource(csp, 'connect-src', 'https://accounts.google.com/gsi/');
  csp = appendSource(csp, 'frame-src', 'https://accounts.google.com/gsi/');
  csp = appendSource(csp, 'style-src', 'https://accounts.google.com/gsi/style');
  headers.set('Content-Security-Policy', csp);
  headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function injectAdminControls(response) {
  if (!response.ok) return response;
  response = allowGoogleIdentity(response);
  return new HTMLRewriter()
    .on('head', {
      element(element) {
        element.append('<link rel="stylesheet" href="/admin-cost.css"><link rel="stylesheet" href="/admin-google-login.css"><script src="https://accounts.google.com/gsi/client" async defer></script>', { html: true });
      }
    })
    .on('#login-form', {
      element(element) {
        const classes = `${element.getAttribute('class') || ''} google-password-hidden`.trim();
        element.setAttribute('class', classes);
        element.setAttribute('hidden', '');
        element.setAttribute('aria-hidden', 'true');
        element.before('<div class="google-auth-shell" id="google-auth-shell"><div class="google-auth-title"><strong>Continue with Google</strong><span>Use an authorized Google account. Your website password is not required.</span></div><div id="google-signin-button" aria-label="Google Sign-In"></div><p id="google-login-status" aria-live="polite">Preparing secure Google Sign-In…</p></div>', { html: true });
      }
    })
    .on('#forgot-toggle', {
      element(element) { element.setAttribute('hidden', ''); }
    })
    .on('#reset-request-form', {
      element(element) { element.setAttribute('hidden', ''); }
    })
    .on('body', {
      element(element) {
        element.append('<script src="/admin-google-login.js" defer></script><script src="/admin-cost.js" defer></script>', { html: true });
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
    if (path === '/admin.html') response = injectAdminControls(response);
    return addQuotaHeaders(response, decision.state);
  }
};
