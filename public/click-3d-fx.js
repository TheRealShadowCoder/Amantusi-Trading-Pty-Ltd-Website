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
    '.button','.nav-cta','.text-link','.brand','.logo-plaque','.orbital-card','.hero-art',
    '.cap-card','.process-step','.panel-line','.government-panel','.capability-chip','.trust-item','.quote-contact-card','.contact-links a',
    '.menu-card','.brochure-card','.profile-card','.supplier-card','.product-card','.service-card','.feature-card','.stat-card','.timeline-item','.category-card','.catering-card','.gallery-card','.media-card',
    '.lux-step','.lux-upload-zone','.lux-upload-button','.lux-success-dismiss','.lux-field'
  ].join(',');

  const profiles={
    safe:{particles:6,shards:2,nodes:2,orbits:2,trails:2,rings:2,swarm:2,cube:false},
    lite:{particles:10,shards:4,nodes:3,orbits:3,trails:3,rings:2,swarm:3,cube:false},
    balanced:{particles:17,shards:7,nodes:5,orbits:4,trails:5,rings:3,swarm:5,cube:true},
    high:{particles:25,shards:10,nodes:7,orbits:5,trails:7,rings:3,swarm:8,cube:true},
    ultra:{particles:34,shards:13,nodes:9,orbits:7,trails:9,rings:4,swarm:12,cube:true}
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
  let burstCount=0,lastBurst=0,settleTimer=0;
  const rand=(min,max)=>min+Math.random()*(max-min);
  const sign=()=>Math.random()<.5?-1:1;

  function effectFor(target){
    const inHero=Boolean(target.closest('.hero'));
    const inPremium=Boolean(target.closest('.hero,.government,.quote-section,.contact-strip'));
    if(inHero&&target.matches('.hero-art,.orbital-card,.logo-plaque,.capability-chip'))return 'mini-swarm';
    if(inHero&&target.matches('.button,.nav-cta'))return 'ring-swarm';
    if(target.matches('.button,.nav-cta,.lux-success-dismiss'))return 'ring-burst';
    if(target.matches('.cap-card,.menu-card,.brochure-card,.profile-card,.supplier-card,.product-card,.service-card,.feature-card,.stat-card,.timeline-item,.category-card,.catering-card,.gallery-card,.media-card'))return 'glass-gold';
    if(target.matches('.capability-chip,.process-step,.trust-item'))return 'orbital-node';
    if(target.matches('.government-panel,.panel-line,.quote-contact-card,.lux-field'))return 'ripple-depth';
    if(target.matches('.text-link,.brand,.contact-links a,.lux-step,.lux-upload-zone,.lux-upload-button'))return 'spark-wave';
    if(inPremium)return 'mini-swarm';
    return 'ring-burst';
  }

  function addRing(burst,index,wide=false){
    const ring=document.createElement('i');
    ring.className=`c3d-ring r${Math.min(4,index+1)}`;
    ring.style.setProperty('--r',`${(wide?86:66)+index*(wide?44:34)}px`);
    ring.style.setProperty('--delay',`${index*34}ms`);
    ring.style.setProperty('--tilt',`${index%2?68:74}deg`);
    burst.appendChild(ring);
  }
  function addShard(burst,index,total,gold=false){
    const a=Math.PI*2*index/Math.max(1,total)+rand(-.3,.3),distance=rand(50,132);
    const shard=document.createElement('i');
    shard.className=`c3d-shard${gold?' is-gold':''}`;
    shard.style.setProperty('--dx',`${Math.cos(a)*distance}px`);
    shard.style.setProperty('--dy',`${Math.sin(a)*distance}px`);
    shard.style.setProperty('--dz',`${rand(-80,110)}px`);
    shard.style.setProperty('--rx',`${rand(100,460)*sign()}deg`);
    shard.style.setProperty('--ry',`${rand(120,520)*sign()}deg`);
    shard.style.setProperty('--rz',`${rand(-180,180)}deg`);
    shard.style.setProperty('--delay',`${rand(0,100)}ms`);
    burst.appendChild(shard);
  }
  function addParticle(burst,index,total,goldBias=false){
    const a=Math.PI*2*index/Math.max(1,total)+rand(-.2,.2),distance=rand(42,142);
    const p=document.createElement('i');
    p.className='c3d-particle';
    p.style.setProperty('--dx',`${Math.cos(a)*distance}px`);
    p.style.setProperty('--dy',`${Math.sin(a)*distance}px`);
    p.style.setProperty('--dz',`${rand(-45,120)}px`);
    p.style.setProperty('--delay',`${rand(0,85)}ms`);
    p.style.setProperty('--particle-color',goldBias?(index%3?'#d2b568':'#fff0b5'):(index%3===0?'#91c9d5':index%2===0?'#f0dca0':'#d2b568'));
    const size=rand(2.2,5.8);p.style.width=`${size}px`;p.style.height=`${size}px`;p.style.margin=`${-size/2}px`;
    burst.appendChild(p);
  }
  function addNode(burst,index,total,orbit=false){
    const a=Math.PI*2*index/Math.max(1,total)+rand(-.16,.16),distance=orbit?rand(70,126):rand(44,108);
    const node=document.createElement('i');
    node.className=`c3d-node${orbit?' is-orbital':''}`;
    node.style.setProperty('--dx',`${Math.cos(a)*distance}px`);
    node.style.setProperty('--dy',`${Math.sin(a)*distance}px`);
    node.style.setProperty('--dz',`${rand(15,90)}px`);
    node.style.setProperty('--delay',`${index*22}ms`);
    burst.appendChild(node);
  }
  function addOrbit(burst,index,total){
    const orb=document.createElement('i');
    const start=360/Math.max(1,total)*index+rand(-12,12);
    orb.className='c3d-orbit';
    orb.style.setProperty('--a-start',`${start}deg`);
    orb.style.setProperty('--a-end',`${start+290}deg`);
    orb.style.setProperty('--radius',`${rand(58,124)}px`);
    orb.style.setProperty('--delay',`${index*20}ms`);
    burst.appendChild(orb);
  }
  function addRipple(burst,index){
    const ripple=document.createElement('i');
    ripple.className='c3d-ripple';
    ripple.style.setProperty('--delay',`${index*70}ms`);
    ripple.style.setProperty('--scale',`${7+index*2.2}`);
    burst.appendChild(ripple);
  }
  function addTrail(burst,index,total){
    const a=360/Math.max(1,total)*index+rand(-22,22);
    const trail=document.createElement('i');
    trail.className='c3d-trail';
    trail.style.setProperty('--a',`${a}deg`);
    trail.style.setProperty('--len',`${rand(76,166)}px`);
    trail.style.setProperty('--delay',`${index*25}ms`);
    burst.appendChild(trail);
  }
  function addGlowWave(burst,index=0){
    const wave=document.createElement('i');
    wave.className='c3d-glow-wave';
    wave.style.setProperty('--delay',`${index*65}ms`);
    burst.appendChild(wave);
  }
  function addMiniObject(burst,index,total){
    const object=document.createElement('span');
    const types=['cube','diamond','tetra','ringlet'];
    const type=types[index%types.length];
    const a=Math.PI*2*index/Math.max(1,total)+rand(-.25,.25),distance=rand(58,154);
    object.className=`c3d-mini-object is-${type}`;
    object.style.setProperty('--dx',`${Math.cos(a)*distance}px`);
    object.style.setProperty('--dy',`${Math.sin(a)*distance}px`);
    object.style.setProperty('--dz',`${rand(45,150)}px`);
    object.style.setProperty('--rx',`${rand(120,420)*sign()}deg`);
    object.style.setProperty('--ry',`${rand(180,540)*sign()}deg`);
    object.style.setProperty('--delay',`${index*28}ms`);
    object.innerHTML=type==='cube'?'<i></i><i></i><i></i><i></i><i></i><i></i>':'<i></i>';
    burst.appendChild(object);
  }

  function clearOldest(max){while(active.length>=max){active.shift()?.remove();}}

  function burstAt(x,y,target,effect=effectFor(target)){
    if(body.classList.contains('perf-scrolling')||body.classList.contains('perf-wheel-active')){
      clearTimeout(settleTimer);
      settleTimer=setTimeout(()=>{if(target.isConnected)burstAt(x,y,target,effect);},140);
      return;
    }
    const now=performance.now();
    if(now-lastBurst<(coarse?115:72))return;
    lastBurst=now;

    const tier=getTier(),base=profiles[tier]||profiles.balanced;
    const pressured=body.dataset.runtimePressure==='high';
    const factor=pressured?.56:1;
    const count=(n,min=1)=>Math.max(min,Math.round(n*factor));
    const config={particles:count(base.particles,4),shards:count(base.shards),nodes:count(base.nodes),orbits:count(base.orbits,2),trails:count(base.trails,2),rings:base.rings,swarm:count(base.swarm,2),cube:base.cube&&!pressured&&!coarse};

    clearOldest(coarse?2:3);
    const burst=document.createElement('div');
    burst.className='c3d-burst';
    burst.dataset.effect=effect;burst.dataset.tier=tier;
    burst.style.setProperty('--c3d-x',`${x}px`);burst.style.setProperty('--c3d-y',`${y}px`);
    burst.dataset.burstId=String(++burstCount);

    const core=document.createElement('i');core.className='c3d-core';burst.appendChild(core);
    const flare=document.createElement('i');flare.className='c3d-flare';flare.style.setProperty('--flare-a',`${rand(-30,30)}deg`);burst.appendChild(flare);

    if(effect==='ring-burst'||effect==='ring-swarm'){
      for(let i=0;i<config.rings;i++)addRing(burst,i,true);
      for(let i=0;i<Math.ceil(config.particles*.55);i++)addParticle(burst,i,Math.ceil(config.particles*.55),true);
      addGlowWave(burst);
      for(let i=0;i<Math.ceil(config.trails*.55);i++)addTrail(burst,i,Math.ceil(config.trails*.55));
    }
    if(effect==='glass-gold'){
      for(let i=0;i<config.shards;i++)addShard(burst,i,config.shards,i%2===0);
      for(let i=0;i<config.particles;i++)addParticle(burst,i,config.particles,true);
      addRipple(burst,0);addGlowWave(burst);
    }
    if(effect==='orbital-node'){
      for(let i=0;i<config.nodes;i++)addNode(burst,i,config.nodes,true);
      for(let i=0;i<config.orbits;i++)addOrbit(burst,i,config.orbits);
      for(let i=0;i<Math.max(2,config.rings-1);i++)addRing(burst,i);
      addGlowWave(burst);
    }
    if(effect==='ripple-depth'){
      addRipple(burst,0);addRipple(burst,1);addRipple(burst,2);
      for(let i=0;i<Math.ceil(config.nodes*.55);i++)addNode(burst,i,Math.ceil(config.nodes*.55));
      addGlowWave(burst,1);
    }
    if(effect==='spark-wave'){
      for(let i=0;i<config.trails;i++)addTrail(burst,i,config.trails);
      for(let i=0;i<Math.ceil(config.particles*.72);i++)addParticle(burst,i,Math.ceil(config.particles*.72),true);
      addGlowWave(burst,0);addGlowWave(burst,1);
    }
    if(effect==='mini-swarm'||effect==='ring-swarm'){
      for(let i=0;i<config.swarm;i++)addMiniObject(burst,i,config.swarm);
      for(let i=0;i<Math.ceil(config.nodes*.7);i++)addNode(burst,i,Math.ceil(config.nodes*.7),true);
      if(effect==='mini-swarm'){for(let i=0;i<Math.max(2,config.rings-1);i++)addRing(burst,i,true);addGlowWave(burst);}
    }

    stage.appendChild(burst);active.push(burst);
    target.classList.remove('c3d-target-pulse','c3d-target-depth','c3d-target-glow');
    const targetClass=effect==='ripple-depth'?'c3d-target-depth':effect==='spark-wave'?'c3d-target-glow':'c3d-target-pulse';
    requestAnimationFrame(()=>target.classList.add(targetClass));
    setTimeout(()=>target.classList.remove(targetClass),620);
    setTimeout(()=>{const i=active.indexOf(burst);if(i>=0)active.splice(i,1);burst.remove();},1450);

    const pulseKind=(effect==='ring-burst'||effect==='ring-swarm')?'cta':effect==='glass-gold'?'quality':effect==='orbital-node'?'network':'ambient';
    try{window.Amantusi3DOverlay?.pulse?.(pulseKind)}catch(_){}
    document.dispatchEvent(new CustomEvent('amantusi:click3d',{detail:{effect,tier}}));
  }

  document.addEventListener('click',event=>{
    if(!(event.target instanceof Element))return;
    const target=event.target.closest(targetSelector);
    if(!target||target.closest('.admin-shell,.admin-app,[data-admin-root]')||target.matches('input,textarea,select,option'))return;
    let x=event.clientX,y=event.clientY;
    if(!Number.isFinite(x)||!Number.isFinite(y)||x<=0||y<=0){const r=target.getBoundingClientRect();x=r.left+r.width/2;y=r.top+r.height/2;}
    burstAt(x,y,target);
  },{passive:true});

  const stopForScroll=()=>active.splice(0).forEach(b=>b.remove());
  addEventListener('wheel',stopForScroll,{passive:true});
  addEventListener('touchmove',stopForScroll,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopForScroll()});

  window.AmantusiClick3D=Object.freeze({
    trigger(target,x,y,effect){if(target instanceof Element)burstAt(x,y,target,effect)},
    effectFor(target){return target instanceof Element?effectFor(target):null},
    get enabled(){return !reduced},get tier(){return getTier()},get active(){return active.length},get bursts(){return burstCount},
    families:Object.freeze(['ring-burst','glass-gold','orbital-node','ripple-depth','spark-wave','mini-swarm'])
  });
})();