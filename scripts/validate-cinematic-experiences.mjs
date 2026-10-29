import assert from 'node:assert/strict';
import {existsSync,readFileSync,statSync} from 'node:fs';
const html=readFileSync('public/cinematic-experiences.html','utf8');
const runtime=readFileSync('public/cinematic-experiences.js','utf8');
const css=readFileSync('public/cinematic-experiences.css','utf8');
const manifest=JSON.parse(readFileSync('scripts/live-footage-sources.json','utf8'));
const home=readFileSync('public/index.html','utf8'),fast=readFileSync('public/index-fast.html','utf8');
const keys=['intro','product','architecture','marquee','food'];
assert.equal(manifest.films.length,5,'Five distinct licensed live-action videos required');
for(const key of keys){
 assert.ok(html.includes('data-experience="'+key+'"'),'Missing film selector '+key);
 assert.ok(runtime.includes("'/assets/films/'")&&runtime.includes("key+'.mp4'"),'Must use self-hosted real MP4 source');
 const film=manifest.films.find(x=>x.id===key);assert.ok(film&&film.page&&film.license,'Missing source record for '+key);
 const path='public/assets/films/'+key+'.mp4';
 assert.ok(existsSync(path),'Actual filmed video file missing: '+path);
 const buf=readFileSync(path);const size=statSync(path).size;
 assert.ok(buf.toString('ascii',4,8)==='ftyp','Actual MP4 container missing: '+path);
 assert.ok(size>25000&&size<=18*1024*1024,'Invalid MP4 size '+path+': '+size);
}
for(const id of ['cin-film','cin-play','cin-pause','cin-status','cin-poster-image'])assert.ok(html.includes('id="'+id+'"'),'Missing film playback element '+id);
assert.ok(html.includes('<video')&&html.includes('playsinline muted'),'Native muted HTML5 video required');
assert.ok(!html.includes('interactive 3D')&&!html.includes('Play 3D film')&&!html.includes('illustrative 3D designs'),'False 3D film text');
assert.ok(!runtime.includes('WebGLRenderer')&&!runtime.includes("import('/vendor/three.module.js')")&&!runtime.includes('CylinderGeometry'),'3D mesh renderer still present');
assert.ok(runtime.includes('video.play()')&&runtime.includes("visibilitychange"),'Video controls and background pause missing');
assert.ok(html.includes('stock-video')&&html.includes('Pexels license')&&html.includes('Mixkit free license'),'Transparent commercial stock footage disclosure missing');
assert.ok(css.includes('.cin-film{')&&css.includes('@media(max-width:700px)'),'Responsive HTML5 video CSS required');
assert.ok(home.includes('data-motion-film="intro"')&&fast.includes('data-motion-film="food"'),'Independent footage must live within the actual homepage');
console.log('PASS five licensed real-world MP4 films, native playback, rights disclosure, mobile fallback and no Three.js');
