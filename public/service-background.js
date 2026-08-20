(() => {
  'use strict';

  const body=document.body;
  if(!body||body.dataset.serviceCinemaReady==='1')return;
  if(document.querySelector('.admin-shell,.admin-app,[data-admin-root]'))return;

  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const INTERVAL=9000;
  const TRANSITION=reduced?320:(matchMedia('(max-width:760px)').matches?1050:1480);
  const LOGO='/assets/amantusi-logo.svg';
  const ANIMATIONS_PER_SCENE=5;
  const scenes=[
    {id:1,label:'Amantusi Signature — Gold Horizon'},
    {id:2,label:'Amantusi Signature — Executive Left'},
    {id:3,label:'Amantusi Signature — Central Crest'},
    {id:4,label:'Amantusi Signature — Golden Diagonal'},
    {id:5,label:'Amantusi Signature — Procurement Grid'},
    {id:6,label:'Amantusi Signature — Institutional Halo'},
    {id:7,label:'Amantusi Signature — Distribution Orbit'},
    {id:8,label:'Amantusi Signature — Corporate Prism'},
    {id:9,label:'Amantusi Signature — Monumental Mark'},
    {id:10,label:'Amantusi Signature — Closing Gold Arc'}
  ];
  const hostSelectors=['.hero','#about','#capabilities','.government','#process','#quote','.contact-strip','footer'];
  const darkSelectors='.hero,.government,.contact-strip,footer';
  const hosts=[];
  let current=0,timer=0,transitioning=false,totalTransitions=0;

  function preloadLogo(){
    const img=new Image();
    img.decoding='async';
    img.fetchPriority='high';
    img.src=LOGO;
  }

  function makeFrame(kind){
    const frame=document.createElement('div');
    frame.className=`svc-cinema-frame ${kind}`;
    frame.setAttribute('aria-hidden','true');
    frame.innerHTML=[
      '<i class="svc-logo-main"></i>',
      '<i class="svc-logo-echo-a"></i>',
      '<i class="svc-logo-echo-b"></i>',
      '<i class="svc-logo-rings"></i>',
      '<i class="svc-logo-light"></i>'
    ].join('');
    return frame;
  }

  function applyScene(frame,index){
    for(let i=1;i<=scenes.length;i++)frame.classList.remove(`scene-${i}`);
    frame.classList.add(`scene-${scenes[index].id}`);
    frame.dataset.scene=String(scenes[index].id);
    frame.dataset.animations=String(ANIMATIONS_PER_SCENE);
  }

  function buildHost(host,index){
    if(host.querySelector(':scope > .svc-cinema-bg'))return;
    host.classList.add('service-cinema-host');
    host.classList.toggle('svc-tone-dark',host.matches(darkSelectors));
    host.classList.toggle('svc-tone-light',!host.matches(darkSelectors));
    host.dataset.svcHost=String(index+1);

    const stage=document.createElement('div');
    stage.className='svc-cinema-bg svc-logo-only';
    stage.setAttribute('aria-hidden','true');

    const currentFrame=makeFrame('is-current');
    const nextFrame=makeFrame('is-next');
    applyScene(currentFrame,current);

    const mask=document.createElement('div');mask.className='svc-cinema-mask';
    const grain=document.createElement('div');grain.className='svc-cinema-grain';
    stage.append(currentFrame,nextFrame,mask,grain);
    host.prepend(stage);
    hosts.push({host,stage,currentFrame,nextFrame});
  }

  function setMeta(index){
    body.dataset.serviceCinemaReady='1';
    body.dataset.serviceBackgroundIndex=String(index+1);
    body.dataset.serviceBackgroundLabel=scenes[index].label;
    body.dataset.serviceBackgroundSource='amantusi-logo-only';
    body.dataset.serviceBackgroundAnimations=String(ANIMATIONS_PER_SCENE);
    document.documentElement.style.setProperty('--service-background-index',String(index+1));
  }

  function schedule(){
    clearTimeout(timer);
    if(document.hidden||reduced)return;
    timer=setTimeout(()=>advance(),INTERVAL);
  }

  function advance(forceIndex){
    if(transitioning||!hosts.length)return false;
    const next=Number.isInteger(forceIndex)?((forceIndex%scenes.length)+scenes.length)%scenes.length:(current+1)%scenes.length;
    if(next===current){schedule();return false;}
    transitioning=true;

    hosts.forEach(({host,nextFrame})=>{
      applyScene(nextFrame,next);
      host.dataset.svcTransition=`scene-${scenes[next].id}`;
      void host.offsetWidth;
      host.classList.add('is-transitioning');
    });

    window.setTimeout(()=>{
      hosts.forEach(entry=>{
        applyScene(entry.currentFrame,next);
        entry.currentFrame.classList.remove('is-current');
        void entry.currentFrame.offsetWidth;
        entry.currentFrame.classList.add('is-current');
        entry.nextFrame.className='svc-cinema-frame is-next';
        entry.nextFrame.removeAttribute('data-scene');
        entry.nextFrame.removeAttribute('data-animations');
        entry.host.classList.remove('is-transitioning');
      });
      current=next;
      totalTransitions++;
      setMeta(current);
      transitioning=false;
      document.dispatchEvent(new CustomEvent('amantusi:service-background',{detail:{
        index:current,
        label:scenes[current].label,
        source:'amantusi-logo-only',
        animations:ANIMATIONS_PER_SCENE,
        cycle:totalTransitions
      }}));
      schedule();
    },TRANSITION);
    return true;
  }

  hostSelectors.forEach((selector,index)=>{
    const host=document.querySelector(selector);
    if(host)buildHost(host,index);
  });
  if(!hosts.length)return;

  preloadLogo();
  setMeta(current);
  schedule();

  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)clearTimeout(timer);
    else schedule();
  });
  addEventListener('pagehide',()=>clearTimeout(timer),{once:true});

  window.AmantusiServiceBackground=Object.freeze({
    ready:true,
    interval:INTERVAL,
    transitionMs:TRANSITION,
    count:scenes.length,
    animationsPerScene:ANIMATIONS_PER_SCENE,
    source:'amantusi-logo-only',
    logo:LOGO,
    scenes:Object.freeze(scenes.map(({id,label})=>Object.freeze({id,label}))),
    get currentIndex(){return current},
    get currentLabel(){return scenes[current].label},
    get transitioning(){return transitioning},
    get hosts(){return hosts.length},
    advance(){return advance()},
    goTo(index){return advance(Number(index))}
  });
})();
