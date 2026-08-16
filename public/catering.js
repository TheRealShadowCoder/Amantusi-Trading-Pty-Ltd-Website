const AMANTUSI_PREVIEW_KEY = "amantusi-catering-preview";
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarsePointer = window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches || navigator.maxTouchPoints > 0;

const luxuryStyles = document.createElement('link');
luxuryStyles.rel = 'stylesheet';
luxuryStyles.href = '/catering-experience.css';
document.head.appendChild(luxuryStyles);

document.documentElement.classList.add('catering-luxury');

async function getCateringContent() {
  let data = null;
  try {
    const response = await fetch('/api/catering-content');
    if (response.ok) data = await response.json();
  } catch (_) {}
  if (!data) {
    const response = await fetch('/data/catering.json');
    data = await response.json();
  }
  try {
    const preview = localStorage.getItem(AMANTUSI_PREVIEW_KEY);
    if (preview) data = JSON.parse(preview);
  } catch (_) {}
  return data;
}

function money(value, label) {
  if (label) return label;
  if (value === '' || value === null || value === undefined) return 'Request pricing';
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(number);
}

function esc(value = '') {
  return String(value).replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  })[ch]);
}

let revealObserver = null;

function decorateCards(scope = document) {
  const cards = scope.querySelectorAll('.menu-card,.brochure-card,.profile-block,.brand-panel');
  cards.forEach(card => {
    card.classList.add('lux-reveal');
    revealObserver?.observe(card);
    if (reducedMotion || coarsePointer || card.dataset.luxBound) return;
    card.dataset.luxBound = 'true';
    let frame = 0;
    let latest = null;
    card.addEventListener('pointermove', event => {
      latest = event;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!latest) return;
        const rect = card.getBoundingClientRect();
        const x = (latest.clientX - rect.left) / rect.width - .5;
        const y = (latest.clientY - rect.top) / rect.height - .5;
        card.style.transform = `perspective(1100px) rotateX(${-y * 2.2}deg) rotateY(${x * 2.8}deg) translateY(-4px)`;
      });
    }, { passive: true });
    card.addEventListener('pointerleave', () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      latest = null;
      card.style.transform = '';
    }, { passive: true });
  });
}

async function initMenu() {
  const grid = document.querySelector('[data-menu-grid]');
  if (!grid) return;
  const tabs = document.querySelector('[data-category-tabs]');
  const note = document.querySelector('[data-price-note]');
  const content = await getCateringContent();
  const activeItems = (content.items || []).filter(item => item.active !== false);
  const categories = content.categories || [];
  let selected = 'all';

  const renderTabs = () => {
    const buttons = [{id:'all',name:'All'}].concat(categories);
    tabs.innerHTML = buttons.map(cat =>
      `<button class="category-tab ${selected === cat.id ? 'active' : ''}" data-category="${esc(cat.id)}">${esc(cat.name)}</button>`
    ).join('');
    tabs.querySelectorAll('[data-category]').forEach(button => {
      button.addEventListener('click', () => {
        selected = button.dataset.category;
        renderTabs();
        renderCards();
      }, { passive: true });
    });
  };

  const renderCards = () => {
    const list = selected === 'all' ? activeItems : activeItems.filter(item => item.category === selected);
    if (!list.length) {
      grid.innerHTML = '<div class="empty-menu"><strong>No items published in this section yet.</strong><br>Use the Amantusi admin portal to add menu items, images and prices.</div>';
      return;
    }

    grid.innerHTML = list.map((item, index) => {
      const category = categories.find(cat => cat.id === item.category);
      const image = item.image
        ? `<img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy" decoding="async" ${index > 3 ? 'fetchpriority="low"' : ''}>`
        : '';
      return `
        <article class="menu-card">
          <div class="menu-image">${image}</div>
          <div class="menu-card-body">
            <div class="menu-card-top">
              <h3>${esc(item.name)}</h3>
              <span class="menu-price">${esc(money(item.price, item.priceLabel))}</span>
            </div>
            <p>${esc(item.description || '')}</p>
            <span class="menu-category-label">${esc(category?.name || 'Catering')}</span>
          </div>
        </article>`;
    }).join('');
    decorateCards(grid);
  };

  if (content.brand?.cateringTitle) {
    document.querySelectorAll('[data-catering-title]').forEach(el => { el.textContent = content.brand.cateringTitle; });
  }
  if (content.brand?.cateringSubtitle) {
    document.querySelectorAll('[data-catering-subtitle]').forEach(el => { el.textContent = content.brand.cateringSubtitle; });
  }
  if (note) note.textContent = content.meta?.priceNote || '';
  renderTabs();
  renderCards();
}

async function initDynamicProfile() {
  const nodes = document.querySelectorAll('[data-profile]');
  if (!nodes.length) return;
  const content = await getCateringContent();
  const profile = content.profile || {};
  nodes.forEach(node => {
    const key = node.dataset.profile;
    if (profile[key]) node.textContent = profile[key];
  });
  document.querySelectorAll('[data-brand-intro]').forEach(node => {
    if (content.brand?.brochureIntro) node.textContent = content.brand.brochureIntro;
  });
}

function initPrintButtons() {
  document.querySelectorAll('[data-print]').forEach(button => button.addEventListener('click', () => window.print()));
}

function initLuxuryMotion() {
  const progress = document.createElement('div');
  progress.className = 'subsite-scroll-progress';
  progress.innerHTML = '<span></span>';
  document.body.appendChild(progress);
  const bar = progress.querySelector('span');
  if (bar) {
    bar.style.width = '100%';
    bar.style.transformOrigin = 'left center';
    bar.style.transform = 'scaleX(0)';
  }

  let progressFrame = 0;
  const updateProgress = () => {
    progressFrame = 0;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    if (bar) bar.style.transform = `scaleX(${Math.min(1, scrollY / max)})`;
  };
  const scheduleProgress = () => {
    if (progressFrame) return;
    progressFrame = requestAnimationFrame(updateProgress);
  };
  updateProgress();
  addEventListener('scroll', scheduleProgress, { passive: true });
  addEventListener('resize', scheduleProgress, { passive: true });

  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .1, rootMargin: '0px 0px -3% 0px' });

  document.querySelectorAll('.menu-heading,.menu-trust-grid>div,.profile-hero-grid>*,.brochure-cover-inner,.process-step').forEach(node => {
    node.classList.add('lux-reveal');
    revealObserver.observe(node);
  });
  decorateCards(document);

  if (!reducedMotion && !coarsePointer) {
    document.querySelectorAll('.menu-plate,.profile-logo-box').forEach(object => {
      let frame = 0;
      let latest = null;
      object.addEventListener('pointermove', event => {
        latest = event;
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          const rect = object.getBoundingClientRect();
          const x = (latest.clientX - rect.left) / rect.width - .5;
          const y = (latest.clientY - rect.top) / rect.height - .5;
          object.style.transform = `perspective(1100px) rotateX(${-y * 5}deg) rotateY(${x * 6}deg) translate3d(${x * 4}px,${y * 4}px,0)`;
        });
      }, { passive: true });
      object.addEventListener('pointerleave', () => {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        latest = null;
        object.style.transform = '';
      }, { passive: true });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initLuxuryMotion();
  initMenu();
  initDynamicProfile();
  initPrintButtons();
});
