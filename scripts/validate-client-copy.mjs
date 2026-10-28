import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => readFileSync(path,'utf8');
const pages=['index.html','index-fast.html','company-profile.html','capability-statement.html','information-handling.html','procurement-templates.html'];
const strip = html => html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ');
const internal=/photo material study|rendered in glass|interactive image refraction|digital identity|brand system|logo identity|typography direction|brand character|document consistency|public website capability statement|version 1\.0|website source does not specify|final company privacy policy|brighter\s+tom+orrow|service image\s*\/\s*00[1-5]/i;
for(const file of pages){
 const text=strip(read('public/'+file));
 assert.ok(!internal.test(text),file+': public-facing developer/designer copy not allowed');
}
for(const page of ['index.html','index-fast.html']){
 const html=read('public/'+page);
 assert.ok(html.includes('Real services.')&&html.includes('Built around you.'),page+': professional services presentation');
 assert.ok(html.includes('id="immersive"')&&html.includes('id="quote-form"'),page+': RFQ/service sections protected');
 assert.ok(html.includes('Images are illustrative.'),page+': transparent image note retained');
 assert.ok(html.includes('data-amt-item="catering"')&&html.includes('data-amt-item="trading"'),page+': service selectors retained');
 assert.ok(html.includes('href="#immersive"'),page+': hero link retained');
}
const js=read('public/showcase-3d.js');
for(const label of ['CATERING / 01','PACKED MEALS / 02','INSTITUTIONAL SUPPLY / 03','CLEANING & HYGIENE / 04','GENERAL TRADING / 05']){
 assert.ok(js.includes("sub:'"+label+"'"),'Service detail label: '+label);
}
assert.ok(!js.includes("sub:'SERVICE IMAGE"),'Dynamic service text should be customer facing');
const profile=read('public/company-profile.html');
assert.ok(!profile.includes('href="/admin.html"'),'No administrator portal link in public brochure');
assert.ok(profile.includes('Working with Amantusi')&&profile.includes('Request a Quotation'),'Profile describes services and contact');
assert.ok(profile.includes('data-profile="registration"'),'Registered business detail preserved');
const capability=read('public/capability-statement.html');
assert.ok(capability.includes('No certification, contract award or inventory availability'),'Required truthful legal qualification preserved');
const privacy=read('public/information-handling.html');
assert.ok(privacy.includes('not a complete privacy policy'),'Overview does not pretend to be approved complete privacy notice');
const templates=read('public/procurement-templates.html');
assert.ok(templates.includes('[name or SKU]')&&templates.includes('[event type]'),'Functional RFQ examples not removed');
console.log('PASS: client-facing copy, image transparency, legal details, services and RFQ preserved');
