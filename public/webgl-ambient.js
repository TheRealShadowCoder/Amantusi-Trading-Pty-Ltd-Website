/* Low-power, progressive WebGL brand-light renderer. */
(() => {
 'use strict';
 const hero=document.querySelector('.hero, .menu-hero, .sector-hero, .profile-hero, .brochure-cover');
 if(!hero)return;
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const contrast=matchMedia('(prefers-contrast: more)');
 const coarse=matchMedia('(pointer: coarse)');
 const network=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
 const lowMemory=Number(navigator.deviceMemory||4)<=2;
 const lowCPU=Number(navigator.hardwareConcurrency||4)<=2;
 if(motion.matches||contrast.matches||network?.saveData||lowMemory||lowCPU||!('WebGLRenderingContext' in window)){
   hero.dataset.webglState='fallback';return;
 }
 const canvas=document.createElement('canvas');
 canvas.className='ambient-webgl-canvas';
 canvas.setAttribute('aria-hidden','true');
 canvas.setAttribute('role','presentation');
 hero.classList.add('ambient-webgl-host');
 hero.prepend(canvas);
 const mobile=coarse.matches||innerWidth<=700;
 hero.dataset.webglTier=mobile?'mobile':'desktop';
 hero.dataset.webglState='idle';
 const vsSource='attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}';
 const fsSource="precision mediump float;\n uniform vec2 resolution;\n uniform float time;\n void main(){\n  vec2 uv=gl_FragCoord.xy/resolution;\n  vec2 p=(uv-vec2(.52,.47))*vec2(resolution.x/max(1.,resolution.y),1.);\n  float t=time*.1;\n  float r=length(p);\n  float theta=atan(p.y,p.x);\n  float arcs=pow(.5+.5*cos(8.*r-1.5*t+2.4*sin(theta*2.+t*.3)),5.);\n  float wave=.5+.5*sin(p.x*5.6+p.y*2.9+t+sin(p.y*4.+t*.5));\n  float halo=exp(-4.5*length(p-vec2(.38,.06)));\n  float trail=exp(-7.*abs(p.y-.18*sin(2.5*p.x+t*.7)));\n  float shimmer=(.22*arcs+.23*trail+.12*wave)*exp(-1.8*r);\n  float strength=clamp(shimmer+halo*.38,0.,.68);\n  vec3 gold=vec3(.77,.58,.25);\n  vec3 sea=vec3(.08,.39,.49);\n  vec3 color=mix(sea,gold,clamp(uv.x*.65+arcs*.32,0.,1.));\n  gl_FragColor=vec4(color,strength);\n }";
 let gl=null,program=null,resLoc=null,timeLoc=null;
 let frame=0,lastFrame=0,visible=false,started=0,stopped=false,observer=null;
 function compile(type,source){
  const shader=gl.createShader(type);
  gl.shaderSource(shader,source);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
   gl.deleteShader(shader);throw new Error('shader compilation');
  }
  return shader;
 }
 function setup(){
  gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,stencil:false,premultipliedAlpha:true,preserveDrawingBuffer:false,powerPreference:'low-power'});
  if(!gl)throw new Error('no WebGL context');
  const vertex=compile(gl.VERTEX_SHADER,vsSource),fragment=compile(gl.FRAGMENT_SHADER,fsSource);
  program=gl.createProgram();
  gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
  gl.deleteShader(vertex);gl.deleteShader(fragment);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('shader link');
  gl.useProgram(program);
  const buffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const attr=gl.getAttribLocation(program,'a');
  gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
  resLoc=gl.getUniformLocation(program,'resolution');
  timeLoc=gl.getUniformLocation(program,'time');
  gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);
  hero.dataset.webglState='ready';
 }
 function resize(){
  const rect=hero.getBoundingClientRect();
  if(rect.width<4||rect.height<4)return false;
  const dpr=Math.min(devicePixelRatio||1,mobile?.9:1.4);
  const w=Math.max(1,Math.min(1400,Math.round(rect.width*dpr)));
  const h=Math.max(1,Math.min(900,Math.round(rect.height*dpr)));
  if(w!==canvas.width||h!==canvas.height){
   canvas.width=w;canvas.height=h;
   gl.viewport(0,0,w,h);
  }
  return true;
 }
 function fallback(){
  stopped=true;
  if(frame)cancelAnimationFrame(frame);
  frame=0;observer?.disconnect();canvas.remove();
  hero.dataset.webglState='fallback';
 }
 function draw(now){
  frame=0;
  if(stopped||!visible||document.hidden||motion.matches||contrast.matches)return;
  frame=requestAnimationFrame(draw);
  if(now-lastFrame<1000/(mobile?18:30))return;
  lastFrame=now;
  try{
   if(!resize())return;
   gl.useProgram(program);
   gl.uniform2f(resLoc,canvas.width,canvas.height);
   gl.uniform1f(timeLoc,(now-started)/1000);
   gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
   hero.dataset.webglState='active';
  }catch(_){fallback()}
 }
 function play(){
  if(stopped||!visible||document.hidden||frame||motion.matches||contrast.matches)return;
  if(!gl){try{setup()}catch(_){fallback();return}}
  if(!started)started=performance.now();
  frame=requestAnimationFrame(draw);
 }
 function pause(){
  if(frame)cancelAnimationFrame(frame);
  frame=0;
  if(!stopped&&hero.dataset.webglState==='active')hero.dataset.webglState='paused';
 }
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();pause();gl=null;hero.dataset.webglState='context-lost'});
 canvas.addEventListener('webglcontextrestored',()=>{try{setup();play()}catch(_){fallback()}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else play()},{passive:true});
 motion.addEventListener?.('change',()=>{if(motion.matches)pause();else play()});
 contrast.addEventListener?.('change',()=>{if(contrast.matches)pause();else play()});
 if('IntersectionObserver' in window){
  observer=new IntersectionObserver(entries=>{
   visible=entries.some(x=>x.isIntersecting);
   if(visible)play();else pause();
  },{rootMargin:'100px 0px',threshold:0});
  observer.observe(hero);
 }else{visible=true;play()}
 addEventListener('resize',()=>{if(!stopped&&gl)resize()},{passive:true});
})();