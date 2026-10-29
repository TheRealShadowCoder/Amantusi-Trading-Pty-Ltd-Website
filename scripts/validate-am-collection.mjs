import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const home=readFileSync('public/index.html','utf8');
const fast=readFileSync('public/index-fast.html','utf8');
const js=readFileSync('public/am-collection.js','utf8');
const css=readFileSync('public/am-collection.css','utf8');
assert.equal(home,fast,'homepage and fast homepage must share the interaction');
assert.equal((home.match(/data-offer="/g)||[]).length,10,'Ten interactive service images');
assert.equal((home.match(/am-shelf-row"/g)||[]).length,2,'Two floating glass shelves');
for(const text of ['id="collections"','id="am-offer-dialog"','id="am-offer-request"','id="am-offer-image"','id="am-offer-quantity"','id="am-offer-usage"','id="am-offer-link"','data-quote-float','data-quote-count','src="/am-collection.js"','href="/am-collection.css"']){
 assert.ok(home.includes(text),'missing responsive service component: '+text);
}
for(const path of ['public/assets/catering/boardroom-lunch.webp','public/assets/catering/gala-buffet.webp','public/assets/service-scenes/packed-meals.webp','public/assets/catering/corporate-breakfast.webp','public/assets/service-scenes/cleaning-hygiene.webp','public/assets/service-scenes/institutional-supply.webp','public/assets/service-scenes/general-trading.webp','public/assets/catering/canape-reception.webp','public/assets/catering/executive-bento.webp','public/assets/catering/formal-dining.webp']){
 assert.ok(existsSync(path),'Service image is not present: '+path);
 assert.ok(home.includes('/'+path.replace(/^public\//,'')),'Service image is not present in page: '+path);
}
for(const word of ['dialog.showModal()', "dialog.addEventListener('close'", "event.preventDefault()", "new Event('input'", "new Event('change'", "form.elements.namedItem('requirements')","window","matchMedia","200","120"]){
 assert.ok(js.includes(word),'missing interactive handling: '+word);
}
assert.ok(css.includes('scroll-snap-type:x proximity')&&css.includes('.am-offer-dialog::backdrop')&&css.includes('@media(max-width:770px)')&&css.includes('prefers-reduced-motion:reduce'),'Responsive/motion rules missing');
assert.ok(!home.includes('<video')&&!js.includes('video.play')&&!css.includes('autoplay'),'User requested no videos');
assert.ok(!home.includes('€249')&&!home.includes('Add to Bag'),'Avoid fictional shopping inventory/prices');
for(const id of ['quote-form','immersive','capabilities','government','contact'])assert.ok(home.includes('id="'+id+'"'),'Core service section removed: '+id);
console.log('PASS responsive floating shelves, ten honest service offerings, accessible detail dialog, quote handoff and no video');
