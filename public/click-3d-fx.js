(() => {
  'use strict';

  const body=document.body;
  if(!body||body.dataset.click3dReady==='1')return;
  body.dataset.click3dReady='1';

  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
  const saveData=Boolean(navigator.connection?.saveData);
  const memory=navigator.deviceMemory||8;
  const cores=navigator.hardwareConcurrency||8;
  if(reduced)return;

  const stage=document.createElement('div');
  stage.className='c3d-stage';
  stage.setAttribute('aria-hidden','true');
  body.appendChild(stage);

  const targetSelector=[
    '.button','.nav-cta','.text-link','.brand','.logo-plaque','.cap-card','.process-step','.panel-line','.capability-chip','.trust-item','.quote-contact-card','.contact-links a',
    '.menu-card','.brochure-card','.profile-card','.supplier-card','.product-card','.service-card','.feature-card','.stat-card','.timeline-item','.category-card','.catering-card','.gallery-card','.media-card',
    '.lux-step','.lux-upload-zone','.lux-upload-button','.lux-success-dismiss','.lux-field'
  ].join(',');

  const profiles={
    safe:{particles:6,shards:2,nodes:2,orbits:2,lines:0,rings:2,cube:false},
    lite:{particles:10,shards:4,nodes:3,orbits:3,lines:0,rings:2,cube:false},
    balanced:{particles:17,shards:7,nodes:5,orbits:4,lines:3,rings:3,cube:true},
    high:{particles:25,shards:10,nodes:7,orbits:5,lines:4,rings:3,cube:true},
    ultra:{particles:34,shards:13,nodes:9,orbits:7,lines:5,rings:3,cube:true}
  };

  const getTier=()=>{
    if(saveData||memory<=2||cores<=2)return 'safe';
    const runtime=body.dataset.runtimeProfile;
    const animation=window.AmantusiAnimations?.tier||body.dataset.animationTier;
    if(coarse&&runtime==='mobile')return memory<=4?'lite':'balanced';
    if(animation&&profiles[animation])return animation;
    if(memory>=12&&cores>=10)return 'ultra';
    if(memory>=8&&cores>=8)return 'high';
    return 'balanced';
  };

  const active=[];
  let burstCount=0;
  let lastBurst=0;
  const rand=(min,max)=>min+Math.random()*(max-min);
  const sign=()=>Math.random()<.5?-1:1;

  function effectFor(target){
    if(target.matches('.button,.nav-cta,.text-link,.lux-success-dismiss'))return 'portal';
    if(target.matches('.capability-chip,.trust-item,.brand,.logo-plaque'))return 'orbit';
    if(target.matches('.panel-line,.process-step,.cap-card,.menu-card,.brochure-card,.profile-card,.supplier-card,.product-card,.service-card,.feature-card,.stat-card,.timeline-item,.category-card,.catering-card,.gallery-card,.media-card'))return 'constellation';
    if(target.matches('.lux-field,.lux-upload-zone,.lux-upload-button,.quote-contact-card'))return 'glass';
    return 'pulse';
  }

  function addRing(burst,index){
    const ring=document.createElement('i');
    ring.className=`c3d-ring r${Math.min(3,index+1)}`;
    ring.style.setProperty('--r',`${70+index*36}px`);
    ring.style.setProperty('--delay',`${index*35}ms`);
    burst.appendChild(ring);
  }
  function addShard(burst,index,total){
    const a=(Math.PI*2*index/Math.max(1,total))+rand(-.3,.3);
    const distance=rand(48,126);
    const shard=document.createElement('i');
    shard.className='c3d-shard';
    shard.style.setProperty('--dx',`${Math.cos(a)*distance}px`);
    shard.style.setProperty('--dy',`${Math.sin(a)*distance}px`);
    shard.style.setProperty('--dz',`${rand(-70,90)}px`);
    shard.style.setProperty('--rx',`${rand(100,420)*sign()}deg`);
    shard.style.setProperty('--ry',`${rand(120,460)*sign()}deg`);
    shard.style.setProperty('--rz',`${rand(-180,180)}deg`);
    shard.style.setProperty('--delay',`${rand(0,90)}ms`);
    burst.appendChild(shard);
  }
  function addParticle(burst,index,total,effect){
    const a=(Math.PI*2*index/Math.max(1,total))+rand(-.22,.22);
    const distance=rand(38,effect==='portal'?150:118);
    const particle=document.createElement('i');
    particle.className='c3d-particle';
    particle.style.setProperty('--dx',`${Math.cos(a)*distance}px`);
    particle.style.setProperty('--dy',`${Math.sin(a)*distance}px`);
    particle.style.setProperty('--dz',`${rand(-35,100)}px`);
    particle.style.setProperty('--delay',`${rand(0,75)}ms`);
    particle.style.setProperty('--particle-color',index%3===0?'#91c9d5':index%2===0?'#f0dca0':'#d2b568');
    const size=rand(2.2,5.5);
    particle.style.width=`${size}px`;particle.style.height=`${size}px`;particle.style.margin=`${-size/2}px`;
    burst.appendChild(particle);
  }
  function addNode(burst,index,total){
    const a=(Math.PI*2*index/Math.max(1,total))+rand(-.18,.18);
    const distance=rand(42,106);
    const node=document.createElement('i');
    node.className='c3d-node';
    node.style.setProperty('--dx',`${Math.cos(a)*distance}px`);
    node.style.setProperty('--dy',`${Math.sin(a)*distance}px`);
    node.style.setProperty('--dz',`${rand(10,80)}px`);
    node.style.setProperty('--delay',`${index*20}ms`);
    burst.appendChild(node);
  }
  function addOrbit(burst,index,total){
    const orb=document.createElement('i');
    orb.className='c3d-orbit';
    orb.style.setProperty('--a',`${(360/Math.max(1,total))*index+rand(-14,14)}deg`);
    orb.style.setProperty('--radius',`${rand(54,116)}px`);
    orb.style.setProperty('--delay',`${index*18}ms`);
    burst.appendChild(orb);
  }
  function addLine(burst,index,total){
    const line=document.createElement('i');
    line.className='c3d-line';
    line.style.setProperty('--len',`${rand(58,122)}px`);
    line.style.setProperty('--a',`${(360/Math.max(1,total))*index+rand(-18,18)}deg`);
    line.style.setProperty('--delay',`${index*28}ms`);
    burst.appendChild(line);
  }
  function addCube(burst,effect){
    const cube=document.createElement('span');
    cube.className='c3d-cube';
    cube.style.setProperty('--cx',`${effect==='constellation'?rand(-54,54):rand(-32,32)}px`);
    cube.style.setProperty('--cy',`${rand(-52,30)}px`);
    cube.innerHTML='<i></i><i></i><i></i><i></i><i></i><i></i>';
    burst.appendChild(cube);
  }

  function clearOldest(max){
    while(active.length>=max){
      const old=active.shift();
      old?.remove();
    }
  }

  function burstAt(x,y,target,effect=effectFor(target)){
    if(body.classList.contains('perf-scrolling')||body.classList.contains('perf-wheel-active'))return;
    const now=performance.now();
    if(now-lastBurst<coarse?110:70)return;
    lastBurst=now;

    const tier=getTier();
    const base=profiles[tier]||profiles.balanced;
    const pressured=body.dataset.runtimePressure==='high';
    const factor=pressured?.58:1;
    const config={
      particles:Math.max(4,Math.round(base.particles*factor)),
      shards:Math.max(1,Math.round(base.shards*factor)),
      nodes:Math.max(1,Math.round(base.nodes*factor)),
      orbits:Math.max(2,Math.round(base.orbits*factor)),
      lines:Math.round(base.lines*factor),
      rings:base.rings,
      cube:base.cube&&!pressured&&!coarse
    };

    clearOldest(coarse?2:3);
    const burst=document.createElement('div');
    burst.className='c3d-burst';
    burst.dataset.effect=effect;
    burst.dataset.tier=tier;
    burst.style.setProperty('--c3d-x',`${x}px`);
    burst.style.setProperty('--c3d-y',`${y}px`);
    burst.dataset.burstId=String(++burstCount);

    const wave=document.createElement('i');wave.className='c3d-wave';burst.appendChild(wave);
    const flare=document.createElement('i');flare.className='c3d-flare';flare.style.setProperty('--flare-a',`${rand(-28,28)}deg`);burst.appendChild(flare);
    const core=document.createElement('i');core.className='c3d-core';burst.appendChild(core);
    for(let i=0;i<config.rings;i++)addRing(burst,i);
    if(config.cube)addCube(burst,effect);
    for(let i=0;i<config.shards;i++)addShard(burst,i,config.shards);
    for(let i=0;i<config.particles;i++)addParticle(burst,i,config.particles,effect);
    for(let i=0;i<config.nodes;i++)addNode(burst,i,config.nodes);
    for(let i=0;i<config.orbits;i++)addOrbit(burst,i,config.orbits);
    for(let i=0;i<config.lines;i++)addLine(burst,i,config.lines);

    stage.appendChild(burst);active.push(burst);
    target.classList.remove('c3d-target-pulse');
    requestAnimationFrame(()=>target.classList.add('c3d-target-pulse'));
    setTimeout(()=>target.classList.remove('c3d-target-pulse'),500);
    setTimeout(()=>{
      const index=active.indexOf(burst);if(index>=0)active.splice(index,1);
      burst.remove();
    },1350);

    const pulseKind=effect==='portal'?'cta':effect==='glass'?'quality':'ambient';
    try{window.Amantusi3DOverlay?.pulse?.(pulseKind)}catch(_){}
    document.dispatchEvent(new CustomEvent('amantusi:click3d',{detail:{effect,tier}}));
  }

  document.addEventListener('click',event=>{
    if(!(event.target instanceof Element))return;
    const target=event.target.closest(targetSelector);
    if(!target||target.closest('.admin-shell,.admin-app,[data-admin-root]'))return;
    if(target.matches('input,textarea,select,option'))return;
    const x=Number.isFinite(event.clientX)&&event.clientX>0?event.clientX:(target.getBoundingClientRect().left+target.getBoundingClientRect().width/2);
    const y=Number.isFinite(event.clientY)&&event.clientY>0?event.clientY:(target.getBoundingClientRect().top+target.getBoundingClientRect().height/2);
    burstAt(x,y,target);
  },{passive:true});

  const stopForScroll=()=>{
    active.splice(0).forEach(burst=>burst.remove());
  };
  addEventListener('wheel',stopForScroll,{passive:true});
  addEventListener('touchmove',stopForScroll,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopForScroll()});

  window.AmantusiClick3D=Object.freeze({
    trigger(target,x,y,effect){if(target instanceof Element)burstAt(x,y,target,effect)},
    get enabled(){return !reduced},
    get tier(){return getTier()},
    get active(){return active.length},
    get bursts(){return burstCount}
  });
})();
