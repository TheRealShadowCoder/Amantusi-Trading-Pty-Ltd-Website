import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const pages=['public/index.html','public/index-fast.html'];
const home=readFileSync(pages[0],'utf8'),fast=readFileSync(pages[1],'utf8');
assert.equal(home,fast,'Homepage and fast route should match');
for(const [path,html] of pages.map(path=>[path,readFileSync(path,'utf8')])){
 for(const marker of ['data-motion-film','data-motion-src','/assets/films/','cin-home-card','cin-stage','editorial-motion.js','scroll-cinema.js','cinematic-home.css','gsap.min.js','ScrollTrigger.min.js','cinematic-experiences.html','<video']){
  assert.ok(!html.includes(marker),path+': video component remains '+marker);
 }
 for(const marker of ['id="quote-form"','id="immersive"','id="about"','id="capabilities"','id="government"','id="sectors"','id="resources"','id="faqs"','id="process"','id="contact"']){
  assert.ok(html.includes(marker),path+': core business section missing '+marker);
 }
 assert.ok(html.includes('/assets/amantusi-logo.svg'),'Branding removed from '+path);
}
const removed=[
 'public/cinematic-experiences.html','public/cinematic-experiences.js','public/cinematic-experiences.css',
 'public/cinematic-home.css','public/editorial-motion.js','public/scroll-cinema.js','public/real-film-previews.js',
 'scripts/prepare-real-films.mjs','scripts/live-footage-sources.json','scripts/build-motion-vendor.mjs',
 'scripts/build-cinematic-vendor.mjs','scripts/validate-cinematic-experiences.mjs',
 'scripts/validate-editorial-motion.mjs','scripts/validate-scroll-cinema.mjs'
];
for(const file of removed)assert.ok(!existsSync(file),'Obsolete footage implementation is still deployed: '+file);
for(const name of ['intro','product','architecture','marquee','food'])assert.ok(!existsSync('public/assets/films/'+name+'.mp4'),'Old MP4 still deployed: '+name);
const p=JSON.parse(readFileSync('package.json','utf8'));
assert.ok(!p.dependencies?.gsap,'Orphan motion dependency remains');
for(const name of ['dev','deploy','check']){
 assert.ok(!p.scripts[name].includes('media:prepare')&&!p.scripts[name].includes('motion:vendor'),'Obsolete video build still required');
}
console.log('PASS no stock film playback, no old film pages/assets, all core website sections and RFQ preserved');
