/* Amantusi: live-action video cinema.
   Real licensed stock footage; no WebGL, Three.js geometry, synthetic actors or 3D meshes.
   Videos are self-hosted from verified build-time MP4 assets and never auto-download on page entry. */
const films={
 intro:{label:'COMPANY INTRODUCTION',kicker:'THE AMANTUSI STORY',title:'More than a supplier.',description:'Real-world business footage highlighting communication, sourcing and service.',poster:'/assets/amantusi-logo.svg',alt:'Amantusi Trading company identity',detail:'/company-profile.html',source:'https://www.pexels.com/video/group-of-people-in-a-business-meeting-3191887/'},
 product:{label:'PRODUCT SHOWCASE',kicker:'SOURCING & SUPPLY',title:'Every detail matters.',description:'Filmed logistics and supply operations, reflecting the importance of dependable procurement.',poster:'/assets/service-scenes/institutional-supply.webp',alt:'Office and institutional goods',detail:'/office-institutional.html',source:'https://www.pexels.com/videos/'},
 architecture:{label:'ARCHITECTURAL FLYTHROUGH',kicker:'A LOOK INSIDE',title:'Built for what comes next.',description:'A real camera movement through a luxury interior, presented as architectural inspiration.',poster:'/assets/amantusi-logo.svg',alt:'Amantusi brand image; architectural film loads when played',detail:'/company-profile.html',source:'https://mixkit.co/free-stock-video/luxury-hotel-room-panning-shot-4196/'},
 marquee:{label:'MARQUEE & EVENT FILM',kicker:'EVENT ATMOSPHERE',title:'Space becomes occasion.',description:'Real footage of an elegantly decorated event venue — inspiration for your next function.',poster:'/assets/catering/garden-buffet.webp',alt:'Illustrative event catering image',detail:'/corporate-catering.html',source:'https://mixkit.co/free-stock-video/decorations-on-the-ceiling-of-a-wedding-party-5213/'},
 food:{label:'CINEMATIC FOOD COMMERCIAL',kicker:'CATERING & PRESENTATION',title:'Crafted for the occasion.',description:'Genuine food-preparation footage presented with cinematic typography and luxury color treatment.',poster:'/assets/service-scenes/catering.webp',alt:'Catering presentation',detail:'/corporate-catering.html',source:'https://www.pexels.com/videos/'}
};
const sequence=Object.keys(films),viewer=document.getElementById('cin-viewer'),video=document.getElementById('cin-film');
const layer=document.getElementById('cin-canvas'),poster=document.getElementById('cin-poster-image');
const playButton=document.getElementById('cin-play'),pauseButton=document.getElementById('cin-pause');
const status=document.getElementById('cin-status'),progress=document.getElementById('cin-progress'),clock=document.getElementById('cin-time');
const label=document.getElementById('cin-current-label'),title=document.getElementById('cin-scene-title');
const description=document.getElementById('cin-scene-description'),kicker=document.getElementById('cin-scene-kicker');
const counter=document.getElementById('cin-counter'),detail=document.getElementById('cin-detail-link');
let selected='intro',playing=false,visible=true,loadedKey=null;
const duration=10;
const prefersReduced=matchMedia('(prefers-reduced-motion: reduce)');
document.getElementById('cin-year').textContent=String(new Date().getFullYear());
function info(value){status.textContent=value;}
function timecode(seconds){return '00:'+String(Math.min(duration,Math.max(0,Math.floor(seconds)))).padStart(2,'0');}
function refresh(seconds=0){clock.textContent=timecode(seconds)+' / 00:10';progress.style.width=(Math.min(100,Math.max(0,seconds/duration*100))).toFixed(2)+'%';}
function pause(){
 video.pause();playing=false;pauseButton.disabled=true;playButton.disabled=false;playButton.textContent=loadedKey===selected?'Resume video ▶':'Play video ▶';
}
function select(key){
 if(!Object.hasOwn(films,key))return;
 pause();selected=key;loadedKey=null;
 video.removeAttribute('src');video.load();
 video.currentTime=0;layer.classList.remove('is-ready');refresh(0);
 const film=films[key],n=sequence.indexOf(key)+1;
 poster.src=film.poster;poster.alt=film.alt;video.setAttribute('aria-label','Real stock-video footage: '+film.label.toLowerCase());
 label.textContent=film.label;title.textContent=film.title;description.textContent=film.description;kicker.textContent=film.kicker;
 counter.textContent=String(n).padStart(2,'0')+' / 05';detail.href=film.detail;
 for(const button of document.querySelectorAll('[data-experience]')){
  const active=button.dataset.experience===key;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));
 }
 playButton.textContent='Play video ▶';
 info('Selected '+film.label.toLowerCase()+'. Press Play to watch real filmed footage.');
}
async function play(){
 if(playing)return;
 const film=films[selected],key=selected;
 if(loadedKey!==key){
  loadedKey=key;video.src='/assets/films/'+key+'.mp4';
  video.preload='auto';video.muted=true;video.playsInline=true;video.loop=false;
  video.load();
 }
 playButton.disabled=true;playButton.textContent='Loading footage…';
 info('Preparing filmed footage. Your browser may download a short HD video.');
 try{
  await video.play();
  if(key!==selected){video.pause();return;}
  playing=true;pauseButton.disabled=false;playButton.disabled=false;playButton.textContent='Playing…';
  info('Playing real-world stock footage: '+film.label.toLowerCase()+'.');
 }catch(error){
  playing=false;playButton.disabled=false;pauseButton.disabled=true;playButton.textContent='Retry video ▶';
  info('This film could not be played. The still-image preview remains available. Check your connection or open the original footage on '+new URL(film.source).hostname+'.');
 }
}
video.addEventListener('loadeddata',()=>{if(video.readyState>=2)layer.classList.add('is-ready');});
video.addEventListener('timeupdate',()=>{
 const t=Number.isFinite(video.currentTime)?video.currentTime:0;
 refresh(Math.min(t,duration));
 if(t>=duration-.08){video.currentTime=0;if(playing)video.play().catch(()=>pause());}
});
video.addEventListener('ended',()=>{video.currentTime=0;if(playing)video.play().catch(()=>pause());else refresh(0);});
video.addEventListener('error',()=>{
 if(!video.getAttribute('src'))return;
 layer.classList.remove('is-ready');pause();loadedKey=null;
 info('Video unavailable in this browser. Please use the service links below; the footage has a static preview.');
});
playButton.addEventListener('click',()=>{if(!playing)void play();});
pauseButton.addEventListener('click',()=>{pause();info('Video paused.');});
document.querySelectorAll('[data-experience]').forEach(button=>button.addEventListener('click',()=>select(button.dataset.experience)));
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)pause();},{passive:true});
if('IntersectionObserver'in window){
 const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(!visible&&playing)pause();},{threshold:0});
 observer.observe(viewer);
}
prefersReduced.addEventListener?.('change',()=>{
 if(prefersReduced.matches&&playing)pause();
});
select(new URLSearchParams(location.search).get('scene')||'intro');
if(prefersReduced.matches)info('Motion reduction is enabled. The video will play only if you press Play.');
else if(navigator.connection?.saveData)info('Data saving is enabled. Videos load only after you press Play.');
