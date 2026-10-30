import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const home=readFileSync('public/index.html','utf8');
const fast=readFileSync('public/index-fast.html','utf8');
const js=readFileSync('public/am-collection.js','utf8');
const css=readFileSync('public/am-collection.css','utf8');
assert.equal(home,fast,'Homepage and fast homepage must match');
assert.equal((home.match(/data-offer="/g)||[]).length,10,'Ten photographic services required');
assert.equal((home.match(/am-shelf-row"/g)||[]).length,2,'Two glass shelves required');
for(const text of ['id="collections"','id="am-offer-dialog"','id="am-offer-request"','id="am-offer-image"','id="am-offer-quantity"','id="am-offer-usage"','id="am-offer-link"','data-quote-float','data-quote-count','src="/am-collection.js"','href="/am-collection.css"'])assert.ok(home.includes(text),'Missing interactive component: '+text);
const imagePaths=[
  "public/assets/service-scenes/boardroom-lunch-showcase-v2.webp",
  "public/assets/service-scenes/gala-buffet-showcase-v2.webp",
  "public/assets/service-scenes/packed-meals.webp",
  "public/assets/service-scenes/corporate-breakfast-showcase-v2.webp",
  "public/assets/service-scenes/cleaning-hygiene.webp",
  "public/assets/service-scenes/institutional-supply.webp",
  "public/assets/service-scenes/general-trading.webp",
  "public/assets/service-scenes/canape-reception-showcase-v2.webp",
  "public/assets/service-scenes/executive-bento-showcase-v2.webp",
  "public/assets/service-scenes/formal-dining-showcase-v2.webp"
];
for(const path of imagePaths){
  assert.ok(existsSync(path),'Collection image file is missing: '+path);
  assert.ok(home.includes('/'+path.slice(7)),'New image URL absent from collection: '+path);
  const bytes=readFileSync(path);
  assert.ok(bytes.length>10000,'Image is unexpectedly small: '+path);
  assert.equal(bytes.toString('ascii',0,4),'RIFF','Not RIFF image: '+path);
  assert.equal(bytes.toString('ascii',8,12),'WEBP','Not WebP image: '+path);
  assert.equal(bytes.readUInt32LE(4)+8,bytes.length,'RIFF file length mismatch: '+path);
}
for(const word of ['dialog.showModal()', "dialog.addEventListener('close'",'event.preventDefault()',"new Event('input'","new Event('change'","form.elements.namedItem('requirements')",'matchMedia','200','120',"image.addEventListener('error'","photo.addEventListener('error'"] )assert.ok(js.includes(word),'Missing accessible behavior: '+word);
assert.ok(css.includes('scroll-snap-type:x proximity')&&css.includes('.am-offer-dialog::backdrop')&&css.includes('@media(max-width:770px)')&&css.includes('prefers-reduced-motion:reduce'),'Missing responsive/motion CSS');
assert.ok(!home.includes('<video')&&!js.includes('video.play')&&!css.includes('autoplay'),'Video not permitted');
assert.ok(!home.includes('€249')&&!home.includes('Add to Bag'),'No fake prices or checkout');
for(const id of ['quote-form','immersive','capabilities','government','contact'])assert.ok(home.includes('id="'+id+'"'),'Core feature missing: '+id);
console.log('PASS 10 valid WebP assets, cache-busted URLs, fallbacks, dialog interaction and preserved RFQ');
