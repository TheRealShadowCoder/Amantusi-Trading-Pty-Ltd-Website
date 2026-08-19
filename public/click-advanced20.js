(() => {
  'use strict';

  const body=document.body;
  if(!body||body.dataset.advanced20Ready==='1')return;
  body.dataset.advanced20Ready='1';

  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced)return;

  const coarse=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
  const memory=navigator.deviceMemory||8;
  const cores=navigator.hardwareConcurrency||8;
  const saveData=Boolean(navigator.connection?.saveData);

  const stage=document.createElement('div');
  stage.className='a20-stage';
  stage.setAttribute('aria-hidden','true');
  body.appendChild(stage);

  const map=[
    ['.brand','liquid-metal-morph'],
    ['.hero .button-gold','energy-tunnel'],
    ['.hero .button-ghost','hologram-scan'],
    ['.orbital-card','magnetic-fragment-recall'],
    ['.capability-chip.chip-a','shock-cone'],
    ['.capability-chip.chip-b','light-pillar'],
    ['.capability-chip.chip-c','wireframe-reveal'],
    ['.capability-chip.chip-d','hex-grid'],
    ['.capability-grid .cap-card:nth-child(1)','domino-wave'],
    ['.capability-grid .cap-card:nth-child(2)','page-fold'],
    ['.capability-grid .cap-card:nth-child(3)','gravity-well'],
    ['.capability-grid .cap-card:nth-child(4)','crystal-growth'],
    ['.capability-grid .cap-card:nth-child(5)','plasma-arc'],
    ['.capability-grid .cap-card:nth-child(6)','depth-slice'],
    ['.government-panel .panel-line:nth-child(1)','radar-sweep'],
    ['.government-panel .panel-line:nth-child(2)','vortex-implosion'],
    ['.government-panel .panel-line:nth-child(3)','light-ribbon'],
    ['.government-panel .panel-line:nth-child(4)','satellite-deployment'],
    ['.process-step:nth-child(1)','prismatic-refraction'],
    ['#quote-form button[type="submit"]','constellation-draw']
  ];

  const assignments=[];
  map.forEach(([selector,effect],index)=>{
    const target=document.querySelector(selector);
    if(!target)return;
    target.classList.add('a20-target');
    target.dataset.a20Effect=effect;
    target.dataset.a20Index=String(index+1);
    assignments.push({selector,effect,target});
  });

  const active=[];
  let lastBurst=0;
  let totalBursts=0;
  let settleTimer=0;
  const rand=(min,max)=>min+Math.random()*(max-min);
  const sign=()=>Math.random()<.5?-1:1;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

  function tier(){
    if(saveData||memory<=2||cores<=2)return 'safe';
    const runtime=body.dataset.runtimeProfile;
    if(runtime==='mobile')return memory<=4?'lite':'balanced';
    if(memory>=12&&cores>=10)return 'ultra';
    if(memory>=8&&cores>=8)return 'high';
    return 'balanced';
  }

  const density={safe:.45,lite:.65,balanced:.82,high:1,ultra:1.2};
  const scaled=n=>Math.max(1,Math.round(n*(density[tier()]||.82)*(body.dataset.runtimePressure==='high'?.58:1)));

  function make(tag,cls){
    const node=document.createElement(tag);
    node.className=cls;
    return node;
  }

  function addBurst(x,y,effect,target){
    while(active.length>=(coarse?1:2))active.shift()?.remove();
    const burst=make('div','a20-burst');
    burst.dataset.effect=effect;
    burst.dataset.tier=tier();
    burst.style.setProperty('--x',`${x}px`);
    burst.style.setProperty('--y',`${y}px`);
    stage.appendChild(burst);
    active.push(burst);
    totalBursts++;
    setTimeout(()=>{
      const i=active.indexOf(burst);
      if(i>=0)active.splice(i,1);
      burst.remove();
    },1700);
    return burst;
  }

  function targetPulse(target,kind='pulse'){
    target.classList.remove('a20-pulse','a20-depth','a20-glow','a20-prism');
    const cls=kind==='depth'?'a20-depth':kind==='glow'?'a20-glow':kind==='prism'?'a20-prism':'a20-pulse';
    requestAnimationFrame(()=>target.classList.add(cls));
    setTimeout(()=>target.classList.remove(cls),760);
  }

  function particle(burst,cls='a20-particle',count=10,mode='out'){
    for(let i=0;i<scaled(count);i++){
      const p=make('i',cls);
      const a=Math.PI*2*i/Math.max(1,scaled(count))+rand(-.28,.28);
      const r=rand(44,138);
      p.style.setProperty('--dx',`${Math.cos(a)*r}px`);
      p.style.setProperty('--dy',`${Math.sin(a)*r}px`);
      p.style.setProperty('--dz',`${rand(-70,130)}px`);
      p.style.setProperty('--delay',`${rand(0,120)}ms`);
      p.style.setProperty('--mode',mode);
      burst.appendChild(p);
    }
  }

  function liquidMetal(burst,target){
    for(let i=0;i<scaled(7);i++){
      const blob=make('i','a20-metal-blob');
      blob.style.setProperty('--dx',`${rand(-86,86)}px`);
      blob.style.setProperty('--dy',`${rand(-62,62)}px`);
      blob.style.setProperty('--s',`${rand(.55,1.35)}`);
      blob.style.setProperty('--delay',`${i*28}ms`);
      burst.appendChild(blob);
    }
    targetPulse(target,'glow');
  }

  function energyTunnel(burst,target){
    for(let i=0;i<scaled(8);i++){
      const ring=make('i','a20-tunnel-ring');
      ring.style.setProperty('--i',String(i));
      ring.style.setProperty('--delay',`${i*40}ms`);
      ring.style.setProperty('--size',`${56+i*22}px`);
      burst.appendChild(ring);
    }
    particle(burst,'a20-tunnel-particle',12);
    targetPulse(target,'depth');
  }

  function hologramScan(burst,target){
    const frame=make('span','a20-holo-frame');
    for(let i=0;i<8;i++)frame.appendChild(make('i','a20-holo-line'));
    frame.appendChild(make('b','a20-holo-scan'));
    burst.appendChild(frame);
    particle(burst,'a20-holo-pixel',10);
    targetPulse(target,'prism');
  }

  function magneticRecall(burst,target){
    for(let i=0;i<scaled(14);i++){
      const f=make('i','a20-recall-fragment');
      const a=Math.PI*2*i/Math.max(1,scaled(14))+rand(-.2,.2),r=rand(55,140);
      f.style.setProperty('--dx',`${Math.cos(a)*r}px`);
      f.style.setProperty('--dy',`${Math.sin(a)*r}px`);
      f.style.setProperty('--rz',`${rand(-170,170)}deg`);
      f.style.setProperty('--delay',`${rand(0,90)}ms`);
      burst.appendChild(f);
    }
    targetPulse(target,'depth');
  }

  function shockCone(burst,target){
    for(let i=0;i<scaled(5);i++){
      const cone=make('i','a20-shock-cone');
      cone.style.setProperty('--rot',`${i*(360/Math.max(1,scaled(5)))+rand(-12,12)}deg`);
      cone.style.setProperty('--delay',`${i*45}ms`);
      burst.appendChild(cone);
    }
    targetPulse(target,'pulse');
  }

  function lightPillar(burst,target){
    burst.appendChild(make('i','a20-light-pillar'));
    burst.appendChild(make('i','a20-light-base'));
    for(let i=0;i<scaled(14);i++){
      const p=make('i','a20-rise-particle');
      p.style.setProperty('--dx',`${rand(-26,26)}px`);
      p.style.setProperty('--rise',`${rand(80,210)}px`);
      p.style.setProperty('--delay',`${rand(0,180)}ms`);
      burst.appendChild(p);
    }
    targetPulse(target,'glow');
  }

  function wireframeReveal(burst,target){
    const r=target.getBoundingClientRect();
    const frame=make('span','a20-wireframe');
    frame.style.width=`${clamp(r.width,60,260)}px`;
    frame.style.height=`${clamp(r.height,34,180)}px`;
    for(let i=0;i<4;i++)frame.appendChild(make('i','a20-wire-edge'));
    burst.appendChild(frame);
    targetPulse(target,'depth');
  }

  function hexGrid(burst,target){
    for(let i=0;i<scaled(15);i++){
      const h=make('i','a20-hex');
      const col=(i%5)-2,row=Math.floor(i/5)-1;
      h.style.setProperty('--hx',`${col*28+(row%2?14:0)}px`);
      h.style.setProperty('--hy',`${row*24}px`);
      h.style.setProperty('--delay',`${(Math.abs(col)+Math.abs(row))*55}ms`);
      burst.appendChild(h);
    }
    targetPulse(target,'glow');
  }

  function dominoWave(burst,target){
    const cards=[...document.querySelectorAll('.capability-grid .cap-card')];
    const origin=cards.indexOf(target);
    cards.forEach((card,index)=>{
      const d=Math.abs(index-origin);
      card.animate([
        {transform:'translate3d(0,0,0) rotateX(0deg)',offset:0},
        {transform:`translate3d(0,${-6+Math.min(d,3)}px,${20-Math.min(d,3)*4}px) rotateX(${2.5-Math.min(d,2)}deg)`,offset:.45},
        {transform:'translate3d(0,0,0) rotateX(0deg)',offset:1}
      ],{duration:520,delay:d*85,easing:'cubic-bezier(.16,1,.3,1)'});
    });
    particle(burst,'a20-domino-dot',8);
  }

  function pageFold(burst,target){
    const rect=target.getBoundingClientRect();
    const fold=make('span','a20-fold-plane');
    fold.style.width=`${clamp(rect.width,90,320)}px`;
    fold.style.height=`${clamp(rect.height,80,240)}px`;
    burst.appendChild(fold);
    target.animate([
      {transform:'perspective(900px) rotateY(0deg) rotateX(0deg)'},
      {transform:'perspective(900px) rotateY(-8deg) rotateX(4deg)',offset:.45},
      {transform:'perspective(900px) rotateY(0deg) rotateX(0deg)'}
    ],{duration:620,easing:'cubic-bezier(.16,1,.3,1)'});
  }

  function gravityWell(burst,target){
    for(let i=0;i<scaled(18);i++){
      const p=make('i','a20-gravity-particle');
      const a=Math.PI*2*i/Math.max(1,scaled(18))+rand(-.2,.2),r=rand(70,150);
      p.style.setProperty('--sx',`${Math.cos(a)*r}px`);
      p.style.setProperty('--sy',`${Math.sin(a)*r}px`);
      p.style.setProperty('--ex',`${Math.cos(a+rand(-.7,.7))*rand(120,200)}px`);
      p.style.setProperty('--ey',`${Math.sin(a+rand(-.7,.7))*rand(120,200)}px`);
      p.style.setProperty('--delay',`${rand(0,100)}ms`);
      burst.appendChild(p);
    }
    burst.appendChild(make('i','a20-gravity-core'));
    targetPulse(target,'depth');
  }

  function crystalGrowth(burst,target){
    for(let i=0;i<scaled(11);i++){
      const c=make('i','a20-crystal');
      c.style.setProperty('--rot',`${rand(-70,70)}deg`);
      c.style.setProperty('--dx',`${rand(-82,82)}px`);
      c.style.setProperty('--dy',`${rand(-48,48)}px`);
      c.style.setProperty('--h',`${rand(24,70)}px`);
      c.style.setProperty('--delay',`${i*28}ms`);
      burst.appendChild(c);
    }
    targetPulse(target,'prism');
  }

  function plasmaArc(burst,target){
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('class','a20-plasma');
    svg.setAttribute('viewBox','-120 -80 240 160');
    for(let n=0;n<scaled(4);n++){
      const path=document.createElementNS('http://www.w3.org/2000/svg','polyline');
      const dir=n%2?1:-1;
      const pts=[];
      for(let i=0;i<7;i++)pts.push(`${dir*(i*18+8)},${rand(-30,30)+(i%2?8:-8)}`);
      path.setAttribute('points',`0,0 ${pts.join(' ')}`);
      path.setAttribute('class','a20-plasma-path');
      path.style.setProperty('--delay',`${n*55}ms`);
      svg.appendChild(path);
    }
    burst.appendChild(svg);
    targetPulse(target,'glow');
  }

  function depthSlice(burst,target){
    const r=target.getBoundingClientRect();
    for(let i=0;i<scaled(6);i++){
      const s=make('i','a20-slice');
      s.style.width=`${clamp(r.width,100,340)}px`;
      s.style.height=`${clamp(r.height/Math.max(4,scaled(6)),18,50)}px`;
      s.style.setProperty('--dy',`${(i-scaled(6)/2)*18}px`);
      s.style.setProperty('--dz',`${(i-scaled(6)/2)*18}px`);
      s.style.setProperty('--delay',`${i*25}ms`);
      burst.appendChild(s);
    }
    targetPulse(target,'depth');
  }

  function radarSweep(burst,target){
    const radar=make('span','a20-radar');
    radar.appendChild(make('i','a20-radar-sweep'));
    for(let i=0;i<scaled(7);i++){
      const dot=make('b','a20-radar-dot');
      dot.style.setProperty('--rx',`${rand(-65,65)}px`);
      dot.style.setProperty('--ry',`${rand(-65,65)}px`);
      dot.style.setProperty('--delay',`${rand(120,650)}ms`);
      radar.appendChild(dot);
    }
    burst.appendChild(radar);
    targetPulse(target,'glow');
  }

  function vortexImplosion(burst,target){
    for(let i=0;i<scaled(18);i++){
      const p=make('i','a20-vortex-particle');
      const a=360*i/Math.max(1,scaled(18));
      p.style.setProperty('--a',`${a}deg`);
      p.style.setProperty('--r',`${rand(70,145)}px`);
      p.style.setProperty('--delay',`${i*18}ms`);
      burst.appendChild(p);
    }
    burst.appendChild(make('i','a20-vortex-core'));
    targetPulse(target,'depth');
  }

  function lightRibbon(burst,target){
    for(let i=0;i<scaled(4);i++){
      const ribbon=make('i','a20-ribbon');
      ribbon.style.setProperty('--rot',`${i*38-55}deg`);
      ribbon.style.setProperty('--delay',`${i*60}ms`);
      ribbon.style.setProperty('--scale',`${1+i*.16}`);
      burst.appendChild(ribbon);
    }
    targetPulse(target,'glow');
  }

  function satellites(burst,target){
    burst.appendChild(make('i','a20-satellite-core'));
    for(let i=0;i<scaled(8);i++){
      const sat=make('i','a20-satellite');
      sat.style.setProperty('--start',`${i*(360/Math.max(1,scaled(8)))}deg`);
      sat.style.setProperty('--end',`${i*(360/Math.max(1,scaled(8)))+300}deg`);
      sat.style.setProperty('--radius',`${rand(60,125)}px`);
      sat.style.setProperty('--delay',`${i*32}ms`);
      burst.appendChild(sat);
    }
    targetPulse(target,'depth');
  }

  function prismatic(burst,target){
    for(let i=0;i<3;i++){
      const prism=make('i',`a20-prism-layer p${i+1}`);
      prism.style.setProperty('--offset',`${(i-1)*10}px`);
      burst.appendChild(prism);
    }
    particle(burst,'a20-prism-spark',9);
    targetPulse(target,'prism');
  }

  function constellation(burst,target){
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('class','a20-constellation');
    svg.setAttribute('viewBox','-110 -80 220 160');
    const points=[];
    for(let i=0;i<scaled(8);i++)points.push([rand(-90,90),rand(-58,58)]);
    for(let i=1;i<points.length;i++){
      const line=document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1',points[i-1][0]);line.setAttribute('y1',points[i-1][1]);
      line.setAttribute('x2',points[i][0]);line.setAttribute('y2',points[i][1]);
      line.setAttribute('class','a20-constellation-line');
      line.style.setProperty('--delay',`${i*70}ms`);
      svg.appendChild(line);
    }
    points.forEach(([x,y],i)=>{
      const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('cx',x);c.setAttribute('cy',y);c.setAttribute('r','3');
      c.setAttribute('class','a20-constellation-node');
      c.style.setProperty('--delay',`${i*65}ms`);
      svg.appendChild(c);
    });
    burst.appendChild(svg);
    targetPulse(target,'glow');
  }

  const renderers={
    'liquid-metal-morph':liquidMetal,
    'energy-tunnel':energyTunnel,
    'hologram-scan':hologramScan,
    'magnetic-fragment-recall':magneticRecall,
    'shock-cone':shockCone,
    'light-pillar':lightPillar,
    'wireframe-reveal':wireframeReveal,
    'hex-grid':hexGrid,
    'domino-wave':dominoWave,
    'page-fold':pageFold,
    'gravity-well':gravityWell,
    'crystal-growth':crystalGrowth,
    'plasma-arc':plasmaArc,
    'depth-slice':depthSlice,
    'radar-sweep':radarSweep,
    'vortex-implosion':vortexImplosion,
    'light-ribbon':lightRibbon,
    'satellite-deployment':satellites,
    'prismatic-refraction':prismatic,
    'constellation-draw':constellation
  };

  function trigger(target,event){
    const effect=target.dataset.a20Effect;
    const render=renderers[effect];
    if(!render)return;

    if(body.classList.contains('perf-scrolling')||body.classList.contains('perf-wheel-active')){
      clearTimeout(settleTimer);
      settleTimer=setTimeout(()=>target.isConnected&&trigger(target,event),145);
      return;
    }

    const now=performance.now();
    if(now-lastBurst<(coarse?125:76))return;
    lastBurst=now;

    let x=event?.clientX,y=event?.clientY;
    if(!Number.isFinite(x)||!Number.isFinite(y)||x<=0||y<=0){
      const r=target.getBoundingClientRect();
      x=r.left+r.width/2;y=r.top+r.height/2;
    }
    const burst=addBurst(x,y,effect,target);
    render(burst,target,event);
    try{window.Amantusi3DOverlay?.pulse?.(effect==='gravity-well'||effect==='vortex-implosion'?'ambient':'quality')}catch(_){}
    document.dispatchEvent(new CustomEvent('amantusi:advanced20',{detail:{effect,index:Number(target.dataset.a20Index),tier:tier()}}));
  }

  document.addEventListener('click',event=>{
    if(!(event.target instanceof Element))return;
    const target=event.target.closest('.a20-target');
    if(!target||target.closest('.admin-shell,.admin-app,[data-admin-root]'))return;
    trigger(target,event);
  },{passive:true});

  const clear=()=>active.splice(0).forEach(node=>node.remove());
  addEventListener('wheel',clear,{passive:true});
  addEventListener('touchmove',clear,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clear()});

  window.AmantusiAdvanced20=Object.freeze({
    get ready(){return true},
    get count(){return assignments.length},
    get active(){return active.length},
    get bursts(){return totalBursts},
    get tier(){return tier()},
    assignments:Object.freeze(assignments.map(({selector,effect})=>Object.freeze({selector,effect}))),
    effects:Object.freeze(Object.keys(renderers)),
    trigger(target){if(target instanceof Element&&target.classList.contains('a20-target'))trigger(target,null)}
  });
})();