(() => {
  'use strict';

  const EFFECTS = Object.freeze({
    1:'hero-reveal',2:'curtain-reveal',3:'gold-line-draw',4:'headline-stagger',5:'subtitle-focus',
    6:'hero-parallax',7:'light-sweep',8:'hero-crossfade',9:'scroll-pulse',10:'depth',
    11:'fade-up',12:'reveal-left',13:'reveal-right',14:'alternate',15:'scale-in',16:'blur-focus',
    17:'line-reveal',18:'counter',19:'sticky-sequence',20:'background-morph',21:'image-tilt',22:'touch-tilt',
    23:'hover-zoom',24:'image-pan',25:'border-trace',26:'caption-rise',27:'gallery-stack',28:'gallery-drag',
    29:'gallery-momentum',30:'active-depth',31:'card-lift',32:'shadow-expand',33:'icon-rotate',34:'card-mask',
    35:'content-stagger',36:'price-reveal',37:'filter-transition',38:'card-flip-detail',39:'tag-cascade',40:'spotlight',
    41:'magnetic-cta',42:'gold-sweep',43:'press-compress',44:'arrow-shift',45:'cursor-preview',46:'anchor-transition',
    47:'accordion',48:'form-focus',49:'rfq-success',50:'footer-reveal'
  });

  const mediaReduce = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)').matches || matchMedia('(hover: none)').matches || navigator.maxTouchPoints > 0;
  const saveData = Boolean(navigator.connection?.saveData);
  const memory = Number(navigator.deviceMemory || 4);
  const cores = Number(navigator.hardwareConcurrency || 4);
  const lowViewport = Math.min(innerWidth, innerHeight) < 520;

  function resolveTier() {
    if (mediaReduce.matches || saveData || memory <= 2 || cores <= 2 || lowViewport) return 'lite';
    if (coarse || memory <= 4 || cores <= 4 || innerWidth < 900) return 'standard';
    return 'high';
  }

  let tier = resolveTier();
  document.documentElement.dataset.cateringMotionTier = tier;
  document.documentElement.classList.add('cm-anchor-transition');

  const bound = new WeakMap();
  const observers = new Set();
  let pointerX = innerWidth / 2;
  let pointerY = innerHeight / 2;
  let scrollYLatest = scrollY;
  let raf = 0;

  function mark(el, name) {
    let set = bound.get(el);
    if (!set) { set = new Set(); bound.set(el, set); }
    if (set.has(name)) return false;
    set.add(name);
    return true;
  }

  function reveal(el, className = 'cm-reveal', threshold = .1) {
    if (!el || !mark(el, `reveal:${className}`)) return;
    el.classList.add(className);
    if (mediaReduce.matches) { el.classList.add('cm-visible'); return; }
    const obs = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('cm-visible');
        obs.unobserve(entry.target);
      }
    }, { threshold, rootMargin: '0px 0px -4% 0px' });
    observers.add(obs);
    obs.observe(el);
  }

  function splitWords(el) {
    if (!el || el.dataset.cmSplit) return;
    el.dataset.cmSplit = '1';
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) if (walker.currentNode.nodeValue.trim()) nodes.push(walker.currentNode);
    let delay = 0;
    nodes.forEach(node => {
      const frag = document.createDocumentFragment();
      const parts = node.nodeValue.split(/(\s+)/);
      parts.forEach(part => {
        if (!part.trim()) { frag.append(part); return; }
        const span = document.createElement('span');
        span.className = 'cm-word';
        span.textContent = part;
        span.style.transitionDelay = `${Math.min(420, delay)}ms`;
        delay += 55;
        frag.append(span);
      });
      node.parentNode.replaceChild(frag, node);
    });
    requestAnimationFrame(() => requestAnimationFrame(() => el.querySelectorAll('.cm-word').forEach(n => n.classList.add('cm-visible'))));
  }

  function bindTilt(el, strength = 4) {
    if (!el || tier !== 'high' || coarse || mediaReduce.matches || !mark(el, 'tilt')) return;
    let localRaf = 0;
    let evt = null;
    el.addEventListener('pointermove', e => {
      evt = e;
      if (localRaf) return;
      localRaf = requestAnimationFrame(() => {
        localRaf = 0;
        if (!evt) return;
        const r = el.getBoundingClientRect();
        const x = (evt.clientX - r.left) / Math.max(1, r.width) - .5;
        const y = (evt.clientY - r.top) / Math.max(1, r.height) - .5;
        el.style.transform = `perspective(1100px) rotateX(${-y * strength}deg) rotateY(${x * strength * 1.15}deg) translateY(-3px)`;
      });
    }, { passive:true });
    el.addEventListener('pointerleave', () => { evt = null; if (localRaf) cancelAnimationFrame(localRaf); localRaf = 0; el.style.transform = ''; }, { passive:true });
  }

  function bindTouchTilt(el) {
    if (!el || tier === 'lite' || !coarse || mediaReduce.matches || !mark(el, 'touch-tilt')) return;
    el.addEventListener('pointerdown', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / Math.max(1, r.width) - .5;
      const y = (e.clientY - r.top) / Math.max(1, r.height) - .5;
      el.animate([
        { transform:'translate3d(0,0,0) scale(1)' },
        { transform:`translate3d(${x * 4}px,${y * 4}px,0) scale(.992)` },
        { transform:'translate3d(0,0,0) scale(1)' }
      ], { duration:360, easing:'cubic-bezier(.2,.75,.2,1)' });
    }, { passive:true });
  }

  function bindMagnet(el) {
    if (!el || tier !== 'high' || coarse || mediaReduce.matches || !mark(el, 'magnet')) return;
    el.classList.add('cm-btn');
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * .08;
      const y = (e.clientY - (r.top + r.height / 2)) * .08;
      el.style.setProperty('--cm-mx', `${x}px`);
      el.style.setProperty('--cm-my', `${y}px`);
    }, { passive:true });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--cm-mx','0px'); el.style.setProperty('--cm-my','0px'); }, { passive:true });
  }

  function bindCursorPreview(card) {
    if (!card || tier !== 'high' || coarse || mediaReduce.matches || !mark(card, 'cursor-preview')) return;
    const img = card.querySelector('img');
    if (!img?.currentSrc && !img?.src) return;
    let preview = document.querySelector('.cm-cursor-preview');
    if (!preview) { preview = document.createElement('div'); preview.className = 'cm-cursor-preview'; preview.innerHTML = '<img alt="">'; document.body.append(preview); }
    const previewImg = preview.querySelector('img');
    card.addEventListener('pointerenter', () => { previewImg.src = img.currentSrc || img.src; preview.classList.add('cm-show'); }, { passive:true });
    card.addEventListener('pointermove', e => { preview.style.left = `${e.clientX + 22}px`; preview.style.top = `${e.clientY + 20}px`; }, { passive:true });
    card.addEventListener('pointerleave', () => preview.classList.remove('cm-show'), { passive:true });
  }

  function bindGallery(root) {
    if (!root || !mark(root, 'gallery')) return;
    root.classList.add('cm-gallery');
    const track = root.querySelector('[data-catering-gallery-track]');
    if (!track) return;
    track.classList.add('cm-gallery-track');
    let x = 0, startX = 0, pointerStart = 0, dragging = false, velocity = 0, lastX = 0, lastT = 0, momentum = 0;
    const clamp = value => {
      const min = Math.min(0, root.clientWidth - track.scrollWidth - 8);
      return Math.max(min, Math.min(0, value));
    };
    const render = () => { track.style.transform = `translate3d(${x}px,0,0)`; updateActive(); };
    const updateActive = () => {
      const center = root.getBoundingClientRect().left + root.clientWidth / 2;
      track.querySelectorAll('.cm-gallery-card').forEach(card => {
        const r = card.getBoundingClientRect();
        card.classList.toggle('cm-active', Math.abs((r.left + r.width / 2) - center) < r.width * .62);
      });
    };
    const stopMomentum = () => { if (momentum) cancelAnimationFrame(momentum); momentum = 0; };
    const glide = () => {
      velocity *= .94;
      x = clamp(x + velocity * 16);
      render();
      if (Math.abs(velocity) > .02) momentum = requestAnimationFrame(glide); else momentum = 0;
    };
    track.addEventListener('pointerdown', e => {
      if (mediaReduce.matches) return;
      dragging = true; stopMomentum(); track.setPointerCapture?.(e.pointerId); pointerStart = e.clientX; startX = x; lastX = e.clientX; lastT = performance.now(); velocity = 0;
    });
    track.addEventListener('pointermove', e => {
      if (!dragging) return;
      const now = performance.now(); const dx = e.clientX - lastX; const dt = Math.max(8, now - lastT); velocity = dx / dt; lastX = e.clientX; lastT = now;
      x = clamp(startX + (e.clientX - pointerStart)); render();
    });
    const end = e => { if (!dragging) return; dragging = false; track.releasePointerCapture?.(e.pointerId); if (tier !== 'lite' && !mediaReduce.matches) momentum = requestAnimationFrame(glide); };
    track.addEventListener('pointerup', end); track.addEventListener('pointercancel', end);
    addEventListener('resize', () => { x = clamp(x); render(); }, { passive:true });
    updateActive();
  }

  function animateCounter(el) {
    if (!el || !mark(el,'counter')) return;
    const end = Number(el.dataset.counterEnd ?? el.textContent.replace(/[^0-9.]/g,''));
    if (!Number.isFinite(end)) return;
    const prefix = el.dataset.counterPrefix || ''; const suffix = el.dataset.counterSuffix || '';
    const obs = new IntersectionObserver(entries => {
      if (!entries[0]?.isIntersecting) return;
      obs.disconnect();
      if (mediaReduce.matches) { el.textContent = `${prefix}${Math.round(end)}${suffix}`; return; }
      const start = performance.now(); const duration = 850;
      const step = now => { const p = Math.min(1,(now-start)/duration); const eased = 1 - Math.pow(1-p,3); el.textContent = `${prefix}${Math.round(end*eased).toLocaleString('en-ZA')}${suffix}`; if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }, { threshold:.5 }); obs.observe(el); observers.add(obs);
  }

  function bindAccordion(btn) {
    if (!btn || !mark(btn,'accordion')) return;
    btn.classList.add('cm-accordion');
    btn.setAttribute('aria-expanded', btn.getAttribute('aria-expanded') || 'false');
    btn.addEventListener('click', () => btn.setAttribute('aria-expanded', btn.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'));
  }

  function effect(el, name, index = 0) {
    if (!el) return;
    switch (name) {
      case 'hero-reveal': reveal(el,'cm-scale-in',.02); break;
      case 'curtain-reveal': { if (tier === 'lite' || el.querySelector(':scope > .cm-curtain')) break; const c=document.createElement('div'); c.className='cm-curtain'; el.append(c); requestAnimationFrame(()=>requestAnimationFrame(()=>c.classList.add('cm-open'))); setTimeout(()=>c.remove(),1500); break; }
      case 'gold-line-draw': { if (el.querySelector(':scope > .cm-gold-line')) break; const line=document.createElement('span'); line.className='cm-gold-line'; el.append(line); requestAnimationFrame(()=>line.classList.add('cm-visible')); break; }
      case 'headline-stagger': splitWords(el); break;
      case 'subtitle-focus': el.classList.add('cm-subtitle-focus'); requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('cm-visible'))); break;
      case 'hero-parallax': el.dataset.cmParallax = el.dataset.cmParallax || '.14'; break;
      case 'light-sweep': { if (tier==='lite'||el.querySelector(':scope > .cm-light-sweep')) break; const s=document.createElement('i'); s.className='cm-light-sweep'; s.setAttribute('aria-hidden','true'); el.append(s); break; }
      case 'hero-crossfade': el.classList.add('cm-ready'); break;
      case 'scroll-pulse': { if (tier==='lite'||el.querySelector(':scope > .cm-scroll-cue')) break; const cue=document.createElement('span'); cue.className='cm-scroll-cue'; cue.setAttribute('aria-hidden','true'); el.append(cue); break; }
      case 'depth': el.dataset.cmDepth = el.dataset.cmDepth || '.08'; break;
      case 'fade-up': reveal(el,'cm-reveal'); break;
      case 'reveal-left': reveal(el,'cm-reveal-left'); break;
      case 'reveal-right': reveal(el,'cm-reveal-right'); break;
      case 'alternate': reveal(el,index%2?'cm-reveal-right':'cm-reveal-left'); break;
      case 'scale-in': reveal(el,'cm-scale-in'); break;
      case 'blur-focus': reveal(el,tier==='lite'?'cm-reveal':'cm-blur-focus'); break;
      case 'line-reveal': reveal(el,'cm-reveal'); break;
      case 'counter': animateCounter(el); break;
      case 'sticky-sequence': if(tier==='high')el.classList.add('cm-sticky-sequence'); break;
      case 'background-morph': el.classList.add('cm-bg-morph'); reveal(el,'cm-bg-morph'); break;
      case 'image-tilt': bindTilt(el,3.2); break;
      case 'touch-tilt': bindTouchTilt(el); break;
      case 'hover-zoom': el.classList.add('cm-hover-zoom'); break;
      case 'image-pan': el.classList.add('cm-image-pan'); break;
      case 'border-trace': el.classList.add('cm-border-trace'); break;
      case 'caption-rise': el.classList.add('cm-image-wrap'); break;
      case 'gallery-stack': el.querySelectorAll('.cm-gallery-card').forEach((n,i)=>n.style.zIndex=String(100-i)); break;
      case 'gallery-drag': case 'gallery-momentum': case 'active-depth': bindGallery(el); break;
      case 'card-lift': el.classList.add('cm-card','cm-card-lift'); break;
      case 'shadow-expand': el.classList.add('cm-card','cm-shadow'); break;
      case 'icon-rotate': el.classList.add('cm-icon-rotate'); break;
      case 'card-mask': el.classList.add('cm-mask'); reveal(el,'cm-mask'); break;
      case 'content-stagger': el.querySelectorAll('h3,p,.menu-category-label,.service-pill').forEach((child,i)=>{child.classList.add('cm-stagger-child');child.style.transitionDelay=`${Math.min(240,i*45)}ms`;requestAnimationFrame(()=>child.classList.add('cm-visible'));}); break;
      case 'price-reveal': el.classList.add('cm-price-reveal'); break;
      case 'filter-transition': el.classList.add('cm-filter-done'); break;
      case 'card-flip-detail': el.classList.add('cm-flip'); break;
      case 'tag-cascade': el.classList.add('cm-tag'); requestAnimationFrame(()=>el.classList.add('cm-visible')); break;
      case 'spotlight': el.classList.add('cm-spotlight-scope'); break;
      case 'magnetic-cta': bindMagnet(el); break;
      case 'gold-sweep': el.classList.add('cm-btn','cm-gold-sweep'); break;
      case 'press-compress': el.classList.add('cm-btn'); break;
      case 'arrow-shift': { if (!el.querySelector('.cm-arrow')) { const a=document.createElement('span');a.className='cm-arrow';a.textContent='→';a.setAttribute('aria-hidden','true');el.append(a); } break; }
      case 'cursor-preview': bindCursorPreview(el); break;
      case 'anchor-transition': break;
      case 'accordion': bindAccordion(el); break;
      case 'form-focus': el.classList.add('cm-field'); break;
      case 'rfq-success': break;
      case 'footer-reveal': el.classList.add('cm-footer-reveal'); reveal(el,'cm-footer-reveal'); break;
    }
  }

  function applyList(el, names, index=0) { names.forEach(name => effect(el,name,index)); }

  function decorateMenuCards(scope=document) {
    const cards=[...scope.querySelectorAll('.menu-card')];
    cards.forEach((card,i)=>{
      applyList(card,['fade-up','card-lift','shadow-expand','border-trace','image-tilt','touch-tilt','content-stagger','cursor-preview'],i);
      const image=card.querySelector('.menu-image'); if(image) applyList(image,[i%2?'image-pan':'hover-zoom','caption-rise','card-mask'],i);
      const price=card.querySelector('.menu-price'); if(price) effect(price,'price-reveal');
      const tag=card.querySelector('.menu-category-label'); if(tag) effect(tag,'tag-cascade');
    });
    const grid=scope.matches?.('.menu-grid')?scope:scope.querySelector('.menu-grid'); if(grid) effect(grid,'spotlight');
  }

  function wirePage(scope=document) {
    const hero=scope.querySelector('.menu-hero');
    if(hero){ applyList(hero,['hero-reveal','curtain-reveal','hero-parallax','light-sweep','hero-crossfade','scroll-pulse','depth']); const copy=hero.querySelector('.menu-hero-grid>div:first-child'); if(copy)effect(copy,'gold-line-draw'); const h1=hero.querySelector('h1'); if(h1)effect(h1,'headline-stagger'); const sub=hero.querySelector('[data-catering-subtitle]'); if(sub)effect(sub,'subtitle-focus'); const plate=hero.querySelector('.menu-plate'); if(plate)applyList(plate,['image-tilt','touch-tilt','scale-in']); }
    const cover=scope.querySelector('.brochure-cover');
    if(cover){ applyList(cover,['hero-reveal','curtain-reveal','light-sweep','scroll-pulse','depth']); const inner=cover.querySelector('.brochure-cover-inner'); if(inner){effect(inner,'gold-line-draw');const h1=inner.querySelector('h1');if(h1)effect(h1,'headline-stagger');const p=inner.querySelector('p:last-child');if(p)effect(p,'subtitle-focus');} }

    [...scope.querySelectorAll('.menu-heading')].forEach((n,i)=>effect(n,i%2?'reveal-right':'reveal-left',i));
    [...scope.querySelectorAll('.menu-trust-grid>div')].forEach((n,i)=>{effect(n,'fade-up',i);n.style.transitionDelay=`${i*70}ms`;});
    [...scope.querySelectorAll('.brochure-card,.process-step')].forEach((n,i)=>applyList(n,['alternate','card-lift','shadow-expand','border-trace','content-stagger'],i));
    [...scope.querySelectorAll('.service-pill')].forEach((n,i)=>{effect(n,'tag-cascade',i);n.style.transitionDelay=`${Math.min(360,i*45)}ms`;});
    [...scope.querySelectorAll('.menu-section')].forEach((n,i)=>{ if(i%3===1)effect(n,'background-morph',i); });
    [...scope.querySelectorAll('.menu-btn')].forEach(btn=>applyList(btn,['magnetic-cta','gold-sweep','press-compress','arrow-shift']));
    [...scope.querySelectorAll('.category-tab')].forEach(tab=>applyList(tab,['press-compress','gold-sweep']));
    [...scope.querySelectorAll('form .admin-field,form .field,form label')].forEach(n=>effect(n,'form-focus'));
    [...scope.querySelectorAll('[data-accordion]')].forEach(n=>effect(n,'accordion'));
    [...scope.querySelectorAll('[data-counter-end]')].forEach(n=>effect(n,'counter'));
    [...scope.querySelectorAll('[data-catering-gallery]')].forEach(g=>applyList(g,['gallery-stack','gallery-drag','gallery-momentum','active-depth']));
    const footer=scope.querySelector('footer'); if(footer)effect(footer,'footer-reveal');
    decorateMenuCards(scope);
  }

  function updateContinuous() {
    raf=0;
    if (mediaReduce.matches || tier==='lite') return;
    const y=scrollYLatest;
    document.querySelectorAll('[data-cm-parallax]').forEach(el=>{const k=Number(el.dataset.cmParallax||.1);el.style.setProperty('--cm-scroll-y',`${y*k}px`);if(!el.classList.contains('menu-hero')&&!el.classList.contains('brochure-cover'))el.style.transform=`translate3d(0,${Math.min(40,y*k*.08)}px,0)`;});
    document.querySelectorAll('[data-cm-depth]').forEach(el=>{const r=el.getBoundingClientRect();const center=(r.top+r.height/2)-innerHeight/2;const k=Number(el.dataset.cmDepth||.05);el.style.setProperty('--cm-depth-y',`${Math.max(-20,Math.min(20,-center*k*.05))}px`);});
  }

  function scheduleContinuous(){scrollYLatest=scrollY;if(raf)return;raf=requestAnimationFrame(updateContinuous);}
  addEventListener('scroll',scheduleContinuous,{passive:true}); addEventListener('resize',scheduleContinuous,{passive:true});
  addEventListener('pointermove',e=>{pointerX=e.clientX;pointerY=e.clientY;},{passive:true});

  function bindAnchors(){
    document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const id=a.getAttribute('href');if(!id||id==='#')return;const target=document.querySelector(id);if(!target)return;e.preventDefault();document.documentElement.classList.add('cm-anchor-active');setTimeout(()=>{target.scrollIntoView({behavior:mediaReduce.matches?'auto':'smooth',block:'start'});setTimeout(()=>document.documentElement.classList.remove('cm-anchor-active'),220);},80);});
  }

  function onMenuFilter(grid){ if(!grid)return; grid.classList.add('cm-filtering'); setTimeout(()=>{grid.classList.remove('cm-filtering');grid.classList.add('cm-filter-done');setTimeout(()=>grid.classList.remove('cm-filter-done'),560);},90); }

  function success(target){
    const host=typeof target==='string'?document.querySelector(target):target; if(!host)return;
    const mark=document.createElement('span');mark.className='cm-success-mark';mark.innerHTML='<svg viewBox="0 0 48 48" width="28" height="28" fill="none" aria-hidden="true"><path d="M13 24.5 21 32l15-17" stroke="#b89e56" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';host.prepend(mark);
  }

  function refresh(scope=document){wirePage(scope);scheduleContinuous();}

  window.CateringMotion={effects:EFFECTS,get tier(){return tier;},refresh,onMenuFilter,success};

  document.addEventListener('DOMContentLoaded',()=>{bindAnchors();refresh(document);});
  mediaReduce.addEventListener?.('change',()=>{tier=resolveTier();document.documentElement.dataset.cateringMotionTier=tier;refresh(document);});
})();
