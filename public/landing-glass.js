/* Amantusi interactive glass photo gallery. Presentation only.
   Links remain ordinary anchors. Mobile swipes are native overflow scrolling. */
(() => {
 'use strict';
 const hero=document.querySelector('.am-landing-hero'),gallery=hero?.querySelector('[data-glass-gallery]');
 if(!hero||!gallery)return;
 const cards=[...gallery.querySelectorAll('[data-glass-tile]')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const coarse=matchMedia('(pointer: coarse)');
 const saveData=Boolean(navigator.connection?.saveData);
 let raf=0,lastEvent=null;
 function paint(){
  raf=0;
  if(!lastEvent)return;
  const r=gallery.getBoundingClientRect();
  const dx=Math.max(-.5,Math.min(.5,(lastEvent.clientX-r.left)/Math.max(1,r.width)-.5));
  const dy=Math.max(-.5,Math.min(.5,(lastEvent.clientY-r.top)/Math.max(1,r.height)-.5));
  gallery.style.setProperty('--am-stage-x',(dx*6).toFixed(2)+'px');
  gallery.style.setProperty('--am-stage-y',(dy*4).toFixed(2)+'px');
  for(const card of cards){
    const b=card.getBoundingClientRect();
    card.style.setProperty('--glx',((lastEvent.clientX-b.left)/Math.max(1,b.width)*100).toFixed(1)+'%');
    card.style.setProperty('--gly',((lastEvent.clientY-b.top)/Math.max(1,b.height)*100).toFixed(1)+'%');
  }
 }
 if(!reduced.matches&&!coarse.matches&&!saveData){
  gallery.addEventListener('pointermove',event=>{
   if(event.pointerType!=='mouse')return;
   lastEvent={clientX:event.clientX,clientY:event.clientY};
   if(!raf)raf=requestAnimationFrame(paint);
  },{passive:true});
  gallery.addEventListener('pointerleave',()=>{
   if(raf)cancelAnimationFrame(raf);
   raf=0;lastEvent=null;
   gallery.style.setProperty('--am-stage-x','0px');
   gallery.style.setProperty('--am-stage-y','0px');
  },{passive:true});
 }
 // Service cards remain navigable even when animation and WebGL are disabled.
 // Avoid hijacking touch, scrolling, click, Enter or keyboard focus.
})();
