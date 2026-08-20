(() => {
  'use strict';
  const root=document.documentElement,body=document.body;
  if(!body||body.dataset.runtimeGate==='1')return;
  body.dataset.runtimeGate='1';

  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse=matchMedia('(pointer: coarse)').matches||matchMedia('(hover: none)').matches||navigator.maxTouchPoints>0;
  const saveData=Boolean(navigator.connection?.saveData);
  const memory=Number(navigator.deviceMemory||4);
  const cores=Number(navigator.hardwareConcurrency||4);
  const mobile=coarse||innerWidth<860;
  const low=saveData||memory<=2||cores<=2;
  const standard=memory<=4||cores<=4||mobile;
  const tier=low?'lite':standard?'standard':'high';
  body.dataset.runtimeTier=tier;

  const loaded=new Set();
  function css(href){
    if(loaded.has(href))return;
    loaded.add(href);
    const link=document.createElement('link');
    link.rel='stylesheet';link.href=href;link.media='print';
    link.onload=()=>{link.media='all'};
    document.head.appendChild(link);
  }
  function script(src,{module=false}={}){
    if(loaded.has(src))return Promise.resolve();
    loaded.add(src);
    return new Promise(resolve=>{
      const el=document.createElement('script');
      if(module)el.type='module';
      el.src=src;el.async=true;
      el.onload=resolve;el.onerror=resolve;
      document.body.appendChild(el);
    });
  }
  function idle(fn,timeout=1400){
    if('requestIdleCallback' in window)requestIdleCallback(fn,{timeout});
    else setTimeout(fn,Math.min(timeout,700));
  }
  function depth(){
    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    return Math.min(1,scrollY/max);
  }

  let lastFrames=[];
  let pressureTimer=0;
  function samplePressure(){
    if(reduced||document.hidden)return;
    let last=performance.now(),frames=0;
    const started=last;
    const run=now=>{
      frames++;
      if(now-started<900)return requestAnimationFrame(run);
      const fps=frames/((now-started)/1000);
      lastFrames.push(fps);if(lastFrames.length>3)lastFrames.shift();
      const avg=lastFrames.reduce((a,b)=>a+b,0)/lastFrames.length;
      body.dataset.runtimePressure=avg<38?'high':'normal';
    };
    requestAnimationFrame(run);
  }

  function loadCoreRuntime(){
    if(reduced||saveData)return;
    css('/performance-v3.css');
    script('/performance-v3.js');
  }

  function loadCinematic(){
    if(reduced||tier==='lite')return;
    css('/cinematic.css');css('/motion-plus.css');
    script('/cinematic.js');script('/motion-plus.js');
  }

  function loadExperience(){
    if(reduced||saveData||tier==='lite')return;
    if(mobile&&tier!=='high')return;
    script('/experience.js',{module:true});
  }

  function loadDeepLayers(){
    if(reduced||tier==='lite')return;
    css('/animation-registry.css');
    script('/animation-registry.js');
    if(tier==='high'&&!mobile){
      css('/animation-3d-overlay.css');css('/hover-objects.css');css('/luxury-ui.css');
      script('/animation-3d-overlay.js');script('/hover-objects.js');script('/luxury-ui.js');
    }
  }

  function loadInteractionFx(){
    if(tier!=='high'||mobile||reduced||saveData)return;
    css('/click-3d-fx.css');
    script('/click-3d-fx.js');
    idle(()=>{css('/click-advanced20.css');script('/click-advanced20.js')},1800);
  }

  function loadTouchEnhancements(){
    if(!mobile||tier==='lite'||reduced)return;
    css('/touch-60.css');
    script('/touch-60-guard.js').then(()=>script('/touch-60.js'));
  }

  let cinematicLoaded=false,experienceLoaded=false,deepLoaded=false,touchLoaded=false;
  function onProgress(){
    const y=scrollY;
    const d=depth();
    if(!cinematicLoaded&&y>Math.min(220,innerHeight*.22)){cinematicLoaded=true;loadCinematic()}
    if(!experienceLoaded&&y>Math.min(520,innerHeight*.55)){experienceLoaded=true;loadExperience()}
    if(!deepLoaded&&(d>.22||y>innerHeight*1.5)){deepLoaded=true;loadDeepLayers()}
    if(!touchLoaded&&mobile&&y>innerHeight*.9){touchLoaded=true;loadTouchEnhancements()}
  }

  let scrollRaf=0;
  addEventListener('scroll',()=>{
    if(scrollRaf)return;
    scrollRaf=requestAnimationFrame(()=>{scrollRaf=0;onProgress()});
  },{passive:true});

  addEventListener('pointerdown',loadInteractionFx,{once:true,passive:true});
  addEventListener('load',()=>{
    idle(loadCoreRuntime,900);
    idle(samplePressure,1600);
    onProgress();
  },{once:true});

  document.addEventListener('visibilitychange',()=>{
    clearTimeout(pressureTimer);
    if(!document.hidden)pressureTimer=setTimeout(samplePressure,600);
  });

  /* Sample first-party analytics instead of writing a D1 row for every page view. */
  idle(()=>{
    try{
      let bucket=localStorage.getItem('amantusi-analytics-bucket');
      if(bucket===null){bucket=String(Math.floor(Math.random()*20));localStorage.setItem('amantusi-analytics-bucket',bucket)}
      if(Number(bucket)<2)script('/analytics.js');
    }catch(_){/* Storage blocked: skip non-essential analytics. */}
  },2200);

  root.classList.add('runtime-gated');
})();
