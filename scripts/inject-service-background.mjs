import fs from 'node:fs';

const path='src/worker.js';
let source=fs.readFileSync(path,'utf8');
const original=source;

// Make the injector idempotent and remove any older service-background registry/proxy first.
source=source.replace(/\nconst SERVICE_BACKGROUND_IMAGES = Object\.freeze\(\[[\s\S]*?\]\);/g,'');
source=source.replace(/\nasync function serviceBackgroundImage\(request, path\) \{[\s\S]*?\n\}\n\n(?=async function routeRequest\(request, env\) \{)/g,'\n');
source=source.replace(/^\s*if \(request\.method === 'GET' && path\.startsWith\('\/service-bg\/'\)\) return serviceBackgroundImage\(request, path\);\n/m,'');

const constantsAnchor="const KV_MEDIA_PREFIX = 'media:';";
if(!source.includes(constantsAnchor))throw new Error('service background injector: constants anchor not found');
const registry=`${constantsAnchor}\nconst SERVICE_BACKGROUND_IMAGES = Object.freeze([\n  { pexelsId: 16924265, kind: 'warehouse', policy: 'objects-only-no-people' },\n  { pexelsId: 23625701, kind: 'warehouse', policy: 'objects-only-no-people' },\n  { pexelsId: 6340707, kind: 'office', policy: 'objects-only-no-people' },\n  { pexelsId: 7718661, kind: 'office', policy: 'objects-only-no-people' },\n  { pexelsId: 38155168, kind: 'cleaning', policy: 'objects-only-no-people' },\n  { pexelsId: 5217779, kind: 'cleaning', policy: 'objects-only-no-people' },\n  { pexelsId: 28576626, kind: 'cleaning', policy: 'objects-only-no-people' },\n  { pexelsId: 20551982, kind: 'catering', policy: 'objects-only-no-people' },\n  { pexelsId: 32611691, kind: 'catering', policy: 'objects-only-no-people' },\n  { pexelsId: 29086310, kind: 'catering', policy: 'objects-only-no-people' }\n]);`;
source=source.replace(constantsAnchor,registry);
console.log('service background injector: strict object-photo registry wired');

const routeAnchor='async function routeRequest(request, env) {';
if(!source.includes(routeAnchor))throw new Error('service background injector: route function anchor not found');
const fn=`async function serviceBackgroundImage(request, path) {\n  const match = String(path || '').match(/^\\/service-bg\\/(\\d+)$/);\n  const id = match ? Number(match[1]) : 0;\n  const photo = SERVICE_BACKGROUND_IMAGES[id - 1];\n  if (!photo) return new Response('Not found.', { status: 404 });\n\n  const requestedWidth = Number(new URL(request.url).searchParams.get('w') || 1600);\n  const allowedWidths = [640, 960, 1280, 1600];\n  const width = allowedWidths.reduce((best, value) => Math.abs(value - requestedWidth) < Math.abs(best - requestedWidth) ? value : best, 1600);\n  const upstreamUrl = 'https://images.pexels.com/photos/' + photo.pexelsId + '/pexels-photo-' + photo.pexelsId + '.jpeg?auto=compress&cs=tinysrgb&w=' + width + '&fit=crop';\n\n  try {\n    const upstream = await fetch(upstreamUrl, {\n      headers: { 'Accept': 'image/avif,image/webp,image/*,*/*;q=0.8' },\n      cf: { cacheEverything: true, cacheTtl: 604800 }\n    });\n    if (!upstream.ok || !upstream.body) return new Response('Background unavailable.', { status: 502 });\n    const headers = new Headers();\n    headers.set('content-type', upstream.headers.get('content-type') || 'image/jpeg');\n    headers.set('cache-control', 'public, max-age=604800, stale-while-revalidate=86400');\n    headers.set('x-content-type-options', 'nosniff');\n    headers.set('cross-origin-resource-policy', 'same-origin');\n    headers.set('x-amantusi-service-background', String(id));\n    headers.set('x-amantusi-background-kind', photo.kind);\n    headers.set('x-amantusi-background-policy', photo.policy);\n    headers.set('x-amantusi-background-width', String(width));\n    return new Response(upstream.body, { status: 200, headers });\n  } catch (_) {\n    return new Response('Background unavailable.', { status: 502 });\n  }\n}\n\n${routeAnchor}`;
source=source.replace(routeAnchor,fn);
console.log('service background injector: responsive photo proxy wired');

const sitemapAnchor="  if (request.method === 'GET' && path === '/sitemap.xml') return sitemapResponse(request, env);";
if(!source.includes(sitemapAnchor))throw new Error('service background injector: route anchor not found');
source=source.replace(sitemapAnchor,`  if (request.method === 'GET' && path.startsWith('/service-bg/')) return serviceBackgroundImage(request, path);\n${sitemapAnchor}`);
console.log('service background injector: image route wired');

if(!source.includes('/service-background.css')){
  const anchors=['<link rel="stylesheet" href="/touch-60.css">','<link rel="stylesheet" href="/click-advanced40.css">','<link rel="stylesheet" href="/performance-v3.css">'];
  const anchor=anchors.find(value=>source.includes(value));
  if(!anchor)throw new Error('service background injector: style anchor not found');
  source=source.replace(anchor,`${anchor}<link rel="stylesheet" href="/service-background.css">`);
  console.log('service background injector: stylesheet wired');
}

if(!source.includes('/service-background.js')){
  const anchors=['<script src="/touch-60.js" defer></script>','<script src="/click-advanced40.js" defer></script>','<script src="/performance-v3.js" defer></script>'];
  const anchor=anchors.find(value=>source.includes(value));
  if(!anchor)throw new Error('service background injector: script anchor not found');
  source=source.replace(anchor,`${anchor}<script src="/service-background.js" defer></script>`);
  console.log('service background injector: runtime wired');
}

if(source!==original)fs.writeFileSync(path,source);
