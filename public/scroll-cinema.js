/* Amantusi: five filmed chapters embedded in the homepage.
   No 3D meshes, no WebGL, no third-party trackers. Touch and native page scroll stay usable. */
(() => {
  'use strict';
  const root=document.querySelector('[data-cinema-story]');
  if(!root)return;
  const stage=root.querySelector('[data-cin-stage]');
  const screen=root.querySelector('[data-cin-screen]');
  const video=root.querySelector('[data-cin-video]');
  const poster=root.querySelector('[data-cin-poster]');
  const title=root.querySelector('[data-cin-title]');
  const description=root.querySelector('[data-cin-description]');
  const label=root.querySelector('[data-cin-label]');
  const number=root.querySelector('[data-cin-number]');
  const toggle=root.querySelector('[data-cin-toggle]');
  const tap=root.querySelector('[data-cin-tap]');
  const previous=root.querySelector('[data-cin-previous]');
  const next=root.querySelector('[data-cin-next]');
  const seek=root.querySelector('[data-cin-seek]');
  const time=root.querySelector('[data-cin-time]');
  const status=root.querySelector('[data-cin-status]');
  const cards=[...root.querySelectorAll('[data-cin-chapter]')];
  if(!stage||!screen||!video||cards.length!==5)return;
  const ids=['intro','product','architecture','marquee','food'];
  const films={
    intro:{title:'Built on connection.',label:'01 / THE COMPANY',description:'A look at the people and conversations behind great service.',poster:'/assets/amantusi-logo.svg'},
    product:{title:'Essentials, carefully sourced.',label:'02 / PROCUREMENT & SUPPLY',description:'From institutional goods to everyday requirements, every detail matters.',poster:'/assets/service-scenes/institutional-supply.webp'},
    architecture:{title:'A wider perspective.',label:'03 / ARCHITECTURE',description:'Real camera footage of modern architecture and the places shaping tomorrow.',poster:'/assets/amantusi-logo.svg'},
    marquee:{title:'An occasion to remember.',label:'04 / EVENT INSPIRATION',description:'Real event decor and venue footage, bringing the atmosphere to life.',poster:'/assets/catering/garden-buffet.webp'},
    food:{title:'Made for the moment.',label:'05 / CATERING',description:'Real food preparation filmed with warmth, movement and attention to detail.',poster:'/assets/service-scenes/catering.webp'}
  };
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const saveData=Boolean(navigator.connection?.saveData);
  let active='intro',visible=false,manualPause=false,scrollFrame=0,selectionToken=0,swipeOrigin=null,lastSwipe=0,draggingSeek=false,userNavigationUntil=0;
  function clamp(n,a,b){return Math.min(b,Math.max(a,n));}
  function announce(msg){status.textContent=msg;}
  function updateControls(){
    const isPlaying=!video.paused&&!video.ended;
    toggle.textContent=isPlaying?'Pause film':'Play film';
    toggle.setAttribute('aria-pressed',String(isPlaying));
    tap.setAttribute('aria-label',isPlaying?'Pause film':'Play film');
    stage.dataset.playing=String(isPlaying);
    previous.disabled=ids.indexOf(active)===0;
    next.disabled=ids.indexOf(active)===ids.length-1;
  }
  function pause(userInitiated=false){
    video.pause();
    if(userInitiated)manualPause=true;
    updateControls();
  }
  function setSource(){
    const src='/assets/films/'+active+'.mp4';
    if(video.getAttribute('src')===src)return;
    video.pause();
    stage.classList.remove('cin-film-ready');
    video.removeAttribute('src');
    video.load();
    video.src=src;
    video.preload='metadata';
    video.muted=true;
    video.playsInline=true;
    video.loop=true;
    video.load();
  }
  function startFilm(userInitiated=false){
    if(!visible&&!userInitiated)return;
    if((reduced.matches||saveData)&&!userInitiated)return;
    if(document.hidden)return;
    manualPause=false;
    setSource();
    const token=selectionToken;
    const play=video.play();
    if(play&&typeof play.catch==='function'){
      play.catch(()=>{
        if(token!==selectionToken)return;
        stage.dataset.playing='false';
        updateControls();
        announce('Tap Play to watch this film.');
      });
    }
  }
  function chooseFilm(key,{scrollTo=false,fromUser=false}={}){
    if(fromUser)userNavigationUntil=performance.now()+1300;
    if(!Object.hasOwn(films,key))return;
    const same=key===active;
    if(!same){
      selectionToken+=1;
      video.pause();
      video.removeAttribute('src');
      video.load();
      stage.classList.remove('cin-film-ready');
      active=key;
      manualPause=false;
      const item=films[key];
      poster.src=item.poster;
      poster.alt=item.title;
      title.textContent=item.title;
      description.textContent=item.description;
      label.textContent=item.label;
      number.textContent=String(ids.indexOf(key)+1).padStart(2,'0')+' / 05';
      stage.dataset.film=key;
      seek.value='0';
      time.textContent='00:00 / 00:10';
      announce(item.label.replace(/\d+ \/ /,'')+' film selected.');
      for(const card of cards){
        const selected=card.dataset.cinChapter===key;
        card.classList.toggle('is-active',selected);
        if(selected)card.setAttribute('aria-current','step');
        else card.removeAttribute('aria-current');
      }
    }
    updateControls();
    if(scrollTo){
      const card=cards.find(x=>x.dataset.cinChapter===key);
      card?.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'center'});
    }
    if(visible&&!manualPause)startFilm(fromUser);
  }
  function toggleFilm(){
    if(!video.paused){
      pause(true);
      announce('Film paused.');
    }else{
      startFilm(true);
      announce('Playing '+films[active].label.toLowerCase()+'.');
    }
  }
  function chapterOffset(){
    // The active chapter sits below the sticky film on phones.
    return innerWidth<=760?innerHeight*.79:innerHeight*.51;
  }
  function updateFromScroll(){
    scrollFrame=0;
    if(!visible||performance.now()<userNavigationUntil)return;
    const line=chapterOffset();
    let closest=cards[0],distance=Infinity;
    for(const card of cards){
      const r=card.getBoundingClientRect();
      const d=Math.abs(r.top+r.height*.45-line);
      if(d<distance){distance=d;closest=card;}
    }
    const selected=closest.dataset.cinChapter;
    if(selected&&selected!==active)chooseFilm(selected);
    const b=closest.getBoundingClientRect();
    const local=clamp((line-b.top)/Math.max(1,b.height),0,1);
    stage.style.setProperty('--cin-story-progress',local.toFixed(3));
  }
  function schedule(){
    if(!scrollFrame)scrollFrame=requestAnimationFrame(updateFromScroll);
  }
  for(const card of cards){
    card.addEventListener('click',event=>{
      if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
      event.preventDefault();
      chooseFilm(card.dataset.cinChapter,{scrollTo:true,fromUser:true});
    });
  }
  toggle.addEventListener('click',toggleFilm);
  tap.addEventListener('click',()=>{
    if(Date.now()-lastSwipe<450)return;
    toggleFilm();
  });
  previous.addEventListener('click',()=>{
    const i=ids.indexOf(active);if(i>0)chooseFilm(ids[i-1],{scrollTo:true,fromUser:true});
  });
  next.addEventListener('click',()=>{
    const i=ids.indexOf(active);if(i<ids.length-1)chooseFilm(ids[i+1],{scrollTo:true,fromUser:true});
  });
  seek.addEventListener('pointerdown',()=>{draggingSeek=true;});
  seek.addEventListener('pointerup',()=>{draggingSeek=false;});
  seek.addEventListener('change',()=>{draggingSeek=false;});
  seek.addEventListener('input',()=>{
    if(!video.getAttribute('src'))setSource();
    const value=clamp(Number(seek.value),0,100);
    if(video.readyState>=1&&Number.isFinite(video.duration)){
      video.currentTime=value/100*Math.min(10,video.duration);
    }else{
      video.addEventListener('loadedmetadata',()=>{
        if(Number.isFinite(video.duration))video.currentTime=value/100*Math.min(10,video.duration);
      },{once:true});
    }
  });
  video.addEventListener('loadeddata',()=>{
    stage.classList.add('cin-film-ready');
  });
  video.addEventListener('timeupdate',()=>{
    if(draggingSeek)return;
    const progress=clamp((video.currentTime||0)/Math.max(1,Math.min(10,video.duration||10)),0,1);
    seek.value=String(Math.round(progress*100));
    time.textContent='00:'+String(Math.floor(Math.min(10,video.currentTime||0))).padStart(2,'0')+' / 00:10';
    stage.style.setProperty('--cin-film-progress',progress.toFixed(3));
  });
  video.addEventListener('play',updateControls);
  video.addEventListener('pause',updateControls);
  video.addEventListener('playing',()=>{updateControls();stage.classList.add('cin-film-ready');});
  video.addEventListener('error',()=>{
    if(!video.getAttribute('src'))return;
    stage.classList.remove('cin-film-ready');
    pause();
    announce('Video unavailable. The chapter image and service links are still available.');
  });
  screen.addEventListener('pointerdown',event=>{
    if(event.pointerType==='mouse')return;
    swipeOrigin={x:event.clientX,y:event.clientY,time:Date.now()};
  },{passive:true});
  screen.addEventListener('pointerup',event=>{
    if(!swipeOrigin||event.pointerType==='mouse')return;
    const dx=event.clientX-swipeOrigin.x;
    const dy=event.clientY-swipeOrigin.y;
    swipeOrigin=null;
    if(Math.abs(dx)>54&&Math.abs(dx)>Math.abs(dy)*1.35){
      lastSwipe=Date.now();
      const currentIndex=ids.indexOf(active);
      const dest=ids[clamp(currentIndex+(dx<0?1:-1),0,ids.length-1)];
      if(dest!==active)chooseFilm(dest,{scrollTo:true,fromUser:true});
    }
  },{passive:true});
  screen.addEventListener('pointercancel',()=>{swipeOrigin=null;});
  if(matchMedia('(hover: hover) and (pointer: fine)').matches){
    screen.addEventListener('pointermove',e=>{
      const r=screen.getBoundingClientRect();
      stage.style.setProperty('--cin-pointer-x',((e.clientX-r.left)/Math.max(1,r.width)-0.5).toFixed(3));
      stage.style.setProperty('--cin-pointer-y',((e.clientY-r.top)/Math.max(1,r.height)-0.5).toFixed(3));
    },{passive:true});
    screen.addEventListener('pointerleave',()=>{
      stage.style.setProperty('--cin-pointer-x','0');
      stage.style.setProperty('--cin-pointer-y','0');
    });
  }
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)pause();
    else if(visible&&!manualPause)startFilm();
  },{passive:true});
  reduced.addEventListener?.('change',()=>{if(reduced.matches)pause();});
  if('IntersectionObserver'in window){
    const ob=new IntersectionObserver(entries=>{
      const now=entries.some(e=>e.isIntersecting);
      if(visible===now)return;
      visible=now;
      if(now){
        schedule();
        if(!manualPause)startFilm();
      }else pause();
    },{threshold:.04});
    ob.observe(stage);
  }else{
    visible=true;
    startFilm();
  }
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  updateControls();
  schedule();
})();
