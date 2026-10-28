/* Amantusi service-image studio: rendered WebP photography + WebGL image refraction.
   Actual service imagery is the content. GPU effects are optional, never required for access. */
(() => {
 'use strict';
 const section=document.getElementById('immersive');
 if(!section)return;
 const stage=section.querySelector('[data-amt-stage]');
 const frame=stage.querySelector('[data-amt-photo-frame]');
 const canvas=stage.querySelector('[data-amt-photo-webgl]');
 const photo=stage.querySelector('[data-amt-service-image]');
 const tabs=[...section.querySelectorAll('[data-amt-item]')];
 const title=section.querySelector('[data-amt-title]');
 const sub=section.querySelector('[data-amt-subtitle]');
 const body=section.querySelector('[data-amt-description]');
 const list=section.querySelector('[data-amt-features]');
 const link=section.querySelector('[data-amt-link]');
 const count=section.querySelector('[data-amt-counter]');
 const detail=section.querySelector('#amt-showcase-detail');
 const scenes=[
  {key:'catering',image:'/assets/service-scenes/catering.webp',alt:'Rendered buffet catering arrangement with curries, serving trays, rice and salads',title:'Considered catering.',sub:'SERVICE IMAGE / 001',description:'From meeting refreshments to larger functions, we shape the catering brief around guest numbers, service requirements and venue details.',features:['Meeting and event catering','Menu and quantity planning','Venue and delivery coordination'],href:'/corporate-catering.html',label:'Explore catering services'},
  {key:'meals',image:'/assets/service-scenes/packed-meals.webp',alt:'Rendered ready-to-go packed meal boxes with sandwiches, fruit and refreshments',title:'Meals, thoughtfully packed.',sub:'SERVICE IMAGE / 002',description:'Packed-meal and refreshment concepts for meetings, functions and institutional catering requirements, quoted around your specific brief.',features:['Sandwich and meal options','Guest-count planning','Packing and delivery requirements'],href:'/catering-menu.html',label:'Explore catering menu'},
  {key:'institutional',image:'/assets/service-scenes/institutional-supply.webp',alt:'Rendered stacks of books, school stationery, notebooks and desk supplies',title:'Supplies that enable.',sub:'SERVICE IMAGE / 003',description:'From notebooks and stationery to everyday institutional items, a clear specification is the first step in sourcing the right goods.',features:['Stationery and print materials','Office and institutional consumables','Specification-based sourcing'],href:'/office-institutional.html',label:'Explore institutional supply'},
  {key:'hygiene',image:'/assets/service-scenes/cleaning-hygiene.webp',alt:'Rendered facility cleaning products, gloves, cleaning cloths, spray bottles and buckets',title:'Spaces, cared for.',sub:'SERVICE IMAGE / 004',description:'Cleaning and hygiene consumables selected around facility requirements, quantity, format and delivery schedule.',features:['Detergents and cleaning tools','Paper and hygiene products','Consumables for facility care'],href:'/cleaning-hygiene.html',label:'Explore hygiene supply'},
  {key:'trading',image:'/assets/service-scenes/general-trading.webp',alt:'Rendered trade and supply boxes, handling trolley and packaged delivery goods',title:'Everything in its place.',sub:'SERVICE IMAGE / 005',description:'Flexible product sourcing and general trading requirements brought together in one structured request, with delivery details captured up front.',features:['General goods and product sourcing','Bulk and individual line-item RFQs','Delivery and fulfilment coordination'],href:'/general-trading.html',label:'Explore general trading'}
 ];
 let selected=0,gl=null,program=null,texture=null,buffer=null,raf=0,last=0,visible=false,broken=false,started=performance.now();
 let mouseX=.52,mouseY=.46,targetX=0,targetY=0,rotX=0,rotY=0,hover=0,hoverTarget=0,scrollY=0;
 let currentImage='',observer=null,dragStart=null;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),contrast=matchMedia('(prefers-contrast: more)');
 const coarse=matchMedia('(pointer:coarse)');
 const connection=navigator.connection||navigator.webkitConnection;
 const lowPower=Number(navigator.deviceMemory||4)<=2||Number(navigator.hardwareConcurrency||4)<=2;
 const shouldFallback=()=>reduced.matches||contrast.matches||Boolean(connection?.saveData)||lowPower;
 const vertex=String.raw`attribute vec2 position;varying vec2 uv;void main(){uv=(position+1.0)*0.5;gl_Position=vec4(position,0.0,1.0);}`;
 const fragment=String.raw`precision mediump float;
 varying vec2 uv;
 uniform sampler2D uImage;
 uniform vec2 pointer;
 uniform float time;
 uniform float strength;
 uniform float depth;
 void main(){
  vec2 d=uv-pointer;
  float lens=exp(-dot(d,d)*13.0)*strength;
  vec2 ripple=normalize(d+vec2(0.0001))*sin(length(d)*35.0-time*2.2)*0.0035*lens;
  vec2 bend=d*lens*.027+ripple;
  vec2 sampleUV=clamp(uv+bend,vec2(.002),vec2(.998));
  vec3 base=texture2D(uImage,sampleUV).rgb;
  vec2 rgbOffset=vec2(.0026,-.0016)*lens;
  vec3 refracted=vec3(
   texture2D(uImage,clamp(sampleUV+rgbOffset,vec2(.002),vec2(.998))).r,
   base.g,
   texture2D(uImage,clamp(sampleUV-rgbOffset,vec2(.002),vec2(.998))).b
  );
  float spec=pow(max(0.0,1.0-abs(uv.x*.76+uv.y*.55-.55-.15*sin(time*.4+depth))),28.0);
  float chrome=.05*spec + .045*lens;
  float edges=pow(1.0-abs(uv.x-.5)*2.0,10.0)*.025;
  vec3 color=mix(base,refracted,.52)+vec3(.94,.75,.48)*(chrome+edges);
  gl_FragColor=vec4(clamp(color,0.0,1.0),1.0);
 }`;
 let uniforms={};
 function makeShader(type,source){
  const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);
  if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){gl.deleteShader(sh);throw Error('shader');}
  return sh;
 }
 function abandon(){
  broken=true;stop();
  stage.dataset.renderer='fallback';
  canvas.style.display='none';
 }
 function setup(){
  if(broken||shouldFallback()||!('WebGLRenderingContext' in window))return false;
  gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,stencil:false,premultipliedAlpha:true,powerPreference:'low-power'});
  if(!gl)return false;
  const vs=makeShader(gl.VERTEX_SHADER,vertex),fs=makeShader(gl.FRAGMENT_SHADER,fragment);
  program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  gl.deleteShader(vs);gl.deleteShader(fs);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('link');
  gl.useProgram(program);
  buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');
  gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  uniforms={
   image:gl.getUniformLocation(program,'uImage'),
   pointer:gl.getUniformLocation(program,'pointer'),
   time:gl.getUniformLocation(program,'time'),
   strength:gl.getUniformLocation(program,'strength'),
   depth:gl.getUniformLocation(program,'depth')
  };
  gl.uniform1i(uniforms.image,0);
  return true;
 }
 function upload(){
  if(!gl||!photo.complete||!photo.naturalWidth||photo.currentSrc!==currentImage&&currentImage)return;
  try{
   if(texture)gl.deleteTexture(texture);
   texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,photo);
   stage.dataset.renderer='webgl';
  }catch(_){abandon()}
 }
 function size(){
  if(!gl)return false;
  const rect=frame.getBoundingClientRect();
  if(rect.width<5||rect.height<5)return false;
  const dpr=Math.min(devicePixelRatio||1,coarse.matches ? 0.85 : 1.35);
  const w=Math.max(1,Math.min(720,Math.round(rect.width*dpr)));
  const h=Math.max(1,Math.min(960,Math.round(rect.height*dpr)));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
  return true;
 }
 function paint(now){
  raf=0;
  if(!visible||document.hidden||broken||shouldFallback())return;
  const speed=coarse.matches?1000/18:1000/30;
  raf=requestAnimationFrame(paint);
  if(now-last<speed)return;
  last=now;
  rotX+=(targetX-rotX)*.12;rotY+=(targetY-rotY)*.12;hover+=(hoverTarget-hover)*.12;
  frame.style.setProperty('--photo-rotate-x',rotX.toFixed(3)+'deg');
  frame.style.setProperty('--photo-rotate-y',rotY.toFixed(3)+'deg');
  frame.style.setProperty('--photo-scroll',scrollY.toFixed(2)+'px');
  if(!gl||!texture||!size())return;
  try{
   gl.useProgram(program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
   gl.uniform2f(uniforms.pointer,mouseX,1-mouseY);
   gl.uniform1f(uniforms.time,(now-started)/1000);
   gl.uniform1f(uniforms.strength,hover);
   gl.uniform1f(uniforms.depth,scrollY/30);
   gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  }catch(_){abandon()}
 }
 function stop(){if(raf)cancelAnimationFrame(raf);raf=0}
 function play(){
  if(!visible||document.hidden||broken||shouldFallback())return;
  if(!raf)raf=requestAnimationFrame(paint);
 }
 function select(index,focus=false){
  selected=(index+scenes.length)%scenes.length;
  const scene=scenes[selected];
  tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===selected));tab.tabIndex=i===selected?0:-1;});
  if(focus)tabs[selected].focus({preventScroll:true});
  stage.dataset.scene=scene.key;
  sub.textContent=scene.sub;title.textContent=scene.title;body.textContent=scene.description;
  list.replaceChildren(...scene.features.map(value=>{const li=document.createElement('li');li.textContent=value;return li}));
  link.href=scene.href;
  link.replaceChildren(document.createTextNode(scene.label+' '),(()=>{const span=document.createElement('span');span.textContent='↗';span.setAttribute('aria-hidden','true');return span})());
  detail.setAttribute('aria-labelledby',tabs[selected].id);
  count.textContent=String(selected+1).padStart(2,'0');
  currentImage='';
  stage.dataset.renderer='fallback';
  stage.classList.remove('is-switching');
  if(!reduced.matches){void stage.offsetWidth;stage.classList.add('is-switching')}
  photo.alt=scene.alt;
  photo.src=scene.image;
  frame.style.setProperty('--amt-photo-image',`url("${scene.image}")`);
  const url=photo.currentSrc||photo.src;
  if(photo.complete&&photo.naturalWidth){currentImage=url;upload();}
 }
 tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>select(index));
  tab.addEventListener('keydown',e=>{
   const next=e.key==='ArrowRight'||e.key==='ArrowDown'?selected+1:e.key==='ArrowLeft'||e.key==='ArrowUp'?selected-1:e.key==='Home'?0:e.key==='End'?scenes.length-1:null;
   if(next===null)return;e.preventDefault();select(next,true);
  });
  tab.addEventListener('mouseenter',()=>{if(!connection?.saveData){const next=new Image();next.src=scenes[index].image;}});
 });
 photo.addEventListener('load',()=>{currentImage=photo.currentSrc||photo.src;upload();play()});
 photo.addEventListener('error',()=>{stage.dataset.renderer='fallback';canvas.style.display='none'});
 function pointer(e){
  const box=stage.getBoundingClientRect();
  mouseX=Math.min(1,Math.max(0,(e.clientX-box.left)/Math.max(1,box.width)));
  mouseY=Math.min(1,Math.max(0,(e.clientY-box.top)/Math.max(1,box.height)));
  stage.style.setProperty('--amt-mx',(mouseX*100).toFixed(1)+'%');
  stage.style.setProperty('--amt-my',(mouseY*100).toFixed(1)+'%');
  stage.style.setProperty('--amt-sx',((mouseX-.5)*-18).toFixed(1)+'px');
  stage.style.setProperty('--amt-sy',((mouseY-.5)*-18).toFixed(1)+'px');
  if(!coarse.matches){
   targetX=(.5-mouseY)*11;targetY=(mouseX-.5)*17;hoverTarget=1;
  }
 }
 stage.addEventListener('pointermove',pointer,{passive:true});
 stage.addEventListener('pointerenter',()=>{hoverTarget=1});
 stage.addEventListener('pointerleave',()=>{hoverTarget=0;targetX=0;targetY=0});
 stage.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')dragStart={x:e.clientX,y:e.clientY,id:e.pointerId}});
 stage.addEventListener('pointerup',e=>{
  if(!dragStart||e.pointerId!==dragStart.id)return;
  const dx=e.clientX-dragStart.x,dy=e.clientY-dragStart.y;
  if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.25)select(selected+(dx<0?1:-1));
  dragStart=null;
 });
 stage.addEventListener('pointercancel',()=>{dragStart=null});
 stage.style.touchAction='pan-y';
 function onScroll(){
  const bounds=section.getBoundingClientRect(),progress=Math.max(-1,Math.min(1,(innerHeight*.5-bounds.top)/Math.max(1,bounds.height)-.5));
  scrollY=progress*24;
 }
 addEventListener('scroll',onScroll,{passive:true});onScroll();
 const mediaChange=()=>{if(shouldFallback()){stop();stage.dataset.renderer='fallback'}else{if(gl&&texture)stage.dataset.renderer='webgl';play()}};
 reduced.addEventListener?.('change',mediaChange);contrast.addEventListener?.('change',mediaChange);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();stop();stage.dataset.renderer='fallback';gl=null;texture=null});
 canvas.addEventListener('webglcontextrestored',()=>{
  try{if(setup()){currentImage=photo.currentSrc||photo.src;upload();play()}}catch(_){abandon()}
 });
 document.addEventListener('visibilitychange',()=>document.hidden?stop():play(),{passive:true});
 if('IntersectionObserver' in window){
  observer=new IntersectionObserver(entries=>{visible=entries.some(x=>x.isIntersecting);if(visible)play();else stop()},{rootMargin:'90px 0px',threshold:0});
  observer.observe(stage);
 }else{visible=true}
 addEventListener('resize',()=>{if(gl)size()},{passive:true});
 try{
  if(!shouldFallback()&&setup()){if(photo.complete&&photo.naturalWidth){currentImage=photo.currentSrc||photo.src;upload()}}
  else{stage.dataset.renderer='fallback'}
 }catch(_){abandon()}
 select(0);
 play();
})();