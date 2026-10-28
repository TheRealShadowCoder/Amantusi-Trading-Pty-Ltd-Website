/* AMANTUSI: one 10-second, seamless, photo-textured WebGL1 glass loop.
   ONE small GPU canvas, ONE real service WebP, only when visible on capable desktops.
   All links, images and content remain ordinary accessible DOM. */
(() => {
 'use strict';
 const hero=document.querySelector('.am-landing-hero');
 const tile=hero?.querySelector('.am-glass-tile--catering');
 const photo=tile?.querySelector('img');
 if(!hero||!tile||!photo)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const contrast=matchMedia('(prefers-contrast: more)');
 const coarse=matchMedia('(pointer: coarse)');
 const network=navigator.connection||navigator.webkitConnection;
 const lowPower=Number(navigator.deviceMemory||4)<4||Number(navigator.hardwareConcurrency||4)<4;
 const motionOff=()=>reduced.matches||contrast.matches||Boolean(network?.saveData)||coarse.matches||innerWidth<=980||lowPower;
 if(motionOff())hero.dataset.amLoopState='fallback';
 let visible=false,gl=null,program=null,texture=null,buffer=null,frame=0,prev=0,started=0,disabled=false,initScheduled=false;
 let canvas=null,observer=null,rect=null;
 const vs=String.raw`attribute vec2 aPosition;
 attribute vec2 aUv;
 varying vec2 vUv;
 uniform float uPhase;
 void main(){
  float angle=.045*sin(uPhase);
  vec3 p=vec3(aPosition.x*cos(angle),aPosition.y,-aPosition.x*sin(angle));
  float perspective=1.0/(1.0-p.z*.09);
  gl_Position=vec4(p.xy*perspective,0.0,1.0);
  vUv=aUv;
 }`;
 const fs=String.raw`precision mediump float;
 varying vec2 vUv;
 uniform sampler2D uPhoto;
 uniform float uPhase;
 uniform vec2 uPointer;
 uniform vec2 uCover;
 void main(){
  float breathe=sin(uPhase);
  vec2 uv=(vUv-.5)*uCover+.5;
  vec2 delta=vUv-uPointer;
  float light=exp(-dot(delta,delta)*16.0);
  vec2 warp=vec2(sin(vUv.y*14.0+2.0*breathe),cos(vUv.x*11.0+2.0*cos(uPhase)));
  uv=clamp(uv+warp*.0022+light*.003*normalize(delta+vec2(.001)),vec2(.002),vec2(.998));
  vec3 color=texture2D(uPhoto,uv).rgb;
  float sheen=pow(max(0.0,1.0-abs(vUv.x*.92+vUv.y*.46-.46-.11*breathe)),26.0);
  color+=vec3(.91,.71,.43)*(.11*sheen+.025*light);
  gl_FragColor=vec4(min(color,vec3(1.0)),.96);
 }`;
 function compile(type,source){
  const shader=gl.createShader(type);
  gl.shaderSource(shader,source);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);throw Error('webgl shader compile');}
  return shader;
 }
 function pause(){
  if(frame)cancelAnimationFrame(frame);
  frame=0;
  if(hero.dataset.amLoopState==='playing')hero.dataset.amLoopState='paused';
 }
 function fallback(){
  pause();disabled=true;gl=null;
  hero.dataset.amLoopState='fallback';
  tile.removeAttribute('data-glass-webgl');
  if(canvas){canvas.remove();canvas=null;}
 }
 let u={};
 function initialise(){
  if(gl||disabled||motionOff()||!visible||document.hidden)return;
  if(!photo.complete||!photo.naturalWidth)return;
  canvas=document.createElement('canvas');canvas.className='am-glass-webgl';
  canvas.setAttribute('aria-hidden','true');canvas.setAttribute('role','presentation');
  tile.insertBefore(canvas,tile.querySelector('.am-glass-tile__gloss'));
  gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,stencil:false,powerPreference:'low-power',premultipliedAlpha:false,preserveDrawingBuffer:false});
  if(!gl){fallback();return;}
  try{
   const vert=compile(gl.VERTEX_SHADER,vs),frag=compile(gl.FRAGMENT_SHADER,fs);
   program=gl.createProgram();gl.attachShader(program,vert);gl.attachShader(program,frag);gl.linkProgram(program);
   gl.deleteShader(vert);gl.deleteShader(frag);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('webgl program link');
   gl.useProgram(program);
   buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
   // xy + uv; one textured, 3D-transformed quad (4 vertices).
   gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,0,0,1,-1,1,0,-1,1,0,1,1,1,1,1]),gl.STATIC_DRAW);
   const stride=4*Float32Array.BYTES_PER_ELEMENT;
   for(const [name,offset] of [['aPosition',0],['aUv',2]]){
    const loc=gl.getAttribLocation(program,name);
    gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,stride,offset*4);
   }
   u.phase=gl.getUniformLocation(program,'uPhase');u.pointer=gl.getUniformLocation(program,'uPointer');
   u.cover=gl.getUniformLocation(program,'uCover');u.photo=gl.getUniformLocation(program,'uPhoto');
   texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,photo);
   gl.uniform1i(u.photo,0);
   canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fallback()},{passive:false});
   // On context restoration preserve the original photographic fallback rather than recreating buffers in a hidden tab.
   tile.dataset.glassWebgl='active';
   hero.dataset.amLoopState='ready';
  }catch(_){fallback();}
 }
 let mouse=[.5,.5];
 function resize(){
  if(!rect)rect=tile.getBoundingClientRect();
  const box=rect;
  if(box.width<2||box.height<2)return false;
  // 1x DPR, max 400x550: avoid expensive full-resolution GPU redraws.
  const width=Math.max(1,Math.min(400,Math.round(box.width)));
  const height=Math.max(1,Math.min(550,Math.round(box.height)));
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);}
  const sourceRatio=photo.naturalWidth/photo.naturalHeight,displayRatio=width/height;
  const coverX=displayRatio>sourceRatio?1:sourceRatio/displayRatio;
  const coverY=displayRatio>sourceRatio?displayRatio/sourceRatio:1;
  gl.uniform2f(u.cover,coverX,coverY);
  return true;
 }
 function render(now){
  frame=0;
  if(!visible||document.hidden||motionOff()||!gl||disabled){pause();return;}
  frame=requestAnimationFrame(render);
  if(now-prev<1000/20)return;prev=now;
  if(!started)started=now;
  try{
   if(!resize())return;
   // Exactly 10.000 seconds; start and end states are identical.
   const phase=((now-started)%10000)/10000*Math.PI*2;
   gl.useProgram(program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
   gl.uniform1f(u.phase,phase);
   gl.uniform2f(u.pointer,mouse[0],1-mouse[1]);
   gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
   if(hero.dataset.amLoopState!=='playing')hero.dataset.amLoopState='playing';
  }catch(_){fallback()}
 }
 function play(){
  if(!visible||document.hidden||motionOff()||disabled)return;
  if(!gl){if(!initScheduled){initScheduled=true;
    const schedule=()=>{initScheduled=false;initialise();if(gl)play();};
    if('requestIdleCallback' in window)requestIdleCallback(schedule,{timeout:650});
    else setTimeout(schedule,120);
   }return;}
  if(!frame)frame=requestAnimationFrame(render);
 }
 function visibility(){
  hero.dataset.amLoopVisible=visible&&!document.hidden?'true':'false';
  if(visible&&!document.hidden)play();else pause();
 }
 tile.addEventListener('pointermove',event=>{
  if(event.pointerType!=='mouse')return;
  const box=rect||tile.getBoundingClientRect();
  mouse=[Math.min(1,Math.max(0,(event.clientX-box.left)/Math.max(1,box.width))),
         Math.min(1,Math.max(0,(event.clientY-box.top)/Math.max(1,box.height)))];
 },{passive:true});
 reduced.addEventListener?.('change',()=>{if(motionOff())pause();else play()});
 contrast.addEventListener?.('change',()=>{if(motionOff())pause();else play()});
 document.addEventListener('visibilitychange',visibility,{passive:true});
 addEventListener('resize',()=>{rect=null;if(motionOff())pause();else play()},{passive:true});
 if('IntersectionObserver' in window){
  observer=new IntersectionObserver(entries=>{visible=entries.some(x=>x.isIntersecting);visibility()},{threshold:0,rootMargin:'30px'});
  observer.observe(hero);
 }else{visible=true;visibility();}
})();