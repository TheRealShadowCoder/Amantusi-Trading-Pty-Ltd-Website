import fs from 'node:fs';

const path = 'src/worker.js';
let source = fs.readFileSync(path, 'utf8');
const original = source;

if (!source.includes('/luxury-ui.css')) {
  if (source.includes('<link rel="stylesheet" href="/hover-objects.css">')) {
    source = source.replace(
      '<link rel="stylesheet" href="/hover-objects.css">',
      '<link rel="stylesheet" href="/hover-objects.css"><link rel="stylesheet" href="/luxury-ui.css">'
    );
  } else {
    source = source.replace(
      '<link rel="stylesheet" href="/performance-v3.css">',
      '<link rel="stylesheet" href="/performance-v3.css"><link rel="stylesheet" href="/luxury-ui.css">'
    );
  }
  console.log('luxury UI injector: public styles wired');
}

if (!source.includes('/luxury-ui.js')) {
  if (source.includes('<script src="/hover-objects.js" defer></script>')) {
    source = source.replace(
      '<script src="/hover-objects.js" defer></script>',
      '<script src="/hover-objects.js" defer></script><script src="/luxury-ui.js" defer></script>'
    );
  } else if (source.includes('<script src="/wheel-fast.js" defer></script>')) {
    source = source.replace(
      '<script src="/wheel-fast.js" defer></script>',
      '<script src="/wheel-fast.js" defer></script><script src="/luxury-ui.js" defer></script>'
    );
  } else {
    source = source.replace(
      '<script src="/performance-v3.js" defer></script>',
      '<script src="/performance-v3.js" defer></script><script src="/luxury-ui.js" defer></script>'
    );
  }
  console.log('luxury UI injector: public runtime wired');
}

if (source !== original) fs.writeFileSync(path, source);
