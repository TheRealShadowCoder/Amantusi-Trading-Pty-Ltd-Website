(() => {
  'use strict';

  const MOBILE_MAX = 760;
  const root = document.documentElement;
  let resizeFrame = 0;
  let lastWidth = innerWidth;

  function setViewportVars() {
    const header = document.querySelector('.subsite-header');
    const toolbar = document.querySelector('[data-ux-toolbar]');
    const headerH = Math.ceil(header?.getBoundingClientRect().height || 64);
    const toolbarH = Math.ceil(toolbar?.getBoundingClientRect().height || 0);
    const viewportH = Math.round(window.visualViewport?.height || innerHeight);
    root.style.setProperty('--catering-header-h', `${headerH}px`);
    root.style.setProperty('--catering-toolbar-h', `${toolbarH}px`);
    root.style.setProperty('--catering-visual-vh', `${viewportH}px`);
    root.dataset.cateringViewport = innerWidth <= 380 ? 'xs' : innerWidth <= 520 ? 'sm' : innerWidth <= 760 ? 'mobile' : innerWidth <= 920 ? 'tablet' : innerWidth <= 1180 ? 'compact' : 'wide';
  }

  function closeMobileNav(focusToggle = false) {
    const nav = document.querySelector('.subsite-links');
    const toggle = document.querySelector('[data-catering-nav-toggle]');
    if (!nav || !toggle) return;
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
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
      if (opening) nav.querySelector('a')?.focus({ preventScroll: true });
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

  function keepActiveRailsVisible() {
    document.addEventListener('click', event => {
      const chip = event.target.closest('.category-tab,.ux-chip');
      if (!chip) return;
      requestAnimationFrame(() => chip.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', inline: 'center', block: 'nearest' }));
    });
  }

  function refreshResponsiveSystems() {
    setViewportVars();
    if (innerWidth > MOBILE_MAX) closeMobileNav(false);
    window.CateringMotion?.refresh?.(document);
    document.dispatchEvent(new CustomEvent('amantusi:catering:responsive', {
      detail: { width: innerWidth, height: innerHeight, viewport: root.dataset.cateringViewport }
    }));
  }

  function scheduleRefresh() {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      const changed = Math.abs(innerWidth - lastWidth) > 1;
      lastWidth = innerWidth;
      refreshResponsiveSystems();
      if (changed) document.body.classList.add('catering-layout-ready');
    });
  }

  function observeInjectedToolbar() {
    const bodyObserver = new MutationObserver(mutations => {
      if (!mutations.some(m => [...m.addedNodes].some(n => n.nodeType === 1 && (n.matches?.('[data-ux-toolbar]') || n.querySelector?.('[data-ux-toolbar]'))))) return;
      scheduleRefresh();
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });
  }

  function initPerformanceGuard() {
    const connection = navigator.connection;
    const lowResource = Number(navigator.deviceMemory || 4) <= 2 || Number(navigator.hardwareConcurrency || 4) <= 2 || Boolean(connection?.saveData);
    if (lowResource || innerWidth <= 380) {
      document.body.classList.add('catering-responsive-lite');
      root.dataset.cateringResponsivePerformance = 'lite';
    } else if (innerWidth <= 920 || matchMedia('(pointer:coarse)').matches) {
      root.dataset.cateringResponsivePerformance = 'balanced';
    } else {
      root.dataset.cateringResponsivePerformance = 'full';
    }
  }

  function init() {
    document.body.classList.add('catering-responsive-v3');
    initMobileNav();
    keepActiveRailsVisible();
    initPerformanceGuard();
    setViewportVars();
    observeInjectedToolbar();

    const header = document.querySelector('.subsite-header');
    if ('ResizeObserver' in window && header) {
      const observer = new ResizeObserver(scheduleRefresh);
      observer.observe(header);
    }

    addEventListener('resize', scheduleRefresh, { passive: true });
    addEventListener('orientationchange', () => setTimeout(scheduleRefresh, 80), { passive: true });
    window.visualViewport?.addEventListener('resize', scheduleRefresh, { passive: true });
    window.visualViewport?.addEventListener('scroll', scheduleRefresh, { passive: true });
    requestAnimationFrame(() => requestAnimationFrame(refreshResponsiveSystems));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
