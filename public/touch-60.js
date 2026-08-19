(() => {
  'use strict';

  const body=document.body;
  if(!body||body.dataset.touch60Ready==='1')return;
  const touchCapable=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!touchCapable||reduced)return;
  body.dataset.touch60Ready='1';

  const stage=document.createElement('div');
  stage.className='t60-stage';
  stage.setAttribute('aria-hidden','true');
  body.appendChild(stage);

  const memory=navigator.deviceMemory||8;
  const cores=navigator.hardwareConcurrency||8;
  const saveData=Boolean(navigator.connection?.saveData);
  const targetSelector=[
    'a','button','.brand','.hero-title','.hero-lead','.hero-meta span','.eyebrow','.section-heading','.section-intro','.prose',
    '.cap-card','.capability-chip','.government-panel','.panel-line','.process-step','.process-progress','.quote-copy','.quote-contact-card',
    '.lux-step','.lux-upload-zone','.lux-upload-button','.lux-field','.contact-strip h2','.contact-grid>div','.footer-brand','.footer-legal','footer'
  ].join(',');

  const effects=[
    {id:1,name:'touch-ripple-sphere',group:'tap',shape:'sphere',motion:'expand',count:8,pulse:'pulse'},
    {id:2,name:'finger-pressure-bloom',group:'long',shape:'bloom',motion:'expand',count:10,pulse:'glow'},
    {id:3,name:'gold-dust-fingerprint',group:'tap',shape:'fingerprint',motion:'expand',count:9,pulse:'gold'},
    {id:4,name:'liquid-glass-touch',group:'tap',shape:'glass',motion:'rotate',count:8,pulse:'prism'},
    {id:5,name:'elastic-card-press',group:'tap',shape:'card',motion:'compress',count:6,pulse:'depth'},
    {id:6,name:'button-depression',group:'tap',shape:'button',motion:'compress',count:7,pulse:'depth'},
    {id:7,name:'magnetic-finger-attraction',group:'tap',shape:'magnet',motion:'inward',count:8,pulse:'glow'},
    {id:8,name:'finger-orbit-satellites',group:'drag',shape:'satellite',motion:'orbit',count:8,pulse:'depth'},
    {id:9,name:'swipe-comet-trail',group:'swipe',shape:'comet',motion:'swipe',count:9,pulse:'glow'},
    {id:10,name:'gold-ribbon-swipe',group:'drag',shape:'ribbon',motion:'drag',count:7,pulse:'gold'},
    {id:11,name:'neon-gesture-trail',group:'drag',shape:'trail',motion:'drag',count:8,pulse:'glow'},
    {id:12,name:'particle-ink-trail',group:'drag',shape:'ink',motion:'drag',count:10,pulse:'depth'},
    {id:13,name:'glass-bead-trail',group:'drag',shape:'bead',motion:'drag',count:10,pulse:'prism'},
    {id:14,name:'firefly-trail',group:'drag',shape:'firefly',motion:'drag',count:12,pulse:'glow'},
    {id:15,name:'prismatic-touch-trail',group:'drag',shape:'prism',motion:'drag',count:9,pulse:'prism'},
    {id:16,name:'touch-shockwave',group:'tap',shape:'wave',motion:'expand',count:6,pulse:'depth'},
    {id:17,name:'double-tap-portal',group:'double',shape:'portal',motion:'rotate',count:7,pulse:'glow'},
    {id:18,name:'double-tap-star-explosion',group:'double',shape:'star',motion:'expand',count:11,pulse:'gold'},
    {id:19,name:'double-tap-diamond-bloom',group:'double',shape:'crystal',motion:'expand',count:10,pulse:'prism'},
    {id:20,name:'long-press-energy-core',group:'long',shape:'core',motion:'compress',count:8,pulse:'glow'},
    {id:21,name:'long-press-charging-rings',group:'long',shape:'ring',motion:'orbit',count:8,pulse:'gold'},
    {id:22,name:'long-press-crystal-growth',group:'long',shape:'crystal',motion:'rise',count:10,pulse:'prism'},
    {id:23,name:'long-press-hologram-scanner',group:'long',shape:'scanner',motion:'rise',count:8,pulse:'prism'},
    {id:24,name:'long-press-information-halo',group:'long',shape:'halo',motion:'orbit',count:8,pulse:'glow'},
    {id:25,name:'release-explosion',group:'release',shape:'sphere',motion:'expand',count:12,pulse:'gold'},
    {id:26,name:'rubber-band-release',group:'release',shape:'ribbon',motion:'flick',count:8,pulse:'depth'},
    {id:27,name:'slingshot-particle-release',group:'release',shape:'comet',motion:'flick',count:10,pulse:'glow'},
    {id:28,name:'swipe-card-tilt',group:'swipe',shape:'card',motion:'swipe',count:7,pulse:'depth'},
    {id:29,name:'swipe-depth-layers',group:'swipe',shape:'layer',motion:'swipe',count:9,pulse:'depth'},
    {id:30,name:'swipe-glass-shutter',group:'swipe',shape:'glass',motion:'swipe',count:8,pulse:'prism'},
    {id:31,name:'swipe-cube-rotation',group:'swipe',shape:'cube',motion:'rotate',count:8,pulse:'depth'},
    {id:32,name:'swipe-page-curl',group:'swipe',shape:'page',motion:'rotate',count:7,pulse:'depth'},
    {id:33,name:'swipe-prism-slice',group:'swipe',shape:'prism',motion:'swipe',count:9,pulse:'prism'},
    {id:34,name:'swipe-particle-wind',group:'swipe',shape:'wind',motion:'swipe',count:12,pulse:'glow'},
    {id:35,name:'fast-flick-meteors',group:'swipe',shape:'meteor',motion:'flick',count:10,pulse:'gold'},
    {id:36,name:'vertical-swipe-fountain',group:'swipe',shape:'sphere',motion:'fountain',count:12,pulse:'glow'},
    {id:37,name:'downward-swipe-rain',group:'swipe',shape:'rain',motion:'rain',count:13,pulse:'prism'},
    {id:38,name:'horizontal-wave-sweep',group:'swipe',shape:'wave',motion:'wave',count:9,pulse:'depth'},
    {id:39,name:'pinch-gravity-well',group:'pinch',shape:'sphere',motion:'inward',count:13,pulse:'depth'},
    {id:40,name:'pinch-explosion',group:'pinch',shape:'sphere',motion:'expand',count:13,pulse:'gold'},
    {id:41,name:'pinch-orbital-compression',group:'pinch',shape:'torus',motion:'compress',count:9,pulse:'depth'},
    {id:42,name:'pinch-constellation-expansion',group:'pinch',shape:'constellation',motion:'expand',count:12,pulse:'glow'},
    {id:43,name:'pinch-crystal-fracture',group:'pinch',shape:'shard',motion:'expand',count:11,pulse:'prism'},
    {id:44,name:'two-finger-gyroscope',group:'rotate',shape:'gyro',motion:'rotate',count:8,pulse:'depth'},
    {id:45,name:'two-finger-galaxy',group:'rotate',shape:'galaxy',motion:'orbit',count:13,pulse:'glow'},
    {id:46,name:'two-finger-torus-rotation',group:'rotate',shape:'torus',motion:'rotate',count:8,pulse:'gold'},
    {id:47,name:'touch-drag-orb',group:'drag',shape:'orb',motion:'drag',count:7,pulse:'depth'},
    {id:48,name:'touch-lens-distortion',group:'drag',shape:'lens',motion:'drag',count:6,pulse:'prism'},
    {id:49,name:'touch-spotlight',group:'drag',shape:'spotlight',motion:'drag',count:6,pulse:'glow'},
    {id:50,name:'touch-shadow-displacement',group:'drag',shape:'sphere',motion:'drag',count:6,pulse:'depth'},
    {id:51,name:'proximity-tilt',group:'drag',shape:'card',motion:'drag',count:6,pulse:'depth'},
    {id:52,name:'edge-swipe-aurora',group:'edge',shape:'aurora',motion:'edge',count:8,pulse:'prism'},
    {id:53,name:'edge-swipe-particles',group:'edge',shape:'sphere',motion:'edge',count:12,pulse:'glow'},
    {id:54,name:'scroll-momentum-sparks',group:'scroll',shape:'firefly',motion:'flick',count:10,pulse:'glow'},
    {id:55,name:'scroll-stop-section-pulse',group:'scroll',shape:'wave',motion:'expand',count:6,pulse:'depth'},
    {id:56,name:'section-arrival-constellation',group:'scroll',shape:'constellation',motion:'expand',count:10,pulse:'glow'},
    {id:57,name:'tap-unfold-geometry',group:'tap',shape:'geometry',motion:'rotate',count:9,pulse:'depth'},
    {id:58,name:'tap-micro-robot-assembly',group:'tap',shape:'robot',motion:'inward',count:10,pulse:'gold'},
    {id:59,name:'tap-floating-island',group:'tap',shape:'island',motion:'rise',count:8,pulse:'depth'},
    {id:60,name:'touch-quantum-burst',group:'tap',shape:'quantum',motion:'teleport',count:12,pulse:'glow'}
  ];

  const groups={};
  for(const effect of effects)(groups[effect.group]||(groups[effect.group]=[])).push(effect);
  const targets=[...document.querySelectorAll(targetSelector)].filter(el=>!el.closest('.admin-shell,.admin-app,[data-admin-root]'));
  targets.forEach((el,index)=>{el.classList.add('t60-target');el.dataset.t60Slot=String(index);});

  function tier(){
    if(saveData||memory<=2||cores<=2)return 'safe';
    if(memory>=12&&cores>=10)return 'ultra';
    if(memory>=8&&cores>=8)return 'high';
    if(memory>=4&&cores>=4)return 'balanced';
    return 'lite';
  }
  const density={safe:.36,lite:.5,balanced:.68,high:.9,ultra:1.08};
  const scaled=n=>Math.max(2,Math.round(n*(density[tier()]||.68)*(body.dataset.runtimePressure==='high'?.55:1)));
  const rand=(a,b)=>a+Math.random()*(b-a);
  const active=[];
  const pointers=new Map();
  const counters={};
  let lastTapTime=0,lastTapX=0,lastTapY=0,pendingTap=0,longTimer=0,lastTrail=0,lastMulti=0,lastTouchTime=0,scrollTimer=0;
  let primary=null,multiBase=null;

  function suppressDesktopClick(){
    body.dataset.touch60SuppressClick='1';
    clearTimeout(suppressDesktopClick.timer);
    suppressDesktopClick.timer=setTimeout(()=>delete body.dataset.touch60SuppressClick,650);
  }

  function pick(group,target){
    const pool=groups[group]||groups.tap;
    const slot=Number(target?.dataset?.t60Slot||0);
    const count=(counters[group]=(counters[group]||0)+1);
    return pool[(slot+count-1)%pool.length];
  }

  function targetPulse(target,pulse){
    if(!target)return;
    target.classList.remove('t60-target-pulse','t60-target-depth','t60-target-prism','t60-target-glow');
    const cls=pulse==='depth'?'t60-target-depth':pulse==='prism'?'t60-target-prism':pulse==='glow'||pulse==='gold'?'t60-target-glow':'t60-target-pulse';
    requestAnimationFrame(()=>target.classList.add(cls));
    setTimeout(()=>target.classList.remove(cls),760);
  }

  function applySpecial(effect,target,dx=0,dy=0){
    if(!target||typeof target.animate!=='function')return;
    const n=effect.name;
    if(n==='elastic-card-press'||n==='button-depression')target.animate([{transform:'translateZ(0) scale(1)'},{transform:'translateZ(-18px) scale(.965)',offset:.42},{transform:'translateZ(0) scale(1)'}],{duration:520,easing:'cubic-bezier(.16,1,.3,1)'});
    if(n==='rubber-band-release')target.animate([{transform:`translate3d(${dx*.16}px,${dy*.16}px,0) scale(.99)`},{transform:`translate3d(${-dx*.08}px,${-dy*.08}px,12px) scale(1.018)`,offset:.42},{transform:'translate3d(0,0,0) scale(1)'}],{duration:620,easing:'cubic-bezier(.16,1,.3,1)'});
    if(n==='swipe-card-tilt'||n==='swipe-cube-rotation'||n==='swipe-page-curl')target.animate([{transform:'perspective(900px) rotateX(0) rotateY(0)'},{transform:`perspective(900px) rotateX(${Math.max(-8,Math.min(8,-dy*.05))}deg) rotateY(${Math.max(-12,Math.min(12,dx*.05))}deg) translateZ(18px)`,offset:.45},{transform:'perspective(900px) rotateX(0) rotateY(0)'}],{duration:620,easing:'cubic-bezier(.16,1,.3,1)'});
  }

  function render(effect,x,y,target,vector={dx:0,dy:0}){
    if(!effect)return;
    while(active.length>=(tier()==='safe'?1:2))active.shift()?.remove();
    const burst=document.createElement('div');
    burst.className='t60-burst';
    burst.dataset.effect=effect.name;
    burst.dataset.tier=tier();
    burst.style.setProperty('--x',`${x}px`);burst.style.setProperty('--y',`${y}px`);
    const core=document.createElement('i');core.className='t60-core';burst.appendChild(core);
    const halo=document.createElement('i');halo.className='t60-halo';burst.appendChild(halo);
    const count=scaled(effect.count);
    for(let i=0;i<count;i++){
      const obj=document.createElement('i');
      obj.className=`t60-object t60-shape-${effect.shape} t60-m-${effect.motion}`;
      const angle=Math.PI*2*i/Math.max(1,count)+rand(-.3,.3),radius=rand(42,138);
      const vx=vector.dx||Math.cos(angle)*radius,vy=vector.dy||Math.sin(angle)*radius;
      obj.style.setProperty('--dx',`${vx*(.55+Math.random()*.8)}px`);
      obj.style.setProperty('--dy',`${vy*(.55+Math.random()*.8)}px`);
      obj.style.setProperty('--dz',`${rand(-70,145)}px`);
      obj.style.setProperty('--r',`${radius}px`);
      obj.style.setProperty('--rise',`${rand(80,210)}px`);
      obj.style.setProperty('--fall',`${rand(80,190)}px`);
      obj.style.setProperty('--rx',`${rand(-420,420)}deg`);obj.style.setProperty('--ry',`${rand(-420,420)}deg`);obj.style.setProperty('--rz',`${rand(-300,300)}deg`);
      obj.style.setProperty('--delay',`${rand(0,100)}ms`);
      burst.appendChild(obj);
    }
    stage.appendChild(burst);active.push(burst);
    targetPulse(target,effect.pulse);applySpecial(effect,target,vector.dx,vector.dy);
    document.dispatchEvent(new CustomEvent('amantusi:touch60',{detail:{effect:effect.name,group:effect.group,tier:tier()}}));
    try{window.Amantusi3DOverlay?.pulse?.(effect.pulse==='gold'?'cta':effect.pulse==='glow'?'network':'ambient')}catch(_){}
    setTimeout(()=>{const i=active.indexOf(burst);if(i>=0)active.splice(i,1);burst.remove();},1450);
  }

  function nearestTarget(node){return node instanceof Element?(node.closest(targetSelector)||body):body;}
  function pointDistance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
  function angleOf(a,b){return Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI}
  function centerOf(a,b){return{x:(a.x+b.x)/2,y:(a.y+b.y)/2}}

  function fire(group,target,x,y,vector){render(pick(group,target),x,y,target,vector)}

  document.addEventListener('pointerdown',event=>{
    if(event.pointerType!=='touch')return;
    suppressDesktopClick();lastTouchTime=performance.now();
    const target=nearestTarget(event.target);
    const p={id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,time:performance.now(),target,moved:false,longFired:false};
    pointers.set(event.pointerId,p);
    target.classList.add('t60-pressing');
    if(pointers.size===1){
      primary=p;
      clearTimeout(longTimer);
      longTimer=setTimeout(()=>{
        const live=pointers.get(p.id);
        if(!live||live.moved||pointers.size!==1)return;
        live.longFired=true;
        fire('long',live.target,live.x,live.y,{dx:0,dy:-40});
      },520);
    }else if(pointers.size===2){
      clearTimeout(longTimer);
      const [a,b]=[...pointers.values()];
      multiBase={distance:pointDistance(a,b),angle:angleOf(a,b),center:centerOf(a,b),target:a.target};
    }
  },{passive:true});

  document.addEventListener('pointermove',event=>{
    if(event.pointerType!=='touch')return;
    const p=pointers.get(event.pointerId);if(!p)return;
    p.x=event.clientX;p.y=event.clientY;
    if(Math.hypot(p.x-p.startX,p.y-p.startY)>8){p.moved=true;clearTimeout(longTimer)}
    if(pointers.size===2){
      const [a,b]=[...pointers.values()];if(!multiBase)return;
      const now=performance.now();if(now-lastMulti<105)return;
      const d=pointDistance(a,b),ang=angleOf(a,b),c=centerOf(a,b),dd=d-multiBase.distance,da=ang-multiBase.angle;
      if(Math.abs(dd)>14){fire('pinch',multiBase.target,c.x,c.y,{dx:dd*1.5,dy:dd*.3});multiBase.distance=d;lastMulti=now;}
      else if(Math.abs(da)>9){fire('rotate',multiBase.target,c.x,c.y,{dx:Math.cos(ang*Math.PI/180)*80,dy:Math.sin(ang*Math.PI/180)*80});multiBase.angle=ang;lastMulti=now;}
      return;
    }
    if(pointers.size===1&&p.moved){
      const now=performance.now();if(now-lastTrail>95){
        const dx=p.x-p.startX,dy=p.y-p.startY;
        fire('drag',p.target,p.x,p.y,{dx:Math.max(-110,Math.min(110,dx)),dy:Math.max(-110,Math.min(110,dy))});lastTrail=now;
      }
      if(p.target&&p.target!==body){
        const r=p.target.getBoundingClientRect(),nx=((p.x-r.left)/Math.max(1,r.width)-.5)*2,ny=((p.y-r.top)/Math.max(1,r.height)-.5)*2;
        p.target.style.setProperty('--t60-tilt-x',`${(-ny*5).toFixed(2)}deg`);p.target.style.setProperty('--t60-tilt-y',`${(nx*6).toFixed(2)}deg`);
      }
    }
  },{passive:true});

  document.addEventListener('pointerup',event=>{
    if(event.pointerType!=='touch')return;
    suppressDesktopClick();lastTouchTime=performance.now();
    const p=pointers.get(event.pointerId);if(!p)return;
    p.x=event.clientX;p.y=event.clientY;
    clearTimeout(longTimer);p.target.classList.remove('t60-pressing');p.target.style.removeProperty('--t60-tilt-x');p.target.style.removeProperty('--t60-tilt-y');
    const dx=p.x-p.startX,dy=p.y-p.startY,dist=Math.hypot(dx,dy),duration=performance.now()-p.time,velocity=dist/Math.max(1,duration);
    pointers.delete(event.pointerId);
    if(pointers.size<2)multiBase=null;

    if(p.longFired){fire('release',p.target,p.x,p.y,{dx,dy});primary=null;return;}
    if(dist>=36){
      const edge=p.startX<28||p.startX>innerWidth-28;
      if(edge)fire('edge',p.target,p.x,p.y,{dx,dy});
      else fire('swipe',p.target,p.x,p.y,{dx:dx*(velocity>1.05?1.45:1),dy:dy*(velocity>1.05?1.45:1)});
      if(dist>64&&duration>220)fire('release',p.target,p.x,p.y,{dx:-dx*.55,dy:-dy*.55});
      primary=null;return;
    }
    if(duration<=360){
      const now=performance.now(),isDouble=now-lastTapTime<320&&Math.hypot(p.x-lastTapX,p.y-lastTapY)<34;
      if(isDouble){clearTimeout(pendingTap);pendingTap=0;fire('double',p.target,p.x,p.y,{dx:0,dy:-40});lastTapTime=0;}
      else{
        lastTapTime=now;lastTapX=p.x;lastTapY=p.y;
        clearTimeout(pendingTap);pendingTap=setTimeout(()=>{fire('tap',p.target,p.x,p.y,{dx:0,dy:-28});pendingTap=0;},220);
      }
    }
    primary=null;
  },{passive:true});

  document.addEventListener('pointercancel',event=>{
    const p=pointers.get(event.pointerId);if(p?.target){p.target.classList.remove('t60-pressing');p.target.style.removeProperty('--t60-tilt-x');p.target.style.removeProperty('--t60-tilt-y');}
    pointers.delete(event.pointerId);clearTimeout(longTimer);if(pointers.size<2)multiBase=null;
  },{passive:true});

  addEventListener('scroll',()=>{
    if(performance.now()-lastTouchTime>1400)return;
    clearTimeout(scrollTimer);
    scrollTimer=setTimeout(()=>{
      const x=innerWidth*.5,y=Math.min(innerHeight*.52,innerHeight-80);
      const el=document.elementFromPoint(x,y);const target=nearestTarget(el);
      fire('scroll',target,x,y,{dx:0,dy:72});
    },190);
  },{passive:true});

  document.addEventListener('click',event=>{
    if(body.dataset.touch60SuppressClick==='1')event.stopImmediatePropagation();
  },true);

  const clear=()=>active.splice(0).forEach(el=>el.remove());
  addEventListener('pagehide',clear,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clear()});

  window.AmantusiTouch60=Object.freeze({
    ready:true,enabled:true,
    get count(){return effects.length},
    get tier(){return tier()},
    get effects(){return effects.map(e=>e.name)},
    get groups(){return Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,v.map(e=>e.name)]))},
    trigger(name,target,x,y){const effect=effects.find(e=>e.name===name);if(effect&&target instanceof Element)render(effect,x,y,target,{dx:0,dy:-40})}
  });
})();