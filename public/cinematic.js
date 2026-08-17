(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  if (!body || body.dataset.cinematicReady === '1') return;
  body.dataset.cinematicReady = '1';

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches || matchMedia('(hover: none)').matches || navigator.maxTouchPoints > 0;
  const saveData = Boolean(navigator.connection?.saveData);
  const memory = Number(navigator.deviceMemory || 4);
  const cores = Number(navigator.hardwareConcurrency || 4);
  const width = () => document.documentElement.clientWidth || innerWidth;
  const height = () => document.documentElement.clientHeight || innerHeight;
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const lerp = (a, b, t) => a + (b - a) * t;

  function initialQuality() {
    if (reducedMotion || saveData || memory <= 2 || cores <= 2) return 'lite';
    if (memory <= 4 || cores <= 4) return width() < 860 ? 'low' : 'medium';
    if (width() < 700) return 'medium';
    if (memory >= 8 && cores >= 8 && width() >= 1280) return 'ultra';
    return 'high';
  }

  const qualityOrder = ['lite', 'low', 'medium', 'high', 'ultra'];
  let quality = initialQuality();
  body.dataset.cinematicQuality = quality;

  const state = {
    rawScroll: scrollY,
    targetScroll: scrollY,
    smoothScroll: scrollY,
    previousScroll: scrollY,
    velocity: 0,
    acceleration: 0,
    direction: 1,
    progress: 0,
    sectionProgress: 0,
    activeSection: null,
    activeIndex: 0,
    pointerX: width() * .5,
    pointerY: height() * .5,
    targetPointerX: width() * .5,
    targetPointerY: height() * .5,
    pointerVelocity: 0,
    previousPointerX: width() * .5,
    previousPointerY: height() * .5,
    visible: !document.hidden,
    dirty: true,
    inputUntil: performance.now() + 1800,
    lastFrame: performance.now(),
    longTasks: 0
  };

  const ui = document.createElement('div');
  ui.className = 'cinematic-ui';
  ui.setAttribute('aria-hidden', 'true');
  ui.innerHTML = `
    <div class="cinematic-frame"></div>
    <div class="cinematic-lens"></div>
    <div class="cinematic-scene-tag"><span>Scene</span><strong>Home</strong></div>
    <div class="cinematic-velocity-line"></div>
  `;
  body.appendChild(ui);

  const transition = document.createElement('div');
  transition.className = 'cinematic-transition';
  transition.setAttribute('aria-hidden', 'true');
  body.appendChild(transition);

  const sceneTag = ui.querySelector('.cinematic-scene-tag strong');

  const sceneConfig = [
    { selector: '.hero', id: 'home', label: 'Supply Network', accent: '#c8aa5d', rgb: '200,170,93', intensity: 1.0 },
    { selector: '#about', id: 'company', label: 'Company', accent: '#a98946', rgb: '169,137,70', intensity: .42 },
    { selector: '#capabilities', id: 'capabilities', label: 'Capabilities', accent: '#c8aa5d', rgb: '200,170,93', intensity: .74 },
    { selector: '#government', id: 'government', label: 'Institutional Supply', accent: '#e2c77b', rgb: '226,199,123', intensity: 1.0 },
    { selector: '#process', id: 'process', label: 'Fulfilment Flow', accent: '#789ba2', rgb: '120,155,162', intensity: .48 },
    { selector: '#quote', id: 'quote', label: 'RFQ Gateway', accent: '#b6954d', rgb: '182,149,77', intensity: .66 },
    { selector: '#contact', id: 'contact', label: 'Contact', accent: '#d5b968', rgb: '213,185,104', intensity: .86 }
  ].map((config, index) => ({ ...config, index, el: document.querySelector(config.selector) })).filter(item => item.el);

  function markDirty(duration = 900) {
    state.dirty = true;
    state.inputUntil = Math.max(state.inputUntil, performance.now() + duration);
    requestFrame();
  }

  let raf = 0;
  function requestFrame() {
    if (!raf && state.visible) raf = requestAnimationFrame(frame);
  }

  function downgradeQuality(reason = 'frame-budget') {
    const idx = qualityOrder.indexOf(quality);
    if (idx <= 0) return;
    quality = qualityOrder[idx - 1];
    body.dataset.cinematicQuality = quality;
    document.dispatchEvent(new CustomEvent('amantusi:cinematic-quality', { detail: { quality, reason } }));
  }

  function upgradeQuality() {
    if (saveData || reducedMotion) return;
    const idx = qualityOrder.indexOf(quality);
    const max = qualityOrder.indexOf(initialQuality());
    if (idx < max) {
      quality = qualityOrder[idx + 1];
      body.dataset.cinematicQuality = quality;
      document.dispatchEvent(new CustomEvent('amantusi:cinematic-quality', { detail: { quality, reason: 'recovered' } }));
    }
  }

  try {
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver(list => {
        const count = list.getEntries().filter(entry => entry.duration > 65).length;
        if (!count) return;
        state.longTasks += count;
        if (state.longTasks >= 4) {
          downgradeQuality('long-task-pressure');
          state.longTasks = 0;
        }
      });
      longTaskObserver.observe({ type: 'longtask', buffered: true });
    }
  } catch (_) {}

  function splitWords(element) {
    if (!element || element.dataset.cinematicSplit === '1' || reducedMotion) return;
    const original = (element.textContent || '').replace(/\s+/g, ' ').trim();
    if (!original) return;
    element.dataset.cinematicSplit = '1';
    element.classList.add('cinematic-split');
    if (!element.getAttribute('aria-label')) element.setAttribute('aria-label', original);

    let wordIndex = 0;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent || parent.closest('[aria-hidden="true"]')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(node => {
      const frag = document.createDocumentFragment();
      const parts = node.nodeValue.split(/(\s+)/);
      parts.forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
          return;
        }
        const mask = document.createElement('span');
        mask.className = 'cinematic-word-mask';
        mask.setAttribute('aria-hidden', 'true');
        const word = document.createElement('span');
        word.className = 'cinematic-word';
        word.style.setProperty('--word-index', String(Math.min(wordIndex, 18)));
        word.textContent = part;
        mask.appendChild(word);
        frag.appendChild(mask);
        wordIndex += 1;
      });
      node.parentNode?.replaceChild(frag, node);
    });
  }

  const splitTargets = [
    document.querySelector('.hero-title'),
    ...document.querySelectorAll('.section-intro h2,.section-heading h2,.government h2,.quote-copy h2,.contact-strip h2')
  ].filter(Boolean);
  splitTargets.forEach(splitWords);

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('cinematic-visible');
    });
  }, { threshold: .16, rootMargin: '0px 0px -8% 0px' });
  splitTargets.forEach(el => revealObserver.observe(el));

  const nearObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('cinematic-near', entry.isIntersecting));
  }, { rootMargin: '55% 0px 55% 0px', threshold: 0 });
  document.querySelectorAll('main section').forEach(section => nearObserver.observe(section));

  function setScene(config) {
    if (!config || state.activeSection === config.el) return;
    state.activeSection?.classList.remove('cinematic-current');
    state.activeSection = config.el;
    state.activeIndex = config.index;
    config.el.classList.add('cinematic-current');
    body.dataset.cinematicScene = config.id;
    root.style.setProperty('--cinematic-accent', config.accent);
    root.style.setProperty('--cinematic-accent-rgb', config.rgb);
    if (sceneTag) sceneTag.textContent = config.label;
    markDirty(1200);
  }

  const sceneObserver = new IntersectionObserver(entries => {
    const candidate = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!candidate) return;
    const config = sceneConfig.find(item => item.el === candidate.target);
    setScene(config);
  }, { threshold: [.22, .38, .55, .7], rootMargin: '-18% 0px -24% 0px' });
  sceneConfig.forEach(config => sceneObserver.observe(config.el));
  if (sceneConfig[0]) setScene(sceneConfig[0]);

  const depthNodes = [
    ...document.querySelectorAll('.hero-aurora,.section-accent,.government-orbit,.contact-shine,.page-glow')
  ];
  depthNodes.forEach((el, index) => {
    el.dataset.cinematicDepth = String(index % 3);
    el.setAttribute('data-cinematic-depth', '');
  });

  function updateSectionProgress() {
    const active = state.activeSection;
    if (!active) return;
    const rect = active.getBoundingClientRect();
    const viewport = height();
    const travel = rect.height + viewport;
    state.sectionProgress = clamp((viewport - rect.top) / Math.max(1, travel), 0, 1);
    root.style.setProperty('--cinematic-section-progress', state.sectionProgress.toFixed(4));

    if (active.id === 'process') {
      const steps = active.querySelectorAll('.process-step');
      steps.forEach((step, index) => {
        const start = index / Math.max(1, steps.length);
        const end = (index + 1) / Math.max(1, steps.length);
        const p = clamp((state.sectionProgress - start) / Math.max(.001, end - start), 0, 1);
        step.style.setProperty('--step-progress', p.toFixed(3));
      });
    }
  }

  function updateDepth() {
    if (reducedMotion || quality === 'lite') return;
    const velocity = clamp(state.velocity / 1400, -1, 1);
    depthNodes.forEach((el, index) => {
      const strength = coarse ? 3 + index % 2 : 7 + (index % 3) * 3;
      const local = Math.sin((state.progress + index * .17) * Math.PI * 2) * strength;
      const velocityPush = velocity * (coarse ? 2 : 6);
      el.style.setProperty('--cinematic-depth', `${(local + velocityPush).toFixed(2)}px`);
    });
  }

  function updateCssState() {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - height());
    state.progress = clamp(state.smoothScroll / maxScroll, 0, 1);
    root.style.setProperty('--cinematic-progress', state.progress.toFixed(5));
    root.style.setProperty('--cinematic-velocity', Math.min(1200, Math.abs(state.velocity)).toFixed(2));
    root.style.setProperty('--cinematic-direction', String(state.direction));
    root.style.setProperty('--cinematic-x', `${state.pointerX.toFixed(1)}px`);
    root.style.setProperty('--cinematic-y', `${state.pointerY.toFixed(1)}px`);
    updateSectionProgress();
    updateDepth();
  }

  let slowFrameCount = 0;
  let healthyFrameCount = 0;
  function frame(now) {
    raf = 0;
    if (!state.visible) return;
    const dtMs = clamp(now - state.lastFrame, 1, 80);
    state.lastFrame = now;
    const dt = dtMs / 1000;

    const previousVelocity = state.velocity;
    state.smoothScroll += (state.targetScroll - state.smoothScroll) * (1 - Math.exp(-12 * dt));
    const delta = state.smoothScroll - state.previousScroll;
    const instantaneous = delta / Math.max(dt, .001);
    state.velocity = lerp(state.velocity, instantaneous, .18);
    state.acceleration = lerp(state.acceleration, state.velocity - previousVelocity, .16);
    if (Math.abs(state.velocity) > 2) state.direction = state.velocity >= 0 ? 1 : -1;
    state.previousScroll = state.smoothScroll;

    state.pointerX += (state.targetPointerX - state.pointerX) * (1 - Math.exp(-14 * dt));
    state.pointerY += (state.targetPointerY - state.pointerY) * (1 - Math.exp(-14 * dt));

    updateCssState();

    if (dtMs > 26) {
      slowFrameCount += 1;
      healthyFrameCount = 0;
    } else if (dtMs < 19) {
      healthyFrameCount += 1;
      slowFrameCount = Math.max(0, slowFrameCount - 1);
    }
    if (slowFrameCount > 26) {
      downgradeQuality('dom-frame-budget');
      slowFrameCount = 0;
    }
    if (healthyFrameCount > 420) {
      upgradeQuality();
      healthyFrameCount = 0;
    }

    const moving = Math.abs(state.targetScroll - state.smoothScroll) > .4 || Math.abs(state.velocity) > 1.5;
    const pointerMoving = Math.abs(state.targetPointerX - state.pointerX) > .35 || Math.abs(state.targetPointerY - state.pointerY) > .35;
    const keepAlive = now < state.inputUntil;
    state.dirty = moving || pointerMoving || keepAlive;
    if (state.dirty) requestFrame();
  }

  addEventListener('scroll', () => {
    state.rawScroll = scrollY;
    state.targetScroll = scrollY;
    markDirty(650);
  }, { passive: true });

  if (!coarse) {
    addEventListener('pointermove', event => {
      const dx = event.clientX - state.previousPointerX;
      const dy = event.clientY - state.previousPointerY;
      state.pointerVelocity = Math.hypot(dx, dy);
      state.previousPointerX = event.clientX;
      state.previousPointerY = event.clientY;
      state.targetPointerX = event.clientX;
      state.targetPointerY = event.clientY;
      markDirty(500);
    }, { passive: true });
  } else {
    addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
      state.targetPointerX = event.clientX;
      state.targetPointerY = event.clientY;
      state.pointerX = event.clientX;
      state.pointerY = event.clientY;
      markDirty(420);
    }, { passive: true });
  }

  document.addEventListener('visibilitychange', () => {
    state.visible = !document.hidden;
    if (state.visible) {
      state.lastFrame = performance.now();
      markDirty(800);
    } else if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });

  addEventListener('resize', () => markDirty(900), { passive: true });
  screen.orientation?.addEventListener?.('change', () => setTimeout(() => markDirty(1400), 160), { passive: true });

  /* Local card lighting/tilt uses CSS variables; no layout reads inside animation loops. */
  if (!coarse && !reducedMotion) {
    document.querySelectorAll('.cap-card').forEach(card => {
      let rect = null;
      card.addEventListener('pointerenter', () => {
        rect = card.getBoundingClientRect();
        card.classList.add('cinematic-card-active');
      }, { passive: true });
      card.addEventListener('pointermove', event => {
        if (!rect) return;
        const x = clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
        const y = clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1);
        card.style.setProperty('--card-x', `${(x * 100).toFixed(1)}%`);
        card.style.setProperty('--card-y', `${(y * 100).toFixed(1)}%`);
        card.style.setProperty('--card-tilt-x', `${((.5 - y) * 3.2).toFixed(2)}deg`);
        card.style.setProperty('--card-tilt-y', `${((x - .5) * 4.2).toFixed(2)}deg`);
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        rect = null;
        card.classList.remove('cinematic-card-active');
        card.style.removeProperty('--card-tilt-x');
        card.style.removeProperty('--card-tilt-y');
      }, { passive: true });
    });
  }

  /* Full-screen navigation is still the existing semantic nav; we only make it spatial. */
  const menuButton = document.querySelector('.menu-button');
  const nav = document.getElementById('main-nav');
  function syncMenu() {
    const open = Boolean(nav?.classList.contains('open'));
    body.classList.toggle('cinematic-menu-open', open);
    markDirty(open ? 1600 : 700);
  }
  if (menuButton && nav) {
    menuButton.addEventListener('click', () => requestAnimationFrame(syncMenu));
    nav.addEventListener('pointermove', event => {
      if (!nav.classList.contains('open')) return;
      const x = clamp(event.clientX / Math.max(1, width()), 0, 1);
      const y = clamp(event.clientY / Math.max(1, height()), 0, 1);
      nav.style.setProperty('--menu-x', `${(x * 100).toFixed(1)}%`);
      nav.style.setProperty('--menu-y', `${(y * 100).toFixed(1)}%`);
    }, { passive: true });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setTimeout(syncMenu, 0)));
  }

  /* Progressive media loading: critical hero assets stay eager; below-fold assets decode asynchronously. */
  document.querySelectorAll('img').forEach(img => {
    img.decoding = 'async';
    if (img.closest('.hero,.site-header,#experience-loader')) {
      if (img.closest('.hero')) img.fetchPriority = 'high';
      return;
    }
    if (!img.hasAttribute('loading')) img.loading = 'lazy';
    if (!img.complete) {
      img.dataset.cinematicLazy = '1';
      img.addEventListener('load', () => img.classList.add('cinematic-image-ready'), { once: true, passive: true });
      img.addEventListener('error', () => img.classList.add('cinematic-image-ready'), { once: true, passive: true });
    } else {
      img.classList.add('cinematic-image-ready');
    }
  });

  /* Preload likely next pages only after user intent. */
  const prefetched = new Set();
  function prefetchLink(link) {
    if (!link || prefetched.has(link.href)) return;
    let url;
    try { url = new URL(link.href, location.href); } catch (_) { return; }
    if (url.origin !== location.origin || url.pathname === location.pathname || url.hash) return;
    prefetched.add(link.href);
    const hint = document.createElement('link');
    hint.rel = 'prefetch';
    hint.href = url.href;
    document.head.appendChild(hint);
  }
  document.querySelectorAll('a[href]').forEach(link => {
    link.addEventListener('pointerenter', () => prefetchLink(link), { passive: true, once: true });
    link.addEventListener('touchstart', () => prefetchLink(link), { passive: true, once: true });
  });

  /* Cinematic page wipe for same-origin document navigation. Hash navigation remains instant/usable. */
  if (!reducedMotion) {
    document.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!link || link.hasAttribute('download') || link.target === '_blank') return;
      let url;
      try { url = new URL(link.href, location.href); } catch (_) { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      if (!/^https?:$/.test(url.protocol)) return;
      event.preventDefault();
      transition.classList.remove('is-leaving');
      transition.classList.add('is-entering');
      setTimeout(() => { location.href = url.href; }, 560);
    });

    transition.classList.add('is-leaving');
    setTimeout(() => transition.classList.remove('is-leaving'), 720);
  }

  /* Keep per-section light tied to deliberate pointer contact, not a generic global hover. */
  document.querySelectorAll('main section').forEach(section => {
    if (coarse) return;
    section.addEventListener('pointermove', event => {
      const rect = section.getBoundingClientRect();
      section.style.setProperty('--section-light-x', `${clamp((event.clientX - rect.left) / Math.max(1, rect.width) * 100, 0, 100).toFixed(1)}%`);
      section.style.setProperty('--section-light-y', `${clamp((event.clientY - rect.top) / Math.max(1, rect.height) * 100, 0, 100).toFixed(1)}%`);
    }, { passive: true });
  });

  /* Expose a read-only snapshot for diagnostics without driving UI through global state. */
  window.AmantusiCinematic = Object.freeze({
    get quality() { return quality; },
    get snapshot() {
      return {
        quality,
        progress: state.progress,
        sectionProgress: state.sectionProgress,
        velocity: state.velocity,
        acceleration: state.acceleration,
        direction: state.direction,
        scene: body.dataset.cinematicScene || 'home',
        reducedMotion,
        saveData,
        coarsePointer: coarse
      };
    }
  });

  root.classList.add('cinematic-ready');
  markDirty(1800);
})();
