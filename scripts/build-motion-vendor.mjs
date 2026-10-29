/* Keep GSAP / ScrollTrigger on the same origin for CSP, caching and privacy. */
import {mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const destination='public/vendor';
const sources=[['gsap.min.js','node_modules/gsap/dist/gsap.min.js'],['ScrollTrigger.min.js','node_modules/gsap/dist/ScrollTrigger.min.js']];
mkdirSync(destination,{recursive:true});
for(const [filename,src] of sources){
 if(!existsSync(src))throw new Error('GSAP missing: npm install first ('+src+')');
 copyFileSync(src,join(destination,filename));
}
console.log('PASS: same-origin GSAP and ScrollTrigger motion libraries');
