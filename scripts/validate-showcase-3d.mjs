import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const home=readFileSync('public/index.html','utf8');
const fast=readFileSync('public/index-fast.html','utf8');
const js=readFileSync('public/showcase-3d.js','utf8');
const css=readFileSync('public/showcase-3d.css','utf8');
for(const [name,html] of [['home',home],['home-fast',fast]]){
 assert.equal((html.match(/id="immersive"/g)||[]).length,1,name+': one showroom');
 assert.equal((html.match(/data-amt-item=/g)||[]).length,5,name+': five interactive service selectors');
 assert.ok(html.includes('src="/showcase-3d.js"')&&html.includes('href="/showcase-3d.css"'),name+': assets wired');
 assert.ok(html.includes('href="#immersive"'),name+': entry link wired');
 assert.ok(html.includes('id="quote-form"'),name+': quote must remain');
 assert.ok(html.includes('src="/webgl-ambient.js"'),name+': existing hero light retained');
 assert.ok(!html.includes('fumigation')&&!html.includes('pest-control'),'No unverified fumigation service claims');
}
assert.ok(js.includes('createShader')&&js.includes('drawElements'),'Object scenes must use real GPU geometry');
assert.ok(js.includes('surfaceBox')&&js.includes('sphere(')&&js.includes('cylinder('),'3D primitives required');
assert.ok(js.includes('prefers-reduced-motion: reduce')&&js.includes('saveData')&&js.includes('IntersectionObserver'),'Device safety required');
assert.ok(js.includes('webglcontextlost')&&js.includes('stage.dataset.renderer=\'fallback\''),'WebGL failure fallback required');
assert.ok(css.includes('@media(max-width:440px)')&&css.includes('@media(prefers-reduced-motion:reduce)'),'Mobile and accessibility required');
console.log('PASS: Amantusi immersive procedural 3D and accessible fallback');
