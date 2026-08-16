import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.min.js';

const root = document.documentElement;
const body = document.body;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarsePointer = matchMedia('(pointer: coarse)').matches;
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
  if (loader) {
    loader.classList.add('is-complete');
    setTimeout(() => loader.remove(), 850);
  }
}

function performanceTier() {
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  const small = innerWidth < 800;
  if (small || cores <= 4 || memory <= 4) return 'LOW';
  if (cores <= 8 || memory <= 8) return 'MEDIUM';
  return 'HIGH';
}

function hasWebGL2() {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2', { failIfMajorPerformanceCaveat: false });
  } catch (_) {
    return false;
  }
}

setLoader(8, 'Preparing spatial interface');

if (reducedMotion || !hasWebGL2()) {
  setLoader(100, reducedMotion ? 'Reduced motion mode' : 'Optimised visual mode');
  finishLoader(true);
} else {
  const tier = performanceTier();
  body.dataset.performanceTier = tier.toLowerCase();
  root.classList.add('experience-active');
  setLoader(18, `Graphics tier: ${tier.toLowerCase()}`);

  const state = {
    pointer: new THREE.Vector2(0, 0),
    pointerTarget: new THREE.Vector2(0, 0),
    pointerVelocity: new THREE.Vector2(0, 0),
    pointerSpeed: 0,
    lastPointer: new THREE.Vector2(innerWidth * 0.5, innerHeight * 0.5),
    scroll: scrollY,
    scrollTarget: scrollY,
    scrollVelocity: 0,
    lastScroll: scrollY,
    progress: 0,
    idle: 0,
    activeSection: 0,
    visible: !document.hidden,
    elapsed: 0
  };

  const canvas = document.createElement('canvas');
  canvas.className = 'experience-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  body.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: tier !== 'LOW',
    powerPreference: tier === 'LOW' ? 'default' : 'high-performance'
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  let pixelRatio = Math.min(devicePixelRatio || 1, tier === 'HIGH' ? 1.8 : tier === 'MEDIUM' ? 1.35 : 1);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(innerWidth, innerHeight, false);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x071923, tier === 'LOW' ? 0.065 : 0.052);

  const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 80);
  camera.position.set(0, 0.1, 8.3);

  const world = new THREE.Group();
  scene.add(world);

  const ambient = new THREE.AmbientLight(0xd8e5ec, 0.34);
  const keyLight = new THREE.PointLight(0xc8aa5d, 10, 18, 2);
  keyLight.position.set(3.5, 2, 4);
  const rimLight = new THREE.PointLight(0x3c6d7a, 7, 18, 2);
  rimLight.position.set(-4, -1.5, 2.5);
  scene.add(ambient, keyLight, rimLight);

  setLoader(32, 'Building supply network');

  const gold = new THREE.Color(0xc8aa5d);
  const paleGold = new THREE.Color(0xf2dfad);
  const blue = new THREE.Color(0x537b86);

  const network = new THREE.Group();
  network.position.set(2.15, 0.35, -0.8);
  world.add(network);

  const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0x0b2430,
    emissive: 0x071923,
    emissiveIntensity: 0.55,
    roughness: 0.42,
    metalness: 0.75,
    transparent: true,
    opacity: 0.82,
    wireframe: true
  });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.02, tier === 'LOW' ? 1 : 2), coreMaterial);
  network.add(core);

  const ringMaterial = new THREE.MeshBasicMaterial({ color: gold, transparent: true, opacity: 0.34, depthWrite: false });
  const ringMaterialSoft = new THREE.MeshBasicMaterial({ color: blue, transparent: true, opacity: 0.17, depthWrite: false });
  const rings = [];
  [
    [1.58, 0.011, 0.2, 0.9, 0.05, ringMaterial],
    [1.95, 0.008, 1.2, 0.15, 0.45, ringMaterialSoft],
    [2.36, 0.006, 0.45, 0.45, 1.1, ringMaterial],
    [2.75, 0.004, 1.45, 0.25, 0.35, ringMaterialSoft]
  ].forEach(([radius, tube, rx, ry, rz, material]) => {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 6, tier === 'LOW' ? 96 : 180), material);
    mesh.rotation.set(rx, ry, rz);
    network.add(mesh);
    rings.push(mesh);
  });

  const nodeCount = tier === 'HIGH' ? 44 : tier === 'MEDIUM' ? 32 : 22;
  const nodeGeometry = new THREE.SphereGeometry(0.026, 8, 8);
  const nodeMaterial = new THREE.MeshBasicMaterial({ color: paleGold, transparent: true, opacity: 0.92 });
  const nodes = new THREE.InstancedMesh(nodeGeometry, nodeMaterial, nodeCount);
  const nodePositions = [];
  const dummy = new THREE.Object3D();
  for (let i = 0; i < nodeCount; i++) {
    const phi = Math.acos(1 - 2 * (i + 0.5) / nodeCount);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r = 1.3 + ((i % 5) / 5) * 0.95;
    const p = new THREE.Vector3(
      Math.cos(theta) * Math.sin(phi) * r,
      Math.cos(phi) * r * 0.78,
      Math.sin(theta) * Math.sin(phi) * r * 0.52
    );
    nodePositions.push(p);
    dummy.position.copy(p);
    dummy.scale.setScalar(i % 7 === 0 ? 1.7 : 1);
    dummy.updateMatrix();
    nodes.setMatrixAt(i, dummy.matrix);
  }
  network.add(nodes);

  const linePositions = [];
  for (let i = 0; i < nodePositions.length; i++) {
    for (let j = i + 1; j < nodePositions.length; j++) {
      const d = nodePositions[i].distanceTo(nodePositions[j]);
      if (d < 0.72 && linePositions.length < (tier === 'HIGH' ? 900 : 520)) {
        linePositions.push(...nodePositions[i].toArray(), ...nodePositions[j].toArray());
      }
    }
  }
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  const connections = new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({
    color: 0x8aa4aa,
    transparent: true,
    opacity: 0.14,
    depthWrite: false
  }));
  network.add(connections);

  const routeMaterial = new THREE.MeshBasicMaterial({ color: gold, transparent: true, opacity: 0.28, depthWrite: false });
  const routes = [];
  const routePairs = [[0, 8], [3, 16], [7, 21], [11, 26], [4, 29]];
  routePairs.slice(0, tier === 'LOW' ? 3 : 5).forEach(([a, b], idx) => {
    const start = nodePositions[a % nodePositions.length].clone();
    const end = nodePositions[b % nodePositions.length].clone();
    const middle = start.clone().add(end).multiplyScalar(0.5);
    middle.z += 0.7 + idx * 0.08;
    middle.y += (idx % 2 ? -1 : 1) * 0.38;
    const curve = new THREE.CatmullRomCurve3([start, middle, end]);
    const route = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.009, 5, false), routeMaterial.clone());
    route.material.opacity = 0.18 + idx * 0.025;
    network.add(route);
    routes.push(route);
  });

  setLoader(48, 'Waking atmospheric field');

  const particleCount = tier === 'HIGH' ? 2200 : tier === 'MEDIUM' ? 1300 : 620;
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const scales = new Float32Array(particleCount);
  const seeds = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 18;
    positions[i3 + 1] = (Math.random() - 0.5) * 11;
    positions[i3 + 2] = -2 - Math.random() * 16;
    scales[i] = 0.55 + Math.random() * 1.7;
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
        vec3 p = position;
        float t = uTime * (0.12 + aSeed * 0.008);
        p.x += sin(t + p.y * .42 + aSeed) * .13;
        p.y += cos(t * 1.17 + p.x * .28 + aSeed) * .11;
        p.x += uPointer.x * (0.035 + aSeed * .0015);
        p.y += uPointer.y * (0.028 + aSeed * .0012);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float speedBoost = 1.0 + min(abs(uVelocity) * .018, .8);
        gl_PointSize = max(1.0, aScale * speedBoost * (42.0 / max(1.0, -mv.z)));
        gl_Position = projectionMatrix * mv;
        vAlpha = mix(.42, .18, uIdle) * (0.55 + aScale * .18);
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      void main(){
        vec2 c = gl_PointCoord - .5;
        float d = length(c);
        float alpha = smoothstep(.5, .06, d) * vAlpha;
        vec3 col = mix(vec3(.32,.48,.52), vec3(.79,.67,.36), smoothstep(.0,.5,d));
        gl_FragColor = vec4(col, alpha);
      }
    `
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  const haze = new THREE.Mesh(
    new THREE.SphereGeometry(5.8, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0x0d3440, transparent: true, opacity: 0.035, side: THREE.BackSide, depthWrite: false })
  );
  haze.scale.set(1.4, 0.82, 1);
  scene.add(haze);

  setLoader(62, 'Calibrating interaction physics');

  // Pointer ribbon: a lightweight world-space ribbon driven by recent pointer positions.
  const trailLength = tier === 'LOW' ? 26 : 46;
  const trailPoints = Array.from({ length: trailLength }, () => new THREE.Vector3(0, 0, 0.5));
  const ribbonPositions = new Float32Array(trailLength * 2 * 3);
  const ribbonFade = new Float32Array(trailLength * 2);
  const ribbonIndices = [];
  for (let i = 0; i < trailLength; i++) {
    ribbonFade[i * 2] = ribbonFade[i * 2 + 1] = i / (trailLength - 1);
    if (i < trailLength - 1) {
      const a = i * 2;
      ribbonIndices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const ribbonGeometry = new THREE.BufferGeometry();
  ribbonGeometry.setAttribute('position', new THREE.BufferAttribute(ribbonPositions, 3));
  ribbonGeometry.setAttribute('aFade', new THREE.BufferAttribute(ribbonFade, 1));
  ribbonGeometry.setIndex(ribbonIndices);
  const ribbonMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uOpacity: { value: coarsePointer ? 0.22 : 0.58 } },
    vertexShader: `attribute float aFade; varying float vFade; void main(){vFade=aFade;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform float uOpacity; varying float vFade; void main(){float a=pow(vFade,1.65)*uOpacity;vec3 c=mix(vec3(.22,.41,.46),vec3(.86,.72,.38),vFade);gl_FragColor=vec4(c,a);}`
  });
  const ribbon = new THREE.Mesh(ribbonGeometry, ribbonMaterial);
  scene.add(ribbon);

  const pointerWorld = new THREE.Vector3();
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.45);
  function screenToWorld(clientX, clientY, target = pointerWorld) {
    const ndc = new THREE.Vector2((clientX / innerWidth) * 2 - 1, -(clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.ray.intersectPlane(plane, target);
  }

  function updateRibbon(speed) {
    const newest = screenToWorld(state.lastPointer.x, state.lastPointer.y, new THREE.Vector3());
    if (!newest) return;
    trailPoints[trailLength - 1].lerp(newest, 0.68);
    for (let i = 0; i < trailLength - 1; i++) {
      const follow = 0.15 + (i / trailLength) * 0.18;
      trailPoints[i].lerp(trailPoints[i + 1], follow);
    }
    for (let i = 0; i < trailLength; i++) {
      const p = trailPoints[i];
      const prev = trailPoints[Math.max(0, i - 1)];
      const next = trailPoints[Math.min(trailLength - 1, i + 1)];
      const tx = next.x - prev.x;
      const ty = next.y - prev.y;
      const len = Math.max(0.0001, Math.hypot(tx, ty));
      const nx = -ty / len;
      const ny = tx / len;
      const age = i / (trailLength - 1);
      const width = (0.004 + clamp(speed, 0, 80) * 0.00016) * Math.pow(age, 1.35);
      const base = i * 6;
      ribbonPositions[base] = p.x + nx * width;
      ribbonPositions[base + 1] = p.y + ny * width;
      ribbonPositions[base + 2] = p.z;
      ribbonPositions[base + 3] = p.x - nx * width;
      ribbonPositions[base + 4] = p.y - ny * width;
      ribbonPositions[base + 5] = p.z;
    }
    ribbonGeometry.attributes.position.needsUpdate = true;
  }

  const ripples = [];
  function spawnRipple(x, y) {
    const p = screenToWorld(x, y, new THREE.Vector3());
    if (!p) return;
    const material = new THREE.MeshBasicMaterial({ color: 0xc8aa5d, transparent: true, opacity: 0.68, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
    const mesh = new THREE.Mesh(new THREE.RingGeometry(0.035, 0.043, 48), material);
    mesh.position.copy(p);
    mesh.position.z += 0.01;
    scene.add(mesh);
    ripples.push({ mesh, age: 0 });
  }

  setLoader(76, 'Connecting cinematic camera');

  const sections = [
    { el: document.querySelector('.hero'), label: 'Home' },
    { el: document.querySelector('#about'), label: 'Company' },
    { el: document.querySelector('#capabilities'), label: 'Capabilities' },
    { el: document.querySelector('#government'), label: 'Government' },
    { el: document.querySelector('#process'), label: 'Process' },
    { el: document.querySelector('#quote'), label: 'Quote' },
    { el: document.querySelector('#contact'), label: 'Contact' }
  ].filter((s) => s.el);

  const spatialIndex = document.createElement('nav');
  spatialIndex.className = 'spatial-index';
  spatialIndex.setAttribute('aria-label', 'Section progress');
  spatialIndex.innerHTML = sections.map((s, i) => `<a href="${s.el.id ? `#${s.el.id}` : '#top'}" data-index="${i}" aria-label="${s.label}"><span>${String(i + 1).padStart(2, '0')}</span><i></i></a>`).join('');
  body.appendChild(spatialIndex);

  const indexLinks = [...spatialIndex.querySelectorAll('a')];
  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const idx = sections.findIndex((s) => s.el === visible.target);
    if (idx >= 0) {
      state.activeSection = idx;
      body.dataset.scene = sections[idx].label.toLowerCase();
      indexLinks.forEach((link, i) => link.classList.toggle('active', i === idx));
    }
  }, { threshold: [0.2, 0.42, 0.62], rootMargin: '-20% 0px -28% 0px' });
  sections.forEach((s) => sectionObserver.observe(s.el));

  let cursor = null;
  let cursorDot = null;
  let cursorLabel = null;
  let cursorX = innerWidth / 2;
  let cursorY = innerHeight / 2;
  let cursorTX = cursorX;
  let cursorTY = cursorY;

  if (!coarsePointer) {
    cursor = document.createElement('div');
    cursor.className = 'spatial-cursor';
    cursor.innerHTML = '<span class="spatial-cursor-ring"></span><span class="spatial-cursor-dot"></span><span class="spatial-cursor-label"></span>';
    body.appendChild(cursor);
    cursorDot = cursor.querySelector('.spatial-cursor-dot');
    cursorLabel = cursor.querySelector('.spatial-cursor-label');

    document.addEventListener('pointerover', (event) => {
      const interactive = event.target.closest('a,button,input,select,textarea,[role="link"]');
      cursor.classList.toggle('is-interactive', Boolean(interactive));
      if (cursorLabel) {
        let label = '';
        if (interactive?.matches('button[type="submit"]')) label = 'SEND';
        else if (interactive?.closest('.cap-card')) label = 'VIEW';
        else if (interactive?.matches('a,.button,[role="link"]')) label = 'OPEN';
        cursorLabel.textContent = label;
      }
    });
  }

  function markActivity() { state.idle = 0; }

  addEventListener('pointermove', (event) => {
    const dx = event.clientX - state.lastPointer.x;
    const dy = event.clientY - state.lastPointer.y;
    state.pointerVelocity.set(dx, dy);
    state.pointerSpeed = Math.hypot(dx, dy);
    state.lastPointer.set(event.clientX, event.clientY);
    state.pointerTarget.set((event.clientX / innerWidth) * 2 - 1, -(event.clientY / innerHeight) * 2 + 1);
    cursorTX = event.clientX;
    cursorTY = event.clientY;
    markActivity();
  }, { passive: true });

  addEventListener('pointerdown', (event) => {
    spawnRipple(event.clientX, event.clientY);
    if (cursor) cursor.classList.add('is-pressed');
    markActivity();
  }, { passive: true });
  addEventListener('pointerup', () => cursor?.classList.remove('is-pressed'), { passive: true });

  addEventListener('scroll', () => {
    state.scrollTarget = scrollY;
    markActivity();
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    state.visible = !document.hidden;
  });

  setLoader(88, 'Precompiling visual systems');
  try { await renderer.compileAsync(scene, camera); } catch (_) { renderer.compile(scene, camera); }

  const navShell = document.querySelector('.nav-shell');
  let lastTime = performance.now();
  let frames = 0;
  let fpsTimer = 0;

  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
  }
  addEventListener('resize', resize, { passive: true });

  function setNetworkOpacity(value) {
    core.material.opacity = 0.35 + value * 0.47;
    rings.forEach((r, i) => r.material.opacity = (i % 2 ? 0.08 : 0.16) + value * (i % 2 ? 0.13 : 0.24));
    connections.material.opacity = 0.045 + value * 0.12;
    nodeMaterial.opacity = 0.36 + value * 0.6;
    routes.forEach((r, i) => r.material.opacity = 0.05 + value * (0.14 + i * 0.018));
  }

  function animate(now) {
    if (!state.visible) {
      lastTime = now;
      requestAnimationFrame(animate);
      return;
    }

    const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;
    state.elapsed += dt;
    state.idle += dt;
    const idleMix = smooth(clamp((state.idle - 6) / 8, 0, 1));

    state.pointer.lerp(state.pointerTarget, 1 - Math.pow(0.0008, dt));
    state.scroll += (state.scrollTarget - state.scroll) * (1 - Math.pow(0.0003, dt));
    const scrollDelta = state.scroll - state.lastScroll;
    state.scrollVelocity = lerp(state.scrollVelocity, scrollDelta / Math.max(dt, 0.001), 0.12);
    state.lastScroll = state.scroll;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    state.progress = clamp(state.scroll / maxScroll, 0, 1);

    const p = state.progress;
    const focus = state.activeSection === 0 || state.activeSection === 3 ? 1 : state.activeSection === 6 ? 0.62 : 0.24;
    setNetworkOpacity(focus * (1 - idleMix * 0.25));

    // Scroll-directed spatial choreography: one network, continuously transformed.
    const phase = Math.sin(p * Math.PI * 2);
    network.position.x = lerp(2.18, -1.95, smooth(clamp((p - 0.08) / 0.25, 0, 1))) + smooth(clamp((p - 0.34) / 0.22, 0, 1)) * 4.05;
    if (p > 0.64) network.position.x = lerp(network.position.x, -1.5, smooth((p - 0.64) / 0.36));
    network.position.y = 0.32 + phase * 0.28 - p * 0.55;
    network.position.z = -0.82 - Math.sin(p * Math.PI) * 1.15;
    const scale = 1 - Math.sin(p * Math.PI) * 0.14 + (state.activeSection === 3 ? 0.18 : 0);
    network.scale.setScalar(scale);

    const pointerInfluence = 1 - idleMix * 0.75;
    network.rotation.y += dt * (0.08 + Math.min(0.14, Math.abs(state.scrollVelocity) * 0.000018));
    network.rotation.x = state.pointer.y * 0.11 * pointerInfluence + Math.sin(state.elapsed * 0.18) * 0.035;
    network.rotation.z = state.pointer.x * -0.07 * pointerInfluence;
    core.rotation.x += dt * 0.045;
    core.rotation.y -= dt * 0.055;
    rings.forEach((ring, i) => ring.rotation.z += dt * (i % 2 ? -0.018 : 0.012));

    camera.position.x += ((state.pointer.x * 0.24 * pointerInfluence) - camera.position.x) * (1 - Math.pow(0.006, dt));
    camera.position.y += ((0.1 + state.pointer.y * 0.15 * pointerInfluence - p * 0.12) - camera.position.y) * (1 - Math.pow(0.008, dt));
    camera.position.z = 8.3 + Math.sin(p * Math.PI) * 0.42;
    camera.fov = 42 + clamp(Math.abs(state.scrollVelocity) * 0.0008, 0, 2.8);
    camera.updateProjectionMatrix();
    camera.lookAt(0, -0.05, -1.1);

    keyLight.position.x = 3.4 + state.pointer.x * 1.8;
    keyLight.position.y = 2 + state.pointer.y * 1.1;
    rimLight.intensity = 5.2 + clamp(state.pointerSpeed * 0.035, 0, 3.5);

    particleMaterial.uniforms.uTime.value = state.elapsed;
    particleMaterial.uniforms.uVelocity.value = state.scrollVelocity;
    particleMaterial.uniforms.uPointer.value.copy(state.pointer);
    particleMaterial.uniforms.uIdle.value = idleMix;
    particles.rotation.y = state.elapsed * 0.006 + p * 0.22;
    particles.position.y = -p * 0.42;

    updateRibbon(state.pointerSpeed);
    ribbonMaterial.uniforms.uOpacity.value = (coarsePointer ? 0.14 : 0.55) * (1 - idleMix * 0.72);

    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.age += dt;
      const t = clamp(r.age / 1.05, 0, 1);
      r.mesh.scale.setScalar(1 + t * 13);
      r.mesh.material.opacity = (1 - t) * 0.62;
      r.mesh.rotation.z += dt * 0.18;
      if (t >= 1) {
        scene.remove(r.mesh);
        r.mesh.geometry.dispose();
        r.mesh.material.dispose();
        ripples.splice(i, 1);
      }
    }

    const darkScene = state.activeSection === 0 || state.activeSection === 3 || state.activeSection === 6;
    canvas.style.opacity = darkScene ? '1' : '0.26';

    if (navShell) {
      const v = clamp(Math.abs(state.scrollVelocity) * 0.00003, 0, 0.045);
      navShell.style.transform = `translateY(${clamp(state.scrollVelocity * -0.00032, -3.2, 3.2)}px) scaleY(${1 + v})`;
    }

    if (cursor) {
      cursorX += (cursorTX - cursorX) * 0.22;
      cursorY += (cursorTY - cursorY) * 0.22;
      cursor.style.transform = `translate3d(${cursorX}px,${cursorY}px,0)`;
      if (cursorDot) cursorDot.style.transform = `scale(${1 + clamp(state.pointerSpeed * 0.012, 0, 0.7)})`;
    }

    renderer.render(scene, camera);

    frames++;
    fpsTimer += dt;
    if (fpsTimer > 2.5) {
      const fps = frames / fpsTimer;
      if (fps < 42 && pixelRatio > 0.85) {
        pixelRatio = Math.max(0.85, pixelRatio - 0.15);
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(innerWidth, innerHeight, false);
      }
      frames = 0;
      fpsTimer = 0;
    }

    state.pointerSpeed *= 0.84;
    requestAnimationFrame(animate);
  }

  setLoader(100, 'Experience ready');
  finishLoader(false);
  requestAnimationFrame(animate);
}
