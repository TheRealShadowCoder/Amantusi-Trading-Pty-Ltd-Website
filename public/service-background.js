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
    {id:1,label:'Warehouse Stockholding & Distribution',kind:'warehouse'},
    {id:2,label:'Bulk Inventory & Pallet Supply',kind:'warehouse'},
    {id:3,label:'Office & Institutional Supplies',kind:'office'},
    {id:4,label:'Administrative & Stationery Supply',kind:'office'},
    {id:5,label:'Cleaning & Hygiene Products',kind:'cleaning'},
    {id:6,label:'Janitorial Consumables & Equipment',kind:'cleaning'},
    {id:7,label:'Facility Cleaning Essentials',kind:'cleaning'},
    {id:8,label:'Fresh Catering & Buffet Service',kind:'catering'},
    {id:9,label:'Corporate Catering & Event Food',kind:'catering'},
    {id:10,label:'Premium Pastry & Refreshment Catering',kind:'catering'}
  ];
  const hostSelectors=['.hero','#about','#capabilities','.government','#process','#quote','.contact-strip','footer'];
  const darkSelectors='.hero,.government,.contact-strip,footer';
  const hosts=[];
  let current=0,timer=0,transitioning=false,totalTransitions=0;

  function photoUrl(index){return `/service-bg/${scenes[index].id}`;}

  function preload(index){
    const img=new Image();
    img.decoding='async';
    img.fetchPriority=index===0?'high':'low';
    img.src=photoUrl(index);
    return img;
  }

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
      '<i class="svc-photo"></i>',
      '<i class="svc-logo-main"></i>',
      '<i class="svc-photo-orbit"></i>',
      '<i class="svc-photo-light"></i>',
      '<i class="svc-photo-depth"></i>'
    ].join('');
    return frame;
  }

  function applyScene(frame,index){
    for(let i=1;i<=scenes.length;i++)frame.classList.remove(`scene-${i}`);
    const scene=scenes[index];
    frame.classList.add(`scene-${scene.id}`);
    frame.dataset.scene=String(scene.id);
    frame.dataset.kind=scene.kind;
    frame.dataset.animations=String(ANIMATIONS_PER_SCENE);
    const photo=frame.querySelector('.svc-photo');
    if(photo)photo.style.backgroundImage=`url("${photoUrl(index)}")`;
  }

  function buildHost(host,index){
    if(host.querySelector(':scope > .svc-cinema-bg'))return;
    host.classList.add('service-cinema-host');
    host.classList.toggle('svc-tone-dark',host.matches(darkSelectors));
    host.classList.toggle('svc-tone-light',!host.matches(darkSelectors));
    host.dataset.svcHost=String(index+1);

    const stage=document.createElement('div');
    stage.className='svc-cinema-bg svc-object-photography';
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
    body.dataset.serviceBackgroundSource='object-photography-no-people';
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
    preload((next+1)%scenes.length);

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
        entry.nextFrame.removeAttribute('data-kind');
        entry.nextFrame.removeAttribute('data-animations');
        const nextPhoto=entry.nextFrame.querySelector('.svc-photo');
        if(nextPhoto)nextPhoto.style.backgroundImage='none';
        entry.host.classList.remove('is-transitioning');
      });
      current=next;
      totalTransitions++;
      setMeta(current);
      transitioning=false;
      document.dispatchEvent(new CustomEvent('amantusi:service-background',{detail:{
        index:current,
        label:scenes[current].label,
        kind:scenes[current].kind,
        source:'object-photography-no-people',
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
  preload(0);
  preload(1);
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
    source:'object-photography-no-people',
    logo:LOGO,
    scenes:Object.freeze(scenes.map(({id,label,kind})=>Object.freeze({id,label,kind}))),
    get currentIndex(){return current},
    get currentLabel(){return scenes[current].label},
    get transitioning(){return transitioning},
    get hosts(){return hosts.length},
    advance(){return advance()},
    goTo(index){return advance(Number(index))}
  });
})();
