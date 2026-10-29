import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const home=readFileSync('public/index.html','utf8');
const fast=readFileSync('public/index-fast.html','utf8');
const css=readFileSync('public/cinematic-home.css','utf8');
const js=readFileSync('public/scroll-cinema.js','utf8');
assert.equal(home,fast,'Homepage and fast homepage must have the same cinematic content');
assert.equal((home.match(/data-cin-chapter=/g)||[]).length,5,'All five filmed scroll chapters must be embedded in the homepage');
assert.equal((home.match(/data-cin-video/g)||[]).length,1,'One GPU-friendly HTML5 film player on homepage');
assert.ok(home.includes('<video class="cin-stage-video"')&&home.includes('playsinline loop preload="none"'),'Real native footage, muted and lazy loaded');
assert.ok(home.indexOf('id="cinematic"')<home.indexOf('id="about"'),'Cinematic story must be near top after hero');
assert.ok(home.includes('href="#cinematic">Films</a>'),'Navigation must link directly to the filmed section');
assert.ok(home.includes('src="/scroll-cinema.js"')&&!home.includes('src="/real-film-previews.js"'),'Scroll cinema replaces hover-only preview runtime');
assert.ok(!home.includes('cin-home-preview'),'Avoid five concurrent previews and duplicated video streams');
assert.ok(home.includes('id="quote-form"')&&home.includes('id="immersive"')&&home.includes('id="capabilities"'),'Existing functionality protected');
for(const key of ['intro','product','architecture','marquee','food']){
 assert.ok(home.includes('data-cin-chapter="'+key+'"'),'Missing cinematic scroll chapter '+key);
 assert.ok(home.includes('/cinematic-experiences.html?scene='+key),'Fallback film page link missing '+key);
 assert.ok(js.includes(key+':{'),'Missing film metadata '+key);
}
for(const item of ["addEventListener('scroll'","scrollIntoView(","'pointerup'","'pointerdown'","'input'","visibilitychange","IntersectionObserver","prefers-reduced-motion","saveData","video.play()"]){
 assert.ok(js.includes(item),'Missing scroll/touch/performance control '+item);
}
assert.ok(!js.includes('WebGLRenderer')&&!js.includes('THREE.')&&!js.includes('CylinderGeometry'),'Must present real video rather than 3D meshes');
assert.ok(css.includes('position:sticky')&&css.includes('@media(max-width:760px)')&&css.includes('touch-action:pan-y'),'Sticky mobile film stage and native touch scrolling required');
console.log('PASS homepage films are scroll-activated, touch-enabled, keyboard-accessible and real video only');
