(() => {
  'use strict';

  const body = document.body;
  const root = document.documentElement;
  if (!body || body.dataset.fastWheelReady === '1') return;
  body.dataset.fastWheelReady = '1';

  const finePointer = matchMedia('(pointer:fine)').matches && matchMedia('(hover:hover)').matches;
  if (!finePointer) return;

  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  let lastWheelAt = 0;
  let wheelIdleTimer = 0;
  let boostedEvents = 0;
  let precisionBoostedEvents = 0;
  let wheelBoostedEvents = 0;

  function canScrollElement(el, deltaY) {
    if (!(el instanceof HTMLElement)) return false;
    const style = getComputedStyle(el);
    const overflowY = style.overflowY;
    if (!/(auto|scroll|overlay)/.test(overflowY)) return false;
    if (el.scrollHeight <= el.clientHeight + 2) return false;
    if (deltaY < 0) return el.scrollTop > 0;
    return el.scrollTop + el.clientHeight < el.scrollHeight - 1;
  }

  function hasLocalScrollTarget(target, deltaY) {
    let el = target instanceof Element ? target : null;
    while (el && el !== body && el !== root) {
      if (el.matches('textarea,select,[contenteditable="true"],[data-native-wheel]')) return true;
      if (canScrollElement(el, deltaY)) return true;
      el = el.parentElement;
    }
    return false;
  }

  function normalizedPixels(event) {
    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 42;
    if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * innerHeight * .9;
    return event.deltaY;
  }

  function classify(delta, event, elapsed) {
    const magnitude = Math.abs(delta);
    if (event.deltaMode !== WheelEvent.DOM_DELTA_PIXEL) return 'wheel';
    if (magnitude >= 72) return 'wheel';
    if (magnitude >= 38 && elapsed >= 22) return 'wheel';
    if (magnitude >= 28 && elapsed >= 34) return 'wheel';
    return 'precision';
  }

  function wheelMultiplier(delta) {
    const magnitude = Math.abs(delta);
    if (magnitude >= 180) return 1.45;
    if (magnitude >= 100) return 1.75;
    if (magnitude >= 60) return 2.05;
    return 2.3;
  }

  function precisionMultiplier(delta) {
    const magnitude = Math.abs(delta);
    if (magnitude <= 4) return 2.05;
    if (magnitude <= 10) return 1.9;
    if (magnitude <= 20) return 1.75;
    if (magnitude <= 36) return 1.6;
    return 1.45;
  }

  function markWheelActive() {
    body.classList.add('perf-wheel-active');
    clearTimeout(wheelIdleTimer);
    wheelIdleTimer = setTimeout(() => body.classList.remove('perf-wheel-active'), 80);
  }

  addEventListener('wheel', event => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (!event.deltaY) return;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY) * 1.15) return;

    const now = performance.now();
    const elapsed = lastWheelAt ? now - lastWheelAt : 999;
    lastWheelAt = now;

    const delta = normalizedPixels(event);
    if (hasLocalScrollTarget(event.target, delta)) return;

    const kind = classify(delta, event, elapsed);
    const multiplier = kind === 'precision' ? precisionMultiplier(delta) : wheelMultiplier(delta);

    event.preventDefault();
    markWheelActive();

    const viewport = Math.max(1, innerHeight);
    const maxStep = kind === 'precision' ? Math.max(260, viewport * .58) : Math.max(420, viewport * .82);
    const accelerated = clamp(delta * multiplier, -maxStep, maxStep);
    const maxY = Math.max(0, root.scrollHeight - viewport);
    const nextY = clamp(scrollY + accelerated, 0, maxY);

    scrollTo({ left: 0, top: nextY, behavior: 'instant' });
    boostedEvents += 1;
    if (kind === 'precision') precisionBoostedEvents += 1;
    else wheelBoostedEvents += 1;
  }, { passive: false });

  window.AmantusiWheel = Object.freeze({
    get boostedEvents() { return boostedEvents; },
    get precisionBoostedEvents() { return precisionBoostedEvents; },
    get wheelBoostedEvents() { return wheelBoostedEvents; },
    get enabled() { return true; },
    get precisionEnabled() { return true; }
  });
})();
