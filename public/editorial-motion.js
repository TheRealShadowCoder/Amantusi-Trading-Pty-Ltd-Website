/* AMANTUSI — filmed editorial motion. Real photography moves with the page; no player UI.
 * One licensed, self-hosted stock clip per section. IntersectionObserver keeps offscreen
 * videos paused, ScrollTrigger scrubs presentation (not browser scroll) for native touch. */
(() => {
 'use strict';
 const scenes=[...document.querySelectorAll('[data-motion-film]')];
 if(!scenes.length)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const dataSaver=()=>Boolean(navigator.connection?.saveData);
 const motionOff=()=>reduced.matches||dataSaver();
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const active=new Set();
 const videos=scenes.map(section=>({section,video:section.querySelector('video[data-motion-src]')||null})).filter(x=>x.video);
 function suspend(video){if(!video.paused)video.pause();}
 function start(video){
   if(motionOff()||document.hidden)return;
   if(!video.getAttribute('src')){
     video.src=video.dataset.motionSrc;
     video.preload='metadata';
     video.load();
   }
   const play=video.play();
   if(play&&play.catch)play.catch(()=>{ /* Posters remain visible if autoplay is blocked. */ });
 }
 for(const {section,video} of videos){
   video.muted=true;video.defaultMuted=true;video.playsInline=true;video.loop=true;
   video.addEventListener('playing',()=>section.classList.add('am-motion-has-video'),{passive:true});
   video.addEventListener('error',()=>section.classList.remove('am-motion-has-video'),{passive:true});
 }
 const observer=('IntersectionObserver' in window)?new IntersectionObserver(entries=>{
   for(const entry of entries){
     const section=entry.target;
     const video=section.querySelector('video[data-motion-src]');
     if(!video)continue;
     if(entry.isIntersecting){
       active.add(video);
       start(video);
     } else {
       active.delete(video);
       suspend(video);
     }
   }
 },{rootMargin:'180px 0px',threshold:.02}):null;
 for(const {section,video} of videos){if(observer)observer.observe(section);else{active.add(video);start(video);}}
 document.addEventListener('visibilitychange',()=>{
   for(const {video} of videos)document.hidden?suspend(video):(active.has(video)&&start(video));
 },{passive:true});
 reduced.addEventListener?.('change',()=>{for(const {video} of videos)motionOff()?suspend(video):(active.has(video)&&start(video));});
 navigator.connection?.addEventListener?.('change',()=>{for(const {video} of videos)motionOff()?suspend(video):(active.has(video)&&start(video));});
 // Position is presentational only. Touch gestures are never captured or cancelled.
 for(const {section} of videos){
   const area=section.querySelector('[data-motion-interact]')||section;
   if(matchMedia('(pointer:fine) and (hover:hover)').matches){
     area.addEventListener('pointermove',e=>{
       const r=area.getBoundingClientRect();
       section.style.setProperty('--film-x',((e.clientX-r.left)/Math.max(r.width,1)-.5).toFixed(3));
       section.style.setProperty('--film-y',((e.clientY-r.top)/Math.max(r.height,1)-.5).toFixed(3));
     },{passive:true});
     area.addEventListener('pointerleave',()=>{section.style.setProperty('--film-x','0');section.style.setProperty('--film-y','0');},{passive:true});
   }
 }
 if(motionOff()||!window.gsap||!window.ScrollTrigger)return;
 const gsap=window.gsap,ST=window.ScrollTrigger;
 gsap.registerPlugin(ST);
 const words=(root)=>root?[...root.querySelectorAll('.am-motion-line-inner')]:[];
 // Every film is in its own real section. The scroll timeline changes the frame,
 // typography and lighting: clips themselves continue as ambient moving photography.
 const mm=gsap.matchMedia();
 mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)',()=>{
   const hero=document.querySelector('.am-landing-hero');
   const heroVideo=hero?.querySelector('.am-motion-hero-media');
   const heroCopy=hero?.querySelector('.am-landing-copy');
   if(hero&&heroVideo&&heroCopy){
     const tl=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{
       trigger:hero,start:'top top',end:'+=55%',pin:true,pinSpacing:true,
       scrub:1.35,anticipatePin:1,fastScrollEnd:false,invalidateOnRefresh:true
     }});
     tl.to(heroVideo,{scale:1.14,yPercent:4,duration:1},0)
       .to(heroCopy,{y:-110,autoAlpha:0,filter:'blur(7px)',duration:.85},.13);
     const gallery=hero.querySelector('.am-landing-art');
     if(gallery)tl.to(gallery,{xPercent:9,yPercent:-2,scale:.95,autoAlpha:.55,duration:1},0);
   }
   // Architecture has a cinematic camera-like push-in while the scene remains pinned.
   const arch=document.querySelector('.am-motion-architecture');
   const shot=arch?.querySelector('.am-motion-film-surface');
   if(arch&&shot){
     const timeline=gsap.timeline({scrollTrigger:{
       trigger:arch,start:'top top',end:'+=72%',pin:true,
       scrub:1.25,anticipatePin:1,invalidateOnRefresh:true
     }});
     timeline.fromTo(shot,{scale:1.05},{scale:1.25,ease:'none',duration:1},0);
     const lines=words(arch);
     if(lines.length)timeline.fromTo(lines,{yPercent:105,filter:'blur(10px)'},{yPercent:0,filter:'blur(0px)',stagger:.14,duration:.48,ease:'power2.out'},.05);
     const deco=arch.querySelector('.am-motion-light-sweep');
     if(deco)timeline.fromTo(deco,{xPercent:-100,opacity:.1},{xPercent:110,opacity:.7,duration:1,ease:'none'},0);
   }
 });
 mm.add('(prefers-reduced-motion: no-preference)',()=>{
   for(const section of scenes){
     if(section.classList.contains('am-motion-architecture')&&innerWidth>=900)continue;
     if(section.classList.contains('am-motion-hero-scene'))continue;
     const surface=section.querySelector('.am-motion-film-surface');
     const copy=section.querySelector('.am-motion-copy');
     const lines=words(section);
     const timeline=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{
       trigger:section,start:'top 92%',end:'bottom 8%',scrub:1.15,
       invalidateOnRefresh:true
     }});
     if(surface){
       timeline.fromTo(surface,{scale:1.12,yPercent:4,clipPath:'inset(9% 4% 9% 4% round 18px)'},{scale:1.01,yPercent:-4,clipPath:'inset(0% 0% 0% 0% round 0px)',duration:1},0);
     }
     if(copy)timeline.fromTo(copy,{y:65,opacity:.5},{y:-12,opacity:1,duration:.72},.05);
     if(lines.length)timeline.fromTo(lines,{yPercent:90,filter:'blur(7px)'},{yPercent:0,filter:'blur(0px)',stagger:.1,duration:.42,ease:'power2.out'},.08);
   }
 });
 let pending=false;
 addEventListener('resize',()=>{
   if(pending)return;
   pending=true;
   requestAnimationFrame(()=>{pending=false;ST.refresh(true);});
 },{passive:true});
})();
