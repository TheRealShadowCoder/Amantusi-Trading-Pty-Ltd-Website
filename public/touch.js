(() => {
  const coarse = matchMedia('(pointer: coarse)').matches || matchMedia('(hover: none)').matches || navigator.maxTouchPoints > 0;
  if (!coarse) return;

  const root = document.documentElement;
  root.classList.add('touch-device');

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = Boolean(navigator.connection?.saveData);
  const memory = Number(navigator.deviceMemory || 4);
  const cores = Number(navigator.hardwareConcurrency || 4);
  const tier = reduced || saveData || memory <= 2 || cores <= 2 ? 'lite' : (memory >= 6 && cores >= 6 ? 'high' : 'standard');
  root.dataset.touchTier = tier;

  const layer = document.createElement('div');
  layer.className = 'touch-fx-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);

  const active = new Map();
  let lastTap = { t: 0, x: 0, y: 0, target: null };
  let lastTrailAt = 0;

  const interactiveSelector = [
    'a','button','.cap-card','.menu-card','.brochure-card','.profile-block','.brand-panel',
    '.government-panel','.quote-form','.hero-art','.logo-plaque','.credential','.service-pill',
    '.process-step','.trust-item','.contact-links a','.admin-panel','.item-row','.login-card'
  ].join(',');

  const textSelector = 'h1,h2,h3,.hero-title,.menu-kicker,.button,.menu-btn,.admin-button,.nav-links a,.subsite-links a,.capability-chip,.category-tab';

  function viewport() {
    const height = window.visualViewport?.height || innerHeight;
    root.style.setProperty('--app-vh', `${height * 0.01}px`);
  }
  viewport();
  addEventListener('resize', viewport, { passive: true });
  window.visualViewport?.addEventListener('resize', viewport, { passive: true });

  function targetFor(node) {
    return node instanceof Element ? node.closest(interactiveSelector) : null;
  }

  function markReactive(el) {
    if (!el) return;
    el.classList.add('touch-reactive');
    const text = el.matches(textSelector) ? el : el.querySelector(textSelector);
    text?.classList.add('touch-text');
  }
  document.querySelectorAll(interactiveSelector).forEach(markReactive);

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches?.(interactiveSelector)) markReactive(node);
        node.querySelectorAll?.(interactiveSelector).forEach(markReactive);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  function localPoint(el, x, y) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const lx = Math.max(0, Math.min(100, ((x - r.left) / Math.max(1, r.width)) * 100));
    const ly = Math.max(0, Math.min(100, ((y - r.top) / Math.max(1, r.height)) * 100));
    el.style.setProperty('--touch-local-x', `${lx}%`);
    el.style.setProperty('--touch-local-y', `${ly}%`);
    el.style.setProperty('--tilt-y', `${((lx - 50) / 50) * 2.2}deg`);
    el.style.setProperty('--tilt-x', `${((50 - ly) / 50) * 2.0}deg`);
  }

  function shockwave(x, y, superPulse = false) {
    if (reduced) return;
    const el = document.createElement('i');
    el.className = `touch-shockwave${superPulse ? ' super' : ''}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    layer.appendChild(el);
    setTimeout(() => el.remove(), superPulse ? 1050 : 800);
  }

  function particles(x, y, count = 8, power = 1) {
    if (reduced || tier === 'lite') return;
    const max = tier === 'high' ? count : Math.ceil(count * .65);
    for (let i = 0; i < max; i++) {
      const p = document.createElement('i');
      const angle = (Math.PI * 2 * i / max) + Math.random() * .4;
      const dist = (22 + Math.random() * 38) * power;
      p.className = 'touch-particle';
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
      p.style.setProperty('--p-dur', `${.55 + Math.random() * .4}s`);
      layer.appendChild(p);
      setTimeout(() => p.remove(), 1000);
    }
  }

  function contact(x, y) {
    if (reduced) return null;
    const el = document.createElement('i');
    el.className = 'touch-contact';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    layer.appendChild(el);
    return el;
  }

  function ring(x, y) {
    if (reduced || tier === 'lite') return null;
    const el = document.createElement('i');
    el.className = 'touch-ring';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    layer.appendChild(el);
    return el;
  }

  function lens(x, y) {
    if (reduced || tier === 'lite') return null;
    const el = document.createElement('i');
    el.className = 'touch-lens';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    layer.appendChild(el);
    return el;
  }

  function trail(x, y, velocity = 0) {
    if (reduced || tier === 'lite') return;
    const now = performance.now();
    const wait = tier === 'high' ? 26 : 44;
    if (now - lastTrailAt < wait) return;
    lastTrailAt = now;
    const p = document.createElement('i');
    p.className = 'touch-trail';
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    const s = Math.max(3, Math.min(9, 3 + velocity * .025));
    p.style.width = `${s}px`;
    p.style.height = `${s}px`;
    layer.appendChild(p);
    setTimeout(() => p.remove(), 760);
  }

  function clearState(state) {
    clearTimeout(state.longTimer);
    state.contact?.classList.add('release');
    setTimeout(() => state.contact?.remove(), 300);
    state.ring?.remove();
    state.lens?.remove();
    if (state.target) {
      state.target.classList.remove('touch-active','touch-charged');
      state.target.style.setProperty('--drag-x','0px');
      state.target.style.setProperty('--drag-y','0px');
      state.target.style.setProperty('--tilt-x','0deg');
      state.target.style.setProperty('--tilt-y','0deg');
      state.text?.classList.remove('touch-active-text');
    }
  }

  function swipeClass(dx, dy) {
    if (Math.abs(dx) < 45 && Math.abs(dy) < 45) return '';
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'touch-swipe-right' : 'touch-swipe-left';
    return dy > 0 ? 'touch-swipe-down' : 'touch-swipe-up';
  }

  function pulseClass(el, cls, ms = 540) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), ms);
  }

  addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    const target = targetFor(event.target);
    const text = target?.matches(textSelector) ? target : target?.querySelector(textSelector);
    const now = performance.now();
    const doubleTap = now - lastTap.t < 340 && Math.hypot(event.clientX-lastTap.x,event.clientY-lastTap.y) < 48 && lastTap.target === target;

    root.style.setProperty('--touch-x', `${event.clientX}px`);
    root.style.setProperty('--touch-y', `${event.clientY}px`);
    shockwave(event.clientX, event.clientY, doubleTap);
    particles(event.clientX, event.clientY, doubleTap ? 16 : 8, doubleTap ? 1.35 : 1);

    if (target) {
      markReactive(target);
      localPoint(target, event.clientX, event.clientY);
      target.classList.add('touch-active');
      text?.classList.add('touch-active-text');
      if (doubleTap) {
        pulseClass(target,'touch-double',700);
        pulseClass(text,'touch-double-text',720);
      }
    }

    const state = {
      target, text,
      sx:event.clientX, sy:event.clientY,
      x:event.clientX, y:event.clientY,
      t:now, lastT:now,
      contact:contact(event.clientX,event.clientY),
      ring:null, lens:null, charged:false,
      longTimer:null
    };

    state.longTimer = setTimeout(() => {
      state.charged = true;
      state.target?.classList.add('touch-charged');
      state.ring = ring(state.x,state.y);
      if (state.target?.matches('.menu-card,.hero-art,.profile-logo-box,.brochure-card,.brand-panel')) state.lens = lens(state.x,state.y);
      particles(state.x,state.y,12,1.15);
    }, 520);

    active.set(event.pointerId,state);
    lastTap = {t:now,x:event.clientX,y:event.clientY,target};
  }, { passive:true });

  addEventListener('pointermove', (event) => {
    const state = active.get(event.pointerId);
    if (!state) return;
    const now = performance.now();
    const dt = Math.max(1, now-state.lastT);
    const dx = event.clientX-state.x;
    const dy = event.clientY-state.y;
    const velocity = Math.hypot(dx,dy)/dt*1000;
    state.x = event.clientX; state.y = event.clientY; state.lastT = now;
    state.contact && (state.contact.style.left=`${event.clientX}px`,state.contact.style.top=`${event.clientY}px`);
    state.ring && (state.ring.style.left=`${event.clientX}px`,state.ring.style.top=`${event.clientY}px`);
    state.lens && (state.lens.style.left=`${event.clientX}px`,state.lens.style.top=`${event.clientY}px`);
    root.style.setProperty('--touch-x', `${event.clientX}px`);
    root.style.setProperty('--touch-y', `${event.clientY}px`);
    trail(event.clientX,event.clientY,velocity);

    if (state.target) {
      localPoint(state.target,event.clientX,event.clientY);
      const dragX = Math.max(-10,Math.min(10,(event.clientX-state.sx)*.08));
      const dragY = Math.max(-10,Math.min(10,(event.clientY-state.sy)*.08));
      state.target.style.setProperty('--drag-x',`${dragX}px`);
      state.target.style.setProperty('--drag-y',`${dragY}px`);
    }

    if (Math.hypot(event.clientX-state.sx,event.clientY-state.sy)>16 && !state.charged) clearTimeout(state.longTimer);
  }, { passive:true });

  function finish(event) {
    const state = active.get(event.pointerId);
    if (!state) return;
    const dx = event.clientX-state.sx;
    const dy = event.clientY-state.sy;
    const cls = swipeClass(dx,dy);
    if (cls && state.target) pulseClass(state.target,cls,520);

    // Edge-swipe navigation: reveal the main menu without hijacking normal scrolling or pinch zoom.
    if (state.sx < 24 && dx > 72 && Math.abs(dy) < 65) {
      const menu = document.querySelector('.menu-button');
      const nav = document.querySelector('#main-nav');
      if (menu && nav && !nav.classList.contains('open')) menu.click();
    }

    clearState(state);
    active.delete(event.pointerId);
  }

  addEventListener('pointerup', finish, { passive:true });
  addEventListener('pointercancel', finish, { passive:true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      active.forEach(clearState);
      active.clear();
      layer.replaceChildren();
    }
  });
})();
