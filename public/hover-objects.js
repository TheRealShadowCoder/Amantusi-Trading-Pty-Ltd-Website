(() => {
  'use strict';
  const body=document.body;
  if(!body||body.dataset.hoverObjectsReady==='1')return;
  body.dataset.hoverObjectsReady='1';

  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
  const coarse=!fine||matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
  const idle=window.requestIdleCallback||((fn)=>setTimeout(()=>fn({timeRemaining:()=>8}),1));
  const effects=['tilt-left','tilt-right','lift','glow','shimmer','pulse','bob','swing','float','spin-child','orbit-child','zoom'];
  const objectSelectors=[
    '.cap-card','.process-step','.panel-line','.button','.nav-cta','.text-link','.hero-meta span','.capability-chip','.logo-plaque','.orbital-card','.government-panel','.quote-contact-card','.contact-links a','.footer-brand','.brand','.trust-grid span','.trust-item',
    '.menu-card','.brochure-card','.profile-card','.profile-stat','.menu-item','.menu-trust-grid>*','.supplier-card','.product-card','.contact-card','.service-card','.feature-card','.stat-card','.timeline-item','.category-card','.catering-card','.menu-category','.gallery-card','.media-card'
  ];

  const special=new Map([
    ['.logo-plaque','spin-child'],['.brand','float'],['.orbital-card','glow'],['.government-panel','glow'],['.quote-contact-card','shimmer'],['.menu-button','pulse']
  ]);

  function stableHash(el){
    const seed=`${el.tagName}|${el.className}|${el.textContent?.trim().slice(0,48)||''}`;
    let h=2166136261;
    for(let i=0;i<seed.length;i++){h^=seed.charCodeAt(i);h=Math.imul(h,16777619)}
    return Math.abs(h>>>0);
  }
  function chooseEffect(el){
    for(const [selector,fx] of special)if(el.matches(selector))return fx;
    if(el.matches('.button,.nav-cta,.text-link,.contact-links a'))return 'magnetic';
    if(el.matches('.panel-line,.quote-contact-card'))return 'shimmer';
    if(el.matches('.capability-chip,.trust-grid span,.trust-item'))return ['bob','swing','pulse'][stableHash(el)%3];
    if(el.matches('.menu-card,.brochure-card,.gallery-card,.media-card,.catering-card'))return ['zoom','tilt-left','tilt-right','lift'][stableHash(el)%4];
    if(el.matches('.cap-card,.process-step,.profile-card,.supplier-card,.product-card,.service-card,.feature-card,.stat-card,.timeline-item,.category-card'))return effects[stableHash(el)%9];
    return effects[stableHash(el)%effects.length];
  }
  function decorate(el){
    if(!(el instanceof HTMLElement)||el.dataset.hoverFxReady==='1')return;
    if(el.closest('.admin-shell,.admin-app,[data-admin-root]'))return;
    el.dataset.hoverFxReady='1';
    el.classList.add('hover-fx');
    el.dataset.hoverFx=chooseEffect(el);
  }
  function scan(root=document){
    objectSelectors.forEach(sel=>{
      if(root instanceof Element&&root.matches(sel))decorate(root);
      root.querySelectorAll?.(sel).forEach(decorate);
    });
  }
  idle(()=>scan(document));

  let rescanQueued=false;
  const observer=new MutationObserver(records=>{
    if(rescanQueued)return;
    if(!records.some(r=>[...r.addedNodes].some(n=>n instanceof Element)))return;
    rescanQueued=true;
    idle(()=>{rescanQueued=false;scan(document)});
  });
  observer.observe(body,{subtree:true,childList:true});

  function clearMagnetic(el){
    el.style.removeProperty('--hfx-x');
    el.style.removeProperty('--hfx-y');
  }
  function activate(el){
    if(reduced||!el)return;
    el.classList.add('hover-fx-active');
  }
  function deactivate(el){
    if(!el)return;
    el.classList.remove('hover-fx-active');
    clearMagnetic(el);
  }

  if(fine&&!reduced){
    document.addEventListener('pointerover',e=>{
      const el=e.target instanceof Element?e.target.closest('.hover-fx'):null;
      if(!el)return;
      activate(el);
    },{passive:true});
    document.addEventListener('pointerout',e=>{
      const el=e.target instanceof Element?e.target.closest('.hover-fx'):null;
      if(!el)return;
      const next=e.relatedTarget instanceof Element?e.relatedTarget.closest('.hover-fx'):null;
      if(next===el)return;
      deactivate(el);
    },{passive:true});

    let magneticRaf=0,magneticTarget=null,magneticEvent=null;
    document.addEventListener('pointermove',e=>{
      const el=e.target instanceof Element?e.target.closest('.hover-fx[data-hover-fx="magnetic"]'):null;
      if(!el)return;
      magneticTarget=el;magneticEvent=e;
      if(magneticRaf)return;
      magneticRaf=requestAnimationFrame(()=>{
        magneticRaf=0;
        if(!magneticTarget||!magneticEvent||body.classList.contains('perf-scrolling'))return;
        const r=magneticTarget.getBoundingClientRect();
        const nx=(magneticEvent.clientX-(r.left+r.width/2))/Math.max(1,r.width/2);
        const ny=(magneticEvent.clientY-(r.top+r.height/2))/Math.max(1,r.height/2);
        magneticTarget.style.setProperty('--hfx-x',`${Math.max(-1,Math.min(1,nx))*4.5}px`);
        magneticTarget.style.setProperty('--hfx-y',`${Math.max(-1,Math.min(1,ny))*3}px`);
      });
    },{passive:true});
  }else if(!reduced){
    let tapTimer=0,lastTap=null;
    document.addEventListener('pointerdown',e=>{
      const el=e.target instanceof Element?e.target.closest('.hover-fx'):null;
      if(!el)return;
      if(lastTap&&lastTap!==el)deactivate(lastTap);
      lastTap=el;activate(el);clearTimeout(tapTimer);
      tapTimer=setTimeout(()=>{deactivate(el);if(lastTap===el)lastTap=null},460);
    },{passive:true});
  }

  /* CSS-3D overlay is pointer-events:none. Detect pointer proximity without intercepting clicks. */
  const ar3dSelectors=['.ar3d-orb','.ar3d-cube','.ar3d-prism','.ar3d-rings','.ar3d-ribbon','.ar3d-route','.ar3d-lines'];
  let ar3dObjects=[],ar3dQueued=false,px=-9999,py=-9999,active3d=null;
  function refresh3d(){ar3dObjects=ar3dSelectors.map(s=>document.querySelector(s)).filter(Boolean)}
  idle(refresh3d);
  function hit3d(){
    ar3dQueued=false;
    if(reduced||coarse||body.classList.contains('perf-scrolling')||body.classList.contains('perf-wheel-active'))return;
    if(!ar3dObjects.length)refresh3d();
    let winner=null,best=Infinity;
    for(const el of ar3dObjects){
      if(!(el instanceof HTMLElement)||el.offsetParent===null)continue;
      const r=el.getBoundingClientRect();
      const pad=4;
      if(px<r.left-pad||px>r.right+pad||py<r.top-pad||py>r.bottom+pad)continue;
      const cx=r.left+r.width/2,cy=r.top+r.height/2;
      const score=Math.hypot(px-cx,py-cy)+Math.sqrt(Math.max(1,r.width*r.height))*.04;
      if(score<best){best=score;winner=el}
    }
    if(winner===active3d)return;
    active3d?.classList.remove('ar3d-hover-active');
    active3d=winner;
    active3d?.classList.add('ar3d-hover-active');
  }
  if(fine&&!reduced){
    addEventListener('pointermove',e=>{px=e.clientX;py=e.clientY;if(ar3dQueued)return;ar3dQueued=true;requestAnimationFrame(hit3d)},{passive:true});
    addEventListener('scroll',()=>{active3d?.classList.remove('ar3d-hover-active');active3d=null},{passive:true});
  }

  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){document.querySelectorAll('.hover-fx-active').forEach(deactivate);active3d?.classList.remove('ar3d-hover-active');active3d=null}
  });

  window.AmantusiHoverObjects=Object.freeze({
    get enabled(){return !reduced},
    get finePointer(){return fine},
    get count(){return document.querySelectorAll('.hover-fx').length},
    rescan:()=>scan(document)
  });
})();