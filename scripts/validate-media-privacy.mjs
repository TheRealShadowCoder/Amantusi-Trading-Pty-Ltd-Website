import assert from 'node:assert/strict';
import worker from '../src/worker.js';

const origin='https://amantusi-trading-pty-ltd-website.dolomite-computer.workers.dev';
let r2Reads=0;
let kvReads=0;
const image=new Uint8Array([82,73,70,70,0,0,0,0,87,69,66,80]).buffer;
const env={
 CMS_MEDIA:{
  async get(key){
   r2Reads++;
   if(key==='catering/2026-10-28/sample.webp')return {
    body:new Uint8Array(image),
    httpEtag:'"sample"',
    writeHttpMetadata(headers){headers.set('content-type','image/webp')}
   };
   return null;
  }
 },
 CMS_KV:{
  async getWithMetadata(key){
   kvReads++;
   if(key==='media:catering/2026-10-28/legacy.webp')return {
    value:image,metadata:{contentType:'image/webp',cacheControl:'public, max-age=31536000'}
   };
   return {value:null,metadata:null};
  }
 }
};
for(const path of [
 '/media/rfq/2026/10/lead/private.pdf',
 '/media/rfq%2F2026%2F10%2Flead%2Fprivate.pdf',
 '/media/catering/private.html',
 '/media/catering/../rfq/secret.webp',
 '/media/not-catering/secret.webp'
]){
 const out=await worker.fetch(new Request(origin+path),env,{});
 assert.equal(out.status,404,path+' must be unavailable');
}
assert.equal(r2Reads,0,'Private media must be rejected before any R2 read');
assert.equal(kvReads,0,'Private media must be rejected before KV read');
const current=await worker.fetch(new Request(origin+'/media/catering/2026-10-28/sample.webp'),env,{});
assert.equal(current.status,200,'Allowed R2 catering image should be served');
assert.equal(current.headers.get('content-type'),'image/webp');
const legacy=await worker.fetch(new Request(origin+'/media/catering/2026-10-28/legacy.webp'),env,{});
assert.equal(legacy.status,200,'Legacy KV catering image should still be served');
console.log('PASS authenticated-only RFQ key isolation, public catering R2 and legacy KV fallback');
