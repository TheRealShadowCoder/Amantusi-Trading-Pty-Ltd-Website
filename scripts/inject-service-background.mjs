import fs from 'node:fs';

const path='src/worker.js';
let source=fs.readFileSync(path,'utf8');
const original=source;

// Remove the previous external-photo background proxy if an optimized working tree already contains it.
source=source.replace(/\nconst SERVICE_BACKGROUND_IMAGES = Object\.freeze\(\[[\s\S]*?\]\);/g,'');
source=source.replace(/\nasync function serviceBackgroundImage\(request, path\) \{[\s\S]*?\n\}\n\n(?=async function routeRequest\(request, env\) \{)/g,'\n');
source=source.replace(/^\s*if \(request\.method === 'GET' && path\.startsWith\('\/service-bg\/'\)\) return serviceBackgroundImage\(request, path\);\n/m,'');

if(!source.includes('/service-background.css')){
  const anchors=[
    '<link rel="stylesheet" href="/touch-60.css">',
    '<link rel="stylesheet" href="/click-advanced40.css">',
    '<link rel="stylesheet" href="/performance-v3.css">'
  ];
  const anchor=anchors.find(value=>source.includes(value));
  if(!anchor)throw new Error('service background injector: style anchor not found');
  source=source.replace(anchor,`${anchor}<link rel="stylesheet" href="/service-background.css">`);
  console.log('service background injector: logo-cinema stylesheet wired');
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
  console.log('service background injector: logo-cinema runtime wired');
}

if(source!==original)fs.writeFileSync(path,source);
