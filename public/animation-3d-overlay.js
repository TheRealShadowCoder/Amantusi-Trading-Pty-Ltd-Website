(() => {
  'use strict';
  const body=document.body,root=document.documentElement;
  if(!body||body.dataset.ar3dReady==='1')return;
  body.dataset.ar3dReady='1';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse=matchMedia('(pointer: coarse)').matches||navigator.maxTouchPoints>0;
  const stage=document.createElement('div');
  stage.className='ar3d-stage';
  stage.setAttribute('aria-hidden','true');
  stage.innerHTML=`
    <div class="ar3d-world">
      <div class="ar3d-orb"></div>
      <div class="ar3d-cube"><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <div class="ar3d-prism"><i></i><i></i><i></i></div>
      <div class="ar3d-rings"><i></i><i></i><i></i></div>
      <div class="ar3d-ribbon"></div>
      <div class="ar3d-route"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="ar3d-lines"><i></i><i></i><i></i><i></i></div>
    </div>`;
  body.appendChild(stage);

  const quality=()=>window.AmantusiAnimations?.tier||body.dataset.animationTier||'balanced';
  const allowed=()=>!reduced&&!['safe','lite'].includes(quality());
  function sync(){stage.hidden=!allowed();body.dataset.ar3dTier=quality()}
  sync();
  document.addEventListener('amantusi:animation-profile',sync);

  const scenes=[...document.querySelectorAll('.hero,main section')];
  const observer=new IntersectionObserver(entries=>{
    const current=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(!current)return;
    const idx=Math.max(0,scenes.indexOf(current.target));
    body.dataset.ar3dScene=String(idx%7);
    body.classList.add('ar3d-shift');
    setTimeout(()=>body.classList.remove('ar3d-shift'),680);
  },{threshold:[.18,.4,.62],rootMargin:'-18% 0px -22% 0px'});
  scenes.forEach(s=>observer.observe(s));

  if(!coarse&&!reduced){
    let queued=false,x=.5,y=.5;
    addEventListener('pointermove',e=>{x=e.clientX/Math.max(1,innerWidth);y=e.clientY/Math.max(1,innerHeight);if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;root.style.setProperty('--ar3d-x',(x-.5).toFixed(4));root.style.setProperty('--ar3d-y',(y-.5).toFixed(4));});},{passive:true});
  }

  let pulseTimer=0;
  function pulse(kind='ambient'){
    clearTimeout(pulseTimer);body.dataset.ar3dPulse=kind;body.classList.add('ar3d-pulse');
    pulseTimer=setTimeout(()=>{body.classList.remove('ar3d-pulse');delete body.dataset.ar3dPulse},950);
  }
  document.addEventListener('click',e=>{if(e.target instanceof Element&&e.target.closest('.button,.nav-cta,.menu-btn,.text-link'))pulse('cta')},{passive:true});
  document.addEventListener('amantusi:animation-profile',()=>pulse('quality'));
  const q=document.querySelector('#quote-form');
  if(q)new MutationObserver(()=>{if(/AMT-|reference|submitted|success/i.test(q.textContent||''))pulse('rfq')}).observe(q,{subtree:true,childList:true,characterData:true});
  document.addEventListener('visibilitychange',()=>stage.classList.toggle('ar3d-paused',document.hidden));

  window.Amantusi3DOverlay=Object.freeze({pulse,get enabled(){return allowed()},get tier(){return quality()}});
})();