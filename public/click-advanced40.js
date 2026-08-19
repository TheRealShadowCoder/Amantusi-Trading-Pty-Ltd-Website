(() => {
  'use strict';

  const body=document.body;
  if(!body||body.dataset.advanced40Ready==='1')return;
  body.dataset.advanced40Ready='1';

  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced)return;

  const coarse=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
  const memory=navigator.deviceMemory||8;
  const cores=navigator.hardwareConcurrency||8;
  const saveData=Boolean(navigator.connection?.saveData);

  const stage=document.createElement('div');
  stage.className='a40-stage';
  stage.setAttribute('aria-hidden','true');
  body.appendChild(stage);

  const map=[
    ['.nav-links a:nth-child(1)','comet-crown'],
    ['.nav-links a:nth-child(2)','gyroscope-bloom'],
    ['.nav-links a:nth-child(3)','coin-helix'],
    ['.nav-links a:nth-child(4)','bubble-prism'],
    ['.nav-links a:nth-child(5)','prism-fan'],
    ['.hero .eyebrow','helix-sparks'],
    ['.hero-title','cube-flock'],
    ['.hero-title em','diamond-rain'],
    ['.hero-lead','torus-knot'],
    ['.hero-meta span:nth-child(1)','poly-starburst'],
    ['.hero-meta span:nth-child(2)','neon-arches'],
    ['.hero-meta span:nth-child(3)','ribbon-spiral'],
    ['#about .section-intro','portal-doors'],
    ['#about .section-intro .eyebrow','mosaic-tiles'],
    ['#about .section-intro h2','gear-array'],
    ['#about .prose','capsule-orbit'],
    ['#about .prose .large-copy','pyramid-flare'],
    ['#about .prose p:nth-of-type(2)','sphere-cluster'],
    ['#capabilities .section-heading','meteor-shower'],
    ['#capabilities .section-heading .eyebrow','beacon-lattice'],
    ['#capabilities .section-heading h2','tessellation-wave'],
    ['#capabilities .section-heading > p','polygon-bloom'],
    ['.government .eyebrow','cube-lattice'],
    ['.government h2','pearl-orbit'],
    ['.government-copy','wave-discs'],
    ['#process .section-heading','crystal-flower'],
    ['#process .section-heading .eyebrow','arc-bridge'],
    ['#process .section-heading h2','clockwork-rings'],
    ['#process .section-heading > p','data-cards'],
    ['.process-progress','quantum-dots'],
    ['.quote-copy','folding-planes'],
    ['.quote-copy .eyebrow','halo-stack'],
    ['.quote-copy h2','spiral-stair'],
    ['.quote-copy > p','orbiting-bars'],
    ['.contact-strip .eyebrow','prism-tunnel'],
    ['.contact-strip h2','luminous-splines'],
    ['.contact-grid > div:first-child','satellite-cross'],
    ['footer','particle-fountain'],
    ['.footer-brand','voxel-explosion'],
    ['.footer-legal','aurora-fan']
  ];

  const recipes={
    'comet-crown':{shape:'comet',motion:'radial',count:9,pulse:'glow'},
    'gyroscope-bloom':{shape:'gyro',motion:'orbit',count:6,pulse:'depth'},
    'coin-helix':{shape:'coin',motion:'spiral',count:10,pulse:'gold'},
    'bubble-prism':{shape:'bubble',motion:'rise',count:12,pulse:'prism'},
    'prism-fan':{shape:'prism',motion:'fan',count:9,pulse:'prism'},
    'helix-sparks':{shape:'helix',motion:'helix',count:14,pulse:'glow'},
    'cube-flock':{shape:'cube',motion:'swarm',count:8,pulse:'depth'},
    'diamond-rain':{shape:'diamond',motion:'fall',count:12,pulse:'prism'},
    'torus-knot':{shape:'torus',motion:'orbit',count:7,pulse:'depth'},
    'poly-starburst':{shape:'star',motion:'radial',count:11,pulse:'gold'},
    'neon-arches':{shape:'arch',motion:'rise',count:8,pulse:'glow'},
    'ribbon-spiral':{shape:'ribbon',motion:'spiral',count:7,pulse:'gold'},
    'portal-doors':{shape:'door',motion:'split',count:6,pulse:'depth'},
    'mosaic-tiles':{shape:'tile',motion:'mosaic',count:16,pulse:'prism'},
    'gear-array':{shape:'gear',motion:'orbit',count:7,pulse:'gold'},
    'capsule-orbit':{shape:'capsule',motion:'orbit',count:10,pulse:'glow'},
    'pyramid-flare':{shape:'pyramid',motion:'radial',count:9,pulse:'prism'},
    'sphere-cluster':{shape:'sphere',motion:'cluster',count:13,pulse:'depth'},
    'meteor-shower':{shape:'meteor',motion:'diagonal',count:12,pulse:'glow'},
    'beacon-lattice':{shape:'beacon',motion:'rise',count:8,pulse:'gold'},
    'tessellation-wave':{shape:'tess',motion:'wave',count:14,pulse:'prism'},
    'polygon-bloom':{shape:'polygon',motion:'bloom',count:11,pulse:'gold'},
    'cube-lattice':{shape:'lattice',motion:'grid',count:12,pulse:'depth'},
    'pearl-orbit':{shape:'pearl',motion:'orbit',count:12,pulse:'glow'},
    'wave-discs':{shape:'disc',motion:'wave',count:10,pulse:'depth'},
    'crystal-flower':{shape:'flower',motion:'bloom',count:12,pulse:'prism'},
    'arc-bridge':{shape:'bridge',motion:'fan',count:8,pulse:'glow'},
    'clockwork-rings':{shape:'clockring',motion:'orbit',count:7,pulse:'gold'},
    'data-cards':{shape:'datacard',motion:'stack',count:8,pulse:'depth'},
    'quantum-dots':{shape:'qdot',motion:'quantum',count:18,pulse:'glow'},
    'folding-planes':{shape:'plane',motion:'fold',count:9,pulse:'depth'},
    'halo-stack':{shape:'halo',motion:'stack',count:8,pulse:'gold'},
    'spiral-stair':{shape:'stair',motion:'spiral',count:12,pulse:'depth'},
    'orbiting-bars':{shape:'orbitbar',motion:'orbit',count:10,pulse:'glow'},
    'prism-tunnel':{shape:'tunnelprism',motion:'tunnel',count:9,pulse:'prism'},
    'luminous-splines':{shape:'spline',motion:'wave',count:9,pulse:'glow'},
    'satellite-cross':{shape:'satellite',motion:'orbit',count:8,pulse:'depth'},
    'particle-fountain':{shape:'fountain',motion:'fountain',count:18,pulse:'gold'},
    'voxel-explosion':{shape:'voxel',motion:'radial',count:16,pulse:'depth'},
    'aurora-fan':{shape:'aurora',motion:'fan',count:9,pulse:'prism'}
  };

  const assignments=[];
  for(const [selector,effect] of map){
    const target=document.querySelector(selector);
    if(!target)continue;
    target.classList.add('a40-target');
    target.dataset.a40Effect=effect;
    assignments.push({selector,effect,target});
  }

  const active=[];
  let totalBursts=0,lastBurst=0,settleTimer=0;
  const rand=(min,max)=>min+Math.random()*(max-min);
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

  function tier(){
    if(saveData||memory<=2||cores<=2)return 'safe';
    if(body.dataset.runtimeProfile==='mobile')return memory<=4?'lite':'balanced';
    if(memory>=12&&cores>=10)return 'ultra';
    if(memory>=8&&cores>=8)return 'high';
    return 'balanced';
  }
  const density={safe:.42,lite:.6,balanced:.78,high:1,ultra:1.18};
  const scaled=n=>Math.max(2,Math.round(n*(density[tier()]||.78)*(body.dataset.runtimePressure==='high'?.56:1)));

  function make(tag,cls){const el=document.createElement(tag);el.className=cls;return el;}

  function motionVars(el,motion,index,total){
    const angle=Math.PI*2*index/Math.max(1,total)+rand(-.25,.25);
    const radius=rand(48,148);
    el.style.setProperty('--i',String(index));
    el.style.setProperty('--delay',`${rand(0,110)}ms`);
    el.style.setProperty('--a',`${angle}rad`);
    el.style.setProperty('--deg',`${angle*180/Math.PI}deg`);
    el.style.setProperty('--dx',`${Math.cos(angle)*radius}px`);
    el.style.setProperty('--dy',`${Math.sin(angle)*radius}px`);
    el.style.setProperty('--dz',`${rand(-70,145)}px`);
    el.style.setProperty('--r',`${radius}px`);
    el.style.setProperty('--sx',`${Math.cos(angle)*rand(80,170)}px`);
    el.style.setProperty('--sy',`${Math.sin(angle)*rand(80,170)}px`);
    el.style.setProperty('--rise',`${rand(90,220)}px`);
    el.style.setProperty('--fall',`${rand(80,190)}px`);
    el.style.setProperty('--rx',`${rand(-360,360)}deg`);
    el.style.setProperty('--ry',`${rand(-420,420)}deg`);
    el.style.setProperty('--rz',`${rand(-300,300)}deg`);
    el.style.setProperty('--scale',`${rand(.65,1.35)}`);
    el.dataset.motion=motion;
  }

  function addCore(burst,effect){
    const core=make('i','a40-core');
    core.dataset.effect=effect;
    burst.appendChild(core);
    const halo=make('i','a40-core-halo');
    burst.appendChild(halo);
  }

  function renderBurst(x,y,effect,target){
    const recipe=recipes[effect];
    if(!recipe)return;
    while(active.length>=(coarse?1:2))active.shift()?.remove();

    const burst=make('div','a40-burst');
    burst.dataset.effect=effect;
    burst.dataset.tier=tier();
    burst.style.setProperty('--x',`${x}px`);
    burst.style.setProperty('--y',`${y}px`);
    stage.appendChild(burst);
    active.push(burst);
    totalBursts++;

    addCore(burst,effect);
    const count=scaled(recipe.count);
    for(let i=0;i<count;i++){
      const obj=make('i',`a40-object a40-${recipe.shape} a40-m-${recipe.motion}`);
      motionVars(obj,recipe.motion,i,count);
      burst.appendChild(obj);
    }

    target.classList.remove('a40-pulse','a40-depth','a40-glow','a40-prism','a40-gold');
    const pulseClass=recipe.pulse==='depth'?'a40-depth':recipe.pulse==='glow'?'a40-glow':recipe.pulse==='prism'?'a40-prism':recipe.pulse==='gold'?'a40-gold':'a40-pulse';
    requestAnimationFrame(()=>target.classList.add(pulseClass));
    setTimeout(()=>target.classList.remove(pulseClass),760);

    try{window.Amantusi3DOverlay?.pulse?.(recipe.pulse==='gold'?'cta':recipe.pulse==='glow'?'network':'ambient')}catch(_){}
    document.dispatchEvent(new CustomEvent('amantusi:advanced40',{detail:{effect,tier:tier()}}));

    setTimeout(()=>{
      const index=active.indexOf(burst);
      if(index>=0)active.splice(index,1);
      burst.remove();
    },1680);
  }

  function trigger(target,x,y){
    const effect=target?.dataset?.a40Effect;
    if(!effect)return;
    if(body.classList.contains('perf-scrolling')||body.classList.contains('perf-wheel-active')){
      clearTimeout(settleTimer);
      settleTimer=setTimeout(()=>{if(target.isConnected)renderBurst(x,y,effect,target);},140);
      return;
    }
    const now=performance.now();
    if(now-lastBurst<(coarse?115:72))return;
    lastBurst=now;
    renderBurst(x,y,effect,target);
  }

  document.addEventListener('click',event=>{
    if(!(event.target instanceof Element))return;
    const target=event.target.closest('[data-a40-effect]');
    if(!target||target.closest('.admin-shell,.admin-app,[data-admin-root]'))return;
    let x=event.clientX,y=event.clientY;
    if(!Number.isFinite(x)||!Number.isFinite(y)||x<=0||y<=0){
      const rect=target.getBoundingClientRect();
      x=rect.left+rect.width/2;y=rect.top+rect.height/2;
    }
    trigger(target,x,y);
  },{passive:true});

  const clear=()=>active.splice(0).forEach(el=>el.remove());
  addEventListener('wheel',clear,{passive:true});
  addEventListener('touchmove',clear,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});

  window.AmantusiAdvanced40=Object.freeze({
    ready:true,
    get count(){return assignments.length},
    get effects(){return assignments.map(item=>item.effect)},
    get objects(){return Object.values(recipes).map(item=>item.shape)},
    get tier(){return tier()},
    get bursts(){return totalBursts},
    trigger(target,x,y){if(target instanceof Element)trigger(target,x,y)}
  });
})();
