/* Shared public-site utility: accessible navigation, footer directory and back-to-top. */
(() => {
'use strict';
const routes=[
 ['Home','/'],['Government Procurement','/government-procurement.html'],
 ['FMCG Supply','/fmcg-supply.html'],['Catering','/corporate-catering.html'],
 ['Cleaning & Hygiene','/cleaning-hygiene.html'],['Office Supplies','/office-institutional.html'],
 ['General Trading','/general-trading.html'],['RFQ Checklist','/procurement-checklist.html'],
 ['Catering Menu','/catering-menu.html'],['Catering Brochure','/catering-brochure.html'],
 ['Company Profile','/company-profile.html'],
 ['Capability Statement','/capability-statement.html'],['Procurement Guides','/procurement-guides.html'],
 ['RFQ Examples','/procurement-templates.html'],['Supplier Information','/supplier-onboarding.html'],
 ['Frequently Asked Questions','/procurement-faq.html'],['Information Handling','/information-handling.html']
];
function init(){
 if(document.body.classList.contains('admin-body')||document.body.classList.contains('settings-body'))return;
 const main=document.querySelector('main');
 if(main&&!document.querySelector('.skip-link,.sector-skip')){
   if(!main.id)main.id='main-content';
   if(!main.hasAttribute('tabindex'))main.tabIndex=-1;
   const skip=document.createElement('a');skip.href='#'+main.id;skip.className='skip-link';skip.textContent='Skip to main content';
   document.body.prepend(skip);
 }
 document.querySelectorAll('nav a[href]').forEach(link=>{
   const href=link.getAttribute('href')||'';
   if(href.startsWith('/')&&!href.includes('#')&&new URL(link.href).pathname===location.pathname)link.setAttribute('aria-current','page');
 });
 const crumbTarget=document.querySelector('.sector-hero .sector-wrap');
 if(crumbTarget&&location.pathname!=='/'&&!document.querySelector('[data-breadcrumbs]')){
   const nav=document.createElement('nav');nav.dataset.breadcrumbs='1';nav.className='sector-breadcrumbs';nav.setAttribute('aria-label','Breadcrumb');
   const home=document.createElement('a');home.href='/';home.textContent='Home';
   const sep=document.createElement('span');sep.textContent=' / ';sep.setAttribute('aria-hidden','true');
   const here=document.createElement('span');here.setAttribute('aria-current','page');here.textContent=document.title.split('|')[0].trim();
   nav.append(home,sep,here);crumbTarget.prepend(nav);
 }
 const footer=document.querySelector('footer');
 if(footer&&!footer.querySelector('[data-public-site-directory]')){
   const nav=document.createElement('nav');nav.className='public-site-directory';nav.dataset.publicSiteDirectory='1';
   nav.setAttribute('aria-label','Footer site directory');
   const title=document.createElement('strong');title.textContent='Explore Amantusi';nav.append(title);
   const links=document.createElement('div');links.className='public-site-directory-links';
   for(const [label,path] of routes){
     const a=document.createElement('a');a.href=path;a.textContent=label;
     if(path===location.pathname)a.setAttribute('aria-current','page');
     links.append(a);
   }
   nav.append(links);
   const container=footer.querySelector('.container,.sector-wrap')||footer;
   container.append(nav);
 }
 const toTop=document.createElement('button');toTop.type='button';toTop.className='public-back-to-top';toTop.textContent='↑ Back to top';
 toTop.setAttribute('aria-label','Back to top');toTop.hidden=true;document.body.append(toTop);
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 toTop.addEventListener('click',()=>scrollTo({top:0,behavior:reduce?'auto':'smooth'}));
 let frame=0;
 function paint(){frame=0;toTop.hidden=scrollY<600;}
 const onScroll=()=>{if(!frame)frame=requestAnimationFrame(paint)};
 paint();addEventListener('scroll',onScroll,{passive:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
