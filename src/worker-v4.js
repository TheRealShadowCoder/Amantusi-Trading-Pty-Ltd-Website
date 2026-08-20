import core from './worker.js';
import {
  evaluateQuotaPolicy,
  quotaRejectedResponse,
  addQuotaHeaders,
  quotaStatusRoute,
  allowOptionalTelemetry
} from './quota-governor.js';
import { overflowRoute } from './google-overflow.js';

function wrapperHeaders(response, requestId, started) {
  const headers = new Headers(response.headers);
  headers.set('X-Amantusi-Request-Id', headers.get('X-Amantusi-Request-Id') || requestId);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Server-Timing', headers.get('Server-Timing') || `app;dur=${Date.now() - started}`);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function injectAdminCostControl(response) {
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
    if (path === '/admin.html') response = injectAdminCostControl(response);
    return addQuotaHeaders(response, decision.state);
  }
};