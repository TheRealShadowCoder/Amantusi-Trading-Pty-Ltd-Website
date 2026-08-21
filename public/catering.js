const AMANTUSI_PREVIEW_KEY = "amantusi-catering-preview";

const luxuryStyles = document.createElement('link');
luxuryStyles.rel = 'stylesheet';
luxuryStyles.href = '/catering-experience.css';
document.head.appendChild(luxuryStyles);
document.documentElement.classList.add('catering-luxury');

async function getCateringContent() {
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

function renderGallery(content) {
  const shell = document.querySelector('[data-catering-gallery-shell]');
  const track = document.querySelector('[data-catering-gallery-track]');
  if (!shell || !track) return;

  const images = [];
  const seen = new Set();
  for (const item of content.items || []) {
    if (item.active === false || !item.image) continue;
    const src = String(item.image);
    if (seen.has(src)) continue;
    seen.add(src);
    images.push({ src, name: item.name || 'Amantusi Catering' });
    if (images.length >= 20) break;
  }

  if (!images.length) {
    shell.hidden = true;
    return;
  }

  shell.hidden = false;
  track.innerHTML = images.map((item, index) => `
    <figure class="cm-gallery-card" data-gallery-index="${index}">
      <img src="${esc(item.src)}" alt="${esc(item.name)}" loading="lazy" decoding="async" fetchpriority="low">
      <figcaption>${esc(item.name)}</figcaption>
    </figure>`).join('');
  motionRefresh(shell);
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
      const image = item.image
        ? `<img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy" decoding="async" ${index > 3 ? 'fetchpriority="low"' : ''}>`
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
  renderGallery(content);
}

async function initDynamicProfile() {
  const nodes = document.querySelectorAll('[data-profile]');
  const introNodes = document.querySelectorAll('[data-brand-intro]');
  if (!nodes.length && !introNodes.length) return;
  const content = await getCateringContent();
  const profile = content.profile || {};
  nodes.forEach(node => {
    const key = node.dataset.profile;
    if (profile[key]) node.textContent = profile[key];
  });
  introNodes.forEach(node => {
    if (content.brand?.brochureIntro) node.textContent = content.brand.brochureIntro;
  });
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
