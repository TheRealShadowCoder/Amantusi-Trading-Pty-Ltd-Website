/* MotionSites-style scroll storytelling, reinterpreted for real Amantusi photographs.
 * No videos, no fake freight vehicles, no wheel hijack or external libraries.
 * Scroll position is the timeline; reverse scrolling reverses presentation.
 */
(() => {
 'use strict';
 const root=document.querySelector('[data-am-route]');
 if(!root)return;
 const beats=[...root.querySelectorAll('[data-route-step]')];
 const shots=[...root.querySelectorAll('[data-route-shot]')];
 const stage=root.querySelector('.am-route-stage');
 const index=root.querySelector('[data-route-index]');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let active=0,frame=0,enabled=true;
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const paint=()=>{
  frame=0;
  if(!enabled)return;
  const center=innerWidth<=850?innerHeight*.65:innerHeight*.55;
  let next=0,dist=Infinity;
  for(let i=0;i<beats.length;i++){
   const r=beats[i].getBoundingClientRect();
   const d=Math.abs(r.top+r.height*.5-center);
   if(d<dist){dist=d;next=i;}
  }
  if(next!==active){
   active=next;
   beats.forEach((el,i)=>el.classList.toggle('is-active',i===active));
   shots.forEach((el,i)=>el.classList.toggle('is-active',i===active));
   if(index)index.textContent=String(active+1).padStart(2,'0');
  }
  if(stage&&!reduced.matches){
   const first=beats[0].getBoundingClientRect(),last=beats[beats.length-1].getBoundingClientRect();
   const total=last.bottom-first.top;
   const progress=clamp((center-first.top)/Math.max(total,1),0,1);
   stage.style.setProperty('--route-progress',progress.toFixed(3));
   stage.style.setProperty('--route-pan',clamp((center-beats[active].getBoundingClientRect().top)/Math.max(beats[active].getBoundingClientRect().height,1),0,1).toFixed(3));
  }
 };
 const schedule=()=>{if(enabled&&!frame)frame=requestAnimationFrame(paint)};
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries)if(entry.target===root)enabled=entry.isIntersecting;
   if(enabled)schedule();
  },{rootMargin:'120px 0px'});
  observer.observe(root);
 }
 addEventListener('scroll',schedule,{passive:true});
 addEventListener('resize',schedule,{passive:true});
 reduced.addEventListener?.('change',schedule);
 schedule();
})();
