import fs from 'node:fs';

const path='src/worker.js';
let source=fs.readFileSync(path,'utf8');
const original=source;

if(!source.includes('/click-3d-fx.css')){
  const anchors=[
    '<link rel="stylesheet" href="/luxury-ui.css">',
    '<link rel="stylesheet" href="/hover-objects.css">',
    '<link rel="stylesheet" href="/performance-v3.css">'
  ];
  const anchor=anchors.find(value=>source.includes(value));
  if(!anchor)throw new Error('click 3D injector: public style anchor not found');
  source=source.replace(anchor,`${anchor}<link rel="stylesheet" href="/click-3d-fx.css">`);
  console.log('click 3D injector: public styles wired');
}

if(!source.includes('/click-advanced20.css')){
  const anchor='<link rel="stylesheet" href="/click-3d-fx.css">';
  if(!source.includes(anchor))throw new Error('advanced 20 injector: click 3D style anchor not found');
  source=source.replace(anchor,`${anchor}<link rel="stylesheet" href="/click-advanced20.css">`);
  console.log('advanced 20 injector: public styles wired');
}

if(!source.includes('/click-advanced40.css')){
  const anchor='<link rel="stylesheet" href="/click-advanced20.css">';
  if(!source.includes(anchor))throw new Error('advanced 40 injector: advanced 20 style anchor not found');
  source=source.replace(anchor,`${anchor}<link rel="stylesheet" href="/click-advanced40.css">`);
  console.log('advanced 40 injector: public styles wired');
}

if(!source.includes('/click-3d-fx.js')){
  const anchors=[
    '<script src="/luxury-ui.js" defer></script>',
    '<script src="/hover-objects.js" defer></script>',
    '<script src="/wheel-fast.js" defer></script>',
    '<script src="/performance-v3.js" defer></script>'
  ];
  const anchor=anchors.find(value=>source.includes(value));
  if(!anchor)throw new Error('click 3D injector: public script anchor not found');
  source=source.replace(anchor,`${anchor}<script src="/click-3d-fx.js" defer></script>`);
  console.log('click 3D injector: public runtime wired');
}

if(!source.includes('/click-advanced20.js')){
  const anchor='<script src="/click-3d-fx.js" defer></script>';
  if(!source.includes(anchor))throw new Error('advanced 20 injector: click 3D runtime anchor not found');
  source=source.replace(anchor,`${anchor}<script src="/click-advanced20.js" defer></script>`);
  console.log('advanced 20 injector: public runtime wired');
}

if(!source.includes('/click-advanced40.js')){
  const anchor='<script src="/click-advanced20.js" defer></script>';
  if(!source.includes(anchor))throw new Error('advanced 40 injector: advanced 20 runtime anchor not found');
  source=source.replace(anchor,`${anchor}<script src="/click-advanced40.js" defer></script>`);
  console.log('advanced 40 injector: public runtime wired');
}

if(source!==original)fs.writeFileSync(path,source);
