const AMANTUSI_PREVIEW_KEY = "amantusi-catering-preview";
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = Boolean(navigator.connection?.saveData);

const luxuryStyles = document.createElement('link');
luxuryStyles.rel = 'stylesheet';
luxuryStyles.href = '/catering-experience.css';
document.head.appendChild(luxuryStyles);
document.documentElement.classList.add('catering-luxury');

let contentPromise = null;
let portfolioPromise = null;

async function getCateringContent() {
  if (contentPromise) return contentPromise;
  contentPromise = (async () => {
    let data = null;
    try {
      const response = await fetch('/api/catering-content', { cache: 'no-store' });
      if (response.ok) data = await response.json();
    } catch (_) {}
    if (!data) {
      const response = await fetch('/data/catering.json', { cache: 'no-store' });
      data = await response.json();
    }
    try {
      const preview = localStorage.getItem(AMANTUSI_PREVIEW_KEY);
      if (preview) data = JSON.parse(preview);
    } catch (_) {}
    return data;
  })();
  return contentPromise;
}

async function getCateringPortfolio() {
  if (portfolioPromise) return portfolioPromise;
  portfolioPromise = fetch('/data/catering-portfolio.json', { cache: 'force-cache' })
    .then(response => response.ok ? response.json() : Promise.reject(new Error('Portfolio unavailable')))
    .catch(() => ({ hero: [], menuFallbacks: {}, items: [] }));
  return portfolioPromise;
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

function motionRefresh(scope = document) {
  window.CateringMotion?.refresh?.(scope);
}

function portfolioMap(portfolio) {
  return new Map((portfolio.items || []).map(item => [item.key, item]));
}

function itemImage(item, portfolio, index = 0) {
  if (item?.image) return String(item.image);
  const map = portfolioMap(portfolio);
  const fallbackKey = portfolio.menuFallbacks?.[item?.category];
  if (fallbackKey && map.has(fallbackKey)) return map.get(fallbackKey).src;
  const list = portfolio.items || [];
  return list.length ? list[index % list.length].src : '';
}

function initPortfolioHero(portfolio) {
  const map = portfolioMap(portfolio);
  const keys = (portfolio.hero || []).filter(key => map.has(key));
  if (!keys.length) return;

  const menuHero = document.querySelector('.menu-hero');
  if (menuHero && !menuHero.querySelector('[data-catering-hero-photo]')) {
    const visual = document.createElement('div');
    visual.className = 'catering-photo-hero';
    visual.setAttribute('aria-hidden', 'true');
    visual.innerHTML = '<img data-catering-hero-photo alt="" decoding="async"><span></span>';
    menuHero.prepend(visual);
    const img = visual.querySelector('img');
    const sources = keys.map(key => map.get(key).src);
    let current = 0;
    img.src = sources[0];
    menuHero.classList.add('has-catering-photo');

    if (!reducedMotion && !saveData && sources.length > 1) {
      window.setInterval(() => {
        if (document.hidden) return;
        visual.classList.add('is-changing');
        window.setTimeout(() => {
          current = (current + 1) % sources.length;
          img.src = sources[current];
          visual.classList.remove('is-changing');
        }, 420);
      }, 6500);
    }
  }

  const brochureCover = document.querySelector('.brochure-cover');
  if (brochureCover) {
    const image = map.get('gala-buffet') || map.get(keys[0]);
    if (image) {
      brochureCover.style.setProperty('--catering-cover-image', `url("${image.src}")`);
      brochureCover.classList.add('has-catering-photo');
    }
  }
}

function renderGallery(portfolio) {
  const images = (portfolio.items || []).slice(0, 20);
  document.querySelectorAll('[data-catering-gallery-shell]').forEach(shell => {
    const track = shell.querySelector('[data-catering-gallery-track]');
    if (!track) return;
    if (!images.length) {
      shell.hidden = true;
      return;
    }
    shell.hidden = false;
    track.innerHTML = images.map((item, index) => `
      <figure class="cm-gallery-card" data-gallery-index="${index}">
        <img src="${esc(item.src)}" alt="${esc(item.name)}" loading="lazy" decoding="async" fetchpriority="low" width="400" height="300">
        <figcaption><strong>${esc(item.name)}</strong><span>${esc(item.category || 'Amantusi Catering')}</span></figcaption>
      </figure>`).join('');
    shell.querySelectorAll('[data-catering-portfolio-count]').forEach(node => { node.textContent = String(images.length); });
    motionRefresh(shell);
  });
}

async function initMenu() {
  const grid = document.querySelector('[data-menu-grid]');
  if (!grid) return;
  const tabs = document.querySelector('[data-category-tabs]');
  const note = document.querySelector('[data-price-note]');
  const [content, portfolio] = await Promise.all([getCateringContent(), getCateringPortfolio()]);
  const activeItems = (content.items || []).filter(item => item.active !== false);
  const categories = content.categories || [];
  let selected = 'all';

  initPortfolioHero(portfolio);
  renderGallery(portfolio);

  const renderTabs = () => {
    const buttons = [{id:'all',name:'All'}].concat(categories);
    tabs.innerHTML = buttons.map(cat =>
      `<button class="category-tab ${selected === cat.id ? 'active' : ''}" data-category="${esc(cat.id)}">${esc(cat.name)}</button>`
    ).join('');
    tabs.querySelectorAll('[data-category]').forEach(button => {
      button.addEventListener('click', () => {
        window.CateringMotion?.onMenuFilter?.(grid);
        selected = button.dataset.category;
        renderTabs();
        renderCards();
      });
    });
    motionRefresh(tabs);
  };

  const renderCards = () => {
    const list = selected === 'all' ? activeItems : activeItems.filter(item => item.category === selected);
    if (!list.length) {
      grid.innerHTML = '<div class="empty-menu"><strong>No items published in this section yet.</strong><br>Use the Amantusi admin portal to add menu items, images and prices.</div>';
      return;
    }

    grid.innerHTML = list.map((item, index) => {
      const category = categories.find(cat => cat.id === item.category);
      const src = itemImage(item, portfolio, index);
      const image = src
        ? `<img src="${esc(src)}" alt="${esc(item.name)}" loading="lazy" decoding="async" ${index > 3 ? 'fetchpriority="low"' : ''} width="400" height="300">`
        : '';
      return `
        <article class="menu-card">
          <div class="menu-image">${image}${image ? `<span class="cm-caption">${esc(category?.name || 'Catering')}</span>` : ''}</div>
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
    motionRefresh(grid);
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
  const introNodes = document.querySelectorAll('[data-brand-intro]');
  const needsPortfolio = Boolean(document.querySelector('.brochure-cover,[data-catering-gallery-shell]'));
  if (!nodes.length && !introNodes.length && !needsPortfolio) return;
  const [content, portfolio] = await Promise.all([getCateringContent(), getCateringPortfolio()]);
  const profile = content.profile || {};
  nodes.forEach(node => {
    const key = node.dataset.profile;
    if (profile[key]) node.textContent = profile[key];
  });
  introNodes.forEach(node => {
    if (content.brand?.brochureIntro) node.textContent = content.brand.brochureIntro;
  });
  initPortfolioHero(portfolio);
  renderGallery(portfolio);
}

function initPrintButtons() {
  document.querySelectorAll('[data-print]').forEach(button => button.addEventListener('click', () => window.print()));
}

function initScrollProgress() {
  if (document.querySelector('.subsite-scroll-progress')) return;
  const progress = document.createElement('div');
  progress.className = 'subsite-scroll-progress';
  progress.innerHTML = '<span></span>';
  document.body.appendChild(progress);
  const bar = progress.querySelector('span');
  if (!bar) return;
  bar.style.width = '100%';
  bar.style.transformOrigin = 'left center';
  bar.style.transform = 'scaleX(0)';

  let frame = 0;
  const update = () => {
    frame = 0;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    bar.style.transform = `scaleX(${Math.min(1, scrollY / max)})`;
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  update();
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
}

document.addEventListener('DOMContentLoaded', () => {
  initScrollProgress();
  initMenu();
  initDynamicProfile();
  initPrintButtons();
  motionRefresh(document);
});
