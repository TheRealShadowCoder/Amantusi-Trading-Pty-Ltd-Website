/* Catering discovery and quote composition, layered on the existing CMS menu. */
(() => {
'use strict';
const q=(s,ctx=document)=>ctx.querySelector(s);
const grid=q('[data-menu-grid]');
const search=q('[data-catering-search]');
const results=q('[data-catering-results]');
const dietarySelect=q('[data-catering-dietary-filter]');
const basket=q('[data-catering-basket]');
const clear=q('[data-catering-clear]');
const briefForm=q('#catering-brief-form');
const feedback=q('[data-catering-brief-status]');
const selected=new Map();
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const floating=document.createElement('a');
floating.className='catering-floating-basket';floating.href='#build-quote';floating.hidden=true;
floating.setAttribute('aria-label','Jump to selected catering options and build quotation');
document.body.append(floating);
function labelCount(){
 const text=selected.size+' option'+(selected.size===1?'':'s')+' selected';
 if(basket)basket.textContent=text;
 if(clear)clear.disabled=selected.size===0;
 floating.hidden=selected.size===0;
 floating.textContent=text+' · Build enquiry ↗';
}
function update(){
 if(!grid)return;
 const text=(search?.value||'').trim().toLocaleLowerCase();
 const cards=Array.from(grid.querySelectorAll('.menu-card'));
 let count=0;
 for(const card of cards){
  const matchesText=!text||String(card.dataset.search||'').toLocaleLowerCase().includes(text);
  const tag=String(dietarySelect?.value||'').toLocaleLowerCase();
  const matchesDiet=!tag||String(card.dataset.dietary||'').toLocaleLowerCase().split('|').includes(tag);
  const matches=matchesText&&matchesDiet;
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
 dietarySelect?.addEventListener('change',deferUpdate);
 document.addEventListener('amantusi:catering:data-ready',()=>{
  if(!dietarySelect)return;
  const items=window.AmantusiCateringData?.activeItems||[];
  const options=[...new Set(items.flatMap(item=>Array.isArray(item.dietary)?item.dietary:[]).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const previous=dietarySelect.value;
  dietarySelect.replaceChildren(new Option('All dietary options',''),...options.map(option=>new Option(option,option.toLowerCase())));
  if([...dietarySelect.options].some(option=>option.value===previous))dietarySelect.value=previous;
  deferUpdate();
 });
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
  /* Enhance portfolio cards as keyboard-accessible enlarged image viewers. */
  const dialog=document.createElement('dialog');
  dialog.className='catering-lightbox';
  dialog.setAttribute('aria-label','Enlarged catering portfolio photo');
  const image=document.createElement('img');image.alt='';
  const caption=document.createElement('p');
  const close=document.createElement('button');close.type='button';close.textContent='Close photograph ×';close.className='catering-lightbox-close';
  dialog.append(close,image,caption);document.body.append(dialog);
  close.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
  const enhanceFigures=()=>{
    track.querySelectorAll('.cm-gallery-card').forEach(fig=>{
      if(fig.querySelector('.catering-image-open'))return;
      const control=document.createElement('button');
      control.type='button';control.className='catering-image-open';control.textContent='Enlarge photo';
      const img=fig.querySelector('img');
      control.setAttribute('aria-label','Enlarge '+(img?.alt||'catering portfolio photo'));
      control.addEventListener('click',()=>{
        if(!img)return;
        image.src=img.currentSrc||img.src;
        image.alt=img.alt||'Catering portfolio photograph';
        caption.textContent=fig.querySelector('figcaption')?.textContent||image.alt;
        if(typeof dialog.showModal==='function')dialog.showModal();
      });
      fig.append(control);
    });
  };
  enhanceFigures();
  new MutationObserver(changes=>{if(changes.some(c=>c.addedNodes.length))enhanceFigures()}).observe(track,{childList:true});

 });
}
function init(){
 initMenu();initBrief();initGallery();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
