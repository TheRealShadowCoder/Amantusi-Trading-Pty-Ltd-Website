import fs from 'node:fs';

const path='src/worker.js';
let source=fs.readFileSync(path,'utf8');
const original=source;

if(!source.includes('SERVICE_BACKGROUND_IMAGES')){
  const anchor="const KV_MEDIA_PREFIX = 'media:';";
  if(!source.includes(anchor))throw new Error('service background injector: constants anchor not found');
  const block=`${anchor}\nconst SERVICE_BACKGROUND_IMAGES = Object.freeze([\n  'https://images.pexels.com/photos/10284048/pexels-photo-10284048.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop',\n  'https://images.pexels.com/photos/4277794/pexels-photo-4277794.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop',\n  'https://images.pexels.com/photos/4487383/pexels-photo-4487383.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop',\n  'https://images.pexels.com/photos/38195854/pexels-photo-38195854.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop',\n  'https://images.pexels.com/photos/6170407/pexels-photo-6170407.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop',\n  'https://images.pexels.com/photos/6169642/pexels-photo-6169642.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop',\n  'https://images.pexels.com/photos/5217889/pexels-photo-5217889.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop',\n  'https://images.pexels.com/photos/4440564/pexels-photo-4440564.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop',\n  'https://images.pexels.com/photos/7648322/pexels-photo-7648322.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop',\n  'https://images.pexels.com/photos/34321369/pexels-photo-34321369.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop'\n]);`;
  source=source.replace(anchor,block);
  console.log('service background injector: image registry wired');
}

if(!source.includes('async function serviceBackgroundImage(')){
  const anchor='async function routeRequest(request, env) {';
  if(!source.includes(anchor))throw new Error('service background injector: route function anchor not found');
  const fn=`async function serviceBackgroundImage(request, path) {\n  const match = String(path || '').match(/^\\/service-bg\\/(\\d+)$/);\n  const id = match ? Number(match[1]) : 0;\n  const upstreamUrl = SERVICE_BACKGROUND_IMAGES[id - 1];\n  if (!upstreamUrl) return new Response('Not found.', { status: 404 });\n\n  try {\n    const upstream = await fetch(upstreamUrl, {\n      headers: { 'Accept': 'image/avif,image/webp,image/*,*/*;q=0.8' },\n      cf: { cacheEverything: true, cacheTtl: 604800 }\n    });\n    if (!upstream.ok || !upstream.body) return new Response('Background unavailable.', { status: 502 });\n    const headers = new Headers();\n    headers.set('content-type', upstream.headers.get('content-type') || 'image/jpeg');\n    headers.set('cache-control', 'public, max-age=604800, stale-while-revalidate=86400');\n    headers.set('x-content-type-options', 'nosniff');\n    headers.set('cross-origin-resource-policy', 'same-origin');\n    headers.set('x-amantusi-service-background', String(id));\n    return new Response(upstream.body, { status: 200, headers });\n  } catch (_) {\n    return new Response('Background unavailable.', { status: 502 });\n  }\n}\n\n${anchor}`;
  source=source.replace(anchor,fn);
  console.log('service background injector: image proxy wired');
}

if(!source.includes("path.startsWith('/service-bg/')")){
  const anchor="  if (request.method === 'GET' && path === '/sitemap.xml') return sitemapResponse(request, env);";
  if(!source.includes(anchor))throw new Error('service background injector: route anchor not found');
  source=source.replace(anchor,`  if (request.method === 'GET' && path.startsWith('/service-bg/')) return serviceBackgroundImage(request, path);\n${anchor}`);
  console.log('service background injector: route wired');
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
  console.log('service background injector: stylesheet wired');
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
  console.log('service background injector: runtime wired');
}

if(source!==original)fs.writeFileSync(path,source);
