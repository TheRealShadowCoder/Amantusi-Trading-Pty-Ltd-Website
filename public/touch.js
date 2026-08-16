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
  const pendingMoves = new Map();
  let moveFrame = 0;
  let lastTap = { t: 0, x: 0, y: 0, target: null };
  let lastTrailAt = 0;
  let activeFx = 0;
  const maxFx = tier === 'high' ? 28 : tier === 'standard' ? 18 : 8;

  const interactiveSelector = [
    'a','button','.cap-card','.menu-card','.brochure-card','.profile-block','.brand-panel',
    '.government-panel','.quote-form','.hero-art','.logo-plaque','.credential','.service-pill',
    '.process-step','.trust-item','.contact-links a','.admin-panel','.item-row','.login-card'
  ].join(',');

  const textSelector = 'h1,h2,h3,.hero-title,.menu-kicker,.button,.menu-btn,.admin-button,.nav-links a,.subsite-links a,.capability-chip,.category-tab';

  function targetFor(node) {
    return node instanceof Element ? node.closest(interactiveSelector) : null;
  }

  function createFx(className, x, y, ttl, extraClass = '') {
    if (reduced || activeFx >= maxFx) return null;
    const el = document.createElement('i');
    el.className = `${className}${extraClass ? ` ${extraClass}` : ''}`;
    el.style.setProperty('--fx-x', `${x}px`);
    el.style.setProperty('--fx-y', `${y}px`);
    layer.appendChild(el);
    activeFx++;
    setTimeout(() => {
      el.remove();
      activeFx = Math.max(0, activeFx - 1);
    }, ttl);
    return el;
  }

  function shockwave(x, y, superPulse = false) {
    createFx('touch-shockwave', x, y, superPulse ? 900 : 690, superPulse ? 'super' : '');
  }

  function particles(x, y, requested = 6, power = 1) {
    if (reduced || tier === 'lite') return;
    const count = tier === 'high' ? Math.min(requested, 8) : Math.min(requested, 4);
    for (let i = 0; i < count; i++) {
      if (activeFx >= maxFx) break;
      const p = createFx('touch-particle', x, y, 720);
      if (!p) break;
      const angle = (Math.PI * 2 * i / Math.max(1, count)) + Math.random() * .35;
      const dist = (18 + Math.random() * 30) * power;
      p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
      p.style.setProperty('--p-dur', `${.45 + Math.random() * .22}s`);
    }
  }

  function trail(x, y, velocity = 0) {
    if (reduced || tier === 'lite') return;
    const now = performance.now();
    const wait = tier === 'high' ? 48 : 82;
    if (now - lastTrailAt < wait || activeFx >= maxFx) return;
    lastTrailAt = now;
    const p = createFx('touch-trail', x, y, 520);
    if (!p) return;
    const size = Math.max(3, Math.min(7, 3 + velocity * .018));
    p.style.setProperty('--trail-size', `${size}px`);
  }

  function setMoverPosition(el, x, y) {
    if (!el) return;
    el.style.setProperty('--fx-x', `${x}px`);
    el.style.setProperty('--fx-y', `${y}px`);
  }

  function localPoint(state, x, y) {
    const el = state.target;
    const r = state.rect;
    if (!el || !r) return;
    const lx = Math.max(0, Math.min(100, ((x - r.left) / Math.max(1, r.width)) * 100));
    const ly = Math.max(0, Math.min(100, ((y - r.top) / Math.max(1, r.height)) * 100));
    el.style.setProperty('--touch-local-x', `${lx}%`);
    el.style.setProperty('--touch-local-y', `${ly}%`);
    if (tier === 'high') {
      el.style.setProperty('--tilt-y', `${((lx - 50) / 50) * 1.4}deg`);
      el.style.setProperty('--tilt-x', `${((50 - ly) / 50) * 1.2}deg`);
    }
  }

  function clearState(state) {
    clearTimeout(state.longTimer);
    state.contact?.classList.add('release');
    setTimeout(() => state.contact?.remove(), 220);
    state.ring?.remove();
    state.lens?.remove();
    if (state.target) {
      state.target.classList.remove('touch-active', 'touch-charged');
      state.target.style.removeProperty('--drag-x');
      state.target.style.removeProperty('--drag-y');
      state.target.style.removeProperty('--tilt-x');
      state.target.style.removeProperty('--tilt-y');
      state.text?.classList.remove('touch-active-text');
    }
  }

  function swipeClass(dx, dy) {
    if (Math.abs(dx) < 48 && Math.abs(dy) < 48) return '';
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'touch-swipe-right' : 'touch-swipe-left';
    return dy > 0 ? 'touch-swipe-down' : 'touch-swipe-up';
  }

  function pulseClass(el, cls, ms = 440) {
    if (!el) return;
    el.classList.remove(cls);
    requestAnimationFrame(() => {
      el.classList.add(cls);
      setTimeout(() => el.classList.remove(cls), ms);
    });
  }

  function processMoves() {
    moveFrame = 0;
    for (const [pointerId, event] of pendingMoves) {
      const state = active.get(pointerId);
      if (!state) continue;
      const now = performance.now();
      const dt = Math.max(1, now - state.lastT);
      const dx = event.clientX - state.x;
      const dy = event.clientY - state.y;
      const velocity = Math.hypot(dx, dy) / dt * 1000;
      state.x = event.clientX;
      state.y = event.clientY;
      state.lastT = now;

      setMoverPosition(state.contact, state.x, state.y);
      setMoverPosition(state.ring, state.x, state.y);
      setMoverPosition(state.lens, state.x, state.y);
      trail(state.x, state.y, velocity);

      if (state.target) {
        localPoint(state, state.x, state.y);
        const factor = tier === 'high' ? .05 : .025;
        const dragX = Math.max(-6, Math.min(6, (state.x - state.sx) * factor));
        const dragY = Math.max(-6, Math.min(6, (state.y - state.sy) * factor));
        state.target.style.setProperty('--drag-x', `${dragX}px`);
        state.target.style.setProperty('--drag-y', `${dragY}px`);
      }

      if (Math.hypot(state.x - state.sx, state.y - state.sy) > 18 && !state.charged) clearTimeout(state.longTimer);
    }
    pendingMoves.clear();
  }

  addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    const target = targetFor(event.target);
    const text = target?.matches(textSelector) ? target : target?.querySelector(textSelector);
    const now = performance.now();
    const doubleTap = now - lastTap.t < 330 && Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < 44 && lastTap.target === target;

    shockwave(event.clientX, event.clientY, doubleTap);
    particles(event.clientX, event.clientY, doubleTap ? 8 : 4, doubleTap ? 1.25 : 1);

    const rect = target?.getBoundingClientRect() || null;
    if (target) {
      target.classList.add('touch-reactive', 'touch-active');
      text?.classList.add('touch-text', 'touch-active-text');
      if (doubleTap) {
        pulseClass(target, 'touch-double', 560);
        pulseClass(text, 'touch-double-text', 580);
      }
    }

    const state = {
      target, text, rect,
      sx: event.clientX, sy: event.clientY,
      x: event.clientX, y: event.clientY,
      lastT: now,
      contact: reduced ? null : createFx('touch-contact', event.clientX, event.clientY, 1100),
      ring: null,
      lens: null,
      charged: false,
      longTimer: null
    };

    if (target) localPoint(state, event.clientX, event.clientY);

    state.longTimer = setTimeout(() => {
      state.charged = true;
      state.target?.classList.add('touch-charged');
      if (tier !== 'lite') state.ring = createFx('touch-ring', state.x, state.y, 1800);
      if (tier === 'high' && state.target?.matches('.menu-card,.hero-art,.profile-logo-box,.brochure-card,.brand-panel')) {
        state.lens = createFx('touch-lens', state.x, state.y, 1600);
      }
      particles(state.x, state.y, tier === 'high' ? 6 : 3, 1.08);
    }, 540);

    active.set(event.pointerId, state);
    lastTap = { t: now, x: event.clientX, y: event.clientY, target };
  }, { passive: true });

  addEventListener('pointermove', event => {
    if (!active.has(event.pointerId)) return;
    pendingMoves.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY
    });
    if (!moveFrame) moveFrame = requestAnimationFrame(processMoves);
  }, { passive: true });

  function finish(event) {
    const state = active.get(event.pointerId);
    if (!state) return;
    const x = Number.isFinite(event.clientX) ? event.clientX : state.x;
    const y = Number.isFinite(event.clientY) ? event.clientY : state.y;
    const dx = x - state.sx;
    const dy = y - state.sy;
    const cls = swipeClass(dx, dy);
    if (cls && state.target) pulseClass(state.target, cls, 420);

    if (state.sx < 22 && dx > 78 && Math.abs(dy) < 64) {
      const menu = document.querySelector('.menu-button');
      const nav = document.querySelector('#main-nav');
      if (menu && nav && !nav.classList.contains('open')) menu.click();
    }

    pendingMoves.delete(event.pointerId);
    clearState(state);
    active.delete(event.pointerId);
  }

  addEventListener('pointerup', finish, { passive: true });
  addEventListener('pointercancel', finish, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    if (moveFrame) cancelAnimationFrame(moveFrame);
    moveFrame = 0;
    pendingMoves.clear();
    active.forEach(clearState);
    active.clear();
    layer.replaceChildren();
    activeFx = 0;
  });
})();
