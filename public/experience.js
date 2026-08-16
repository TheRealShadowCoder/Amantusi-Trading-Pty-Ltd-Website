import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.min.js';

const root = document.documentElement;
const body = document.body;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarsePointer = matchMedia('(pointer: coarse)').matches || matchMedia('(hover: none)').matches || navigator.maxTouchPoints > 0;
const saveData = Boolean(navigator.connection?.saveData);
const memory = Number(navigator.deviceMemory || 4);
const cores = Number(navigator.hardwareConcurrency || 4);
const mobile = coarsePointer || innerWidth < 860;
const loader = document.getElementById('experience-loader');
const loaderBar = document.getElementById('experience-loader-bar');
const loaderLabel = document.getElementById('experience-loader-label');

const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

function setLoader(progress, label) {
  if (loaderBar) loaderBar.style.width = `${progress}%`;
  if (loaderLabel && label) loaderLabel.textContent = label;
}

function finishLoader(fallback = false) {
  if (fallback) root.classList.add('experience-fallback');
  root.classList.add('experience-loaded');
  if (!loader) return;
  loader.classList.add('is-complete');
  setTimeout(() => loader.remove(), mobile ? 420 : 760);
}

function hasWebGL2() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }));
  } catch (_) {
    return false;
  }
}

function qualityProfile() {
  if (mobile) {
    if (saveData || memory <= 2 || cores <= 2) return { name:'mobile-lite', dpr:.78, particles:150, nodes:14, routes:2, target:34, idle:18, torus:42, ribbon:false, haze:false };
    if (memory <= 4 || cores <= 4) return { name:'mobile-standard', dpr:.9, particles:240, nodes:18, routes:3, target:42, idle:22, torus:52, ribbon:false, haze:true };
    return { name:'mobile-high', dpr:1.05, particles:360, nodes:22, routes:3, target:50, idle:26, torus:64, ribbon:false, haze:true };
  }
  if (memory <= 4 || cores <= 4) return { name:'desktop-low', dpr:1, particles:620, nodes:24, routes:3, target:50, idle:28, torus:88, ribbon:true, haze:true };
  if (memory <= 8 || cores <= 8) return { name:'desktop-medium', dpr:1.3, particles:1000, nodes:32, routes:5, target:60, idle:34, torus:120, ribbon:true, haze:true };
  return { name:'desktop-high', dpr:1.65, particles:1500, nodes:42, routes:5, target:60, idle:40, torus:150, ribbon:true, haze:true };
}

setLoader(8, 'Preparing spatial interface');

if (reducedMotion || saveData && memory <= 2 || !hasWebGL2()) {
  setLoader(100, reducedMotion ? 'Reduced motion mode' : 'Optimised visual mode');
  finishLoader(true);
} else {
  const profile = qualityProfile();
  body.dataset.performanceTier = profile.name;
  root.classList.add('experience-active');
  if (mobile) root.classList.add('experience-mobile');
  setLoader(16, `Graphics tier: ${profile.name.replace('-', ' ')}`);

  const canvas = document.createElement('canvas');
  canvas.className = 'experience-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  body.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !mobile && profile.dpr > 1,
    powerPreference: mobile ? 'low-power' : 'high-performance',
    stencil: false,
    depth: true
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;

  let width = document.documentElement.clientWidth || innerWidth;
  let height = document.documentElement.clientHeight || innerHeight;
  let pixelRatio = Math.min(devicePixelRatio || 1, profile.dpr);
  let orientation = screen.orientation?.type || `${width > height ? 'landscape' : 'portrait'}`;
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x071923, mobile ? 0.07 : 0.052);

  const camera = new THREE.PerspectiveCamera(42, width / Math.max(1, height), 0.1, 80);
  camera.position.set(0, 0.1, 8.3);
  let currentFov = 42;

  const world = new THREE.Group();
  scene.add(world);

  const ambient = new THREE.AmbientLight(0xd8e5ec, mobile ? 0.4 : 0.34);
  const keyLight = new THREE.PointLight(0xc8aa5d, mobile ? 7 : 10, 18, 2);
  keyLight.position.set(3.5, 2, 4);
  const rimLight = new THREE.PointLight(0x3c6d7a, mobile ? 4.5 : 7, 18, 2);
  rimLight.position.set(-4, -1.5, 2.5);
  scene.add(ambient, keyLight, rimLight);

  setLoader(30, 'Building supply network');

  const gold = new THREE.Color(0xc8aa5d);
  const paleGold = new THREE.Color(0xf2dfad);
  const blue = new THREE.Color(0x537b86);

  const network = new THREE.Group();
  network.position.set(mobile ? 1.35 : 2.15, 0.35, -0.8);
  world.add(network);

  const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0x0b2430,
    emissive: 0x071923,
    emissiveIntensity: 0.48,
    roughness: 0.46,
    metalness: 0.68,
    transparent: true,
    opacity: 0.78,
    wireframe: true
  });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(mobile ? .88 : 1.02, mobile ? 1 : 2), coreMaterial);
  network.add(core);

  const ringMaterial = new THREE.MeshBasicMaterial({ color: gold, transparent: true, opacity: 0.28, depthWrite: false });
  const ringMaterialSoft = new THREE.MeshBasicMaterial({ color: blue, transparent: true, opacity: 0.14, depthWrite: false });
  const rings = [];
  [
    [1.5, .01, .2, .9, .05, ringMaterial],
    [1.9, .008, 1.2, .15, .45, ringMaterialSoft],
    [2.3, .006, .45, .45, 1.1, ringMaterial]
  ].forEach(([radius, tube, rx, ry, rz, material]) => {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 6, profile.torus), material);
    mesh.rotation.set(rx, ry, rz);
    network.add(mesh);
    rings.push(mesh);
  });

  const nodeGeometry = new THREE.SphereGeometry(0.026, 6, 6);
  const nodeMaterial = new THREE.MeshBasicMaterial({ color: paleGold, transparent: true, opacity: 0.88 });
  const nodes = new THREE.InstancedMesh(nodeGeometry, nodeMaterial, profile.nodes);
  const nodePositions = [];
  const dummy = new THREE.Object3D();
  for (let i = 0; i < profile.nodes; i++) {
    const phi = Math.acos(1 - 2 * (i + .5) / profile.nodes);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r = 1.25 + ((i % 5) / 5) * .9;
    const p = new THREE.Vector3(
      Math.cos(theta) * Math.sin(phi) * r,
      Math.cos(phi) * r * .78,
      Math.sin(theta) * Math.sin(phi) * r * .52
    );
    nodePositions.push(p);
    dummy.position.copy(p);
    dummy.scale.setScalar(i % 7 === 0 ? 1.55 : 1);
    dummy.updateMatrix();
    nodes.setMatrixAt(i, dummy.matrix);
  }
  network.add(nodes);

  const linePositions = [];
  const lineLimit = mobile ? 250 : 600;
  for (let i = 0; i < nodePositions.length; i++) {
    for (let j = i + 1; j < nodePositions.length; j++) {
      if (linePositions.length >= lineLimit) break;
      if (nodePositions[i].distanceToSquared(nodePositions[j]) < .55) {
        linePositions.push(...nodePositions[i].toArray(), ...nodePositions[j].toArray());
      }
    }
  }
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  const connections = new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({
    color: 0x8aa4aa,
    transparent: true,
    opacity: 0.12,
    depthWrite: false
  }));
  network.add(connections);

  const routeMaterial = new THREE.MeshBasicMaterial({ color: gold, transparent: true, opacity: 0.22, depthWrite: false });
  const routes = [];
  const routePairs = [[0, 8], [3, 16], [7, 21], [11, 26], [4, 29]];
  routePairs.slice(0, profile.routes).forEach(([a, b], idx) => {
    const start = nodePositions[a % nodePositions.length].clone();
    const end = nodePositions[b % nodePositions.length].clone();
    const middle = start.clone().add(end).multiplyScalar(.5);
    middle.z += .65 + idx * .07;
    middle.y += (idx % 2 ? -1 : 1) * .34;
    const curve = new THREE.CatmullRomCurve3([start, middle, end]);
    const route = new THREE.Mesh(new THREE.TubeGeometry(curve, mobile ? 20 : 36, .009, 4, false), routeMaterial.clone());
    route.material.opacity = .15 + idx * .022;
    network.add(route);
    routes.push(route);
  });

  setLoader(46, 'Waking atmospheric field');

  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(profile.particles * 3);
  const scales = new Float32Array(profile.particles);
  const seeds = new Float32Array(profile.particles);
  for (let i = 0; i < profile.particles; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - .5) * 18;
    positions[i3 + 1] = (Math.random() - .5) * 11;
    positions[i3 + 2] = -2 - Math.random() * 16;
    scales[i] = .55 + Math.random() * 1.55;
    seeds[i] = Math.random() * 10;
  }
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
  particleGeometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

  const particleMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uVelocity: { value: 0 },
      uPointer: { value: new THREE.Vector2() },
      uIdle: { value: 0 }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uVelocity;
      uniform vec2 uPointer;
      uniform float uIdle;
      attribute float aScale;
      attribute float aSeed;
      varying float vAlpha;
      void main(){
        vec3 p=position;
        float t=uTime*(.11+aSeed*.007);
        p.x+=sin(t+p.y*.42+aSeed)*.11;
        p.y+=cos(t*1.13+p.x*.28+aSeed)*.09;
        p.x+=uPointer.x*(.03+aSeed*.0012);
        p.y+=uPointer.y*(.024+aSeed*.001);
        vec4 mv=modelViewMatrix*vec4(p,1.0);
        float boost=1.0+min(abs(uVelocity)*.015,.55);
        gl_PointSize=max(1.0,aScale*boost*(40.0/max(1.0,-mv.z)));
        gl_Position=projectionMatrix*mv;
        vAlpha=mix(.38,.14,uIdle)*(.5+aScale*.16);
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      void main(){
        vec2 c=gl_PointCoord-.5;
        float d=length(c);
        float a=smoothstep(.5,.07,d)*vAlpha;
        vec3 col=mix(vec3(.32,.48,.52),vec3(.79,.67,.36),smoothstep(.0,.5,d));
        gl_FragColor=vec4(col,a);
      }
    `
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  if (profile.haze) {
    const haze = new THREE.Mesh(
      new THREE.SphereGeometry(5.8, mobile ? 12 : 20, mobile ? 8 : 14),
      new THREE.MeshBasicMaterial({ color: 0x0d3440, transparent: true, opacity: mobile ? .022 : .034, side: THREE.BackSide, depthWrite: false })
    );
    haze.scale.set(1.4, .82, 1);
    scene.add(haze);
  }

  const state = {
    pointer:new THREE.Vector2(),
    pointerTarget:new THREE.Vector2(),
    pointerSpeed:0,
    lastPointer:new THREE.Vector2(width*.5,height*.5),
    scroll:scrollY,
    scrollTarget:scrollY,
    scrollVelocity:0,
    lastScroll:scrollY,
    progress:0,
    idle:0,
    activeSection:0,
    visible:!document.hidden,
    elapsed:0
  };

  let ribbon = null;
  let ribbonGeometry = null;
  let ribbonMaterial = null;
  let trailPoints = null;
  let trailLength = 0;
  let ribbonPositions = null;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0,0,1), -.45);
  const pointerWorld = new THREE.Vector3();

  function screenToWorld(clientX, clientY, target = pointerWorld) {
    ndc.set((clientX / width) * 2 - 1, -(clientY / height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.ray.intersectPlane(plane, target);
  }

  if (profile.ribbon) {
    trailLength = profile.name === 'desktop-high' ? 42 : 30;
    trailPoints = Array.from({length:trailLength},()=>new THREE.Vector3(0,0,.5));
    ribbonPositions = new Float32Array(trailLength*6);
    const fade = new Float32Array(trailLength*2);
    const indices = [];
    for (let i=0;i<trailLength;i++) {
      fade[i*2]=fade[i*2+1]=i/(trailLength-1);
      if (i<trailLength-1) {
        const a=i*2;
        indices.push(a,a+1,a+2,a+1,a+3,a+2);
      }
    }
    ribbonGeometry = new THREE.BufferGeometry();
    ribbonGeometry.setAttribute('position',new THREE.BufferAttribute(ribbonPositions,3));
    ribbonGeometry.setAttribute('aFade',new THREE.BufferAttribute(fade,1));
    ribbonGeometry.setIndex(indices);
    ribbonMaterial = new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
      uniforms:{uOpacity:{value:.5}},
      vertexShader:'attribute float aFade;varying float vFade;void main(){vFade=aFade;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'uniform float uOpacity;varying float vFade;void main(){float a=pow(vFade,1.6)*uOpacity;vec3 c=mix(vec3(.22,.41,.46),vec3(.86,.72,.38),vFade);gl_FragColor=vec4(c,a);}'
    });
    ribbon = new THREE.Mesh(ribbonGeometry,ribbonMaterial);
    scene.add(ribbon);
  }

  function updateRibbon(speed) {
    if (!ribbon || !trailPoints) return;
    const newest = screenToWorld(state.lastPointer.x,state.lastPointer.y,pointerWorld);
    if (!newest) return;
    trailPoints[trailLength-1].lerp(newest,.66);
    for (let i=0;i<trailLength-1;i++) trailPoints[i].lerp(trailPoints[i+1],.16+(i/trailLength)*.16);
    for (let i=0;i<trailLength;i++) {
      const p=trailPoints[i];
      const prev=trailPoints[Math.max(0,i-1)];
      const next=trailPoints[Math.min(trailLength-1,i+1)];
      const tx=next.x-prev.x, ty=next.y-prev.y;
      const len=Math.max(.0001,Math.hypot(tx,ty));
      const nx=-ty/len, ny=tx/len;
      const age=i/(trailLength-1);
      const w=(.004+clamp(speed,0,80)*.00014)*Math.pow(age,1.3);
      const base=i*6;
      ribbonPositions[base]=p.x+nx*w;
      ribbonPositions[base+1]=p.y+ny*w;
      ribbonPositions[base+2]=p.z;
      ribbonPositions[base+3]=p.x-nx*w;
      ribbonPositions[base+4]=p.y-ny*w;
      ribbonPositions[base+5]=p.z;
    }
    ribbonGeometry.attributes.position.needsUpdate=true;
  }

  const ripples = [];
  function spawnRipple(x,y) {
    if (mobile || ripples.length >= 4) return;
    const point=screenToWorld(x,y,new THREE.Vector3());
    if (!point) return;
    const material=new THREE.MeshBasicMaterial({color:0xc8aa5d,transparent:true,opacity:.62,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
    const mesh=new THREE.Mesh(new THREE.RingGeometry(.035,.043,32),material);
    mesh.position.copy(point); mesh.position.z+=.01;
    scene.add(mesh); ripples.push({mesh,age:0});
  }

  setLoader(68, 'Connecting cinematic camera');

  const sections = [
    {el:document.querySelector('.hero'),label:'Home'},
    {el:document.querySelector('#about'),label:'Company'},
    {el:document.querySelector('#capabilities'),label:'Capabilities'},
    {el:document.querySelector('#government'),label:'Government'},
    {el:document.querySelector('#process'),label:'Process'},
    {el:document.querySelector('#quote'),label:'Quote'},
    {el:document.querySelector('#contact'),label:'Contact'}
  ].filter(s=>s.el);

  let indexLinks=[];
  if (!mobile) {
    const spatialIndex=document.createElement('nav');
    spatialIndex.className='spatial-index';
    spatialIndex.setAttribute('aria-label','Section progress');
    spatialIndex.innerHTML=sections.map((s,i)=>`<a href="${s.el.id?`#${s.el.id}`:'#top'}" data-index="${i}" aria-label="${s.label}"><span>${String(i+1).padStart(2,'0')}</span><i></i></a>`).join('');
    body.appendChild(spatialIndex);
    indexLinks=[...spatialIndex.querySelectorAll('a')];
  }

  let lastOpacity=-1;
  function setNetworkOpacity(value) {
    if (Math.abs(value-lastOpacity)<.025) return;
    lastOpacity=value;
    core.material.opacity=.34+value*.44;
    rings.forEach((r,i)=>r.material.opacity=(i%2?.07:.14)+value*(i%2?.11:.2));
    connections.material.opacity=.04+value*.1;
    nodeMaterial.opacity=.34+value*.55;
    routes.forEach((r,i)=>r.material.opacity=.045+value*(.12+i*.015));
  }

  const sectionObserver=new IntersectionObserver(entries=>{
    const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if (!visible) return;
    const idx=sections.findIndex(s=>s.el===visible.target);
    if (idx<0 || idx===state.activeSection) return;
    state.activeSection=idx;
    body.dataset.scene=sections[idx].label.toLowerCase();
    indexLinks.forEach((link,i)=>link.classList.toggle('active',i===idx));
    canvas.style.opacity=idx===0||idx===3||idx===6?'1':'0.28';
  },{threshold:[.22,.45,.62],rootMargin:'-20% 0px -28% 0px'});
  sections.forEach(s=>sectionObserver.observe(s.el));

  let cursor=null,cursorDot=null,cursorLabel=null;
  let cursorX=width/2,cursorY=height/2,cursorTX=cursorX,cursorTY=cursorY;
  if (!coarsePointer) {
    cursor=document.createElement('div');
    cursor.className='spatial-cursor';
    cursor.innerHTML='<span class="spatial-cursor-ring"></span><span class="spatial-cursor-dot"></span><span class="spatial-cursor-label"></span>';
    body.appendChild(cursor);
    cursorDot=cursor.querySelector('.spatial-cursor-dot');
    cursorLabel=cursor.querySelector('.spatial-cursor-label');
    document.addEventListener('pointerover',event=>{
      const interactive=event.target instanceof Element?event.target.closest('a,button,input,select,textarea,[role="link"]'):null;
      cursor.classList.toggle('is-interactive',Boolean(interactive));
      if (!cursorLabel) return;
      cursorLabel.textContent=interactive?.matches('button[type="submit"]')?'SEND':interactive?.closest('.cap-card')?'VIEW':interactive?.matches('a,.button,[role="link"]')?'OPEN':'';
    },{passive:true});
  }

  const markActivity=()=>{state.idle=0;};
  if (!coarsePointer) {
    addEventListener('pointermove',event=>{
      const dx=event.clientX-state.lastPointer.x;
      const dy=event.clientY-state.lastPointer.y;
      state.pointerSpeed=Math.hypot(dx,dy);
      state.lastPointer.set(event.clientX,event.clientY);
      state.pointerTarget.set((event.clientX/width)*2-1,-(event.clientY/height)*2+1);
      cursorTX=event.clientX; cursorTY=event.clientY;
      markActivity();
    },{passive:true});
    addEventListener('pointerdown',event=>{spawnRipple(event.clientX,event.clientY);cursor?.classList.add('is-pressed');markActivity();},{passive:true});
    addEventListener('pointerup',()=>cursor?.classList.remove('is-pressed'),{passive:true});
  } else {
    addEventListener('pointerdown',markActivity,{passive:true});
  }

  let maxScroll=Math.max(1,document.documentElement.scrollHeight-height);
  addEventListener('scroll',()=>{state.scrollTarget=scrollY;markActivity();},{passive:true});
  document.addEventListener('visibilitychange',()=>{state.visible=!document.hidden;});

  let resizeQueued=false;
  function applyResize(force=false) {
    resizeQueued=false;
    const newWidth=document.documentElement.clientWidth||innerWidth;
    const newHeight=document.documentElement.clientHeight||innerHeight;
    const newOrientation=screen.orientation?.type||`${newWidth>newHeight?'landscape':'portrait'}`;
    if (mobile&&!force&&Math.abs(newWidth-width)<3&&newOrientation===orientation) return;
    width=newWidth; height=newHeight; orientation=newOrientation;
    camera.aspect=width/Math.max(1,height);
    camera.updateProjectionMatrix();
    renderer.setSize(width,height,false);
    maxScroll=Math.max(1,document.documentElement.scrollHeight-height);
  }
  addEventListener('resize',()=>{
    if (resizeQueued) return;
    resizeQueued=true;
    requestAnimationFrame(()=>applyResize(false));
  },{passive:true});
  screen.orientation?.addEventListener?.('change',()=>setTimeout(()=>applyResize(true),180),{passive:true});
  document.fonts?.ready?.then(()=>{maxScroll=Math.max(1,document.documentElement.scrollHeight-height);});

  setLoader(88, 'Optimising motion budget');
  if (!mobile) {
    try { await renderer.compileAsync(scene,camera); } catch (_) { renderer.compile(scene,camera); }
  }

  setLoader(100, 'Experience ready');
  finishLoader(false);

  let lastFrame=performance.now();
  let lastRender=0;
  let sampleStart=lastFrame;
  let sampleFrames=0;
  let stableSamples=0;
  const navShell=document.querySelector('.nav-shell');

  function animate(now) {
    if (!state.visible) { lastFrame=now; return; }

    const desiredFps=state.idle>5?profile.idle:profile.target;
    const interval=1000/desiredFps;
    if (now-lastRender<interval) return;
    const elapsedMs=Math.min(80,Math.max(1,now-lastFrame));
    const dt=elapsedMs/1000;
    lastFrame=now;
    lastRender=now;
    state.elapsed+=dt;
    state.idle+=dt;

    const idleMix=smooth(clamp((state.idle-5)/7,0,1));
    state.pointer.lerp(state.pointerTarget,1-Math.pow(.0008,dt));
    state.scroll+=(state.scrollTarget-state.scroll)*(1-Math.pow(.0003,dt));
    const scrollDelta=state.scroll-state.lastScroll;
    state.scrollVelocity=lerp(state.scrollVelocity,scrollDelta/Math.max(dt,.001),mobile?.16:.12);
    state.lastScroll=state.scroll;
    state.progress=clamp(state.scroll/maxScroll,0,1);

    const p=state.progress;
    const focus=state.activeSection===0||state.activeSection===3?1:state.activeSection===6?.62:.24;
    setNetworkOpacity(focus*(1-idleMix*.24));

    const phase=Math.sin(p*Math.PI*2);
    if (mobile) {
      network.position.x=lerp(1.35,-.75,smooth(clamp((p-.08)/.3,0,1)))+smooth(clamp((p-.42)/.25,0,1))*1.5;
      if (p>.72) network.position.x=lerp(network.position.x,-.55,smooth((p-.72)/.28));
      network.position.y=.18+phase*.15-p*.36;
      network.position.z=-1-Math.sin(p*Math.PI)*.65;
    } else {
      network.position.x=lerp(2.18,-1.95,smooth(clamp((p-.08)/.25,0,1)))+smooth(clamp((p-.34)/.22,0,1))*4.05;
      if (p>.64) network.position.x=lerp(network.position.x,-1.5,smooth((p-.64)/.36));
      network.position.y=.32+phase*.28-p*.55;
      network.position.z=-.82-Math.sin(p*Math.PI)*1.15;
    }
    const scale=(mobile?.86:1)-Math.sin(p*Math.PI)*(mobile?.08:.14)+(state.activeSection===3?(mobile?.08:.18):0);
    network.scale.setScalar(scale);

    const pointerInfluence=coarsePointer?0:1-idleMix*.75;
    network.rotation.y+=dt*(mobile?.045:.08+Math.min(.14,Math.abs(state.scrollVelocity)*.000018));
    network.rotation.x=state.pointer.y*.1*pointerInfluence+Math.sin(state.elapsed*.18)*(mobile?.018:.035);
    network.rotation.z=state.pointer.x*-.065*pointerInfluence;
    core.rotation.x+=dt*.035;
    core.rotation.y-=dt*.045;
    rings.forEach((ring,i)=>ring.rotation.z+=dt*(i%2?-.012:.009));

    camera.position.x+=((state.pointer.x*.22*pointerInfluence)-camera.position.x)*(1-Math.pow(.006,dt));
    camera.position.y+=((.1+state.pointer.y*.13*pointerInfluence-p*.1)-camera.position.y)*(1-Math.pow(.008,dt));
    camera.position.z=8.3+Math.sin(p*Math.PI)*(mobile?.24:.42);
    const targetFov=42+clamp(Math.abs(state.scrollVelocity)*(mobile?.00045:.0008),0,mobile?1.3:2.8);
    if (Math.abs(targetFov-currentFov)>.06) {
      currentFov=targetFov;
      camera.fov=currentFov;
      camera.updateProjectionMatrix();
    }
    camera.lookAt(0,-.05,-1.1);

    if (!coarsePointer) {
      keyLight.position.x=3.4+state.pointer.x*1.8;
      keyLight.position.y=2+state.pointer.y*1.1;
      rimLight.intensity=5.2+clamp(state.pointerSpeed*.035,0,3.5);
    }

    particleMaterial.uniforms.uTime.value=state.elapsed;
    particleMaterial.uniforms.uVelocity.value=state.scrollVelocity;
    particleMaterial.uniforms.uPointer.value.copy(state.pointer);
    particleMaterial.uniforms.uIdle.value=idleMix;
    particles.rotation.y=state.elapsed*(mobile?.0035:.006)+p*.18;
    particles.position.y=-p*.36;

    if (ribbon) {
      updateRibbon(state.pointerSpeed);
      ribbonMaterial.uniforms.uOpacity.value=.5*(1-idleMix*.72);
    }

    for (let i=ripples.length-1;i>=0;i--) {
      const r=ripples[i];
      r.age+=dt;
      const t=clamp(r.age/1.05,0,1);
      r.mesh.scale.setScalar(1+t*13);
      r.mesh.material.opacity=(1-t)*.6;
      r.mesh.rotation.z+=dt*.18;
      if (t>=1) {
        scene.remove(r.mesh);
        r.mesh.geometry.dispose();
        r.mesh.material.dispose();
        ripples.splice(i,1);
      }
    }

    if (!mobile&&navShell) {
      const v=clamp(Math.abs(state.scrollVelocity)*.00003,0,.045);
      navShell.style.transform=`translateY(${clamp(state.scrollVelocity*-.00032,-3.2,3.2)}px) scaleY(${1+v})`;
    }

    if (cursor) {
      cursorX+=(cursorTX-cursorX)*.22;
      cursorY+=(cursorTY-cursorY)*.22;
      cursor.style.transform=`translate3d(${cursorX}px,${cursorY}px,0)`;
      if (cursorDot) cursorDot.style.transform=`scale(${1+clamp(state.pointerSpeed*.012,0,.7)})`;
    }

    renderer.render(scene,camera);

    sampleFrames++;
    if (now-sampleStart>2600) {
      const fps=sampleFrames/((now-sampleStart)/1000);
      const lowThreshold=profile.target*.78;
      if (fps<lowThreshold&&pixelRatio>.68) {
        pixelRatio=Math.max(.68,pixelRatio-.1);
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(width,height,false);
        stableSamples=0;
      } else if (fps>profile.target*.95&&pixelRatio<Math.min(devicePixelRatio||1,profile.dpr)) {
        stableSamples++;
        if (stableSamples>=4) {
          pixelRatio=Math.min(Math.min(devicePixelRatio||1,profile.dpr),pixelRatio+.05);
          renderer.setPixelRatio(pixelRatio);
          renderer.setSize(width,height,false);
          stableSamples=0;
        }
      } else {
        stableSamples=0;
      }
      sampleFrames=0;
      sampleStart=now;
    }

    state.pointerSpeed*=.82;
  }

  renderer.setAnimationLoop(animate);
}
