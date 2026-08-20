(() => {
  'use strict';

  const body=document.body;
  if(!body||body.dataset.serviceCinemaReady==='1')return;
  if(document.querySelector('.admin-shell,.admin-app,[data-admin-root]'))return;

  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile=matchMedia('(max-width:760px)').matches;
  const saveData=Boolean(navigator.connection?.saveData);
  const lowDevice=(navigator.deviceMemory&&navigator.deviceMemory<=4)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4);
  const INTERVAL=9000;
  const TRANSITION=reduced?260:(mobile?820:1280);
  const LOGO='/assets/amantusi-logo.svg';
  const ANIMATIONS_PER_SCENE=5;
  const PHOTO_WIDTH=mobile||saveData||lowDevice?960:1600;
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
  let current=0,timer=0,transitioning=false,cycle=0;

  function photoUrl(index){return `/service-bg/${scenes[index].id}?w=${PHOTO_WIDTH}`;}
  function preload(url,high=false){const img=new Image();img.decoding='async';img.fetchPriority=high?'high':'low';img.src=url;return img;}
  function makeFrame(kind){
    const frame=document.createElement('div');
    frame.className=`svc-cinema-frame ${kind}`;
    frame.setAttribute('aria-hidden','true');
    frame.innerHTML='<i class="svc-photo"></i><i class="svc-logo-main"></i><i class="svc-photo-orbit"></i><i class="svc-photo-light"></i><i class="svc-photo-depth"></i>';
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

  const stage=document.createElement('div');
  stage.className='svc-cinema-global svc-object-photography';
  stage.setAttribute('aria-hidden','true');
  const currentFrame=makeFrame('is-current');
  const nextFrame=makeFrame('is-next');
  applyScene(currentFrame,current);
  const veil=document.createElement('div');veil.className='svc-cinema-veil';
  const grain=document.createElement('div');grain.className='svc-cinema-grain';
  stage.append(currentFrame,nextFrame,veil,grain);
  body.prepend(stage);
  body.classList.add('has-global-service-cinema');

  function setMeta(index){
    body.dataset.serviceCinemaReady='1';
    body.dataset.serviceBackgroundIndex=String(index+1);
    body.dataset.serviceBackgroundLabel=scenes[index].label;
    body.dataset.serviceBackgroundSource='verified-object-photography-no-people';
    body.dataset.serviceBackgroundAnimations=String(ANIMATIONS_PER_SCENE);
    body.dataset.serviceBackgroundPhotoWidth=String(PHOTO_WIDTH);
    document.documentElement.style.setProperty('--svc-transition-ms',`${TRANSITION}ms`);
  }
  function schedule(){clearTimeout(timer);if(document.hidden||reduced)return;timer=setTimeout(()=>advance(),INTERVAL);}
  function advance(forceIndex){
    if(transitioning)return false;
    const next=Number.isInteger(forceIndex)?((forceIndex%scenes.length)+scenes.length)%scenes.length:(current+1)%scenes.length;
    if(next===current){schedule();return false;}
    transitioning=true;
    preload(photoUrl(next),true);
    preload(photoUrl((next+1)%scenes.length));
    applyScene(nextFrame,next);
    stage.dataset.transition=`scene-${scenes[next].id}`;
    void stage.offsetWidth;
    stage.classList.add('is-transitioning');
    setTimeout(()=>{
      applyScene(currentFrame,next);
      currentFrame.classList.remove('is-current');
      void currentFrame.offsetWidth;
      currentFrame.classList.add('is-current');
      nextFrame.className='svc-cinema-frame is-next';
      nextFrame.removeAttribute('data-scene');
      nextFrame.removeAttribute('data-kind');
      nextFrame.removeAttribute('data-animations');
      const nextPhoto=nextFrame.querySelector('.svc-photo');if(nextPhoto)nextPhoto.style.backgroundImage='none';
      stage.classList.remove('is-transitioning');
      current=next;cycle++;setMeta(current);transitioning=false;
      document.dispatchEvent(new CustomEvent('amantusi:service-background',{detail:{index:current,label:scenes[current].label,kind:scenes[current].kind,source:'verified-object-photography-no-people',animations:ANIMATIONS_PER_SCENE,cycle}}));
      schedule();
    },TRANSITION);
    return true;
  }

  preload(LOGO,true);preload(photoUrl(0),true);preload(photoUrl(1));setMeta(current);schedule();
  document.addEventListener('visibilitychange',()=>document.hidden?clearTimeout(timer):schedule());
  addEventListener('pagehide',()=>clearTimeout(timer),{once:true});
  addEventListener('resize',()=>stage.classList.toggle('svc-compact',innerWidth<=760),{passive:true});

  window.AmantusiServiceBackground=Object.freeze({
    ready:true,interval:INTERVAL,transitionMs:TRANSITION,count:scenes.length,animationsPerScene:ANIMATIONS_PER_SCENE,
    source:'verified-object-photography-no-people',logo:LOGO,photoWidth:PHOTO_WIDTH,
    scenes:Object.freeze(scenes.map(({id,label,kind})=>Object.freeze({id,label,kind}))),
    get currentIndex(){return current},get currentLabel(){return scenes[current].label},get transitioning(){return transitioning},
    advance(){return advance()},goTo(index){return advance(Number(index))}
  });
})();
