const AMANTUSI_PREVIEW_KEY = "amantusi-catering-preview";
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

const luxuryStyles = document.createElement('link');
luxuryStyles.rel = 'stylesheet';
luxuryStyles.href = '/catering-experience.css';
document.head.appendChild(luxuryStyles);

const responsiveStyles = document.createElement('link');
responsiveStyles.rel = 'stylesheet';
responsiveStyles.href = '/responsive.css';
document.head.appendChild(responsiveStyles);

document.documentElement.classList.add('catering-luxury');

async function getCateringContent() {
  let data = null;
  try {
    const response = await fetch("/api/catering-content", { cache: "no-store" });
    if (response.ok) data = await response.json();
  } catch (_) {}
  if (!data) {
    const response = await fetch("/data/catering.json", { cache: "no-store" });
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
  if (value === "" || value === null || value === undefined) return "Request pricing";
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(number);
}

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[ch]);
}

function decorateCards(scope = document) {
  const cards = scope.querySelectorAll('.menu-card,.brochure-card,.profile-block,.brand-panel');
  cards.forEach((card) => {
    card.classList.add('lux-reveal');
    if (reducedMotion || coarsePointer || card.dataset.luxBound) return;
    card.dataset.luxBound = 'true';
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      card.style.transform = `perspective(1100px) rotateX(${-y * 2.2}deg) rotateY(${x * 2.8}deg) translateY(-4px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
  requestAnimationFrame(() => revealObserver?.takeRecords());
  cards.forEach((card) => revealObserver?.observe(card));
}

let revealObserver = null;

async function initMenu() {
  const grid = document.querySelector("[data-menu-grid]");
  if (!grid) return;
  const tabs = document.querySelector("[data-category-tabs]");
  const note = document.querySelector("[data-price-note]");
  const content = await getCateringContent();

  const activeItems = (content.items || []).filter((item) => item.active !== false);
  const categories = content.categories || [];
  let selected = "all";

  const renderTabs = () => {
    const buttons = [{id:"all",name:"All"}].concat(categories);
    tabs.innerHTML = buttons.map((cat) =>
      `<button class="category-tab ${selected === cat.id ? "active" : ""}" data-category="${esc(cat.id)}">${esc(cat.name)}</button>`
    ).join("");
    tabs.querySelectorAll("[data-category]").forEach((button) => {
      button.addEventListener("click", () => {
        selected = button.dataset.category;
        renderTabs();
        renderCards();
      });
    });
  };

  const renderCards = () => {
    const list = selected === "all" ? activeItems : activeItems.filter((item) => item.category === selected);
    if (!list.length) {
      grid.innerHTML = `<div class="empty-menu"><strong>No items published in this section yet.</strong><br>Use the Amantusi admin portal to add menu items, images and prices.</div>`;
      return;
    }
    grid.innerHTML = list.map((item) => {
      const category = categories.find((cat) => cat.id === item.category);
      const image = item.image ? `<img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy">` : "";
      return `
        <article class="menu-card">
          <div class="menu-image">${image}</div>
          <div class="menu-card-body">
            <div class="menu-card-top">
              <h3>${esc(item.name)}</h3>
              <span class="menu-price">${esc(money(item.price, item.priceLabel))}</span>
            </div>
            <p>${esc(item.description || "")}</p>
            <span class="menu-category-label">${esc(category?.name || "Catering")}</span>
          </div>
        </article>`;
    }).join("");
    decorateCards(grid);
  };

  if (content.brand?.cateringTitle) {
    document.querySelectorAll("[data-catering-title]").forEach((el) => el.textContent = content.brand.cateringTitle);
  }
  if (content.brand?.cateringSubtitle) {
    document.querySelectorAll("[data-catering-subtitle]").forEach((el) => el.textContent = content.brand.cateringSubtitle);
  }
  if (note) note.textContent = content.meta?.priceNote || "";
  renderTabs();
  renderCards();
}

async function initDynamicProfile() {
  const nodes = document.querySelectorAll("[data-profile]");
  if (!nodes.length) return;
  const content = await getCateringContent();
  const profile = content.profile || {};
  nodes.forEach((node) => {
    const key = node.dataset.profile;
    if (profile[key]) node.textContent = profile[key];
  });
  document.querySelectorAll("[data-brand-intro]").forEach((node) => {
    if (content.brand?.brochureIntro) node.textContent = content.brand.brochureIntro;
  });
}

function initPrintButtons() {
  document.querySelectorAll("[data-print]").forEach((button) => button.addEventListener("click", () => window.print()));
}

function initLuxuryMotion() {
  const progress = document.createElement('div');
  progress.className = 'subsite-scroll-progress';
  progress.innerHTML = '<span></span>';
  document.body.appendChild(progress);
  const bar = progress.querySelector('span');

  const updateProgress = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    bar.style.width = `${Math.min(100, scrollY / max * 100)}%`;
  };
  updateProgress();
  addEventListener('scroll', updateProgress, { passive: true });
  addEventListener('resize', updateProgress, { passive: true });

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: .12, rootMargin: '0px 0px -5% 0px' });

  document.querySelectorAll('.menu-heading,.menu-trust-grid>div,.profile-hero-grid>*,.brochure-cover-inner,.process-step').forEach((node) => {
    node.classList.add('lux-reveal');
    revealObserver.observe(node);
  });
  decorateCards(document);

  if (!reducedMotion && !coarsePointer) {
    document.querySelectorAll('.menu-plate,.profile-logo-box').forEach((object) => {
      object.addEventListener('pointermove', (event) => {
        const rect = object.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        object.style.transform = `perspective(1100px) rotateX(${-y * 5}deg) rotateY(${x * 6}deg) translate3d(${x * 4}px,${y * 4}px,0)`;
      });
      object.addEventListener('pointerleave', () => { object.style.transform = ''; });
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initLuxuryMotion();
  initMenu();
  initDynamicProfile();
  initPrintButtons();
});
