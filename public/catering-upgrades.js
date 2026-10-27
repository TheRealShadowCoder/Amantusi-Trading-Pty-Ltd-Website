/* Catering discovery and quote composition, layered on the existing CMS menu. */
(() => {
'use strict';
const q=(s,ctx=document)=>ctx.querySelector(s);
const grid=q('[data-menu-grid]');
const search=q('[data-catering-search]');
const results=q('[data-catering-results]');
const basket=q('[data-catering-basket]');
const clear=q('[data-catering-clear]');
const briefForm=q('#catering-brief-form');
const feedback=q('[data-catering-brief-status]');
const selected=new Map();
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function labelCount(){if(basket)basket.textContent=selected.size+' option'+(selected.size===1?'':'s')+' selected';if(clear)clear.disabled=selected.size===0;}
function update(){
 if(!grid)return;
 const text=(search?.value||'').trim().toLocaleLowerCase();
 const cards=Array.from(grid.querySelectorAll('.menu-card'));
 let count=0;
 for(const card of cards){
  const matches=!text||String(card.dataset.search||'').toLocaleLowerCase().includes(text);
  card.hidden=!matches;
  if(matches)count++;
  let btn=card.querySelector('[data-catering-add]');
  if(!btn){btn=document.createElement('button');btn.type='button';btn.className='catering-select-item';btn.dataset.cateringAdd='1';card.querySelector('.menu-card-body')?.appendChild(btn);}
  if(btn){const key=card.dataset.itemId||'';const present=selected.has(key);btn.textContent=present?'✓ Added to enquiry':'+ Add to enquiry';btn.setAttribute('aria-pressed',String(present));btn.setAttribute('aria-label',(present?'Remove':'Add')+' '+(card.querySelector('h3')?.textContent||'item')+(present?' from':' to')+' quotation enquiry');}
 }
 if(results)results.textContent=count+' menu option'+(count===1?'':'s')+' shown';
 labelCount();
}
let frame=0;
function deferUpdate(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;update()});}
function initMenu(){
 if(!grid)return;
 search?.addEventListener('input',deferUpdate);
 grid.addEventListener('click',event=>{
  const button=event.target.closest('[data-catering-add]');if(!button)return;
  const card=button.closest('.menu-card');if(!card)return;
  const id=card.dataset.itemId||'';if(!id)return;
  if(selected.has(id))selected.delete(id);
  else{
   const item=window.AmantusiCateringData?.activeItems?.find(x=>String(x.id)===id);
   selected.set(id,{name:item?.name||card.querySelector('h3')?.textContent||'Catering item',category:item?.category||card.dataset.category||'',id});
  }
  update();
 });
 const observer=new MutationObserver(entries=>{if(entries.some(e=>e.addedNodes.length||e.removedNodes.length))deferUpdate()});
 observer.observe(grid,{childList:true});
 document.addEventListener('amantusi:catering:data-ready',deferUpdate);
 document.addEventListener('amantusi:catering:category',deferUpdate);
 clear?.addEventListener('click',()=>{selected.clear();update()});
 update();
}
function readBrief(){
 const data=new FormData(briefForm);
 return {
  eventType:String(data.get('eventType')||'').trim(),
  guestCount:String(data.get('guestCount')||'').trim(),
  serviceFormat:String(data.get('serviceFormat')||'').trim(),
  date:String(data.get('date')||'').trim(),
  location:String(data.get('location')||'').trim(),
  notes:String(data.get('notes')||'').trim(),
  reference:String(data.get('reference')||'').trim()
 };
}
function initBrief(){
 if(!briefForm)return;
 const date=q('[name="date"]',briefForm);
 if(date&&date.type==='date'){const now=new Date();date.min=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');}
 briefForm.addEventListener('submit',event=>{
  event.preventDefault();
  if(!briefForm.reportValidity())return;
  const brief=readBrief();
  const payload={brief,items:Array.from(selected.values())};
  if(!payload.items.length&&!brief.notes){if(feedback)feedback.textContent='Choose a menu item or describe what you need in the dietary / service notes.';q('[name="notes"]',briefForm)?.focus();return;}
  try{localStorage.setItem('amantusi-catering-brief',JSON.stringify(payload));}
  catch(_){if(feedback)feedback.textContent='Your browser blocked local storage. Copy your brief into the RFQ form instead.';return;}
  window.location.assign('/?service=Catering#quote');
 });
}
function initGallery(){
 document.querySelectorAll('[data-catering-gallery]').forEach(gallery=>{
  if(gallery.dataset.navReady==='1')return;
  gallery.dataset.navReady='1';
  const track=q('[data-catering-gallery-track]',gallery);
  if(!track)return;
  track.setAttribute('tabindex','0');
  track.setAttribute('role','region');
  track.setAttribute('aria-label','Catering photo portfolio. Use arrow keys to scroll.');
  const actions=document.createElement('div');actions.className='catering-gallery-actions';
  const prev=document.createElement('button'),next=document.createElement('button');
  prev.type='button';next.type='button';prev.textContent='← Previous photos';next.textContent='Next photos →';
  prev.setAttribute('aria-label','Previous catering photos');next.setAttribute('aria-label','Next catering photos');
  actions.append(prev,next);gallery.before(actions);
  const move=delta=>track.scrollBy({left:delta*(Math.min(track.clientWidth*.8,420)),behavior:reduce?'auto':'smooth'});
  prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
  track.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();move(-1)}if(event.key==='ArrowRight'){event.preventDefault();move(1)}});
 });
}
function init(){
 initMenu();initBrief();initGallery();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
