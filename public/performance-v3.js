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
  const scheduleIdle=window.requestIdleCallback?cb=>requestIdleCallback(cb,{timeout:900}):cb=>setTimeout(()=>cb({timeRemaining:()=>6,didTimeout:true}),48);
  const isInputPending=()=>Boolean(navigator.scheduling?.isInputPending?.());

  function chooseProfile(){
    if(reduced||saveData||memory<=2||cores<=2)return 'mobile';
    if(coarse||innerWidth<900)return 'mobile';
    if(memory<=6||cores<=6||innerWidth<1280)return 'standard';
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
      else api.setTier('high');
      document.dispatchEvent(new CustomEvent('amantusi:runtime-profile',{detail:{profile,reason}}));
    }catch(_){ }
  }
  clampRegistry('initial');
  setTimeout(()=>clampRegistry('late-init'),1000);

  let idleTimer=0,scrollTimer=0,interactionTimer=0,lastPointerWake=0;
  function enterIdle(){
    body.classList.remove('perf-awake');
    body.classList.add('perf-idle');
  }
  function wake(reason='input',hold=900){
    const wasIdle=body.classList.contains('perf-idle');
    if(wasIdle){body.classList.add('perf-awake');body.classList.remove('perf-idle')}
    clearTimeout(idleTimer);
    idleTimer=setTimeout(enterIdle,hold);
    if(reason==='scroll'){
      if(!body.classList.contains('perf-scrolling'))body.classList.add('perf-scrolling');
      clearTimeout(scrollTimer);
      scrollTimer=setTimeout(()=>body.classList.remove('perf-scrolling'),105);
    }
  }
  wake('load',1500);

  addEventListener('scroll',()=>wake('scroll',500),{passive:true});
  addEventListener('pointerdown',()=>wake('pointer',800),{passive:true});
  addEventListener('keydown',()=>wake('keyboard',900),{passive:true});
  if(!coarse){
    addEventListener('pointermove',()=>{
      const now=performance.now();
      if(now-lastPointerWake<120)return;
      lastPointerWake=now;
      wake('pointer',520);
    },{passive:true});
  }

  document.addEventListener('visibilitychange',()=>{
    body.classList.toggle('perf-hidden',document.hidden);
    if(!document.hidden)wake('visible',900);
  });

  const footer=document.querySelector('footer,.site-footer');
  if(footer){
    const footerObserver=new IntersectionObserver(entries=>{
      body.classList.toggle('perf-footer-visible',Boolean(entries[0]?.isIntersecting));
    },{rootMargin:'20% 0px 20% 0px',threshold:0});
    footerObserver.observe(footer);
  }

  const nearObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>entry.target.classList.toggle('perf-near',entry.isIntersecting));
  },{rootMargin:'35% 0px 35% 0px',threshold:0});
  document.querySelectorAll('main section,.hero').forEach(el=>nearObserver.observe(el));

  /* Only high-value copy becomes word-interactive. This keeps the semantic text identical
     while dramatically reducing added DOM nodes versus splitting every card/body label. */
  const wordSelector=coarse
    ? 'h1,h2,.button,.nav-cta,.text-link'
    : 'h1,h2,.eyebrow,.nav-links a:not(.nav-cta),.button,.text-link,.contact-links a';
  const targets=[...document.querySelectorAll(wordSelector)];
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
        span.style.setProperty('--perf-word-index',String(Math.min(index,20)));
        span.textContent=part;
        frag.appendChild(span);index++;
      });
      node.parentNode?.replaceChild(frag,node);
    });
    if(index){host.classList.add('perf-word-host');host.dataset.perfWords='1'}
  }

  function decorateChunk(deadline){
    let count=0;
    while(queue.length&&count<4&&(deadline.didTimeout||deadline.timeRemaining()>4)){
      if(isInputPending())break;
      const host=queue.shift();
      if(host?.isConnected)splitTextNodes(host);
      count++;
    }
    if(queue.length)scheduleIdle(decorateChunk);
  }
  scheduleIdle(decorateChunk);

  let hotWord=null,nearPrev=null,nearNext=null,hotHost=null;
  function clearHot(){
    hotWord?.classList.remove('is-word-hot');
    nearPrev?.classList.remove('is-word-near');
    nearNext?.classList.remove('is-word-near');
    hotHost?.classList.remove('is-word-active');
    hotWord=nearPrev=nearNext=hotHost=null;
  }

  document.addEventListener('pointerover',event=>{
    const word=event.target instanceof Element?event.target.closest('.perf-word'):null;
    if(!word||coarse||word===hotWord)return;
    clearHot();
    hotWord=word;
    hotHost=word.closest('.perf-word-host');
    nearPrev=word.previousElementSibling?.classList.contains('perf-word')?word.previousElementSibling:null;
    nearNext=word.nextElementSibling?.classList.contains('perf-word')?word.nextElementSibling:null;
    hotWord.classList.add('is-word-hot');
    nearPrev?.classList.add('is-word-near');
    nearNext?.classList.add('is-word-near');
    hotHost?.classList.add('is-word-active');
    if(!body.classList.contains('perf-interacting'))body.classList.add('perf-interacting');
    clearTimeout(interactionTimer);
    interactionTimer=setTimeout(()=>body.classList.remove('perf-interacting'),300);
  },{passive:true});

  document.addEventListener('pointerout',event=>{
    if(coarse||!hotHost)return;
    const to=event.relatedTarget instanceof Element?event.relatedTarget.closest('.perf-word-host'):null;
    if(to===hotHost)return;
    clearHot();
  },{passive:true});

  document.addEventListener('pointerdown',event=>{
    if(event.pointerType!=='touch'&&event.pointerType!=='pen')return;
    const word=event.target instanceof Element?event.target.closest('.perf-word'):null;
    if(!word)return;
    if(typeof word.animate==='function'){
      word.getAnimations?.().forEach(animation=>{if(animation.id==='perf-word-tap')animation.cancel()});
      const animation=word.animate([
        {transform:'translate3d(0,0,0) scale(1)'},
        {transform:'translate3d(0,-.1em,0) scale(1.055)',offset:.42},
        {transform:'translate3d(0,0,0) scale(1)'}
      ],{duration:300,easing:'cubic-bezier(.16,1,.3,1)',composite:'replace'});
      animation.id='perf-word-tap';
    }
  },{passive:true});

  document.addEventListener('focusin',event=>{
    const host=event.target instanceof Element?event.target.closest('.perf-word-host'):null;
    if(!host)return;
    host.classList.add('is-keyboard-active');
    setTimeout(()=>host.classList.remove('is-keyboard-active'),500);
  });

  /* On standard hardware, suppress nonessential section-level pointermove handlers before
     they reach target elements. Links/buttons/cards/nav remain fully interactive. */
  if(!coarse){
    document.addEventListener('pointermove',event=>{
      if(profile==='high'||body.classList.contains('perf-interacting'))return;
      const target=event.target instanceof Element?event.target:null;
      if(!target||target.closest('a,button,input,textarea,select,.cap-card,.menu-card,.brochure-card,.government-panel,.quote-form,.nav-links'))return;
      if(target.closest('main section'))event.stopPropagation();
    },{capture:true,passive:true});
  }

  /* Runtime pressure governor: downgrade quickly, recover slowly. */
  let pressure=0,lastPressureAt=0,recoveryTimer=0;
  function applyPressure(){
    lastPressureAt=performance.now();
    body.dataset.runtimePressure='high';
    const api=window.AmantusiAnimations;
    try{api?.setTier(profile==='mobile'?'lite':'balanced')}catch(_){ }
    clearTimeout(recoveryTimer);
    recoveryTimer=setTimeout(()=>{
      if(performance.now()-lastPressureAt<16000)return;
      delete body.dataset.runtimePressure;
      pressure=0;
      profile=chooseProfile();
      body.dataset.runtimeProfile=profile;
      clampRegistry('recovered');
    },18000);
  }
  try{
    if('PerformanceObserver'in window){
      const po=new PerformanceObserver(list=>{
        pressure+=list.getEntries().filter(entry=>entry.duration>50).length;
        if(pressure>=2){pressure=0;applyPressure()}
      });
      po.observe({type:'longtask',buffered:true});
    }
  }catch(_){ }

  /* One short FPS sample only; no permanent benchmark loop. */
  function sampleFps(){
    if(document.hidden||reduced)return;
    let frames=0,start=performance.now(),last=start;
    function tick(now){
      frames++;last=now;
      if(now-start<1400){requestAnimationFrame(tick);return}
      const fps=frames/((last-start)/1000);
      const floor=profile==='mobile'?38:profile==='standard'?46:52;
      if(fps<floor)applyPressure();
      root.dataset.measuredFps=String(Math.round(fps));
    }
    requestAnimationFrame(tick);
  }
  setTimeout(sampleFps,1300);

  let resizeTimer=0;
  addEventListener('resize',()=>{
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(()=>{
      const next=chooseProfile();
      if(next===profile)return;
      profile=next;body.dataset.runtimeProfile=profile;clampRegistry('resize');
    },180);
  },{passive:true});
})();