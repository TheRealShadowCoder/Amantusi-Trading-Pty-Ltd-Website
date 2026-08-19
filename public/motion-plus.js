(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  if (!body || body.dataset.motionPlusReady === '1') return;
  body.dataset.motionPlusReady = '1';

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches || matchMedia('(hover: none)').matches || navigator.maxTouchPoints > 0;
  const saveData = Boolean(navigator.connection?.saveData);
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

  const getQuality = () => window.AmantusiCinematic?.quality || body.dataset.cinematicQuality || (reducedMotion || saveData ? 'lite' : 'high');
  let quality = getQuality();
  body.dataset.motionQuality = quality;

  document.addEventListener('amantusi:cinematic-quality', event => {
    quality = event.detail?.quality || getQuality();
    body.dataset.motionQuality = quality;
  });

  /* -----------------------------------------------------------------------
     Hero entrance choreography. Existing DOM remains untouched; only classes
     are applied to the elements already on the page.
     ----------------------------------------------------------------------- */
  const hero = document.querySelector('.hero');
  if (hero) {
    const heroSequence = [
      ['.eyebrow', 'rise', 0],
      ['.hero-title', 'rise', 1],
      ['.hero-lead', 'fade', 2],
      ['.hero-actions', 'rise', 3],
      ['.hero-meta', 'fade', 4],
      ['.hero-art', 'depth', 2],
      ['.trust-ribbon', 'fade', 5]
    ];

    heroSequence.forEach(([selector, variant, index]) => {
      const el = hero.querySelector(selector) || document.querySelector(selector);
      if (!el) return;
      el.classList.add('motion-plus-intro', `motion-${variant}`);
      el.style.setProperty('--motion-delay-index', String(index));
    });

    const showHero = () => requestAnimationFrame(() => {
      hero.querySelectorAll('.motion-plus-intro').forEach(el => el.classList.add('motion-plus-visible'));
      document.querySelector('.trust-ribbon.motion-plus-intro')?.classList.add('motion-plus-visible');
    });

    if (root.classList.contains('experience-loaded')) showHero();
    else {
      const observer = new MutationObserver(() => {
        if (!root.classList.contains('experience-loaded')) return;
        observer.disconnect();
        showHero();
      });
      observer.observe(root, { attributes: true, attributeFilter: ['class'] });
      setTimeout(() => { observer.disconnect(); showHero(); }, 1800);
    }

    if (!reducedMotion) {
      const cue = document.createElement('div');
      cue.className = 'lux-scroll-cue';
      cue.setAttribute('aria-hidden', 'true');
      cue.innerHTML = '<span>Scroll</span><i><b></b></i>';
      hero.appendChild(cue);

      const heroObserver = new IntersectionObserver(entries => {
        const entry = entries[0];
        cue.classList.toggle('is-hidden', !entry?.isIntersecting || entry.intersectionRatio < .42);
      }, { threshold: [.2, .42, .7] });
      heroObserver.observe(hero);
    }
  }

  /* -----------------------------------------------------------------------
     Reusable viewport reveals. These selectors target existing components;
     no wrapper elements or layout values are changed.
     ----------------------------------------------------------------------- */
  const revealSelectors = [
    '.section-intro', '.section-heading', '.prose', '.cap-card', '.government-panel',
    '.panel-line', '.process-step', '.quote-copy', '.quote-form', '.contact-links a',
    '.trust-item', '.menu-heading', '.menu-card', '.brochure-card', '.menu-trust-grid > *',
    '.profile-section', '.profile-card', '.brochure-section', '.brochure-grid > *'
  ];

  function decorateReveals(scope = document) {
    let index = 0;
    scope.querySelectorAll?.(revealSelectors.join(',')).forEach(el => {
      if (el.dataset.motionReveal === '1') return;
      el.dataset.motionReveal = '1';
      el.classList.add('motion-reveal-item');
      el.style.setProperty('--motion-reveal-index', String(index % 6));
      el.dataset.motionDirection = index % 5 === 1 ? 'left' : index % 5 === 3 ? 'right' : 'up';
      revealObserver.observe(el);
      index += 1;
    });
  }

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('motion-revealed');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -7% 0px' });

  decorateReveals(document);

  /* Dynamic CMS content receives the same animation language. */
  const dynamicRoot = document.querySelector('[data-menu-grid]') || document.querySelector('main');
  if (dynamicRoot) {
    const mutationObserver = new MutationObserver(records => {
      if (!records.some(record => record.addedNodes.length)) return;
      decorateReveals(dynamicRoot);
      decorateMedia(dynamicRoot);
      decoratePressables(dynamicRoot);
    });
    mutationObserver.observe(dynamicRoot, { childList: true, subtree: true });
  }

  /* -----------------------------------------------------------------------
     Cinematic image reveal / restrained hover zoom for content imagery only.
     Brand marks and logos are intentionally excluded.
     ----------------------------------------------------------------------- */
  const mediaSelector = [
    '[data-menu-grid] img', '.menu-card img', '.brochure-card img', '.gallery img',
    '.profile-image img', '.editorial-image img', '.menu-visual img:not([src*="amantusi-logo"])'
  ].join(',');

  const mediaObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('motion-media-visible');
      mediaObserver.unobserve(entry.target);
    });
  }, { threshold: .1, rootMargin: '12% 0px 10% 0px' });

  function decorateMedia(scope = document) {
    scope.querySelectorAll?.(mediaSelector).forEach(img => {
      if (img.dataset.motionMedia === '1') return;
      img.dataset.motionMedia = '1';
      img.classList.add('motion-media');
      img.decoding = 'async';
      if (!img.closest('.hero') && !img.loading) img.loading = 'lazy';
      mediaObserver.observe(img);
    });
  }
  decorateMedia(document);

  /* -----------------------------------------------------------------------
     Header hide/reveal. It never retreats while a menu/form interaction is
     active, and it returns immediately on upward movement.
     ----------------------------------------------------------------------- */
  const header = document.querySelector('.site-header,.subsite-header');
  let lastScroll = scrollY;
  let scrollQueued = false;
  function updateHeader() {
    scrollQueued = false;
    if (!header || reducedMotion) return;
    const current = scrollY;
    const delta = current - lastScroll;
    const menuOpen = body.classList.contains('cinematic-menu-open') || document.querySelector('.nav-links.open,.subsite-links.open');
    const focused = document.activeElement?.matches?.('input,textarea,select,button');
    if (menuOpen || focused || current < 160) {
      header.classList.remove('motion-header-hidden');
    } else if (delta > 8) {
      header.classList.add('motion-header-hidden');
    } else if (delta < -5) {
      header.classList.remove('motion-header-hidden');
    }
    lastScroll = current;
  }
  addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(updateHeader);
  }, { passive: true });

  /* -----------------------------------------------------------------------
     Premium press physics: existing buttons/links/cards only. Touch receives
     compression feedback without desktop-only hover dependencies.
     ----------------------------------------------------------------------- */
  const pressSelector = '.button,.menu-btn,.nav-cta,.text-link,.cap-card,.brochure-card,.contact-links a,button[type="submit"]';
  function decoratePressables(scope = document) {
    scope.querySelectorAll?.(pressSelector).forEach(el => {
      if (el.dataset.motionPress === '1') return;
      el.dataset.motionPress = '1';
      el.classList.add('motion-pressable');
      el.addEventListener('pointerdown', () => el.classList.add('motion-pressed'), { passive: true });
      const release = () => el.classList.remove('motion-pressed');
      el.addEventListener('pointerup', release, { passive: true });
      el.addEventListener('pointercancel', release, { passive: true });
      el.addEventListener('pointerleave', release, { passive: true });
    });
  }
  decoratePressables(document);

  /* -----------------------------------------------------------------------
     Fine-pointer local image/card depth. Pointer work is coalesced to one rAF.
     ----------------------------------------------------------------------- */
  if (!coarse && !reducedMotion) {
    const tactileSelector = '.brochure-card,.menu-card,.government-panel,.quote-form,.contact-links a';
    document.querySelectorAll(tactileSelector).forEach(el => {
      let rect = null;
      let pending = null;
      let raf = 0;
      el.classList.add('motion-tactile');

      el.addEventListener('pointerenter', () => {
        rect = el.getBoundingClientRect();
        el.classList.add('motion-tactile-active');
      }, { passive: true });
      el.addEventListener('pointermove', event => {
        if (!rect) return;
        pending = { x: event.clientX, y: event.clientY };
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          if (!pending || !rect) return;
          const x = clamp((pending.x - rect.left) / Math.max(1, rect.width), 0, 1);
          const y = clamp((pending.y - rect.top) / Math.max(1, rect.height), 0, 1);
          el.style.setProperty('--motion-local-x', `${(x * 100).toFixed(1)}%`);
          el.style.setProperty('--motion-local-y', `${(y * 100).toFixed(1)}%`);
          el.style.setProperty('--motion-local-rx', `${((.5 - y) * 1.5).toFixed(2)}deg`);
          el.style.setProperty('--motion-local-ry', `${((x - .5) * 1.9).toFixed(2)}deg`);
        });
      }, { passive: true });
      el.addEventListener('pointerleave', () => {
        rect = null;
        pending = null;
        el.classList.remove('motion-tactile-active');
        el.style.removeProperty('--motion-local-rx');
        el.style.removeProperty('--motion-local-ry');
      }, { passive: true });
    });
  }

  /* -----------------------------------------------------------------------
     Form microinteractions. No field markup or validation changes.
     ----------------------------------------------------------------------- */
  document.querySelectorAll('input,textarea,select').forEach(field => {
    const label = field.closest('label');
    field.addEventListener('focus', () => label?.classList.add('motion-field-focus'));
    field.addEventListener('blur', () => label?.classList.remove('motion-field-focus'));
  });

  /* -----------------------------------------------------------------------
     Hero ambient motion. CSS handles the actual movement; this observer pauses
     it completely when the hero is out of view.
     ----------------------------------------------------------------------- */
  if (hero && !reducedMotion) {
    const ambientObserver = new IntersectionObserver(entries => {
      body.classList.toggle('motion-hero-active', Boolean(entries[0]?.isIntersecting));
    }, { threshold: .08 });
    ambientObserver.observe(hero);
  }

  /* Suspend animation-only work while hidden. */
  document.addEventListener('visibilitychange', () => {
    body.classList.toggle('motion-page-hidden', document.hidden);
    if (!document.hidden) lastScroll = scrollY;
  });

  root.classList.add('motion-plus-ready');
})();
