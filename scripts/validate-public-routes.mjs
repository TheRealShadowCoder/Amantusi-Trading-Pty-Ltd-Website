import assert from 'node:assert/strict';
import { readFileSync,readdirSync,existsSync,statSync } from 'node:fs';
import path from 'node:path';

/** Validate all local .html/.css/.js/.json/.svg/.webp and icon references written
 *  in static HTML. API routes and in-page anchors are deliberately not inspected. */
const PUBLIC=path.resolve('public');
const pages=readdirSync(PUBLIC).filter(name=>name.endsWith('.html'));
const errors=[];
let refs=0,links=0,alt=0;
for(const name of pages){
 const html=readFileSync(path.join(PUBLIC,name),'utf8');
 if(!/<!doctype html>/i.test(html))errors.push(name+': missing doctype');
 if(!/<html[^>]*lang=/i.test(html))errors.push(name+': missing language');
 if(!/<main(?:\s|>)/i.test(html))errors.push(name+': missing main region');
 if(!/<h1(?:\s|>)/i.test(html))errors.push(name+': missing h1');
 for(const m of html.matchAll(/\b(?:href|src|poster)=["'](\/[^"'?#]+)(?:[?#][^"']*)?["']/gi)){
   let local=m[1];
   if(local.startsWith('//')||local.startsWith('/api/')||local==='/')continue;
   if(!/\.(?:html|css|js|json|svg|webp|png|jpg|jpeg|ico|woff2?)$/i.test(local))continue;
   refs++;
   const filename=path.resolve(PUBLIC,'.'+decodeURIComponent(local));
   if(!filename.startsWith(PUBLIC+path.sep)||!existsSync(filename)||!statSync(filename).isFile())errors.push(name+': missing referenced asset '+local);
 }
 for(const img of html.matchAll(/<img\b[^>]*>/gi)){
  alt++;
  if(!/\balt=["'][^"']*["']/i.test(img[0]))errors.push(name+': image missing alt attribute '+img[0].slice(0,100));
 }
 for(const l of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)){
  links++;
  if(/^javascript:/i.test(l[1]))errors.push(name+': executable javascript: link');
 }
}
console.log('HTML inventory: '+pages.length+' pages, '+refs+' local assets, '+alt+' image alternatives, '+links+' links');
for(const e of errors)console.error('FAIL '+e);
assert.equal(errors.length,0,errors.length+' public integrity issue(s)');
console.log('PASS All public static HTML references and landmarks');
