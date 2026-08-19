(() => {
  'use strict';

  const body = document.body;
  const root = document.documentElement;
  if (!body || body.dataset.animationRegistryReady === '1') return;
  body.dataset.animationRegistryReady = '1';

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches || matchMedia('(hover: none)').matches || navigator.maxTouchPoints > 0;
  const saveData = Boolean(navigator.connection?.saveData);
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const tierRank = { safe: 0, lite: 1, balanced: 2, high: 3, ultra: 4 };
  const qualityMap = { lite:'lite', low:'lite', medium:'balanced', high:'high', ultra:'ultra' };

  function currentTier() {
    if (reducedMotion || saveData) return 'safe';
    const q = window.AmantusiCinematic?.quality || body.dataset.cinematicQuality || '';
    if (qualityMap[q]) return qualityMap[q];
    const perf = body.dataset.performanceTier || '';
    if (/mobile-lite|desktop-low/.test(perf)) return 'lite';
    if (/mobile-standard|desktop-medium/.test(perf)) return 'balanced';
    if (/mobile-high|desktop-high/.test(perf)) return /desktop-high/.test(perf) ? 'ultra' : 'high';
    return innerWidth >= 1280 ? 'high' : 'balanced';
  }

  const FAMILY_NAMES = {
    hero: [
      'background breathing scale','radial light horizontal drift','radial light vertical drift','vignette scroll intensity','gold atmospheric dust','microscopic light specks','depth fog pass','slow light sweep','background perspective drift','content depth separation',
      'headline camera depth','CTA delayed entrance','metadata stagger entrance','eyebrow tracking expansion','scroll indicator pulse','scroll indicator flowing dot','ambient gradient rotation','aurora deformation','grain breathing','shadow field movement',
      'corner illumination response','edge light tracing','cinematic exposure pulse','load highlight bloom','logo light reveal','logo depth extrusion illusion','letter-spacing settle','text focus resolution','word-mask reveal','line-mask reveal',
      'text blur-to-sharp entrance','text perspective entrance','CTA light sweep','CTA magnetic response','CTA gold edge pulse','CTA arrow acceleration','foreground atmospheric streak','foreground particles','foreground lens flare','pointer depth layers',
      'cursor-follow highlight','scroll-speed scene light','camera micro-dolly','camera micro-pan','camera micro-tilt','camera inertia settle','transition chromatic edge','luminance crossfade','scroll particle dispersal','darkness scene resolve'
    ],
    typography: [
      'word vertical reveal','word horizontal reveal','line mask reveal','character cascade','blur-to-focus reveal','perspective flattening','opacity stagger','letter-spacing contraction','letter-spacing expansion','underline drawing',
      'accent line extension','number counter reveal','gold gradient traversal','spotlight sweep','shadow depth emergence','reflection flicker','mask wipe left','mask wipe right','diagonal reveal','center-out reveal',
      'eyebrow tracking fade','eyebrow gold dot','eyebrow line drawing','eyebrow line retract','paragraph fade-up stagger','paragraph lite fade','paragraph blur resolution','paragraph depth rise','paragraph line reveal','paragraph progressive emphasis',
      'highlight word glow','statistics count-up','statistics digit roll','statistics decimal interpolation','percentage ring','section number slide','section number depth fade','decorative word drift','background typography parallax','background typography breathe',
      'link split hover','label-arrow counter-motion','underline liquid sweep','underline asymmetric draw','character micro-rise','button text shift','button arrow shift','button text clipping','CTA letter resolve','scroll-velocity typography response'
    ],
    sections: [
      'fade-up entrance','fade-down entrance','opacity crossfade','depth rise','depth sink','clip-path reveal','diagonal mask','vertical curtain','horizontal curtain','center expansion',
      'edge darkness transition','background light transition','accent interpolation','particle density change','camera target shift','camera focal shift','lighting direction shift','fog density shift','particle flow shift','gradient position interpolation',
      'divider line draw','divider glow','divider dissolve','progress indicator','section number indicator','side rail progress','section mini-map','progress dot transition','title pre-reveal','content delayed reveal',
      'exit desaturation','entry saturation restore','micro scale settle','perspective easing','foreground background separation','opposed image-text parallax','accent object orbit','accent object scroll drift','accent object pointer drift','spotlight entrance',
      'reading-position light','scroll shadow field','background texture drift','grain speed shift','non-hijack pinned sequence','visual hold text progress','connecting line tracking','progress wave','WebGL sync reveal','velocity-linked transition'
    ],
    controls: [
      'header scroll hide','header scroll reveal','header opacity transition','header blur transition','logo compression','logo scale restore','nav stagger load','active underline glide','active gold dot travel','header separator grow',
      'mobile circular menu reveal','mobile curtain menu','mobile stagger entries','mobile atmospheric glow','mobile particles','mobile watermark drift','close icon rotation','menu line morph','mobile CTA delay','mobile touch ripple',
      'button fill sweep','button center fill','button border trace','button gold pulse','button pointer highlight','button magnetic attraction','button release spring','button arrow acceleration','button icon rotation','button icon depth',
      'button press compression','button touch rebound','button glow wake','button sheen','button liquid highlight','button text parallax','form focus line','form label lift','form focus halo','form success glow',
      'form invalid shake','submit loading ring','upload progress','file chip arrival','file chip dissolve','dropdown arrow rotation','dropdown clip reveal','checkbox tick draw','toggle momentum','RFQ confirmation pulse'
    ],
    cards: [
      'capability elevation','capability perspective tilt','capability pointer light','capability border glow','capability icon float','capability icon line draw','capability icon depth','capability description reveal','capability CTA slide','capability gradient shift',
      'government light sweep','government data-line draw','government orbit point','government depth layers','supplier micro-tilt','product hover depth','product image slow zoom','product background light','catering image reveal','catering image settle',
      'catering caption rise','catering category fade','catering border sweep','catering soft perspective','menu stagger reveal','menu underline growth','menu price fade','menu touch lift','brochure depth hover','brochure light edge',
      'brochure corner highlight','brochure shadow movement','profile image parallax','profile copy offset reveal','profile timeline draw','profile statistic roll','trust badge reveal','trust badge pulse','trust badge border draw','trust ribbon drift',
      'trust ribbon hover pause','contact magnetic movement','contact icon slide','contact underline sweep','contact light orbit','contact ambient glow','quote depth separation','quote edge traversal','quote background breathe','quote success morph'
    ],
    network: [
      'global WebGL dust','global gold particles','global cyan particles','global depth motes','global procedural fog','global smoke wisps','global light streaks','global bokeh','global depth stars','global spatial noise',
      'network node breathing','network node rotation','network section pulse','network halo expansion','network connection sparks','network travelling signals','network route illumination','network route flow','network route depth fade','network route width modulation',
      'route scroll speed','route section direction','active node highlight','destination activation','origin activation','core pulse','core rotation','core inner light','core energy rings','core halo',
      'RFQ network pulse','menu network pulse','navigation network pulse','camera cluster travel','cluster emergence','cluster dissolution','particle gathering','particle dispersal','point-cloud morph','line-field morph',
      'WebGL depth fog','ambient shadow movement','light cone sweep','volumetric beam approximation','particle turbulence','slow vortex field','floating line fragments','radial energy flow','procedural grid distortion','depth tunnel illusion'
    ],
    objects3d: [
      'procurement cube','logistics container','package form','document sheet','quotation sheet','clipboard abstraction','supply crate','delivery route sculpture','interconnected spheres','metallic rings',
      'gold wireframe orb','glass sphere','translucent prism','glass slab','gold ribbon','mobius strip','torus','knot sculpture','wave surface','folded plane',
      'origami structure','logistics map plane','South Africa outline','KwaZulu-Natal outline','city route network','warehouse grid','procurement constellation','catering platter abstraction','cutlery abstraction','service icon constellation',
      'slow Y rotation','slow X rotation','scroll-linked rotation','pointer-linked tilt','inertial pointer rotation','float bob','scale breathing','shadow movement','reflection movement','section morph',
      'explode reform','particle assembly','particle dissolve','wireframe to solid','solid to wireframe','gold edge travel','depth focus shift','silhouette emergence','material transition','scene-relative lighting'
    ],
    shaders: [
      'transition displacement','liquid page distortion','gold ripple','cyan ripple','noise reveal','noise dissolve','directional dissolve','radial dissolve','edge dissolve','UV distortion',
      'UV breathing','micro refraction','glass refraction','glass chromatic edge','speed chromatic aberration','transition chromatic aberration','lens distortion','pointer WebGL ripple','touch WebGL ripple','scroll network ripple',
      'route signal-wave shader','node energy-ring shader','Fresnel object glow','angle Fresnel glow','metal reflection sweep','gold anisotropic illusion','brushed-metal texture','frosted-glass noise','animated glass refraction','holographic sheen',
      'procedural grain','procedural cloud','procedural fog','procedural radial light','procedural line field','procedural node field','procedural turbulence','procedural flow field','procedural gradient waves','topographic contours',
      'logistics-map contours','shader image reveal','shader mask transition','shader curtain','shader luminance transition','CTA brightness pulse','camera blur','speed vignette','pointer shader highlight','FPS shader governor'
    ],
    touch: [
      'touch button compression','touch gold ripple','touch glow burst','touch card lift','touch card settle','touch card shadow','touch image expansion','touch image zoom','touch panel lighting','touch node pulse',
      'touch route pulse','touch network shockwave','touch radial burst','touch gold particle burst','touch cyan particle burst','touch dust displacement','touch fluid ripple','double-tap highlight','double-tap card focus','double-tap network pulse',
      'long-press glow build','long-press progress ring','swipe page hint','swipe gallery momentum','swipe card parallax','swipe route response','drag inertia','drag shadow deformation','drag glow intensity','drag resistance',
      'short touch particle trail','stylus precision glow','stylus pressure sizing','touch velocity spread','touch direction ripple','touch release spring','touch hold depth','pen hover equivalent','orientation micro-parallax','device-tilt light',
      'device-tilt network','device-tilt 3D object','orientation scene settle','mobile nav depth','mobile nav particles','mobile sticky CTA pulse','mobile scroll feedback','mobile section arrival','mobile safe-area accent','mobile idle reduction'
    ],
    transitions: [
      'gold page curtain','dark page curtain','radial page mask','circular page reveal','diagonal page reveal','soft page crossfade','blur page crossfade','depth page push','depth page pull','WebGL network page sweep',
      'travelling page signal','gold line page tracer','logo transition reveal','ambient transition sweep','browser-back reversal','anchor soft scene shift','hash target highlight','active nav glow','scene label morph','ambient colour transition',
      'RFQ success network burst','RFQ success 3D rings','RFQ gold particle converge','RFQ reference reveal','admin RFQ status pulse','new lead dashboard glow','lead stage transition','quotation status morph','quotation accepted confirmation','quotation rejected dissolve',
      'supplier record arrival','product stagger reveal','dashboard statistic count','dashboard chart-line draw','dashboard row trail','dashboard notification pulse','logo metallic sweep','logo depth response','logo perimeter route','logo reflection',
      'footer line-field','footer particle drift','footer contact glow','footer depth fade','idle environmental breathing','activity reawakening','tab-return refocus','quality-change crossfade','low-FPS graceful simplification','global ambient heartbeat'
    ]
  };

  const familyOrder = ['hero','typography','sections','controls','cards','network','objects3d','shaders','touch','transitions'];
  const familyTrigger = { hero:'hero', typography:'viewport', sections:'scroll', controls:'interaction', cards:'interaction', network:'continuous', objects3d:'webgl', shaders:'state-change', touch:'touch', transitions:'navigation' };
  const registry = [];
  familyOrder.forEach((family, familyIndex) => {
    FAMILY_NAMES[family].forEach((name, variantIndex) => {
      const id = familyIndex * 50 + variantIndex + 1;
      const cost = family === 'objects3d' || family === 'shaders' ? 3 + (variantIndex % 2) : family === 'network' ? 2 + (variantIndex % 3 === 0 ? 1 : 0) : variantIndex % 8 === 0 ? 2 : 1;
      const minTier = cost >= 4 ? 'ultra' : cost === 3 ? 'high' : cost === 2 ? 'balanced' : 'lite';
      registry.push(Object.freeze({ id, key:`A${String(id).padStart(3,'0')}`, family, name, trigger:familyTrigger[family], cost, minTier, enabled:true }));
    });
  });

  if (registry.length !== 500) throw new Error(`Animation registry expected 500 recipes, found ${registry.length}.`);

  const overrides = new Map();
  let tier = currentTier();
  let forcedTier = '';
  let longTaskPressure = 0;
  body.dataset.animationTier = tier;
  body.dataset.animationCount = '500';

  function effectiveTier() { return forcedTier || tier; }
  function isActive(recipe) {
    if (overrides.get(recipe.id) === false) return false;
    if (reducedMotion && recipe.cost > 1) return false;
    if (coarse && (recipe.family === 'objects3d' || recipe.family === 'shaders') && recipe.cost > 3) return false;
    return tierRank[effectiveTier()] >= tierRank[recipe.minTier];
  }
  function activeRecipes(family) { return registry.filter(r => (!family || r.family === family) && isActive(r)); }

  function syncProfile(reason='sync') {
    tier = currentTier();
    body.dataset.animationTier = effectiveTier();
    const detail = {
      tier: effectiveTier(),
      reason,
      total: 500,
      active: activeRecipes().length,
      families: Object.fromEntries(familyOrder.map(f => [f, activeRecipes(f).length]))
    };
    document.dispatchEvent(new CustomEvent('amantusi:animation-profile', { detail }));
    try { window.AmantusiExperience?.setAnimationProfile?.(detail); } catch (_) {}
  }

  document.addEventListener('amantusi:cinematic-quality', () => syncProfile('cinematic-quality'));

  try {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(list => {
        longTaskPressure += list.getEntries().filter(entry => entry.duration > 75).length;
        if (longTaskPressure < 4) return;
        longTaskPressure = 0;
        const order = ['safe','lite','balanced','high','ultra'];
        const idx = order.indexOf(effectiveTier());
        if (idx > 0) {
          forcedTier = order[idx - 1];
          body.dataset.animationTier = forcedTier;
          syncProfile('long-task-pressure');
        }
      });
      observer.observe({ type:'longtask', buffered:true });
    }
  } catch (_) {}

  const overlay = document.createElement('div');
  overlay.className = 'ar-overlay';
  overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML = '<div class="ar-vignette"></div><div class="ar-light-sweep"></div><div class="ar-depth-fog"></div><div class="ar-signal-line"></div><div class="ar-particles"></div><div class="ar-heartbeat"></div>';
  body.appendChild(overlay);
  const particleHost = overlay.querySelector('.ar-particles');
  const maxParticles = effectiveTier() === 'ultra' ? 24 : effectiveTier() === 'high' ? 16 : effectiveTier() === 'balanced' ? 9 : 4;
  for (let i=0;i<maxParticles;i++) {
    const p=document.createElement('i');
    p.style.setProperty('--i',String(i));
    p.style.setProperty('--x',`${(7 + (i*37)%86)}%`);
    p.style.setProperty('--y',`${(11 + (i*53)%78)}%`);
    p.style.setProperty('--s',`${.45 + (i%5)*.18}`);
    p.style.setProperty('--d',`${7 + (i%7)*1.6}s`);
    p.style.setProperty('--delay',`${-(i%9)*.9}s`);
    particleHost.appendChild(p);
  }

  const sections = [...document.querySelectorAll('main section,.hero')];
  const sectionObserver = new IntersectionObserver(entries => {
    const visible = entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if (!visible) return;
    sections.forEach(s=>s.classList.toggle('ar-current-section',s===visible.target));
    const idx = Math.max(0,sections.indexOf(visible.target));
    body.dataset.animationScene = visible.target.id || (visible.target.classList.contains('hero')?'hero':`section-${idx}`);
    root.style.setProperty('--ar-section-index',String(idx));
    try { window.AmantusiExperience?.pulse?.('section'); } catch (_) {}
  }, { threshold:[.18,.36,.58], rootMargin:'-16% 0px -24% 0px' });
  sections.forEach(s=>sectionObserver.observe(s));

  const revealSelector = '.section-intro,.section-heading,.prose,.cap-card,.government-panel,.process-step,.quote-copy,.quote-form,.trust-item,.menu-card,.brochure-card,.profile-card,.contact-links a';
  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('ar-revealed');
    revealObserver.unobserve(entry.target);
  }), { threshold:.1, rootMargin:'0px 0px -6% 0px' });
  function decorate(scope=document) {
    scope.querySelectorAll?.(revealSelector).forEach((el,i)=>{
      if (el.dataset.arReveal) return;
      el.dataset.arReveal='1';
      el.classList.add('ar-reveal');
      el.style.setProperty('--ar-delay',`${Math.min(5,i%6)*45}ms`);
      revealObserver.observe(el);
    });
  }
  decorate();

  const mutationRoot = document.querySelector('main');
  if (mutationRoot) new MutationObserver(records=>{
    if (records.some(r=>r.addedNodes.length)) decorate(mutationRoot);
  }).observe(mutationRoot,{childList:true,subtree:true});

  let raf=0, lastY=scrollY, velocity=0, px=innerWidth/2, py=innerHeight/2, tpx=px, tpy=py;
  function frame() {
    raf=0;
    const y=scrollY;
    const dy=y-lastY;
    velocity=velocity*.78+dy*.22;
    lastY=y;
    px += (tpx-px)*.16;
    py += (tpy-py)*.16;
    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    root.style.setProperty('--ar-scroll',(y/max).toFixed(5));
    root.style.setProperty('--ar-speed',Math.min(1,Math.abs(velocity)/45).toFixed(4));
    root.style.setProperty('--ar-dir',velocity>=0?'1':'-1');
    root.style.setProperty('--ar-x',`${px.toFixed(1)}px`);
    root.style.setProperty('--ar-y',`${py.toFixed(1)}px`);
    if (Math.abs(velocity)>.05 || Math.abs(tpx-px)>.3 || Math.abs(tpy-py)>.3) requestFrame();
  }
  function requestFrame(){if(!raf&&!document.hidden)raf=requestAnimationFrame(frame)}
  addEventListener('scroll',requestFrame,{passive:true});
  if (!coarse) addEventListener('pointermove',e=>{tpx=e.clientX;tpy=e.clientY;requestFrame()},{passive:true});

  if (!coarse && !reducedMotion) {
    const magnetic = document.querySelectorAll('.button,.nav-cta,.text-link,.contact-links a');
    magnetic.forEach(el=>{
      let rect=null, localRaf=0, pending=null;
      el.classList.add('ar-magnetic');
      el.addEventListener('pointerenter',()=>{rect=el.getBoundingClientRect();el.classList.add('ar-hover')},{passive:true});
      el.addEventListener('pointermove',e=>{
        if(!rect)return; pending=e; if(localRaf)return;
        localRaf=requestAnimationFrame(()=>{localRaf=0;if(!pending||!rect)return;const nx=clamp((pending.clientX-rect.left)/Math.max(1,rect.width),0,1)-.5;const ny=clamp((pending.clientY-rect.top)/Math.max(1,rect.height),0,1)-.5;el.style.setProperty('--ar-mx',`${(nx*4.5).toFixed(2)}px`);el.style.setProperty('--ar-my',`${(ny*3.5).toFixed(2)}px`);});
      },{passive:true});
      el.addEventListener('pointerleave',()=>{rect=null;el.classList.remove('ar-hover');el.style.removeProperty('--ar-mx');el.style.removeProperty('--ar-my')},{passive:true});
    });
  }

  const rippleHost=document.createElement('div');
  rippleHost.className='ar-touch-host'; rippleHost.setAttribute('aria-hidden','true'); body.appendChild(rippleHost);
  const ripples=[];
  function ripple(x,y,kind='touch') {
    const max=effectiveTier()==='safe'?2:effectiveTier()==='lite'?4:8;
    while(ripples.length>=max)ripples.shift()?.remove();
    const el=document.createElement('i');el.className=`ar-ripple ar-ripple-${kind}`;el.style.left=`${x}px`;el.style.top=`${y}px`;rippleHost.appendChild(el);ripples.push(el);setTimeout(()=>{el.remove();const idx=ripples.indexOf(el);if(idx>=0)ripples.splice(idx,1)},780);
    try { window.AmantusiExperience?.pulse?.(kind); } catch (_) {}
  }

  let lastTap=0, holdTimer=0, startX=0, startY=0;
  addEventListener('pointerdown',e=>{
    if(e.pointerType==='touch'||e.pointerType==='pen'){
      startX=e.clientX;startY=e.clientY;ripple(e.clientX,e.clientY,e.pointerType);
      clearTimeout(holdTimer);holdTimer=setTimeout(()=>{ripple(e.clientX,e.clientY,'hold');body.classList.add('ar-long-press');setTimeout(()=>body.classList.remove('ar-long-press'),520)},520);
      const now=performance.now();if(now-lastTap<320){ripple(e.clientX,e.clientY,'double');try{window.AmantusiExperience?.pulse?.('double')}catch(_){}}lastTap=now;
    }
  },{passive:true});
  addEventListener('pointerup',e=>{
    clearTimeout(holdTimer);
    if(e.pointerType==='touch'||e.pointerType==='pen'){
      const dx=e.clientX-startX,dy=e.clientY-startY;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)){body.dataset.arSwipe=dx>0?'right':'left';setTimeout(()=>delete body.dataset.arSwipe,420)}
    }
  },{passive:true});
  addEventListener('pointercancel',()=>clearTimeout(holdTimer),{passive:true});

  if (!('requestPermission' in (window.DeviceOrientationEvent||{})) && coarse && effectiveTier()!=='safe') {
    addEventListener('deviceorientation',e=>{
      if(e.gamma==null||e.beta==null)return;
      root.style.setProperty('--ar-tilt-x',clamp(e.gamma/45,-1,1).toFixed(3));
      root.style.setProperty('--ar-tilt-y',clamp((e.beta-45)/60,-1,1).toFixed(3));
      try { window.AmantusiExperience?.setDeviceTilt?.(clamp(e.gamma/45,-1,1),clamp((e.beta-45)/60,-1,1)); } catch (_) {}
    },{passive:true});
  }

  const quoteForm=document.querySelector('#quote-form');
  if(quoteForm){
    const quoteObserver=new MutationObserver(()=>{
      const text=quoteForm.textContent||'';
      if(!/AMT-|reference|submitted|success/i.test(text))return;
      body.classList.add('ar-rfq-success');
      const r=quoteForm.getBoundingClientRect();ripple(r.left+r.width*.5,Math.max(20,Math.min(innerHeight-20,r.top+r.height*.35)),'success');
      try { window.AmantusiExperience?.pulse?.('rfq'); } catch (_) {}
      setTimeout(()=>body.classList.remove('ar-rfq-success'),1800);
    });
    quoteObserver.observe(quoteForm,{childList:true,subtree:true,characterData:true});
  }

  let heartbeatTimer=0;
  function scheduleHeartbeat(){
    clearTimeout(heartbeatTimer);
    if(document.hidden||reducedMotion)return;
    heartbeatTimer=setTimeout(()=>{
      if(tierRank[effectiveTier()]>=2){body.classList.add('ar-heartbeat-active');try{window.AmantusiExperience?.pulse?.('heartbeat')}catch(_){}setTimeout(()=>body.classList.remove('ar-heartbeat-active'),1400)}
      scheduleHeartbeat();
    },24000+Math.random()*9000);
  }

  document.addEventListener('visibilitychange',()=>{
    body.classList.toggle('ar-page-hidden',document.hidden);
    if(document.hidden){if(raf){cancelAnimationFrame(raf);raf=0}clearTimeout(heartbeatTimer)}else{requestFrame();scheduleHeartbeat();body.classList.add('ar-tab-return');setTimeout(()=>body.classList.remove('ar-tab-return'),700)}
  });
  addEventListener('orientationchange',()=>{body.classList.add('ar-orientation-settle');setTimeout(()=>body.classList.remove('ar-orientation-settle'),720)},{passive:true});

  const API={
    get count(){return 500},
    get tier(){return effectiveTier()},
    get activeCount(){return activeRecipes().length},
    list(family=''){return activeRecipes(family).map(r=>({...r}))},
    get(id){const r=registry.find(x=>x.id===Number(id));return r?{...r,active:isActive(r)}:null},
    enable(id){overrides.set(Number(id),true);syncProfile('manual-enable')},
    disable(id){overrides.set(Number(id),false);syncProfile('manual-disable')},
    setTier(next){if(!(next in tierRank))throw new Error('Unknown animation tier');forcedTier=next;syncProfile('manual-tier')},
    clearTier(){forcedTier='';syncProfile('tier-auto')},
    pulse(kind='manual'){ripple(innerWidth*.5,innerHeight*.5,kind);try{window.AmantusiExperience?.pulse?.(kind)}catch(_){}}
  };
  window.AmantusiAnimations=API;
  root.classList.add('animation-registry-ready');
  syncProfile('initial');
  requestFrame();
  scheduleHeartbeat();
})();