import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const home=readFileSync('public/index.html','utf8');
const fast=readFileSync('public/index-fast.html','utf8');
const js=readFileSync('public/showcase-3d.js','utf8');
const css=readFileSync('public/showcase-photography.css','utf8');
const names=['catering','packed-meals','institutional-supply','cleaning-hygiene','general-trading'];
for(const name of names){
 const path='public/assets/service-scenes/'+name+'.webp';
 const bytes=readFileSync(path);
 assert.ok(bytes.length>10_000&&bytes.length<200_000,'optimized photoreal WebP '+name);
 assert.equal(bytes.toString('ascii',8,12),'WEBP',name+' must be WEBP');
 assert.ok(js.includes('/assets/service-scenes/'+name+'.webp'),name+' must appear in renderer');
}
for(const [name,html] of [['home',home],['home-fast',fast]]){
 assert.equal((html.match(/id="immersive"/g)||[]).length,1,name+': one showroom');
 assert.equal((html.match(/data-amt-item=/g)||[]).length,5,name+': five service selectors');
 assert.ok(html.includes('src="/showcase-3d.js"')&&html.includes('href="/showcase-photography.css"'),name+': CSS/JS connected');
 assert.ok(html.includes('data-amt-service-image'),name+': real picture in HTML fallback');
 assert.ok(html.includes('data-amt-photo-webgl'),name+': progressive GPU texture overlay');
 assert.ok(html.includes('href="#immersive"')&&html.includes('id="quote-form"'),name+': navigation and quote untouched');
 assert.ok(!html.includes('amt-objects-canvas')&&!html.includes('data-amt-fallback='),name+': no obsolete generic procedural visuals');
 assert.ok(!html.includes('fumigation')&&!html.includes('pest-control'),name+': no unsupported pest-control claims');
}
assert.ok(js.includes('texImage2D')&&js.includes('texture2D'),'WebGL must sample actual images');
assert.ok(js.includes('UNPACK_FLIP_Y_WEBGL')&&js.includes('RGB'),'Photographic textures uploaded to GPU');
assert.ok(!js.includes('surfaceBox')&&!js.includes('drawElements'),'No model-only objects');
assert.ok(js.includes('prefers-reduced-motion: reduce')&&js.includes('saveData')&&js.includes('IntersectionObserver'),'Mobile/low-power fallback required');
assert.ok(js.includes('webglcontextlost')&&js.includes('stage.dataset.renderer=\\'fallback\\''),'GPU failure fallback required');
assert.ok(css.includes('@media(max-width:440px)')&&css.includes('@media(prefers-reduced-motion:reduce)'),'Responsive and reduced motion styling required');
console.log('PASS five original rendered WebP service photos, image-based GPU refraction and static fallbacks');
