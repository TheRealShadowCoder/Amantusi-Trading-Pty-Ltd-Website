import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const read = file => readFileSync(file,'utf8');
const home=read('public/index.html');
const app=read('public/app-fast.js');
const styles=read('public/styles.css');
const checks=[
 ['Static-first runtime is active',home.includes('src="/runtime-gate.js"') && home.includes('src="/app-fast.js"')],
 ['No blocking animated splash on homepage',!home.includes('id="experience-loader"')],
 ['Primary main landmark supports skip navigation',home.includes('href="#main-content"')&&home.includes('<main id="main-content"')],
 ['Nav button exposes ARIA state',home.includes('aria-controls="main-nav"')&&home.includes('aria-expanded="false"')],
 ['RFQ form uses multipart encoding',/<form[^>]*id="quote-form"[^>]*enctype="multipart\/form-data"/.test(home)],
 ['RFQ form includes upload',home.includes('name="rfqFiles"')],
 ['RFQ form has required contact fields', ['organisation','contact','email','requirements'].every(n=>new RegExp('name="'+n+'"[^>]*required').test(home))],
 ['RFQ enhancement client exists',existsSync('public/quote-enhancements.js')&&home.includes('/quote-enhancements.js')],
 ['Homepage links to six sector pages',["government-procurement","fmcg-supply","corporate-catering","cleaning-hygiene","office-institutional","general-trading"].every(slug=>home.includes('/'+slug+'.html')&&existsSync('public/'+slug+'.html'))],
 ['Printable RFQ checklist is linked',home.includes('/procurement-checklist.html')&&existsSync('public/procurement-checklist.html')],
 ['Sector landing pages use accessible content and structured enquiry',["government-procurement","fmcg-supply","corporate-catering","cleaning-hygiene","office-institutional","general-trading"].every(slug=>{const html=read('public/'+slug+'.html');return html.includes('id="content"')&&html.includes('/?service=')&&html.includes('<h1>')})],
 ['Client-side form checks block invalid files',app.includes('AmantusiQuoteEnhancements?.validate()')],
 ['Quote enhancements have syntax-safe implementation',existsSync('public/quote-enhancements.js')],
 ['Catering menu exposes selection form',read('public/catering-menu.html').includes('id="catering-brief-form"')&&read('public/catering-menu.html').includes('data-catering-search')],
 ['Catering quotation bridge remains active',read('public/catering-quote-bridge.js').includes('amantusi-catering-brief')],
 ['Catering category count chips are present',read('public/catering.js').includes('category-count')],
 ['Catering quote selected basket shortcut exists',read('public/catering-upgrades.js').includes('catering-floating-basket')],
 ['Catering keyboard photo lightbox is available',read('public/catering-upgrades.js').includes('catering-lightbox')],
 ['Catering portfolio gallery gets keyboard controls',read('public/catering-upgrades.js').includes("track.addEventListener('keydown'")],
 ['Catering graceful failure fallback',read('public/catering.js').includes('Menu is temporarily unavailable')],
 ['Quote form posts to real API',app.includes("fetch('/api/quote'")],
 ['Quote submission reports error states',app.includes("form-status error")],
 ['Menu supports Escape dismissal',app.includes("event.key==='Escape'")&&app.includes('closeMenu({restoreFocus:true})')],
 ['Keyboard focus indicator exists',styles.includes(':focus-visible')],
 ['Skip link visible on focus',styles.includes('.skip-link:focus')],
 ['Catering menu and brochure exist',existsSync('public/catering-menu.html')&&existsSync('public/catering-brochure.html')],
 ['Admin stays separate from public homepage',!home.includes('src="/admin.js"')],
 ['Deployment configuration exists',existsSync('wrangler.jsonc')],
];
for(const directory of ['public','src','scripts']){
  for(const name of readdirSync(directory)){
    if(!/\\.(?:js|mjs)$/.test(name))continue;
    const filename=directory+'/'+name;
    execFileSync(process.execPath,['--check',filename],{stdio:'pipe'});
    console.log('PASS Syntax '+filename);
  }
}
let errors=0;
for(const [name,pass] of checks){console.log((pass?'PASS':'FAIL')+' '+name);if(!pass)errors++}
assert.equal(errors,0,errors+' static smoke check(s) failed');
console.log(checks.length+' static smoke checks passed');
