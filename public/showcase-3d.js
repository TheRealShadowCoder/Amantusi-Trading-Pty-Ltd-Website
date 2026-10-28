/* Amantusi Material Studies — procedural 3D objects, WebGL1, no network or library.
   Every scene is illustrative and derived from an existing Amantusi service category.
   Reduced motion, slow GPUs and WebGL failures retain the inline SVG fallback. */
(() => {
  'use strict';
  const section = document.getElementById('immersive');
  if (!section) return;
  const stage = section.querySelector('[data-amt-stage]');
  const canvas = stage.querySelector('.amt-objects-canvas');
  const tabs = [...section.querySelectorAll('[data-amt-item]')];
  const title = section.querySelector('[data-amt-title]');
  const subtitle = section.querySelector('[data-amt-subtitle]');
  const description = section.querySelector('[data-amt-description]');
  const features = section.querySelector('[data-amt-features]');
  const link = section.querySelector('[data-amt-link]');
  const counter = section.querySelector('[data-amt-counter]');
  const detail = section.querySelector('#amt-showcase-detail');
  const fallbackArts = [...section.querySelectorAll('[data-amt-fallback]')];
  const catalogue = [
    {key:'catering',title:'Considered catering.',sub:'SERVICE STUDY / 001',description:'From meeting refreshments to larger functions, we shape the catering brief around guest numbers, service requirements and venue details.',features:['Meeting and event catering','Menu and quantity planning','Venue and delivery coordination'],href:'/corporate-catering.html',label:'Explore catering services'},
    {key:'meals',title:'Meals, thoughtfully packed.',sub:'SERVICE STUDY / 002',description:'Ready-to-serve and packed-meal concepts for meetings, functions and institutional catering requirements, quoted around your specific brief.',features:['Sandwich and meal options','Guest-count planning','Packing and delivery requirements'],href:'/catering-menu.html',label:'Explore catering menu'},
    {key:'institutional',title:'Supplies that enable.',sub:'SERVICE STUDY / 003',description:'From notebooks and stationery to everyday institutional items, a clear specification is the first step in sourcing the right goods.',features:['Stationery and print materials','Office and institutional consumables','Specification-based sourcing'],href:'/office-institutional.html',label:'Explore institutional supply'},
    {key:'hygiene',title:'Spaces, cared for.',sub:'SERVICE STUDY / 004',description:'Cleaning and hygiene consumables selected around facility requirements, quantity, format and delivery schedule.',features:['Detergents and cleaning tools','Paper and hygiene products','Consumables for facility care'],href:'/cleaning-hygiene.html',label:'Explore hygiene supply'},
    {key:'trading',title:'Everything in its place.',sub:'SERVICE STUDY / 005',description:'Flexible product sourcing and general trading requirements brought together in one structured request, with delivery details captured up front.',features:['General goods and product sourcing','Bulk and individual line-item RFQs','Delivery and fulfilment coordination'],href:'/general-trading.html',label:'Explore general trading'}
  ];
  let selected = 0;
  let switchAt = 0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const contrast = matchMedia('(prefers-contrast: more)');
  const network = navigator.connection || navigator.webkitConnection;
  const coarse = matchMedia('(pointer: coarse)');
  const lowPower = Number(navigator.deviceMemory || 4) <= 2 || Number(navigator.hardwareConcurrency || 4) <= 2;
  const start = performance.now();
  let pointerX = 0, pointerY = 0, targetYaw = 0, yaw = 0, targetPitch = 0, pitch = 0;
  let dragging = false, dragStartX = 0, dragStartY = 0, originYaw = 0, originPitch = 0, pointerId = null;
  let sceneVisible = false, raf = 0, last = 0, scrollDepth = 0, gl = null, stopped = false, observer = null;
  let program = null, meshes = null, uniforms = {}, attributes = {}, bufferWidth = 0, bufferHeight = 0;
  const C = {
    navy:[.04,.15,.21], deep:[.025,.085,.13], teal:[.20,.48,.54], tealLight:[.51,.71,.73],
    gold:[.76,.55,.25], goldLight:[.98,.84,.51], ivory:[.88,.89,.83], white:[.98,.97,.88],
    brown:[.39,.27,.13], orange:[.86,.42,.13], green:[.31,.59,.38], red:[.58,.21,.14]
  };
  function select(index, focus=false) {
    selected = (index + catalogue.length) % catalogue.length;
    const item = catalogue[selected];
    tabs.forEach((tab,i) => {
      tab.setAttribute('aria-selected',String(i===selected));
      tab.tabIndex = i===selected ? 0 : -1;
    });
    if(focus) tabs[selected].focus({preventScroll:true});
    stage.dataset.scene = item.key;
    title.textContent = item.title;
    subtitle.textContent = item.sub;
    description.textContent = item.description;
    features.replaceChildren(...item.features.map(value=>{
      const li=document.createElement('li'); li.textContent=value; return li;
    }));
    link.href=item.href;
    link.replaceChildren(document.createTextNode(item.label+' '),(()=>{
      const span=document.createElement('span');span.textContent='↗';span.setAttribute('aria-hidden','true');return span;
    })());
    detail.setAttribute('aria-labelledby',tabs[selected].id);
    counter.textContent=String(selected+1).padStart(2,'0');
    fallbackArts.forEach(art=>{if(art.dataset.amtFallback===item.key)art.removeAttribute('hidden');else art.setAttribute('hidden','');});
    switchAt=performance.now();
    stage.classList.remove('is-switching');
    if(!reduce.matches) {
      void stage.offsetWidth;
      stage.classList.add('is-switching');
    }
    renderOnce();
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>select(index));
    tab.addEventListener('keydown',event=>{
      const next=event.key==='ArrowRight'||event.key==='ArrowDown' ? selected+1 :
        event.key==='ArrowLeft'||event.key==='ArrowUp' ? selected-1 :
        event.key==='Home' ? 0 : event.key==='End' ? catalogue.length-1 : null;
      if(next===null)return;
      event.preventDefault();select(next,true);
    });
  });
  stage.addEventListener('pointerdown',event=>{
    if(event.pointerType==='mouse'&&event.button!==0)return;
    dragging=true;pointerId=event.pointerId;
    dragStartX=event.clientX;dragStartY=event.clientY;
    originYaw=targetYaw;originPitch=targetPitch;
    if(event.pointerType==='mouse')stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener('pointermove',event=>{
    const rect=stage.getBoundingClientRect();
    const dx=(event.clientX-rect.left)/Math.max(1,rect.width)-.5;
    const dy=(event.clientY-rect.top)/Math.max(1,rect.height)-.5;
    pointerX=dx;pointerY=dy;
    stage.style.setProperty('--amt-mx',`${(dx+.5)*100}%`);
    stage.style.setProperty('--amt-my',`${(dy+.5)*100}%`);
    stage.style.setProperty('--amt-sx',`${(-dx*10).toFixed(1)}px`);
    stage.style.setProperty('--amt-sy',`${(-dy*10).toFixed(1)}px`);
    if(dragging&&event.pointerId===pointerId&&event.pointerType==='mouse'){
      targetYaw=originYaw+(event.clientX-dragStartX)*.007;
      targetPitch=Math.max(-.5,Math.min(.5,originPitch+(event.clientY-dragStartY)*.004));
    }else if(!dragging&&!coarse.matches){targetYaw=dx*.40;targetPitch=-dy*.16}
    renderOnce();
  },{passive:true});
  function stopDrag(event){
    if(!dragging||event.pointerId!==pointerId)return;
    if(event.pointerType!=='mouse'&&Math.abs(event.clientX-dragStartX)>72&&
      Math.abs(event.clientX-dragStartX)>Math.abs(event.clientY-dragStartY)*1.2){
      select(selected+(event.clientX<dragStartX?1:-1));
    }
    dragging=false;pointerId=null;
  }
  stage.addEventListener('pointerup',stopDrag);
  stage.addEventListener('pointercancel',stopDrag);
  stage.addEventListener('lostpointercapture',()=>{dragging=false;pointerId=null});
  stage.addEventListener('pointerleave',()=>{
    if(!dragging){targetYaw=0;targetPitch=0;stage.style.setProperty('--amt-sx','0px');stage.style.setProperty('--amt-sy','0px')}
  });
  stage.style.touchAction='pan-y';
  function onScroll(){
    const bounds=section.getBoundingClientRect();
    const range=bounds.height+innerHeight;
    scrollDepth=Math.max(-1,Math.min(1,((innerHeight-bounds.top)/range-.5)*2));
  }
  addEventListener('scroll',onScroll,{passive:true});onScroll();
  // Keep page content in regular document flow. Scrolling adjusts model depth only.
  function identity(){return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1])}
  function multiply(a,b){
    const out=new Float32Array(16);
    for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];
    return out;
  }
  function translate(x,y,z){const m=identity();m[12]=x;m[13]=y;m[14]=z;return m}
  function scale(x,y,z){const m=identity();m[0]=x;m[5]=y;m[10]=z;return m}
  function rotX(a){const m=identity(),c=Math.cos(a),s=Math.sin(a);m[5]=c;m[6]=s;m[9]=-s;m[10]=c;return m}
  function rotY(a){const m=identity(),c=Math.cos(a),s=Math.sin(a);m[0]=c;m[2]=-s;m[8]=s;m[10]=c;return m}
  function rotZ(a){const m=identity(),c=Math.cos(a),s=Math.sin(a);m[0]=c;m[1]=s;m[4]=-s;m[5]=c;return m}
  function perspective(fov,aspect,near,far){const m=new Float32Array(16);const f=1/Math.tan(fov/2);m[0]=f/aspect;m[5]=f;m[10]=(far+near)/(near-far);m[11]=-1;m[14]=2*far*near/(near-far);return m}
  function surfaceBox(){
    const p=[],n=[],ids=[];
    const faces=[
      {normal:[0,0,1],verts:[[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]]},
      {normal:[0,0,-1],verts:[[.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5]]},
      {normal:[1,0,0],verts:[[.5,-.5,.5],[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5]]},
      {normal:[-1,0,0],verts:[[-.5,-.5,-.5],[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5]]},
      {normal:[0,1,0],verts:[[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5],[-.5,.5,-.5]]},
      {normal:[0,-1,0],verts:[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5]]}
    ];
    faces.forEach((face,i)=>{
      face.verts.forEach(v=>{p.push(...v);n.push(...face.normal)});
      const b=i*4;ids.push(b,b+1,b+2,b,b+2,b+3);
    });return {p,n,ids};
  }
  function sphere(u=20,v=14){const p=[],n=[],ids=[];
    for(let y=0;y<=v;y++){const phi=y*Math.PI/v;for(let x=0;x<=u;x++){
      const theta=x*2*Math.PI/u,px=Math.sin(phi)*Math.cos(theta),py=Math.cos(phi),pz=Math.sin(phi)*Math.sin(theta);
      p.push(px*.5,py*.5,pz*.5);n.push(px,py,pz);
    }}
    for(let y=0;y<v;y++)for(let x=0;x<u;x++){let a=y*(u+1)+x,b=a+u+1;ids.push(a,b,a+1,b,b+1,a+1)}
    return {p,n,ids};
  }
  function cylinder(top=.5,bottom=.5,N=28){const p=[],n=[],ids=[];
    for(let j=0;j<=N;j++){
      const a=j*2*Math.PI/N,ca=Math.cos(a),sa=Math.sin(a);
      const normal=[ca,Math.max(-.25,Math.min(.25,(bottom-top))),sa];
      p.push(ca*bottom,-.5,sa*bottom,ca*top,.5,sa*top);n.push(...normal,...normal);
    }
    for(let j=0;j<N;j++){const k=j*2;ids.push(k,k+1,k+2,k+1,k+3,k+2)}
    for(const topFace of [true,false]){
      const center=p.length/3;
      p.push(0,topFace?.5:-.5,0);n.push(0,topFace?1:-1,0);
      for(let j=0;j<=N;j++){
        const a=j*2*Math.PI/N,rr=topFace?top:bottom;
        p.push(Math.cos(a)*rr,topFace?.5:-.5,Math.sin(a)*rr);
        n.push(0,topFace?1:-1,0);
        if(j<N){if(topFace)ids.push(center,center+1+j,center+2+j);else ids.push(center,center+2+j,center+1+j)}
      }
    }return {p,n,ids};
  }
  function torus(N=32,M=10){const p=[],n=[],ids=[];const R=.5,r=.11;
    for(let j=0;j<=N;j++){let a=j*2*Math.PI/N;for(let k=0;k<=M;k++){
      let b=k*2*Math.PI/M,ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);
      p.push((R+r*cb)*ca,r*sb,(R+r*cb)*sa);n.push(ca*cb,sb,sa*cb);
    }}
    for(let j=0;j<N;j++)for(let k=0;k<M;k++){
      const a=j*(M+1)+k,b=a+M+1;ids.push(a,a+1,b,a+1,b+1,b);
    }return {p,n,ids};
  }
  const catalogueGeometry={box:surfaceBox(),sphere:sphere(),cylinder:cylinder(),cone:cylinder(.16,.5),torus:torus()};
  function compile(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const log=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error('Shader compile: '+log)}return shader}
  const vs=`attribute vec3 aPosition;attribute vec3 aNormal;uniform mat4 uMVP;uniform mat4 uModel;varying vec3 vNormal;varying vec3 vPos;void main(){vec4 w=uModel*vec4(aPosition,1.);vPos=w.xyz;vNormal=normalize(mat3(uModel)*aNormal);gl_Position=uMVP*vec4(aPosition,1.);}`;
  const fs=`precision mediump float;uniform vec3 uColor;uniform float uShine;varying vec3 vNormal;varying vec3 vPos;void main(){vec3 n=normalize(vNormal);vec3 l=normalize(vec3(-.55,.85,1.4));vec3 eye=normalize(vec3(0.,1.5,8.)-vPos);float diffuse=max(dot(n,l),0.);float rim=pow(1.-abs(dot(n,eye)),2.2);float spec=pow(max(dot(reflect(-l,n),eye),0.),16.);vec3 col=uColor*(.3+.78*diffuse)+vec3(.95,.85,.67)*spec*(.4+.9*uShine)+vec3(.43,.69,.74)*rim*(.16+.25*uShine);col=pow(clamp(col,0.,1.),vec3(.88));gl_FragColor=vec4(col,1.);}`;
  function initGL(){
    gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:true,stencil:false,premultipliedAlpha:true,preserveDrawingBuffer:false,powerPreference:'low-power'});
    if(!gl)throw Error('WebGL unavailable');
    const a=compile(gl.VERTEX_SHADER,vs),b=compile(gl.FRAGMENT_SHADER,fs);
    program=gl.createProgram();gl.attachShader(program,a);gl.attachShader(program,b);gl.linkProgram(program);
    gl.deleteShader(a);gl.deleteShader(b);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('WebGL program link failed');
    gl.useProgram(program);
    attributes={position:gl.getAttribLocation(program,'aPosition'),normal:gl.getAttribLocation(program,'aNormal')};
    uniforms={mvp:gl.getUniformLocation(program,'uMVP'),model:gl.getUniformLocation(program,'uModel'),color:gl.getUniformLocation(program,'uColor'),shine:gl.getUniformLocation(program,'uShine')};
    meshes={};for(const [name,data] of Object.entries(catalogueGeometry)){
      const pb=gl.createBuffer(),nb=gl.createBuffer(),ib=gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER,pb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data.p),gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER,nb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data.n),gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(data.ids),gl.STATIC_DRAW);
      meshes[name]={pb,nb,ib,length:data.ids.length};
    }
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.BLEND);gl.clearColor(0,0,0,0);
    stage.dataset.renderer='webgl';
  }
  function fail(){stopped=true;if(raf)cancelAnimationFrame(raf);raf=0;stage.dataset.renderer='fallback';canvas.style.display='none';gl=null;observer?.disconnect()}
  function resize(){
    if(!gl)return;
    const b=stage.getBoundingClientRect(),cap=coarse.matches?1:1.5;
    const dpr=Math.min(devicePixelRatio||1,cap),w=Math.max(1,Math.min(1100,Math.round(b.width*dpr))),h=Math.max(1,Math.min(950,Math.round(b.height*dpr)));
    if(w!==bufferWidth||h!==bufferHeight){canvas.width=w;canvas.height=h;bufferWidth=w;bufferHeight=h;gl.viewport(0,0,w,h)}
  }
  function object(mesh,x,y,z,sx,sy,sz,color,rx=0,ry=0,rz=0,shine=.55){
    const local=multiply(translate(x,y,z),multiply(rotY(ry),multiply(rotX(rx),multiply(rotZ(rz),scale(sx,sy,sz)))));
    const model=multiply(group,local),mvp=multiply(camera,model),m=meshes[mesh];
    if(!m)return;
    gl.uniformMatrix4fv(uniforms.mvp,false,mvp);gl.uniformMatrix4fv(uniforms.model,false,model);
    gl.uniform3fv(uniforms.color,color);gl.uniform1f(uniforms.shine,shine);
    gl.bindBuffer(gl.ARRAY_BUFFER,m.pb);gl.enableVertexAttribArray(attributes.position);gl.vertexAttribPointer(attributes.position,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,m.nb);gl.enableVertexAttribArray(attributes.normal);gl.vertexAttribPointer(attributes.normal,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.ib);gl.drawElements(gl.TRIANGLES,m.length,gl.UNSIGNED_SHORT,0);
  }
  let group=identity(),camera=identity();
  function geometryForScene(t){
    const cube=(...args)=>object('box',...args),ball=(...args)=>object('sphere',...args),tube=(...args)=>object('cylinder',...args),ring=(...args)=>object('torus',...args);
    const wobble=Math.sin(t*.7)*.07;
    if(selected===0){
      // Oval stainless tray, covered buffet dish and warm plated food.
      cube(0,-1,0,3.15,.18,1.9,C.goldLight,0,0,0,.94);
      cube(0,-.89,0,2.9,.15,1.7,C.tealLight,0,0,0,.9);
      tube(0,-.73,0,2.05,.23,1.2,C.gold,0,0,0,.89);
      ball(0,-.04,0,2.12,1.55,1.45,C.tealLight,0,.06+wobble,0,.95);
      tube(0,.79,0,.17,.26,.17,C.goldLight,0,0,0,.98);
      ball(0,.97,0,.30,.24,.30,C.goldLight,0,0,0,1);
      // A small side plate and bread/fruit make the category recognisable.
      tube(-1.35,-.68,.75,.80,.13,.80,C.ivory,0,0,0,.55);
      ring(-1.35,-.58,.75,.78,.12,.78,C.gold,.0,0,0,.83);
      ball(-1.34,-.43,.74,.32,.28,.32,C.orange,0,0,0,.2);
    }else if(selected===1){
      // Packed meal in a divided lunchbox: sandwich, fresh fruit and juice.
      cube(-.18,-.75,0,2.85,.58,1.97,C.tealLight,0,0,0,.68);
      cube(-.18,-.38,0,2.65,.19,1.8,C.ivory,0,0,0,.28);
      cube(-.84,-.24,.04,1.25,.13,1.58,C.deep,0,0,0,.18);
      cube(.55,-.24,.04,1.12,.13,1.58,C.deep,0,0,0,.18);
      cube(-.86,.0,-.2,.96,.21,.64,C.goldLight,0,-.18,0,.25);
      cube(-.86,.20,-.2,.92,.12,.59,C.green,0,-.18,0,.19);
      cube(-.86,.34,-.2,.98,.18,.65,C.goldLight,0,-.18,0,.33);
      ball(.48,.15,.07,.69,.67,.69,C.orange,0,0,0,.4);
      tube(1.35,.19,-.4,.43,1.15,.43,C.teal,0,0,-.12,.65);
      tube(1.35,.84,-.4,.29,.23,.29,C.ivory,0,0,-.12,.43);
      cube(-.23,.58,-1.05,2.8,.15,1.95,C.gold,1.0,0,0,.7);
    }else if(selected===2){
      // Books and office supplies with sealed institutional delivery carton.
      cube(-.46,-1.0,0,2.7,.2,1.75,C.brown,0,0,0,.4);
      cube(-.66,-.68,.08,2.0,.34,1.42,C.teal,0,-.16,0,.58);
      cube(-.66,-.47,.09,1.85,.09,1.29,C.ivory,0,-.16,0,.2);
      cube(-.45,-.26,.10,2.02,.32,1.44,C.gold,0,.10,0,.7);
      cube(-.45,-.05,.1,1.89,.09,1.35,C.ivory,0,.10,0,.28);
      cube(-.69,.17,.09,1.95,.35,1.37,C.tealLight,0,-.07,0,.65);
      cube(-.69,.39,.09,1.83,.085,1.27,C.ivory,0,-.07,0,.29);
      cube(1.25,-.26,-.4,.93,1.44,.81,C.brown,0,-.22,0,.24);
      cube(1.26,-.27,.02,.1,1.25,.06,C.goldLight,0,-.22,0,.38);
      cube(1.26,.12,-.4,.85,.08,.8,C.ivory,0,-.22,0,.27);
    }else if(selected===3){
      // Hygiene supplies: detergent spray bottle, glove-coloured carton and rolls.
      tube(-.26,-.43,0,1.28,1.85,1.12,C.tealLight,0,0,0,.62);
      tube(-.26,.58,0,.49,.41,.5,C.gold,0,0,0,.87);
      cube(-.08,.83,0,1.25,.27,.42,C.goldLight,0,0,-.1,.83);
      cube(.44,.7,0,.53,.19,.45,C.goldLight,0,0,-.18,.88);
      cube(-.25,-.55,.57,.86,.82,.08,C.navy,0,0,0,.38);
      ball(-.25,-.54,.64,.45,.48,.08,C.gold,0,0,0,.62);
      tube(1.24,-.85,.15,.84,.55,.84,C.ivory,0,0,.06,.4);
      tube(1.24,-.32,.15,.83,.56,.83,C.white,0,0,.06,.38);
      tube(1.24,.2,.15,.79,.52,.79,C.ivory,0,0,.06,.36);
      ring(1.24,.48,.15,.39,.06,.39,C.gold,0,0,0,.7);
    }else{
      // Warehouse cargo objects and a timber pallet, not a claim of own freight fleets.
      cube(0,-1.04,0,3.6,.19,1.95,C.brown,0,0,0,.36);
      for(let x of [-1.18,-.4,.4,1.18])cube(x,-.91,0,.16,.18,1.84,C.gold,0,0,0,.33);
      cube(-.78,-.31,.11,1.6,1.06,1.47,C.gold,0,-.08,0,.44);
      cube(-.77,-.31,.88,.12,.95,.07,C.brown,0,-.08,0,.36);
      cube(.91,-.53,.08,1.36,.64,1.43,C.tealLight,0,.10,0,.53);
      cube(.92,-.53,.79,.10,.55,.07,C.goldLight,0,.10,0,.45);
      cube(.37,.37,-.43,1.19,1.17,1.18,C.teal,0,-.13,0,.54);
      cube(.38,.37,.18,.10,1.05,.06,C.gold,0,-.13,0,.47);
      ball(-1.48,.56,-.52,.23,.23,.23,C.goldLight,0,0,0,.99);
    }
    // Floating visual anchors, low cost and intentionally non-interactive.
    for(let i=0;i<5;i++){
      const a=i*1.2566+t*.10;
      ball(Math.cos(a)*2.05,Math.sin(a*1.2)*.95+.45,-1.35,.043,.043,.043,i%2?C.gold:C.tealLight,0,0,0,.9);
    }
  }
  function render(now){
    raf=0;
    if(stopped||!gl||!sceneVisible||document.hidden||reduce.matches)return;
    raf=requestAnimationFrame(render);
    const fps=coarse.matches?22:35;
    if(now-last<1000/fps)return;
    last=now;
    try{
      resize();gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      const t=(now-start)/1000;
      yaw+=(targetYaw-yaw)*.08;pitch+=(targetPitch-pitch)*.09;
      const sw=Math.min(1,(now-switchAt)/540),reveal=reduce.matches?1:Math.min(1,.84+.16*sw);
      const aspect=Math.max(.5,bufferWidth/Math.max(1,bufferHeight));
      camera=multiply(perspective(35*Math.PI/180,aspect,.1,60),translate(0,0,-(aspect<.85?9.2:8.2)));
      group=multiply(translate(0,-.06,0),multiply(rotY(yaw+Math.sin(t*.24)*.23+scrollDepth*.18+(1-sw)*.45),multiply(rotX(pitch+Math.sin(t*.31)*.035),scale(reveal,reveal,reveal))));
      geometryForScene(t);
    }catch(_){fail()}
  }
  function renderOnce(){if(gl&&sceneVisible&&!raf&&!document.hidden&&!reduce.matches)raf=requestAnimationFrame(render)}
  function pause(){if(raf)cancelAnimationFrame(raf);raf=0}
  function play(){if(!gl&&!stopped){try{initGL()}catch(_){fail();return}}renderOnce()}
  if(reduce.matches||contrast.matches||network?.saveData||lowPower||!('WebGLRenderingContext' in window)){
    stage.dataset.renderer='fallback';
  }else{
    stage.dataset.renderer='waiting';
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();pause();fail()});
    if('IntersectionObserver' in window){
      observer=new IntersectionObserver(entries=>{sceneVisible=entries.some(x=>x.isIntersecting);if(sceneVisible)play();else pause()},{rootMargin:'100px 0px',threshold:0});
      observer.observe(stage);
    }else{sceneVisible=true;play()}
    document.addEventListener('visibilitychange',()=>document.hidden?pause():renderOnce(),{passive:true});
    reduce.addEventListener?.('change',()=>{if(reduce.matches){pause();stage.dataset.renderer='fallback'}else if(gl){stage.dataset.renderer='webgl';renderOnce()}});
    contrast.addEventListener?.('change',()=>{if(contrast.matches){pause();stage.dataset.renderer='fallback'}else if(gl){stage.dataset.renderer='webgl';renderOnce()}});
    addEventListener('resize',()=>{if(gl){resize();renderOnce()}},{passive:true});
  }
})();
