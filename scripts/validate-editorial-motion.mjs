import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const home=readFileSync('public/index.html','utf8');
const fast=readFileSync('public/index-fast.html','utf8');
const js=readFileSync('public/editorial-motion.js','utf8');
const css=readFileSync('public/cinematic-home.css','utf8');
assert.equal(home,fast,'Both homepage routes must share the same design');
const keys=['intro','product','architecture','food','marquee'];
assert.equal((home.match(/data-motion-film=/g)||[]).length,5,'Five separate live-footage locations required');
assert.equal((home.match(/data-motion-src=/g)||[]).length,5,'Each scene has its own authentic MP4 footage');
assert.ok(!home.includes('data-cin-stage')&&!home.includes('cin-stage-seek')&&!home.includes('cin-home-card'),'Remove old video-player chapter UI');
assert.ok(!home.includes('src="/scroll-cinema.js"'),'Remove old single-player controller');
assert.ok(home.includes('src="/vendor/gsap.min.js"')&&home.includes('src="/vendor/ScrollTrigger.min.js"')&&home.includes('src="/editorial-motion.js"'),'Load local GSAP animation pipeline');
assert.ok(!home.includes('href="#cinematic">Films</a>'),'Remove demo-like film navigation label');
for(const [key,location] of [['intro','am-landing-hero'],['product','id="capabilities"'],['architecture','id="spaces-film"'],['food','id="catering-film"'],['marquee','id="events-film"']]){
 assert.ok(home.includes('data-motion-film="'+key+'"'),'Missing embedded footage '+key);
 assert.ok(home.includes('data-motion-src="/assets/films/'+key+'.mp4"'),'Missing real MP4 reference '+key);
 assert.ok(home.includes(location),'Missing location '+location);
 assert.ok(existsSync('public/assets/films/'+key+'.mp4'),'Missing film file '+key);
}
assert.ok(home.includes('id="quote-form"')&&home.includes('id="immersive"')&&home.includes('id="capabilities"'),'Do not touch service gallery or RFQ');
assert.ok(home.includes('stock footage'),'Transparent, client-safe provenance note');
assert.ok(js.includes('IntersectionObserver')&&js.includes("video.play()")&&js.includes('visibilitychange'),'Pause footage when offscreen');
assert.ok(js.includes('matchMedia')&&js.includes('saveData')&&js.includes('prefers-reduced-motion'),'Reduced motion and data saver');
assert.ok(js.includes("pin:true")&&js.includes('scrub:1.35')&&js.includes('ScrollTrigger'),'Use scroll-linked GSAP timeline and editorial pinning');
assert.ok(!js.includes('WebGLRenderer')&&!js.includes('THREE.')&&!js.includes('CylinderGeometry'),'Real footage only, no meshes');
assert.ok(css.includes('@media(max-width:700px)')&&css.includes('am-motion-hero-media')&&css.includes('am-motion-marquee'),'Responsive independently composed footage');
assert.ok(existsSync('public/vendor/gsap.min.js')&&existsSync('public/vendor/ScrollTrigger.min.js'),'Motion libraries must be deployed locally');
console.log('PASS: five independent cinematic films, scroll-linked editorial effects, responsive layout, and intact quotation services');
