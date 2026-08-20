import fs from 'node:fs';

const path='src/worker.js';
let source=fs.readFileSync(path,'utf8');
const original=source;

if(!source.includes('SERVICE_BACKGROUND_IMAGES')){
  const anchor="const KV_MEDIA_PREFIX = 'media:';";
  if(!source.includes(anchor))throw new Error('service background injector: constants anchor not found');
  const block=`${anchor}\nconst SERVICE_BACKGROUND_IMAGES = Object.freeze([\n  'https://images.pexels.com/photos/34221998/pexels-photo-34221998.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop',\n  'https://images.pexels.com/photos/4481326/pexels-photo-4481326.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop',\n  'https://images.pexels.com/photos/9930276/pexels-photo-9930276.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop',\n  'https://images.pexels.com/photos/6340707/pexels-photo-6340707.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop',\n  'https://images.pexels.com/photos/10566526/pexels-photo-10566526.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop',\n  'https://images.pexels.com/photos/4440525/pexels-photo-4440525.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop',\n  'https://images.pexels.com/photos/28576626/pexels-photo-28576626.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop',\n  'https://images.pexels.com/photos/17811675/pexels-photo-17811675.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop',\n  'https://images.pexels.com/photos/20551982/pexels-photo-20551982.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop',\n  'https://images.pexels.com/photos/15249758/pexels-photo-15249758.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop'\n]);`;
  source=source.replace(anchor,block);
  console.log('service background injector: people-free image registry wired');
}

if(!source.includes('async function serviceBackgroundImage(')){
  const anchor='async function routeRequest(request, env) {';
  if(!source.includes(anchor))throw new Error('service background injector: route function anchor not found');
  const fn=`async function serviceBackgroundImage(request, path) {\n  const match = String(path || '').match(/^\\/service-bg\\/(\\d+)$/);\n  const id = match ? Number(match[1]) : 0;\n  const upstreamUrl = SERVICE_BACKGROUND_IMAGES[id - 1];\n  if (!upstreamUrl) return new Response('Not found.', { status: 404 });\n\n  try {\n    const upstream = await fetch(upstreamUrl, {\n      headers: { 'Accept': 'image/avif,image/webp,image/*,*/*;q=0.8' },\n      cf: { cacheEverything: true, cacheTtl: 604800 }\n    });\n    if (!upstream.ok || !upstream.body) return new Response('Background unavailable.', { status: 502 });\n    const headers = new Headers();\n    headers.set('content-type', upstream.headers.get('content-type') || 'image/jpeg');\n    headers.set('cache-control', 'public, max-age=604800, stale-while-revalidate=86400');\n    headers.set('x-content-type-options', 'nosniff');\n    headers.set('cross-origin-resource-policy', 'same-origin');\n    headers.set('x-amantusi-service-background', String(id));\n    headers.set('x-amantusi-background-policy', 'objects-only-no-people');\n    return new Response(upstream.body, { status: 200, headers });\n  } catch (_) {\n    return new Response('Background unavailable.', { status: 502 });\n  }\n}\n\n${anchor}`;
  source=source.replace(anchor,fn);
  console.log('service background injector: people-free image proxy wired');
}

if(!source.includes("path.startsWith('/service-bg/')")){
  const anchor="  if (request.method === 'GET' && path === '/sitemap.xml') return sitemapResponse(request, env);";
  if(!source.includes(anchor))throw new Error('service background injector: route anchor not found');
  source=source.replace(anchor,`  if (request.method === 'GET' && path.startsWith('/service-bg/')) return serviceBackgroundImage(request, path);\n${anchor}`);
  console.log('service background injector: image route wired');
}

if(!source.includes('/service-background.css')){
  const anchors=[
    '<link rel="stylesheet" href="/touch-60.css">',
    '<link rel="stylesheet" href="/click-advanced40.css">',
    '<link rel="stylesheet" href="/performance-v3.css">'
  ];
  const anchor=anchors.find(value=>source.includes(value));
  if(!anchor)throw new Error('service background injector: style anchor not found');
  source=source.replace(anchor,`${anchor}<link rel="stylesheet" href="/service-background.css">`);
  console.log('service background injector: photography stylesheet wired');
}

if(!source.includes('/service-background.js')){
  const anchors=[
    '<script src="/touch-60.js" defer></script>',
    '<script src="/click-advanced40.js" defer></script>',
    '<script src="/performance-v3.js" defer></script>'
  ];
  const anchor=anchors.find(value=>source.includes(value));
  if(!anchor)throw new Error('service background injector: script anchor not found');
  source=source.replace(anchor,`${anchor}<script src="/service-background.js" defer></script>`);
  console.log('service background injector: photography runtime wired');
}

if(source!==original)fs.writeFileSync(path,source);
