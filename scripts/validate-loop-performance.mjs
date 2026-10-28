import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const home=read('public/index.html'),fast=read('public/index-fast.html');
const gate=read('public/runtime-gate.js'),hero=read('public/hero-webgl-loop.js'),studio=read('public/showcase-3d.js'),css=read('public/loop-performance.css');
for(const html of [home,fast]){
 assert.ok(html.includes('src="/hero-webgl-loop.js"')&&html.includes('href="/loop-performance.css"'),'Lightweight shader and loop stylesheet');
 assert.ok(!html.includes('src="/webgl-ambient.js"'),'No second competing GPU hero canvas');
 assert.ok(html.includes('src="/showcase-3d.js"'),'Photo service studio retained');
 assert.ok(html.includes('data-glass-gallery')&&html.includes('id="quote-form"'),'Real service image gallery and quotation preserved');
 assert.ok(!/brighter\s+tom+orrow/i.test(html),'Retired marketing copy absent');
}
assert.ok(gate.includes("const leanHome=body.dataset.scene==='home'"),'Homepage has isolated runtime');
for(const fn of ['loadCoreRuntime','loadCinematic','loadExperience','loadDeepLayers','loadInteractionFx','loadTouchEnhancements']){
 assert.ok(gate.includes('function '+fn+'(){\n    if(leanHome)return;'),'Disable duplicate homepage plugin: '+fn);
}
assert.ok(hero.includes('gl.texImage2D')&&hero.includes('uPhoto')&&hero.includes('aPosition'),'Hero animation uses photographic GPU texture and 3D vertices');
assert.ok(hero.includes('%10000')&&studio.includes('%10000'),'Two seamless ten-second GPU loops');
assert.ok(hero.includes('1000/20')&&studio.includes('1000/20'),'20fps GPU cap');
assert.ok(hero.includes('Math.min(400')&&studio.includes('Math.min(720'),'GPU raster caps');
assert.ok(hero.includes('requestIdleCallback')&&hero.includes('IntersectionObserver'),'Deferred GPU setup');
assert.ok(hero.includes('visibilitychange')&&studio.includes('visibilitychange'),'Tab pause');
assert.ok(hero.includes('prefers-reduced-motion: reduce')&&studio.includes('prefers-reduced-motion: reduce'),'Accessibility and static fallback');
assert.ok(studio.includes('if(!gl){\n   try{if(!setup())'),'Second GPU context created only upon visibility');
assert.ok(studio.includes('if(!visible||scrollRaf)return'),'No full-page scroll layout reads when offscreen');
assert.ok(css.includes('10s ease-in-out infinite')&&css.includes('animation-play-state:paused'),'Compositor loops and paused offscreen');
assert.ok(css.includes('@media(max-width:700px)')&&css.includes('backdrop-filter:none'),'Mobile paint savings');
console.log('PASS: two 10-second photo WebGL loops, lazy GPU, reduced effects and homepage speed guards');
