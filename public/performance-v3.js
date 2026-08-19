(() => {
  'use strict';
  const body=document.body,root=document.documentElement;
  if(!body||body.dataset.performanceV3Ready==='1')return;
  body.dataset.performanceV3Ready='1';

  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse=matchMedia('(pointer: coarse)').matches||matchMedia('(hover: none)').matches||navigator.maxTouchPoints>0;
  const saveData=Boolean(navigator.connection?.saveData);
  const memory=Number(navigator.deviceMemory||4);
  const cores=Number(navigator.hardwareConcurrency||4);
  const scheduleIdle=window.requestIdleCallback?cb=>requestIdleCallback(cb,{timeout:700}):cb=>setTimeout(()=>cb({timeRemaining:()=>8,didTimeout:true}),32);
  const isInputPending=()=>Boolean(navigator.scheduling?.isInputPending?.());

  function chooseProfile(){
    if(reduced||saveData||memory<=2||cores<=2)return 'mobile';
    if(coarse||innerWidth<820)return 'mobile';
    if(memory<=4||cores<=4||innerWidth<1180)return 'standard';
    return 'high';
  }
  let profile=chooseProfile();
  body.dataset.runtimeProfile=profile;

  function clampRegistry(reason='runtime-profile'){
    const api=window.AmantusiAnimations;
    if(!api)return;
    try{
      if(reduced||saveData)api.setTier('safe');
      else if(profile==='mobile')api.setTier(memory<=4||cores<=4?'lite':'balanced');
      else if(profile==='standard')api.setTier('balanced');
      else api.clearTier();
      document.dispatchEvent(new CustomEvent('amantusi:runtime-profile',{detail:{profile,reason}}));
    }catch(_){ }
  }
  clampRegistry('initial');
  setTimeout(()=>clampRegistry('late-init'),1200);

  let idleTimer=0,scrollTimer=0,interactionTimer=0;
  function wake(reason='input',hold=1400){
    body.classList.add('perf-awake');
    body.classList.remove('perf-idle');
    clearTimeout(idleTimer);
    idleTimer=setTimeout(()=>{body.classList.remove('perf-awake');body.classList.add('perf-idle')},hold);
    if(reason==='scroll'){
      body.classList.add('perf-scrolling');
      clearTimeout(scrollTimer);
      scrollTimer=setTimeout(()=>body.classList.remove('perf-scrolling'),130);
    }
  }
  wake('load',2200);

  addEventListener('scroll',()=>wake('scroll',900),{passive:true});
  addEventListener('pointerdown',()=>wake('pointer',1200),{passive:true});
  addEventListener('keydown',()=>wake('keyboard',1200),{passive:true});
  if(!coarse){
    let pointerQueued=false;
    addEventListener('pointermove',()=>{
      if(pointerQueued)return;
      pointerQueued=true;
      requestAnimationFrame(()=>{pointerQueued=false;wake('pointer',750)});
    },{passive:true});
  }

  document.addEventListener('visibilitychange',()=>{
    body.classList.toggle('perf-hidden',document.hidden);
    if(!document.hidden)wake('visible',1300);
  });

  const footer=document.querySelector('footer,.site-footer');
  if(footer){
    const footerObserver=new IntersectionObserver(entries=>{
      body.classList.toggle('perf-footer-visible',Boolean(entries[0]?.isIntersecting));
    },{rootMargin:'35% 0px 35% 0px',threshold:0});
    footerObserver.observe(footer);
  }

  const nearObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>entry.target.classList.toggle('perf-near',entry.isIntersecting));
  },{rootMargin:'70% 0px 70% 0px',threshold:0});
  document.querySelectorAll('main section,.hero').forEach(el=>nearObserver.observe(el));

  /* Word decoration is progressive and cooperative: it yields whenever user input is pending. */
  const targets=[...document.querySelectorAll('h1,h2,h3,.eyebrow,.nav-links a:not(.nav-cta),.button,.text-link,.trust-item,.process-step strong,.process-step h3,.contact-links a')];
  let queue=targets.slice();

  function markExistingWords(host){
    const words=[...host.querySelectorAll('.cinematic-word')];
    if(!words.length)return false;
    host.classList.add('perf-word-host');
    words.forEach((word,index)=>{word.classList.add('perf-word');word.style.setProperty('--perf-word-index',String(index))});
    host.dataset.perfWords='1';
    return true;
  }

  function splitTextNodes(host){
    if(host.dataset.perfWords==='1'||reduced)return;
    if(markExistingWords(host))return;
    const walker=document.createTreeWalker(host,NodeFilter.SHOW_TEXT,{acceptNode(node){
      if(!node.nodeValue?.trim())return NodeFilter.FILTER_REJECT;
      const parent=node.parentElement;
      if(!parent||parent.closest('script,style,input,textarea,select,.perf-word,.cinematic-word'))return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    let index=0;
    nodes.forEach(node=>{
      const frag=document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(part=>{
        if(!part)return;
        if(/^\s+$/.test(part)){frag.appendChild(document.createTextNode(part));return}
        const span=document.createElement('span');
        span.className='perf-word';
        span.style.setProperty('--perf-word-index',String(Math.min(index,24)));
        span.textContent=part;
        frag.appendChild(span);index++;
      });
      node.parentNode?.replaceChild(frag,node);
    });
    if(index){host.classList.add('perf-word-host');host.dataset.perfWords='1'}
  }

  function decorateChunk(deadline){
    let count=0;
    while(queue.length&&count<8&&(deadline.didTimeout||deadline.timeRemaining()>3)){
      if(isInputPending())break;
      const host=queue.shift();
      if(host?.isConnected)splitTextNodes(host);
      count++;
    }
    if(queue.length)scheduleIdle(decorateChunk);
  }
  scheduleIdle(decorateChunk);

  const clearWordState=host=>{
    if(!host)return;
    host.querySelectorAll('.is-word-hot,.is-word-near').forEach(el=>el.classList.remove('is-word-hot','is-word-near'));
    host.classList.remove('is-word-active');
  };

  document.addEventListener('pointerover',event=>{
    const word=event.target instanceof Element?event.target.closest('.perf-word'):null;
    if(!word||coarse)return;
    const host=word.closest('.perf-word-host');
    clearWordState(host);
    word.classList.add('is-word-hot');
    const prev=word.previousElementSibling,next=word.nextElementSibling;
    if(prev?.classList.contains('perf-word'))prev.classList.add('is-word-near');
    if(next?.classList.contains('perf-word'))next.classList.add('is-word-near');
    host?.classList.add('is-word-active');
    body.classList.add('perf-interacting');
    clearTimeout(interactionTimer);
    interactionTimer=setTimeout(()=>body.classList.remove('perf-interacting'),420);
  },{passive:true});

  document.addEventListener('pointerout',event=>{
    const word=event.target instanceof Element?event.target.closest('.perf-word'):null;
    if(!word||coarse)return;
    const host=word.closest('.perf-word-host');
    const to=event.relatedTarget instanceof Element?event.relatedTarget.closest('.perf-word-host'):null;
    if(to===host)return;
    clearWordState(host);
  },{passive:true});

  document.addEventListener('pointerdown',event=>{
    if(event.pointerType!=='touch'&&event.pointerType!=='pen')return;
    const word=event.target instanceof Element?event.target.closest('.perf-word'):null;
    if(!word)return;
    if(typeof word.animate==='function'){
      word.getAnimations?.().forEach(animation=>{if(animation.id==='perf-word-tap')animation.cancel()});
      const animation=word.animate([
        {transform:'translate3d(0,0,0) scale(1)'},
        {transform:'translate3d(0,-.13em,0) scale(1.07)',offset:.42},
        {transform:'translate3d(0,0,0) scale(1)'}
      ],{duration:360,easing:'cubic-bezier(.16,1,.3,1)',composite:'replace'});
      animation.id='perf-word-tap';
    }else{
      word.classList.add('is-word-tap');
      setTimeout(()=>word.classList.remove('is-word-tap'),440);
    }
  },{passive:true});

  document.addEventListener('focusin',event=>{
    const host=event.target instanceof Element?event.target.closest('.perf-word-host'):null;
    if(!host)return;
    host.classList.add('is-keyboard-active');
    setTimeout(()=>host.classList.remove('is-keyboard-active'),650);
  });

  /* Runtime pressure governor: downgrade quickly, recover slowly. */
  let pressure=0,lastPressureAt=0,recoveryTimer=0;
  function applyPressure(){
    lastPressureAt=performance.now();
    body.dataset.runtimePressure='high';
    const api=window.AmantusiAnimations;
    try{api?.setTier(profile==='mobile'?'lite':'balanced')}catch(_){ }
    clearTimeout(recoveryTimer);
    recoveryTimer=setTimeout(()=>{
      if(performance.now()-lastPressureAt<18000)return;
      delete body.dataset.runtimePressure;
      pressure=0;
      profile=chooseProfile();
      body.dataset.runtimeProfile=profile;
      clampRegistry('recovered');
    },22000);
  }
  try{
    if('PerformanceObserver'in window){
      const po=new PerformanceObserver(list=>{
        pressure+=list.getEntries().filter(entry=>entry.duration>55).length;
        if(pressure>=3){pressure=0;applyPressure()}
      });
      po.observe({type:'longtask',buffered:true});
    }
  }catch(_){ }

  /* Short FPS sample after startup; no permanent measurement loop. */
  function sampleFps(){
    if(document.hidden||reduced)return;
    let frames=0,start=performance.now(),last=start;
    function tick(now){
      frames++;last=now;
      if(now-start<1800){requestAnimationFrame(tick);return}
      const fps=frames/((last-start)/1000);
      if(fps<42)applyPressure();
      root.dataset.measuredFps=String(Math.round(fps));
    }
    requestAnimationFrame(tick);
  }
  setTimeout(sampleFps,1600);

  addEventListener('resize',()=>{
    const next=chooseProfile();
    if(next===profile)return;
    profile=next;body.dataset.runtimeProfile=profile;clampRegistry('resize');
  },{passive:true});
})();
