const PREVIEW_KEY = "amantusi-catering-preview";
let state = null;
let currentAdmin = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[ch]);
}

async function fetchDefaultContent() {
  let data = null;
  try {
    const response = await fetch("/api/catering-content", { cache: "no-store" });
    if (response.ok) data = await response.json();
  } catch (_) {}
  if (!data) {
    const response = await fetch("/data/catering.json", { cache: "no-store" });
    data = await response.json();
  }
  return data;
}

function saveDraft() {
  try { localStorage.setItem(PREVIEW_KEY, JSON.stringify(state)); } catch (_) {}
}

function uid(prefix = "item") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function updateStatus(message = "") {
  const badge = $("#cms-status");
  if (!badge) return;
  badge.className = "cms-status live";
  badge.textContent = message || "Cloudflare CMS connected";
}

async function login(email, password) {
  const response = await fetch("/api/admin/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  }).catch(() => null);

  if (!response) return { ok: false, status: 0, message: "Admin API is not reachable." };

  let payload = {};
  try { payload = await response.json(); } catch (_) {}

  if (response.ok) return { ok: true, admin: payload };
  return {
    ok: false,
    status: response.status,
    message: payload.error || "Login failed.",
    retryAfter: payload.retryAfter
  };
}

async function requestPasswordReset(email) {
  const response = await fetch("/api/admin/password-reset/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  }).catch(() => null);

  if (!response) return { ok: false, message: "Password reset service is not reachable." };
  let payload = {};
  try { payload = await response.json(); } catch (_) {}
  return {
    ok: response.ok,
    message: payload.message || (response.ok
      ? "If that address is authorized, a reset link will be sent."
      : payload.error || "Could not request a reset link.")
  };
}

async function sessionInfo() {
  const response = await fetch("/api/admin/me", { cache: "no-store" }).catch(() => null);
  if (!response?.ok) return null;
  try { return await response.json(); } catch (_) { return null; }
}

async function openEditor(admin) {
  currentAdmin = admin || currentAdmin;
  state = await fetchDefaultContent();

  $("#login-view").classList.add("hidden");
  $("#admin-view").classList.remove("hidden");

  if (currentAdmin?.email) {
    $("#admin-identity").textContent = `${currentAdmin.label || "Administrator"} • ${currentAdmin.email}`;
  }

  hydrateForms();
  renderCategories();
  renderItems();
  updateStatus();
}

function hydrateForms() {
  const brand = state.brand || {};
  const meta = state.meta || {};
  const profile = state.profile || {};

  $("#brand-title").value = brand.cateringTitle || "";
  $("#brand-subtitle").value = brand.cateringSubtitle || "";
  $("#brand-intro").value = brand.brochureIntro || "";
  $("#price-note").value = meta.priceNote || "";

  $("#profile-legal").value = profile.legalName || "";
  $("#profile-positioning").value = profile.positioning || "";
  $("#profile-registration").value = profile.registration || "";
  $("#profile-csd").value = profile.csd || "";
  $("#profile-email").value = profile.email || "";
  $("#profile-phone").value = profile.phone || "";
  $("#profile-address").value = profile.address || "";
  $("#profile-overview").value = profile.overview || "";
}

function renderCategories() {
  const select = $("#item-category");
  select.innerHTML = (state.categories || [])
    .map((cat) => `<option value="${esc(cat.id)}">${esc(cat.name)}</option>`)
    .join("");
}

function displayPrice(item) {
  if (item.priceLabel) return item.priceLabel;
  if (item.price === "" || item.price == null) return "Request pricing";
  const n = Number(item.price);
  return Number.isFinite(n)
    ? new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(n)
    : String(item.price);
}

function renderItems() {
  const list = $("#items-list");
  const categories = state.categories || [];
  const items = state.items || [];

  if (!items.length) {
    list.innerHTML = `<p style="color:#71808a;font-size:13px">No menu items yet.</p>`;
    return;
  }

  list.innerHTML = items.map((item, index) => {
    const category = categories.find((cat) => cat.id === item.category);
    return `<div class="item-row">
      <div class="item-thumb">${item.image ? `<img src="${esc(item.image)}" alt="">` : "MENU"}</div>
      <div><strong>${esc(item.name)}</strong><small>${esc(item.description || "")}</small></div>
      <div class="category"><small>${esc(category?.name || item.category || "Uncategorised")}</small></div>
      <div class="price">${esc(displayPrice(item))}</div>
      <div class="item-actions">
        <button type="button" data-up="${index}" title="Move up">↑</button>
        <button type="button" data-down="${index}" title="Move down">↓</button>
        <button type="button" data-edit="${esc(item.id)}">Edit</button>
        <button type="button" data-delete="${esc(item.id)}">×</button>
      </div>
    </div>`;
  }).join("");

  $$('[data-edit]').forEach((btn) => btn.addEventListener("click", () => editItem(btn.dataset.edit)));
  $$('[data-delete]').forEach((btn) => btn.addEventListener("click", () => deleteItem(btn.dataset.delete)));
  $$('[data-up]').forEach((btn) => btn.addEventListener("click", () => moveItem(Number(btn.dataset.up), -1)));
  $$('[data-down]').forEach((btn) => btn.addEventListener("click", () => moveItem(Number(btn.dataset.down), 1)));
}

function resetItemForm() {
  $("#item-id").value = "";
  $("#item-image-existing").value = "";
  $("#item-form").reset();
  $("#item-active").value = "true";
  renderCategories();
}

function editItem(id) {
  const item = (state.items || []).find((entry) => entry.id === id);
  if (!item) return;

  $("#item-id").value = item.id;
  $("#item-category").value = item.category || "";
  $("#item-name").value = item.name || "";
  $("#item-description").value = item.description || "";
  $("#item-price").value = item.price ?? "";
  $("#item-price-label").value = item.priceLabel || "";
  $("#item-image-existing").value = item.image || "";
  $("#item-active").value = item.active === false ? "false" : "true";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteItem(id) {
  if (!confirm("Delete this menu item?")) return;
  state.items = (state.items || []).filter((item) => item.id !== id);
  saveDraft();
  renderItems();
  updateStatus("Item removed — publish when ready");
}

function moveItem(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= state.items.length) return;
  [state.items[index], state.items[target]] = [state.items[target], state.items[index]];
  saveDraft();
  renderItems();
  updateStatus("Order changed — publish when ready");
}

async function uploadImage(file) {
  if (!file) return "";
  const body = new FormData();
  body.append("file", file);

  const response = await fetch("/api/admin/media", { method: "POST", body });
  if (!response.ok) {
    let payload = {};
    try { payload = await response.json(); } catch (_) {}
    throw new Error(payload.error || "Image upload failed.");
  }

  return (await response.json()).url;
}

async function saveItem(event) {
  event.preventDefault();
  const button = event.submitter;
  if (button) button.disabled = true;

  try {
    const existingId = $("#item-id").value;
    const imageFile = $("#item-image").files[0];
    const image = imageFile ? await uploadImage(imageFile) : $("#item-image-existing").value;

    const item = {
      id: existingId || uid("menu"),
      category: $("#item-category").value,
      name: $("#item-name").value.trim(),
      description: $("#item-description").value.trim(),
      price: $("#item-price").value === "" ? "" : Number($("#item-price").value),
      priceLabel: $("#item-price-label").value.trim(),
      image,
      active: $("#item-active").value === "true"
    };

    if (!item.name) throw new Error("Enter an item name.");

    state.items = state.items || [];
    const index = state.items.findIndex((entry) => entry.id === item.id);
    if (index >= 0) state.items[index] = item;
    else state.items.push(item);

    saveDraft();
    renderItems();
    resetItemForm();
    updateStatus("Item saved — publish when ready");
  } catch (error) {
    alert(error.message || "Could not save item.");
  } finally {
    if (button) button.disabled = false;
  }
}

function saveCategory() {
  const name = $("#category-name").value.trim();
  const description = $("#category-description").value.trim();
  if (!name) return alert("Enter a category name.");

  state.categories = state.categories || [];
  state.categories.push({ id: uid("category"), name, description });
  $("#category-name").value = "";
  $("#category-description").value = "";
  $("#category-editor").classList.add("hidden");

  saveDraft();
  renderCategories();
  updateStatus("Category saved — publish when ready");
}

function saveBrand() {
  state.brand = state.brand || {};
  state.meta = state.meta || {};
  state.brand.cateringTitle = $("#brand-title").value.trim();
  state.brand.cateringSubtitle = $("#brand-subtitle").value.trim();
  state.brand.brochureIntro = $("#brand-intro").value.trim();
  state.meta.priceNote = $("#price-note").value.trim();
  state.meta.updatedAt = new Date().toISOString();
  saveDraft();
  updateStatus("Brand copy saved — publish when ready");
}

function saveProfile() {
  state.profile = state.profile || {};
  Object.assign(state.profile, {
    legalName: $("#profile-legal").value.trim(),
    positioning: $("#profile-positioning").value.trim(),
    registration: $("#profile-registration").value.trim(),
    csd: $("#profile-csd").value.trim(),
    email: $("#profile-email").value.trim(),
    phone: $("#profile-phone").value.trim(),
    address: $("#profile-address").value.trim(),
    overview: $("#profile-overview").value.trim()
  });
  state.meta = state.meta || {};
  state.meta.updatedAt = new Date().toISOString();
  saveDraft();
  updateStatus("Profile saved — publish when ready");
}

async function publish() {
  saveBrand();
  saveProfile();

  const response = await fetch("/api/admin/content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state)
  });

  if (!response.ok) {
    let payload = {};
    try { payload = await response.json(); } catch (_) {}
    if (response.status === 401) {
      alert("Your administrator session has expired. Please sign in again.");
      location.reload();
      return;
    }
    throw new Error(payload.error || "Publish failed.");
  }

  localStorage.removeItem(PREVIEW_KEY);
  updateStatus("Published to Cloudflare");
  alert("Published successfully.");
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `amantusi-catering-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importJson(file) {
  const parsed = JSON.parse(await file.text());
  if (!parsed || !Array.isArray(parsed.items) || !Array.isArray(parsed.categories)) {
    throw new Error("This does not look like an Amantusi CMS backup.");
  }
  state = parsed;
  saveDraft();
  hydrateForms();
  renderCategories();
  renderItems();
  updateStatus("Backup imported — publish when ready");
}

function showPanel(id) {
  $$(".admin-section").forEach((section) => section.classList.toggle("hidden", section.id !== id));
  $$('[data-panel-target]').forEach((button) => button.classList.toggle("active", button.dataset.panelTarget === id));
}

async function logout() {
  try { await fetch("/api/admin/logout", { method: "POST" }); } catch (_) {}
  location.reload();
}

document.addEventListener("DOMContentLoaded", async () => {
  const activeSession = await sessionInfo();
  if (activeSession?.authenticated) await openEditor(activeSession);

  $("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = $("#login-error");
    error.textContent = "Checking credentials…";

    const result = await login($("#admin-email").value.trim(), $("#admin-password").value);
    if (result.ok) {
      error.textContent = "";
      $("#admin-password").value = "";
      await openEditor(result.admin);
      return;
    }

    if (result.status === 429 && result.retryAfter) {
      const minutes = Math.max(1, Math.ceil(result.retryAfter / 60));
      error.textContent = `Too many failed attempts. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`;
    } else {
      error.textContent = result.message;
    }
  });

  $("#forgot-toggle").addEventListener("click", () => {
    const box = $("#reset-request-form");
    box.classList.toggle("hidden");
    if (!box.classList.contains("hidden") && $("#admin-email").value) {
      $("#reset-email").value = $("#admin-email").value;
    }
  });

  $("#reset-request-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = $("#reset-request-status");
    status.textContent = "Requesting reset link…";
    const result = await requestPasswordReset($("#reset-email").value.trim());
    status.textContent = result.message;
  });

  $("#item-form").addEventListener("submit", saveItem);
  $("#cancel-edit").addEventListener("click", resetItemForm);
  $("#add-category").addEventListener("click", () => $("#category-editor").classList.toggle("hidden"));
  $("#save-category").addEventListener("click", saveCategory);
  $("#save-brand").addEventListener("click", saveBrand);
  $("#save-profile").addEventListener("click", saveProfile);
  $("#publish-content").addEventListener("click", () => publish().catch((error) => alert(error.message)));
  $$('[data-publish]').forEach((button) => button.addEventListener("click", () => publish().catch((error) => alert(error.message))));
  $("#export-json").addEventListener("click", exportJson);

  $("#import-json").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try { await importJson(file); } catch (error) { alert(error.message); }
    event.target.value = "";
  });

  $("#dashboard-reset-password").addEventListener("click", async () => {
    const status = $("#dashboard-reset-status");
    if (!currentAdmin?.email) {
      status.textContent = "Administrator session not available.";
      return;
    }
    status.textContent = "Sending reset link…";
    const result = await requestPasswordReset(currentAdmin.email);
    status.textContent = result.message;
  });

  $("#logout-btn").addEventListener("click", logout);
  $$('[data-panel-target]').forEach((button) => button.addEventListener("click", () => showPanel(button.dataset.panelTarget)));
});
