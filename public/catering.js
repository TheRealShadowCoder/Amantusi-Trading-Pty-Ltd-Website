const AMANTUSI_PREVIEW_KEY = "amantusi-catering-preview";

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

document.addEventListener("DOMContentLoaded", () => {
  initMenu();
  initDynamicProfile();
  initPrintButtons();
});
