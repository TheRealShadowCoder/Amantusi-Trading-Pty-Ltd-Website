import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const home=readFileSync('public/index.html','utf8');
const webgl=readFileSync('public/webgl-ambient.js','utf8');
const css=readFileSync('public/adaptive-layout.css','utf8');
const pages=readdirSync('public').filter(name=>name.endsWith('.html'));
const checked=pages.filter(name=>!/^admin/.test(name)&&name!=='404.html');
for(const name of checked){
 const html=readFileSync('public/'+name,'utf8');
 if(name==='cinematic-experiences.html'){
  assert.ok(html.includes('href="/cinematic-experiences.css"'),'Dedicated cinematic experience has responsive styling');
  assert.ok(html.includes('src="/cinematic-experiences.js"'),'Dedicated cinematic experience loads the on-demand Three.js module');
  assert.ok(!html.includes('src="/webgl-ambient.js"'),'Avoid duplicate WebGL contexts in cinematic theatre');
  continue;
 }
 assert.ok(html.includes('href="/adaptive-layout.css"'),name+' must load adaptive mobile CSS');
 assert.ok(html.includes('href="/webgl-ambient.css"'),name+' must load progressive WebGL CSS');
 if(name==='index.html'||name==='index-fast.html'){
  assert.ok(html.includes('src="/hero-webgl-loop.js"'),name+' uses one lightweight photo-WebGL renderer');
  assert.ok(!html.includes('src="/webgl-ambient.js"'),name+' avoids redundant GPU contexts');
 }else assert.ok(html.includes('src="/webgl-ambient.js"'),name+' must load progressive WebGL fallback');
}
assert.ok(home.includes('am-landing-container')&&home.includes('quote-form'),'Homepage must retain semantic hero and RFQ');
assert.ok(webgl.includes("prefers-reduced-motion: reduce"),'Respect reduced motion');
assert.ok(webgl.includes('saveData')&&webgl.includes('lowMemory'),'Conserve bandwidth and GPU on slower phones');
assert.ok(webgl.includes('contextlost')&&webgl.includes('contextrestored'),'Recover from GPU resets');
assert.ok(webgl.includes('IntersectionObserver')&&webgl.includes('visibilitychange'),'Pause offscreen/background');
assert.ok(webgl.includes('pointer')===false || css.includes('touch-action'),'Touch gesture accessibility');
assert.ok(css.includes('max-width:700px')&&css.includes('max-width:420px'),'Phone rules required');
assert.ok(css.includes('safe-area-inset-bottom'),'Safe-area mobile navigation required');
assert.ok(!webgl.includes('three.min.js'),'Avoid heavyweight third-party GPU bundles');
console.log('PASS '+checked.length+' responsive marketing pages and progressive WebGL safeguards');
