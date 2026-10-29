/* Amantusi Collection / progressive-enhancement interactions
 * Real service images, quotation-led business flow, no fictional prices,
 * no fake shopping basket or backend catalogue, no video/media downloads. */
(() => {
 'use strict';
 const root=document.querySelector('.am-collection');
 const dialog=document.getElementById('am-offer-dialog');
 const form=document.getElementById('quote-form');
 if(!root||!dialog||!form)return;
 const offers=[
  {id:'catering',name:'Corporate catering',label:'EVENTS / 01',img:'/assets/catering/boardroom-lunch.webp',link:'/corporate-catering.html',type:'Catering',scope:'Boardroom lunches and hosted meetings',desc:'Planned catering for professional meetings and work functions.'},
  {id:'buffet',name:'Event buffet service',label:'EVENTS / 02',img:'/assets/catering/gala-buffet.webp',link:'/corporate-catering.html',type:'Catering',scope:'Buffet service and event dining',desc:'Buffet-style meal service for gatherings, functions and events.'},
  {id:'meals',name:'Packed meal supply',label:'MEALS / 03',img:'/assets/service-scenes/packed-meals.webp',link:'/catering-menu.html',type:'Catering',scope:'Prepared meals for groups',desc:'Packed-meal requirements for teams, meetings and institutions.'},
  {id:'breakfast',name:'Breakfast catering',label:'MEALS / 04',img:'/assets/catering/corporate-breakfast.webp',link:'/catering-menu.html',type:'Catering',scope:'Morning meetings and functions',desc:'Breakfast and refreshment options tailored to the brief.'},
  {id:'hygiene',name:'Cleaning & hygiene',label:'SUPPLY / 05',img:'/assets/service-scenes/cleaning-hygiene.webp',link:'/cleaning-hygiene.html',type:'Cleaning & Hygiene',scope:'Facility cleaning essentials',desc:'Cleaning consumables, paper products and hygiene supplies.'},
  {id:'stationery',name:'Office & stationery',label:'SUPPLY / 06',img:'/assets/service-scenes/institutional-supply.webp',link:'/office-institutional.html',type:'Office / Institutional Supply',scope:'Institutional working essentials',desc:'Stationery and operational goods sourced to specification.'},
  {id:'trading',name:'General procurement',label:'SUPPLY / 07',img:'/assets/service-scenes/general-trading.webp',link:'/general-trading.html',type:'General Procurement',scope:'Requirement-led sourcing',desc:'General goods and product categories quoted against your list.'},
  {id:'reception',name:'Canapé reception',label:'EVENTS / 08',img:'/assets/catering/canape-reception.webp',link:'/corporate-catering.html',type:'Catering',scope:'Function and reception catering',desc:'Small bites and service planning for a reception or function.'},
  {id:'bento',name:'Executive meal boxes',label:'MEALS / 09',img:'/assets/catering/executive-bento.webp',link:'/catering-menu.html',type:'Catering',scope:'Individual meal presentation',desc:'Individual meal requirements for guests and professional meetings.'},
  {id:'dining',name:'Formal event dining',label:'EVENTS / 10',img:'/assets/catering/formal-dining.webp',link:'/corporate-catering.html',type:'Catering',scope:'Occasion-focused catering',desc:'Catering arrangements for formal events and hosted occasions.'}
 ];
 const items=new Map(offers.map(x=>[x.id,x]));
 const allCards=[...root.querySelectorAll('[data-offer]')];
 const title=dialog.querySelector('#am-offer-title'),category=dialog.querySelector('#am-offer-category');
 const summary=dialog.querySelector('#am-offer-summary'),photo=dialog.querySelector('#am-offer-image');
 const serviceLink=dialog.querySelector('#am-offer-link');
 const quantity=dialog.querySelector('#am-offer-quantity'),usage=dialog.querySelector('#am-offer-usage');
 const detailForm=dialog.querySelector('#am-offer-request'),feedback=dialog.querySelector('#am-offer-feedback');
 const add=dialog.querySelector('.am-offer-add');
 const countFloat=document.querySelector('[data-quote-float]'),countLabel=countFloat?.querySelector('[data-quote-count]');
 const less=document.getElementById('am-offer-less'),more=document.getElementById('am-offer-more');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let current=null,trigger=null,quoteCount=0,resetTimer=null;
 const limit=(n)=>Math.min(100000,Math.max(1,Math.trunc(Number(n)||1)));
 function close(){
  if(dialog.open)dialog.close();
 }
 function details(key,origin){
  const offer=items.get(key);
  if(!offer)return;
  if(typeof dialog.showModal!=='function')return; // Original links work in older browsers.
  current=offer;trigger=origin;root.classList.add('is-focused');
  for(const link of allCards)link.classList.toggle('is-selected',link===origin);
  category.textContent=offer.label;
  title.textContent=offer.name;
  summary.textContent=offer.desc+' '+offer.scope+'.';
  photo.src=offer.img;photo.alt=offer.name+' — illustrative service photograph';
  serviceLink.href=offer.link;
  quantity.value=offer.type==='Catering'?'20':'1';
  usage.value=offer.type==='Catering'?'Event / function':'Business / office';
  feedback.textContent='';
  add.textContent='Add to quotation request ↗';
  if(resetTimer)clearTimeout(resetTimer);
  if(!dialog.open)dialog.showModal();
  // Browser's dialog provides focus containment and Escape-key behavior natively.
  dialog.querySelector('[data-close-offer]')?.focus({preventScroll:true});
 }
 for(const card of allCards){
  card.addEventListener('click',event=>{
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   if(typeof dialog.showModal!=='function')return; // Progressive enhancement.
   event.preventDefault();
   details(card.dataset.offer,card);
  });
 }
 dialog.querySelectorAll('[data-close-offer]').forEach(btn=>btn.addEventListener('click',close));
 dialog.addEventListener('click',event=>{if(event.target===dialog)close()});
 dialog.addEventListener('close',()=>{
  root.classList.remove('is-focused');
  allCards.forEach(x=>x.classList.remove('is-selected'));
  trigger?.focus({preventScroll:true});
 });
 less.addEventListener('click',()=>{quantity.value=String(limit(Number(quantity.value)-1));});
 more.addEventListener('click',()=>{quantity.value=String(limit(Number(quantity.value)+1));});
 quantity.addEventListener('change',()=>{quantity.value=String(limit(quantity.value));});
 detailForm.addEventListener('submit',event=>{
  event.preventDefault();
  if(!current||!detailForm.reportValidity())return;
  const q=limit(quantity.value),unit=current.type==='Catering'?'estimated people / portions':'estimated units';
  const line='• '+current.name+' — '+q+' '+unit+' — '+usage.value+' — '+current.scope+'. Please confirm options, specifications, availability and pricing.';
  const field=form.elements.namedItem('requirements');
  const type=form.elements.namedItem('type');
  if(!(field instanceof HTMLTextAreaElement))return;
  const prior=field.value.trim();
  field.value=(prior?prior+'\n':'')+line;
  field.dispatchEvent(new Event('input',{bubbles:true}));
  field.dispatchEvent(new Event('change',{bubbles:true}));
  if(type instanceof HTMLSelectElement&&!prior){
   const option=[...type.options].find(x=>x.value===current.type||x.textContent?.trim()===current.type);
   if(option){type.value=option.value;type.dispatchEvent(new Event('change',{bubbles:true}));}
  }
  quoteCount+=1;
  if(countFloat&&countLabel){
   countFloat.hidden=false;
   countLabel.textContent=String(quoteCount);
   countFloat.setAttribute('aria-label',quoteCount+' service ideas added to quotation — jump to form');
   countFloat.animate?.([{transform:'scale(.82)',opacity:.6},{transform:'scale(1.07)',opacity:1},{transform:'scale(1)',opacity:1}],{duration:480,easing:'cubic-bezier(.22,1,.36,1)'});
  }
  const message='Added ✓ '+current.name+' ('+q+') to your quotation form.';
  feedback.textContent=message;
  add.textContent='Added ✓';
  if(resetTimer)clearTimeout(resetTimer);
  resetTimer=setTimeout(()=>{if(dialog.open)add.textContent='Add another requirement ↗';},1500);
 });
 dialog.querySelectorAll('[data-offer-quote]').forEach(a=>a.addEventListener('click',()=>{close();}));
 countFloat?.addEventListener('click',()=>{close();});
 // Delayed spotlight: avoid flicker while moving across the gallery.
 if(!reduced&&matchMedia('(hover:hover) and (pointer:fine)').matches){
  for(const card of allCards){
   let enterTimer,leaveTimer;
   const row=card.closest('.am-shelf-track');
   card.addEventListener('pointerenter',()=>{clearTimeout(leaveTimer);enterTimer=setTimeout(()=>{card.classList.add('is-spotlit');row?.classList.add('has-spotlight')},120)});
   card.addEventListener('pointerleave',()=>{clearTimeout(enterTimer);leaveTimer=setTimeout(()=>{card.classList.remove('is-spotlit');if(!row?.querySelector('.is-spotlit'))row?.classList.remove('has-spotlight')},200)});
  }
 }
 // Native momentum scrolling / snap works for touch, keyboard and trackpads.
 // No wheel-event interception, no fake scroll-bar hiding at document level.
})();
