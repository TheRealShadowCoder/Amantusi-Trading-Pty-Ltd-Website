(() => {
  'use strict';

  const body=document.body;
  if(!body||body.dataset.serviceCinemaReady==='1')return;
  if(document.querySelector('.admin-shell,.admin-app,[data-admin-root]'))return;

  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const INTERVAL=9000;
  const TRANSITION=reduced?360:(matchMedia('(max-width:760px)').matches?1220:1820);
  const services=[
    {id:1,label:'General Procurement & Materials Supply'},
    {id:2,label:'Warehouse Stockholding & Distribution'},
    {id:3,label:'Order Fulfilment & Supply Operations'},
    {id:4,label:'Bulk Inventory & Institutional Supply'},
    {id:5,label:'Logistics Coordination & Procurement Administration'},
    {id:6,label:'Dispatch, Documentation & Delivery Support'},
    {id:7,label:'Cleaning & Hygiene Supplies'},
    {id:8,label:'Cleaning Consumables & Facility Supply'},
    {id:9,label:'Fresh Catering & Food Service'},
    {id:10,label:'Corporate & Event Catering'}
  ];
  const transitions=['zoom','lateral','iris','diagonal','focus'];
  const hostSelectors=['.hero','#about','#capabilities','.government','#process','#quote','.contact-strip','footer'];
  const darkSelectors='.hero,.government,.contact-strip,footer';
  const hosts=[];
  let current=0,timer=0,transitioning=false,totalTransitions=0;

  function url(index){return `/service-bg/${services[index].id}`;}

  function preload(index){
    const img=new Image();
    img.decoding='async';
    img.fetchPriority='low';
    img.src=url(index);
    return img;
  }

  function buildHost(host,index){
    if(host.querySelector(':scope > .svc-cinema-bg'))return;
    host.classList.add('service-cinema-host');
    host.classList.toggle('svc-tone-dark',host.matches(darkSelectors));
    host.classList.toggle('svc-tone-light',!host.matches(darkSelectors));
    host.dataset.svcHost=String(index+1);

    const stage=document.createElement('div');
    stage.className='svc-cinema-bg';
    stage.setAttribute('aria-hidden','true');

    const currentFrame=document.createElement('div');
    currentFrame.className='svc-cinema-frame is-current';
    currentFrame.style.backgroundImage=`url("${url(current)}")`;

    const nextFrame=document.createElement('div');
    nextFrame.className='svc-cinema-frame is-next';

    const mask=document.createElement('div');mask.className='svc-cinema-mask';
    const grain=document.createElement('div');grain.className='svc-cinema-grain';
    const sweep=document.createElement('div');sweep.className='svc-cinema-sweep';
    stage.append(currentFrame,nextFrame,mask,grain,sweep);
    host.prepend(stage);
    hosts.push({host,stage,currentFrame,nextFrame});
  }

  function setMeta(index){
    body.dataset.serviceBackgroundIndex=String(index+1);
    body.dataset.serviceBackgroundLabel=services[index].label;
    document.documentElement.style.setProperty('--service-background-index',String(index+1));
  }

  function schedule(){
    clearTimeout(timer);
    if(document.hidden)return;
    timer=setTimeout(()=>advance(),INTERVAL);
  }

  function advance(forceIndex){
    if(transitioning||!hosts.length)return false;
    const next=Number.isInteger(forceIndex)?((forceIndex%services.length)+services.length)%services.length:(current+1)%services.length;
    if(next===current){schedule();return false;}
    transitioning=true;
    const transition=transitions[totalTransitions%transitions.length];
    const nextUrl=url(next);
    preload((next+1)%services.length);

    hosts.forEach(({host,nextFrame})=>{
      nextFrame.style.backgroundImage=`url("${nextUrl}")`;
      host.dataset.svcTransition=transition;
      void host.offsetWidth;
      host.classList.add('is-transitioning');
    });

    window.setTimeout(()=>{
      hosts.forEach(entry=>{
        entry.currentFrame.style.backgroundImage=`url("${nextUrl}")`;
        entry.currentFrame.classList.remove('is-current');
        void entry.currentFrame.offsetWidth;
        entry.currentFrame.classList.add('is-current');
        entry.nextFrame.style.backgroundImage='none';
        entry.host.classList.remove('is-transitioning');
      });
      current=next;
      totalTransitions++;
      setMeta(current);
      transitioning=false;
      document.dispatchEvent(new CustomEvent('amantusi:service-background',{detail:{index:current,label:services[current].label,transition}}));
      schedule();
    },TRANSITION);
    return true;
  }

  hostSelectors.forEach((selector,index)=>{
    const host=document.querySelector(selector);
    if(host)buildHost(host,index);
  });
  if(!hosts.length)return;

  body.dataset.serviceCinemaReady='1';
  setMeta(current);
  preload(0);
  preload(1);
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
    count:services.length,
    services:Object.freeze(services.map(({id,label})=>Object.freeze({id,label}))),
    get currentIndex(){return current},
    get currentLabel(){return services[current].label},
    get transitioning(){return transitioning},
    get hosts(){return hosts.length},
    advance(){return advance()},
    goTo(index){return advance(Number(index))}
  });
})();
