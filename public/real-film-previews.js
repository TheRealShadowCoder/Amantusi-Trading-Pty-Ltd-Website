/* Lightweight client preview: one authentic filmed MP4 at a time; static for touch/reduced motion. */
(() => {
 'use strict';
 if(matchMedia('(prefers-reduced-motion: reduce)').matches||matchMedia('(hover: none)').matches||navigator.connection?.saveData)return;
 const cards=[...document.querySelectorAll('#cinematic .cin-home-card')];let active=null;
 function stop(card){
  if(!card)return;const v=card.querySelector('video[data-film]');
  if(v){v.pause();try{v.currentTime=0}catch(_){}}
  card.classList.remove('is-video-previewing');
  if(active===card)active=null;
 }
 for(const card of cards){
  const v=card.querySelector('video[data-film]');if(!v)continue;
  v.addEventListener('playing',()=>{if(active===card)card.classList.add('is-video-previewing');});
  v.addEventListener('error',()=>stop(card));
  const enter=()=>{
   if(active&&active!==card)stop(active);
   active=card;
   if(!v.getAttribute('src'))v.src='/assets/films/'+v.dataset.film+'.mp4';
   v.muted=true;v.loop=true;v.play().catch(()=>stop(card));
  };
  card.addEventListener('pointerenter',enter,{passive:true});
  card.addEventListener('pointerleave',()=>stop(card),{passive:true});
  card.addEventListener('focusin',enter);
  card.addEventListener('focusout',()=>stop(card));
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop(active)},{passive:true});
})();
