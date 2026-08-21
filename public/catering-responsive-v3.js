(() => {
  'use strict';

  const MOBILE_MAX = 760;
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let resizeFrame = 0;
  let lastWidth = innerWidth;

  function setViewportClass() {
    const width = innerWidth;
    root.dataset.cateringViewport = width <= 380 ? 'xs' : width <= 520 ? 'sm' : width <= 760 ? 'mobile' : width <= 920 ? 'tablet' : width <= 1180 ? 'compact' : 'wide';
  }

  function closeMobileNav(focusToggle = false) {
    const nav = document.querySelector('.subsite-links');
    const toggle = document.querySelector('[data-catering-nav-toggle]');
    if (!nav || !toggle) return;
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open catering navigation');
    document.body.classList.remove('catering-nav-open');
    if (focusToggle) toggle.focus({ preventScroll: true });
  }

  function initMobileNav() {
    const shell = document.querySelector('.subsite-nav');
    const nav = shell?.querySelector('.subsite-links');
    if (!shell || !nav) return;

    let toggle = shell.querySelector('[data-catering-nav-toggle]');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'catering-mobile-nav-toggle';
      toggle.dataset.cateringNavToggle = '';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open catering navigation');
      toggle.innerHTML = '<span aria-hidden="true"></span>';
      shell.insertBefore(toggle, nav);
    }

    if (!nav.id) nav.id = 'catering-subsite-nav';
    toggle.setAttribute('aria-controls', nav.id);

    toggle.addEventListener('click', () => {
      const opening = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', opening);
      toggle.setAttribute('aria-expanded', String(opening));
      toggle.setAttribute('aria-label', opening ? 'Close catering navigation' : 'Open catering navigation');
      document.body.classList.toggle('catering-nav-open', opening);
    });

    nav.addEventListener('click', event => {
      if (event.target.closest('a')) closeMobileNav(false);
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) closeMobileNav(true);
    });

    document.addEventListener('pointerdown', event => {
      if (innerWidth > MOBILE_MAX || !nav.classList.contains('is-open')) return;
      if (!shell.contains(event.target) && !nav.contains(event.target)) closeMobileNav(false);
    }, { passive: true });
  }

  function centerRailItemHorizontally(chip) {
    const rail = chip.closest('.category-tabs,.ux-chips');
    if (!rail) return;
    const target = chip.offsetLeft - Math.max(0, (rail.clientWidth - chip.offsetWidth) / 2);
    rail.scrollTo({
      left: Math.max(0, target),
      behavior: reducedMotion ? 'auto' : 'smooth'
    });
  }

  function initHorizontalRails() {
    document.addEventListener('click', event => {
      const chip = event.target.closest('.category-tab,.ux-chip');
      if (!chip) return;
      requestAnimationFrame(() => centerRailItemHorizontally(chip));
    });
  }

  function initPerformanceGuard() {
    const connection = navigator.connection;
    const lowResource = Number(navigator.deviceMemory || 4) <= 2 || Number(navigator.hardwareConcurrency || 4) <= 2 || Boolean(connection?.saveData);
    document.body.classList.toggle('catering-responsive-lite', lowResource || innerWidth <= 380);
    root.dataset.cateringResponsivePerformance = lowResource || innerWidth <= 380
      ? 'lite'
      : (innerWidth <= 920 || matchMedia('(pointer:coarse)').matches ? 'balanced' : 'full');
  }

  function stabilizeScrollAnchoring() {
    root.style.overflowAnchor = 'none';
    document.body.style.overflowAnchor = 'none';
    document.querySelectorAll('[data-menu-grid],[data-catering-gallery-track]').forEach(node => {
      node.style.overflowAnchor = 'none';
    });
  }

  function refreshForWidthChange() {
    setViewportClass();
    initPerformanceGuard();
    stabilizeScrollAnchoring();
    if (innerWidth > MOBILE_MAX) closeMobileNav(false);
    document.dispatchEvent(new CustomEvent('amantusi:catering:responsive', {
      detail: { width: innerWidth, height: innerHeight, viewport: root.dataset.cateringViewport }
    }));
  }

  function scheduleWidthRefresh() {
    const nextWidth = innerWidth;
    if (Math.abs(nextWidth - lastWidth) < 8) return;
    lastWidth = nextWidth;
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      refreshForWidthChange();
    });
  }

  function init() {
    document.body.classList.add('catering-responsive-v3');
    initMobileNav();
    initHorizontalRails();
    setViewportClass();
    initPerformanceGuard();
    stabilizeScrollAnchoring();

    // Only horizontal viewport changes are layout-significant. Mobile browser UI
    // can continuously change visualViewport height/scroll position while the user
    // scrolls, so we intentionally do not subscribe to visualViewport scroll/resize
    // or ResizeObserver for the header.
    addEventListener('resize', scheduleWidthRefresh, { passive: true });
    addEventListener('orientationchange', () => {
      setTimeout(() => {
        lastWidth = innerWidth;
        refreshForWidthChange();
      }, 120);
    }, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
