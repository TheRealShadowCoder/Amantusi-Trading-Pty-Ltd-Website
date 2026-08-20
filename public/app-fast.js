(() => {
  'use strict';
  const header=document.querySelector('.site-header');
  const menuButton=document.querySelector('.menu-button');
  const nav=document.querySelector('.nav-links');
  const progress=document.querySelector('.scroll-progress span');
  const processProgress=document.querySelector('.process-progress span');
  const processWrap=document.querySelector('.process-wrap');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse=matchMedia('(pointer: coarse)').matches||matchMedia('(hover: none)').matches||navigator.maxTouchPoints>0;

  if(progress){progress.style.width='100%';progress.style.transformOrigin='left center';progress.style.transform='scaleX(0)'}
  if(processProgress){processProgress.style.width='100%';processProgress.style.transformOrigin='left center';processProgress.style.transform='scaleX(0)'}

  let scrollFrame=0;
  function paintScroll(){
    scrollFrame=0;
    const y=scrollY;
    header?.classList.toggle('scrolled',y>20);
    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    if(progress)progress.style.transform=`scaleX(${Math.min(1,y/max)})`;
    if(processProgress&&processWrap){
      const rect=processWrap.getBoundingClientRect();
      const local=Math.min(1,Math.max(0,(innerHeight*.8-rect.top)/Math.max(1,rect.height+innerHeight*.45)));
      processProgress.style.transform=`scaleX(${local})`;
    }
  }
  function scheduleScroll(){if(!scrollFrame)scrollFrame=requestAnimationFrame(paintScroll)}
  paintScroll();
  addEventListener('scroll',scheduleScroll,{passive:true});
  addEventListener('resize',scheduleScroll,{passive:true});

  menuButton?.addEventListener('click',()=>{
    const open=nav?.classList.toggle('open');
    menuButton.setAttribute('aria-expanded',String(Boolean(open)));
  });
  document.querySelectorAll('.nav-links a').forEach(link=>link.addEventListener('click',()=>{
    nav?.classList.remove('open');menuButton?.setAttribute('aria-expanded','false');
  }));

  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}
    },{threshold:.08,rootMargin:'0px 0px -2% 0px'});
    document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
  }else document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));

  const year=document.getElementById('year');if(year)year.textContent=new Date().getFullYear();

  if(!reduced&&!coarse&&document.body.dataset.runtimeTier!=='lite'){
    document.querySelectorAll('[data-tilt]').forEach(card=>{
      let frame=0,latest=null,rect=null;
      card.addEventListener('pointerenter',()=>{rect=card.getBoundingClientRect()},{passive:true});
      card.addEventListener('pointermove',event=>{
        latest=event;if(frame||!rect)return;
        frame=requestAnimationFrame(()=>{
          frame=0;if(!latest||!rect)return;
          const x=(latest.clientX-rect.left)/Math.max(1,rect.width),y=(latest.clientY-rect.top)/Math.max(1,rect.height);
          card.style.transform=`perspective(1000px) rotateX(${(.5-y)*3.5}deg) rotateY(${(x-.5)*4.5}deg) translateY(-2px)`;
          card.style.setProperty('--mx',`${x*100}%`);card.style.setProperty('--my',`${y*100}%`);
        });
      },{passive:true});
      card.addEventListener('pointerleave',()=>{if(frame)cancelAnimationFrame(frame);frame=0;latest=null;rect=null;card.style.transform=''},{passive:true});
    });
  }

  document.addEventListener('click',event=>{
    const target=event.target.closest('[data-href]');if(target)location.href=target.dataset.href;
  });
  document.addEventListener('keydown',event=>{
    const target=event.target.closest?.('[data-href]');
    if(target&&(event.key==='Enter'||event.key===' ')){event.preventDefault();location.href=target.dataset.href}
  });

  const quoteForm=document.getElementById('quote-form');
  const status=document.getElementById('form-status');
  quoteForm?.addEventListener('submit',async event=>{
    event.preventDefault();
    const submit=quoteForm.querySelector('button[type="submit"]');if(submit)submit.disabled=true;
    if(status){status.className='form-status';status.textContent='Sending your quotation request securely…'}
    try{
      const response=await fetch('/api/quote',{method:'POST',body:new FormData(quoteForm)});
      let payload={};try{payload=await response.json()}catch(_){}
      if(!response.ok)throw new Error(payload.error||'Could not submit your quotation request.');
      quoteForm.reset();
      if(status){status.className='form-status success';status.textContent=`Request received successfully. Reference: ${String(payload.reference||'')}`}
      window.amantusiTrack?.('generate_lead',{files:payload.files||0});
    }catch(error){
      if(status){status.className='form-status error';status.textContent=`${error.message||'Submission failed.'} You can also email zodwangema37@gmail.com or call 073 247 6716.`}
    }finally{if(submit)submit.disabled=false}
  });
})();
