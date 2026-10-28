import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const routes=['public/index.html','public/index-fast.html'];
const services=['catering','packed-meals','institutional-supply','cleaning-hygiene','general-trading'];
for(const path of routes){
 const html=readFileSync(path,'utf8');
 const noMarkup=html.replace(/<[^>]+>/g,' ');
 assert.equal((html.match(/class="hero section-dark am-landing-hero"/g)||[]).length,1,path+': exactly one main hero');
 assert.equal((html.match(/data-glass-tile>/g)||[]).length,5,path+': five photographic cards');
 assert.equal((html.match(/<h1\b/g)||[]).length,1,path+': single primary heading');
 assert.ok(html.includes('FEEDING PEOPLE.')&&html.includes('SUPPLYING')&&html.includes('ESSENTIALS.'),path+': new factual brand direction');
 assert.ok(!/brighter\s+tom+orrow/i.test(noMarkup),path+': retired slogan removed');
 assert.ok(html.includes('href="/landing-glass.css"')&&html.includes('src="/landing-glass.js"'),path+': photographic hero assets connected');
 assert.ok(html.includes('id="quote-form"')&&html.includes('id="immersive"')&&html.includes('id="capabilities"'),path+': quote and studio protected');
 assert.ok(html.includes('aria-controls="main-nav"')&&html.includes('id="main-nav"'),path+': accessible navigation retained');
 for(const label of ['Company','Capabilities','Government Supply','How We Work','RFQ Checklist','Guides','Catering Menu','Company Profile','Sectors','Request a Quote'])
  assert.ok(html.includes('>'+label+'</a>'),path+': navigation retains '+label);
 for(const service of services){
  const filename='public/assets/service-scenes/'+service+'.webp';
  const raw=readFileSync(filename);
  assert.ok(raw.length>10000&&raw.subarray(8,12).toString('ascii')==='WEBP',filename+': service photo exists');
  assert.ok(html.includes('/assets/service-scenes/'+service+'.webp'),path+': photo '+service);
 }
 assert.ok(!/fumigation|pest\s*control/i.test(noMarkup),path+': avoid unrelated service claims');
}
const css=readFileSync('public/landing-glass.css','utf8');
const js=readFileSync('public/landing-glass.js','utf8');
assert.ok(css.includes('scroll-snap-type:x mandatory')&&css.includes('max-width:420px'),'Native swipeable phone layout');
assert.ok(css.includes('prefers-reduced-motion:reduce')&&css.includes('pointer:coarse'),'Accessible motion and mobile');
assert.ok(css.includes('am-glass-tile:focus-visible')&&css.includes('am-landing-art'),'Keyboard focus and gallery');
assert.ok(js.includes('prefers-reduced-motion: reduce')&&js.includes('saveData'),'Motion and data preferences');
assert.ok(js.includes('requestAnimationFrame')&&!js.includes('preventDefault('),'Non-blocking cursor animation');
console.log('PASS photographic glass hero, real services, navigation, quote, mobile and retired slogan removal');
