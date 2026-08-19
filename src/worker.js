import {
  json,
  getAdminSession,
  logout,
  me,
  requestReset,
  confirmReset,
  status
} from './security-v3.js';
import {
  loginWithMfa,
  registrationOptions,
  registrationVerify,
  authenticationOptions,
  authenticationVerify,
  passkeyList,
  passkeyDelete,
  mfaPolicy,
  clearMfaAfterPasswordReset
} from './passkeys.js';
import { platformRoute } from './platform.js';
import { enhanceSeo, sitemapResponse, robotsResponse } from './seo.js';
import { recordAppEvent } from './database.js';

const MAX_CONTENT_BYTES = 750000;
const MAX_IMAGE_BYTES = 8000000;
const KV_MEDIA_PREFIX = 'media:';
const ENHANCED_HTML = new Set([
  '/', '/index.html', '/catering-menu.html', '/catering-brochure.html',
  '/company-profile.html', '/admin.html', '/admin-reset.html'
]);

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; }
  catch (_) { return false; }
}

function securityHeaders(response, request, { admin = false } = {}) {
  const headers = new Headers(response.headers);
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' mailto:",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://www.google-analytics.com https://*.google-analytics.com",
    "font-src 'self' data:",
    "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://region1.google-analytics.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    'upgrade-insecure-requests'
  ].join('; ');
  headers.set('Content-Security-Policy', csp);
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), publickey-credentials-get=(self)');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  if (admin || new URL(request.url).pathname.startsWith('/api/admin/')) {
    headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function enhanceLayout(response, { admin = false } = {}) {
  if (!response.ok) return response;
  const publicStyles = admin ? '' : '<link rel="stylesheet" href="/cinematic.css"><link rel="stylesheet" href="/motion-plus.css"><link rel="stylesheet" href="/animation-registry.css"><link rel="stylesheet" href="/animation-3d-overlay.css">';
  const publicScripts = admin ? '' : '<script src="/cinematic.js" defer></script><script src="/motion-plus.js" defer></script><script src="/animation-registry.js" defer></script><script src="/animation-3d-overlay.js" defer></script>';
  return new HTMLRewriter()
    .on('head', {
      element(element) {
        element.append(`<link rel="stylesheet" href="/responsive.css"><link rel="stylesheet" href="/touch.css"><link rel="stylesheet" href="/platform.css">${publicStyles}`, { html: true });
      }
    })
    .on('body', {
      element(element) {
        element.append(`<script src="/touch.js" defer></script>${publicScripts}`, { html: true });
      }
    })
    .on('#quote-form', {
      element(element) {
        element.setAttribute('enctype', 'multipart/form-data');
      }
    })
    .on('#quote-form .form-note', {
      element(element) {
        element.before('<label class="quote-file-field"><strong>RFQ / Specification Attachments</strong><input type="file" name="rfqFiles" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,image/jpeg,image/png,image/webp"><small>Attach up to 5 files. Maximum 10 MB per file and 30 MB combined.</small></label>', { html: true });
        element.setInnerContent('Your enquiry and attachments are submitted securely to Amantusi and recorded with a reference number.');
      }
    })
    .on('#quote-form button[type="submit"]', {
      element(element) {
        element.setInnerContent('Submit Quotation Request');
      }
    })
    .on('.quote-copy > p:not(.eyebrow)', {
      element(element) {
        element.setInnerContent('Submit your requirement directly to Amantusi. Your enquiry is stored securely, can include RFQ/specification files, and receives a tracking reference immediately.');
      }
    })
    .transform(response);
}

async function serveEnhancedPage(request, env, home = false, admin = false) {
  let response = await env.ASSETS.fetch(request);
  response = enhanceLayout(response, { admin });
  response = await enhanceSeo(request, response, env, { home, admin });
  return response;
}

async function publicContent(request, env) {
  if (env.CMS_KV) {
    const saved = await env.CMS_KV.get('catering-content');
    if (saved) {
      return new Response(saved, {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'public, max-age=60, stale-while-revalidate=300'
        }
      });
    }
  }
  const fallback = new URL('/data/catering.json', request.url);
  return env.ASSETS.fetch(new Request(fallback, request));
}

async function saveContent(request, env) {
  if (!sameOrigin(request)) return json({ error: 'Origin rejected.' }, 403);
  const admin = await getAdminSession(request, env);
  if (!admin) return json({ error: 'Administrator login required.' }, 401);
  if (!env.CMS_KV) return json({ error: 'CMS storage is not connected to this Worker.' }, 503);

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_CONTENT_BYTES) return json({ error: 'Content payload is too large.' }, 413);
  let data;
  try { data = JSON.parse(text); } catch (_) { return json({ error: 'Invalid JSON content.' }, 400); }
  if (!Array.isArray(data?.categories) || !Array.isArray(data?.items) || !data?.profile) return json({ error: 'Content structure is invalid.' }, 400);

  data.meta = data.meta || {};
  data.meta.updatedAt = new Date().toISOString();
  data.meta.updatedBy = admin.email;
  await env.CMS_KV.put('catering-content', JSON.stringify(data));
  return json({ ok: true, updatedAt: data.meta.updatedAt, updatedBy: admin.email });
}

function safeExtension(type) {
  return ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' })[type] || null;
}

function mediaPath(request) {
  const raw = decodeURIComponent(new URL(request.url).pathname.replace(/^\/media\//, ''));
  if (!raw || raw.includes('..') || raw.startsWith('/')) return null;
  return raw;
}

async function uploadMedia(request, env) {
  if (!sameOrigin(request)) return json({ error: 'Origin rejected.' }, 403);
  const admin = await getAdminSession(request, env);
  if (!admin) return json({ error: 'Administrator login required.' }, 401);
  if (!env.CMS_MEDIA && !env.CMS_KV) return json({ error: 'Media storage is not connected to this Worker.' }, 503);

  let form;
  try { form = await request.formData(); } catch (_) { return json({ error: 'Invalid upload request.' }, 400); }
  const file = form.get('file');
  if (!file || typeof file === 'string') return json({ error: 'Choose an image to upload.' }, 400);
  if (file.size > MAX_IMAGE_BYTES) return json({ error: 'Image is larger than 8 MB.' }, 413);
  const extension = safeExtension(file.type);
  if (!extension) return json({ error: 'Only JPG, PNG and WEBP images are allowed.' }, 415);

  const key = `catering/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
  const metadata = {
    contentType: file.type,
    cacheControl: 'public, max-age=31536000, immutable',
    originalName: file.name || 'upload',
    uploadedBy: admin.email,
    uploadedAt: new Date().toISOString()
  };

  if (env.CMS_MEDIA) {
    await env.CMS_MEDIA.put(key, file.stream(), {
      httpMetadata: { contentType: file.type, cacheControl: metadata.cacheControl },
      customMetadata: { originalName: metadata.originalName, uploadedBy: metadata.uploadedBy, uploadedAt: metadata.uploadedAt }
    });
    return json({ ok: true, key, url: `/media/${key}`, backend: 'r2' });
  }

  await env.CMS_KV.put(`${KV_MEDIA_PREFIX}${key}`, await file.arrayBuffer(), { metadata });
  return json({ ok: true, key, url: `/media/${key}`, backend: 'kv' });
}

async function serveMedia(request, env) {
  const key = mediaPath(request);
  if (!key) return new Response('Not found.', { status: 404 });
  if (env.CMS_MEDIA) {
    const object = await env.CMS_MEDIA.get(key);
    if (object) {
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      headers.set('cache-control', headers.get('cache-control') || 'public, max-age=31536000, immutable');
      headers.set('x-content-type-options', 'nosniff');
      return new Response(object.body, { headers });
    }
  }
  if (env.CMS_KV) {
    const result = await env.CMS_KV.getWithMetadata(`${KV_MEDIA_PREFIX}${key}`, { type: 'arrayBuffer' });
    if (result?.value) {
      const metadata = result.metadata || {};
      return new Response(result.value, {
        headers: {
          'content-type': metadata.contentType || 'application/octet-stream',
          'cache-control': metadata.cacheControl || 'public, max-age=31536000, immutable',
          'x-content-type-options': 'nosniff'
        }
      });
    }
  }
  return new Response('Not found.', { status: 404 });
}

async function routeRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'GET' && path === '/sitemap.xml') return sitemapResponse(request, env);
  if (request.method === 'GET' && path === '/robots.txt') return robotsResponse(request, env);

  if (request.method === 'GET' && ENHANCED_HTML.has(path)) {
    const admin = path === '/admin.html' || path === '/admin-reset.html';
    return serveEnhancedPage(request, env, path === '/' || path === '/index.html', admin);
  }

  if (path === '/api/catering-content' && request.method === 'GET') return publicContent(request, env);
  if (path === '/api/admin/status' && request.method === 'GET') return status(env);
  if (path === '/api/admin/me' && request.method === 'GET') return me(request, env);
  if (path === '/api/admin/session' && request.method === 'POST') return loginWithMfa(request, env);
  if (path === '/api/admin/logout' && request.method === 'POST') return logout(request, env);
  if (path === '/api/admin/password-reset/request' && request.method === 'POST') return requestReset(request, env);
  if (path === '/api/admin/password-reset/confirm' && request.method === 'POST') {
    const clone = request.clone();
    const response = await confirmReset(request, env);
    if (response.ok) {
      try { await clearMfaAfterPasswordReset(env, (await clone.json()).email); } catch (_) {}
    }
    return response;
  }
  if (path === '/api/admin/content' && request.method === 'POST') return saveContent(request, env);
  if (path === '/api/admin/media' && request.method === 'POST') return uploadMedia(request, env);

  if (path === '/api/admin/passkeys/registration/options' && request.method === 'POST') return registrationOptions(request, env);
  if (path === '/api/admin/passkeys/registration/verify' && request.method === 'POST') return registrationVerify(request, env);
  if (path === '/api/admin/passkeys/authentication/options' && request.method === 'POST') return authenticationOptions(request, env);
  if (path === '/api/admin/passkeys/authentication/verify' && request.method === 'POST') return authenticationVerify(request, env);
  if (path === '/api/admin/passkeys' && request.method === 'GET') return passkeyList(request, env);
  if (path === '/api/admin/passkeys/mfa' && request.method === 'POST') return mfaPolicy(request, env);
  if (path.startsWith('/api/admin/passkeys/') && request.method === 'DELETE') {
    return passkeyDelete(request, env, decodeURIComponent(path.split('/').pop() || ''));
  }

  const platform = await platformRoute(request, env);
  if (platform) return platform;

  if (path.startsWith('/media/') && request.method === 'GET') return serveMedia(request, env);
  return env.ASSETS.fetch(request);
}

export default {
  async fetch(request, env, ctx) {
    const started = Date.now();
    const requestId = crypto.randomUUID();
    const path = new URL(request.url).pathname;
    try {
      const response = await routeRequest(request, env);
      const secured = securityHeaders(response, request, { admin: path.startsWith('/admin') || path.startsWith('/api/admin/') });
      secured.headers.set('X-Amantusi-Request-Id', requestId);
      secured.headers.set('Server-Timing', `app;dur=${Date.now() - started}`);
      if (path.startsWith('/api/')) {
        console.log(JSON.stringify({ type: 'api_request', requestId, method: request.method, path, status: secured.status, durationMs: Date.now() - started }));
      }
      return secured;
    } catch (error) {
      const message = String(error?.stack || error?.message || error);
      console.error(JSON.stringify({ type: 'worker_error', requestId, path, message }));
      ctx?.waitUntil?.(recordAppEvent(env, {
        severity: 'error', category: 'worker', message, path,
        metadata: { requestId, method: request.method, colo: request.cf?.colo || '' }
      }));
      return securityHeaders(json({ error: 'The Amantusi platform encountered an unexpected error.', requestId }, 500), request, { admin: path.startsWith('/admin') });
    }
  }
};
