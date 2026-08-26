(() => {
  'use strict';

  const CATALOG_URLS = [1, 2, 3, 4, 5].map((n) => `/data/admin-settings-0${n}.json`);
  const PAGE_SIZE = 40;
  const ROOT_EMAIL = 's.k.businessline@gmail.com';
  const state = {
    catalog: [],
    categories: [],
    settings: null,
    query: '',
    group: '',
    category: '',
    status: '',
    page: 1,
    loading: false
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = (value = '') => String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[ch]);

  function settingId(number) {
    return `s${String(number).padStart(3, '0')}`;
  }

  function capabilityEnabled(id) {
    if (!state.settings) return true;
    if (Object.prototype.hasOwnProperty.call(state.settings.overrides || {}, id)) {
      return state.settings.overrides[id] !== false;
    }
    return state.settings.defaultEnabled !== false;
  }

  function providerNote(entry) {
    if (entry.group === 'integration' || entry.group === 'communications') return 'Provider setup may be required';
    if (entry.group === 'automation') return 'Automation policy available';
    if (entry.group === 'platform') return 'Platform control available';
    if (entry.group === 'security') return 'Security control available';
    return 'Control available';
  }

  async function api(path, options = {}) {
    const response = await fetch(path, {
      cache: 'no-store',
      credentials: 'same-origin',
      ...options,
      headers: {
        ...(options.body ? { 'content-type': 'application/json' } : {}),
        ...(options.headers || {})
      }
    });
    let payload = {};
    try { payload = await response.json(); } catch (_) {}
    if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
    return payload;
  }

  async function loadCatalog() {
    const responses = await Promise.all(CATALOG_URLS.map((url) => fetch(url, { cache: 'force-cache' })));
    const payloads = await Promise.all(responses.map((response) => {
      if (!response.ok) throw new Error('Admin settings catalogue could not be loaded.');
      return response.json();
    }));
    const categories = payloads.flatMap((payload) => payload.categories || []).sort((a, b) => a.number - b.number);
    let number = 0;
    const catalog = [];
    for (const category of categories) {
      for (const title of category.items || []) {
        number += 1;
        catalog.push({
          id: settingId(number),
          number,
          title,
          categoryNumber: category.number,
          category: category.name,
          group: category.group
        });
      }
    }
    if (categories.length !== 50 || catalog.length !== 1000) throw new Error(`Settings catalogue integrity error: ${categories.length} domains / ${catalog.length} controls.`);
    state.categories = categories;
    state.catalog = catalog;
  }

  function injectShell() {
    if ($('#settings-panel')) return;
    const nav = $('.admin-nav');
    const main = $('.admin-main');
    if (!nav || !main) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.panelTarget = 'settings-panel';
    button.className = 'settings-nav-entry';
    button.textContent = 'Settings & Governance';
    const logout = $('#logout-btn', nav);
    nav.insertBefore(button, logout || null);

    const section = document.createElement('section');
    section.id = 'settings-panel';
    section.className = 'admin-section hidden settings-control-centre';
    section.innerHTML = `
      <div class="settings-hero">
        <div>
          <p class="menu-kicker">Administration control plane</p>
          <h2>Settings & Governance Centre</h2>
          <p>Manage 1,000 administration capabilities across security, identity, infrastructure, business operations, content, automation, analytics and governance.</p>
        </div>
        <div class="settings-hero-actions">
          <button class="admin-button gold" id="settings-enable-all" type="button">Enable All 1,000</button>
          <button class="admin-button secondary" id="settings-refresh" type="button">Refresh</button>
        </div>
      </div>

      <div class="root-access-banner" id="root-access-banner">
        <div class="root-access-icon" aria-hidden="true">◆</div>
        <div><strong>Protected Root Administrator</strong><span id="root-access-copy">Loading protected account policy…</span></div>
        <span class="root-access-badge">PERMANENT</span>
      </div>

      <div class="settings-metrics" id="settings-metrics"></div>

      <div class="settings-toolbar-card">
        <div class="settings-search-wrap"><input id="settings-search" type="search" placeholder="Search all 1,000 settings…" autocomplete="off"></div>
        <select id="settings-group-filter"><option value="">All groups</option></select>
        <select id="settings-category-filter"><option value="">All 50 domains</option></select>
        <select id="settings-status-filter"><option value="">All states</option><option value="enabled">Enabled</option><option value="disabled">Disabled</option></select>
        <button class="admin-button secondary" id="settings-export" type="button">Export</button>
        <label class="admin-button secondary settings-import-label">Import<input id="settings-import" type="file" accept="application/json" hidden></label>
      </div>

      <div class="settings-group-tabs" id="settings-group-tabs"></div>
      <div class="settings-results-head"><div><strong id="settings-result-count">0 controls</strong><span id="settings-result-note"></span></div><button class="admin-button secondary" id="settings-audit-toggle" type="button">Audit History</button></div>
      <div class="settings-grid" id="settings-grid" aria-live="polite"></div>
      <div class="settings-pagination" id="settings-pagination"></div>

      <div class="settings-audit-panel hidden" id="settings-audit-panel">
        <div class="panel-title-row"><div><p class="menu-kicker">Tamper-linked history</p><h2>Settings Audit Trail</h2></div><button class="admin-button secondary" id="settings-audit-refresh" type="button">Refresh Audit</button></div>
        <div id="settings-audit-list" class="settings-audit-list"></div>
      </div>`;
    main.appendChild(section);

    // admin.js binds panel navigation before this file runs, so bind the new entry here.
    button.addEventListener('click', () => {
      document.querySelectorAll('.admin-section').forEach((panel) => panel.classList.add('hidden'));
      document.querySelectorAll('.admin-nav [data-panel-target]').forEach((entry) => entry.classList.remove('active'));
      section.classList.remove('hidden');
      button.classList.add('active');
      try { localStorage.setItem('amantusi-admin-panel', 'settings-panel'); } catch (_) {}
    });
  }

  function fillFilters() {
    const groupSelect = $('#settings-group-filter');
    const categorySelect = $('#settings-category-filter');
    const tabs = $('#settings-group-tabs');
    if (!groupSelect || !categorySelect || !tabs) return;
    const groups = [...new Set(state.categories.map((category) => category.group))].sort();
    groupSelect.innerHTML = '<option value="">All groups</option>' + groups.map((group) => `<option value="${esc(group)}">${esc(group[0].toUpperCase() + group.slice(1))}</option>`).join('');
    categorySelect.innerHTML = '<option value="">All 50 domains</option>' + state.categories.map((category) => `<option value="${category.number}">${category.number}. ${esc(category.name)}</option>`).join('');
    tabs.innerHTML = ['all', 'security', 'identity', 'platform', 'business', 'content', 'experience', 'governance', 'automation', 'integration'].map((group) => `<button type="button" data-settings-group="${group === 'all' ? '' : group}" class="${group === 'all' ? 'active' : ''}">${esc(group[0].toUpperCase() + group.slice(1))}</button>`).join('');
    tabs.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => {
      tabs.querySelectorAll('button').forEach((entry) => entry.classList.remove('active'));
      button.classList.add('active');
      state.group = button.dataset.settingsGroup || '';
      groupSelect.value = state.group;
      state.page = 1;
      render();
    }));
  }

  function filteredCatalog() {
    const q = state.query.trim().toLowerCase();
    return state.catalog.filter((entry) => {
      if (state.group && entry.group !== state.group) return false;
      if (state.category && String(entry.categoryNumber) !== String(state.category)) return false;
      const enabled = capabilityEnabled(entry.id);
      if (state.status === 'enabled' && !enabled) return false;
      if (state.status === 'disabled' && enabled) return false;
      if (q && !`${entry.number} ${entry.id} ${entry.title} ${entry.category} ${entry.group}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function renderMetrics() {
    const el = $('#settings-metrics');
    if (!el || !state.settings) return;
    const env = state.settings.environment || {};
    const environmentHealthy = Object.values(env).filter(Boolean).length;
    const environmentTotal = Object.keys(env).length;
    el.innerHTML = `
      <article><span>Administration controls</span><strong>1,000</strong><small>Across 50 governance domains</small></article>
      <article><span>Enabled capabilities</span><strong>${Number(state.settings.enabledCount || 0).toLocaleString()}</strong><small>${Number(state.settings.disabledCount || 0)} disabled</small></article>
      <article><span>Root access</span><strong>Protected</strong><small>Server-enforced permanence</small></article>
      <article><span>Platform health</span><strong>${environmentHealthy}/${environmentTotal}</strong><small>Connected capability checks</small></article>`;
  }

  function renderRootProtection() {
    const root = state.settings?.rootProtection || {};
    const copy = $('#root-access-copy');
    if (!copy) return;
    copy.textContent = `${root.email || ROOT_EMAIL} cannot be removed, suspended, demoted, expired or disabled through the settings system.`;
  }

  function render() {
    if (!state.settings) return;
    renderMetrics();
    renderRootProtection();
    const items = filteredCatalog();
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    state.page = Math.min(Math.max(1, state.page), totalPages);
    const start = (state.page - 1) * PAGE_SIZE;
    const pageItems = items.slice(start, start + PAGE_SIZE);
    const grid = $('#settings-grid');
    const count = $('#settings-result-count');
    const note = $('#settings-result-note');
    if (count) count.textContent = `${items.length.toLocaleString()} control${items.length === 1 ? '' : 's'}`;
    if (note) note.textContent = `Showing ${items.length ? start + 1 : 0}–${Math.min(start + PAGE_SIZE, items.length)} • Page ${state.page}/${totalPages}`;

    if (grid) {
      grid.innerHTML = pageItems.map((entry) => {
        const enabled = capabilityEnabled(entry.id);
        return `<article class="settings-card ${enabled ? 'enabled' : 'disabled'}" data-setting-id="${entry.id}">
          <div class="settings-card-top"><span class="settings-number">${String(entry.number).padStart(4, '0')}</span><span class="settings-group-badge">${esc(entry.group)}</span></div>
          <h3>${esc(entry.title)}</h3>
          <p>${esc(entry.category)}</p>
          <div class="settings-card-meta"><span>${esc(providerNote(entry))}</span><strong>${enabled ? 'Enabled' : 'Disabled'}</strong></div>
          <label class="settings-switch"><input type="checkbox" data-setting-toggle="${entry.id}" ${enabled ? 'checked' : ''}><span aria-hidden="true"></span><em>Capability enabled</em></label>
        </article>`;
      }).join('') || '<div class="settings-empty">No settings match these filters.</div>';
      grid.querySelectorAll('[data-setting-toggle]').forEach((input) => input.addEventListener('change', () => updateOne(input.dataset.settingToggle, input.checked, input)));
    }

    renderPagination(items.length, totalPages);
  }

  function renderPagination(total, totalPages) {
    const el = $('#settings-pagination');
    if (!el) return;
    const buttons = [];
    buttons.push(`<button type="button" data-page="${Math.max(1, state.page - 1)}" ${state.page <= 1 ? 'disabled' : ''}>Previous</button>`);
    const first = Math.max(1, state.page - 2);
    const last = Math.min(totalPages, first + 4);
    for (let page = first; page <= last; page += 1) buttons.push(`<button type="button" data-page="${page}" class="${page === state.page ? 'active' : ''}">${page}</button>`);
    buttons.push(`<button type="button" data-page="${Math.min(totalPages, state.page + 1)}" ${state.page >= totalPages ? 'disabled' : ''}>Next</button>`);
    el.innerHTML = `<span>${total.toLocaleString()} total</span><div>${buttons.join('')}</div>`;
    el.querySelectorAll('[data-page]').forEach((button) => button.addEventListener('click', () => {
      state.page = Number(button.dataset.page) || 1;
      render();
      $('#settings-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
  }

  function toast(message, error = false) {
    let el = $('#settings-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'settings-toast';
      document.body.appendChild(el);
    }
    el.className = `settings-toast show ${error ? 'error' : ''}`;
    el.textContent = message;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  async function updateOne(id, enabled, input) {
    if (input) input.disabled = true;
    try {
      const result = await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ changes: [{ id, value: Boolean(enabled) }] }) });
      state.settings.overrides[id] = Boolean(enabled);
      state.settings.updatedAt = result.updatedAt;
      state.settings.updatedBy = result.updatedBy;
      const disabled = state.catalog.reduce((sum, entry) => sum + (capabilityEnabled(entry.id) ? 0 : 1), 0);
      state.settings.disabledCount = disabled;
      state.settings.enabledCount = 1000 - disabled;
      render();
      toast(`${id.toUpperCase()} ${enabled ? 'enabled' : 'disabled'}.`);
    } catch (error) {
      if (input) input.checked = !enabled;
      toast(error.message || 'Could not save setting.', true);
    } finally {
      if (input) input.disabled = false;
    }
  }

  async function enableAll() {
    const button = $('#settings-enable-all');
    if (button) button.disabled = true;
    try {
      await api('/api/admin/settings/bulk', { method: 'POST', body: JSON.stringify({ action: 'enable-all' }) });
      state.settings.overrides = {};
      state.settings.defaultEnabled = true;
      state.settings.enabledCount = 1000;
      state.settings.disabledCount = 0;
      render();
      toast('All 1,000 administration capabilities are enabled.');
    } catch (error) {
      toast(error.message || 'Could not enable all controls.', true);
    } finally {
      if (button) button.disabled = false;
    }
  }

  async function refreshSettings() {
    try {
      state.settings = await api('/api/admin/settings');
      render();
      toast('Settings refreshed.');
    } catch (error) { toast(error.message || 'Could not refresh settings.', true); }
  }

  async function loadAudit() {
    const list = $('#settings-audit-list');
    if (!list) return;
    list.innerHTML = '<p class="settings-loading">Loading audit history…</p>';
    try {
      const result = await api('/api/admin/settings/audit?limit=100');
      const rows = result.audit || [];
      list.innerHTML = rows.length ? rows.map((row) => `<article><div><strong>${esc(row.action)}</strong><span>${esc(row.actor)} • ${esc(new Date(row.at).toLocaleString())}</span></div><code>${esc(String(row.hash || '').slice(0, 16))}…</code></article>`).join('') : '<p class="settings-empty">No settings changes recorded yet.</p>';
    } catch (error) { list.innerHTML = `<p class="settings-empty">${esc(error.message)}</p>`; }
  }

  async function exportSettings() {
    try {
      const payload = await api('/api/admin/settings/export');
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `amantusi-admin-settings-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('Settings export created.');
    } catch (error) { toast(error.message || 'Could not export settings.', true); }
  }

  async function importSettings(file) {
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      await api('/api/admin/settings/import', { method: 'POST', body: JSON.stringify(payload) });
      state.settings = await api('/api/admin/settings');
      render();
      toast('Settings import completed.');
    } catch (error) { toast(error.message || 'Could not import settings.', true); }
  }

  function bindEvents() {
    $('#settings-search')?.addEventListener('input', (event) => { state.query = event.target.value; state.page = 1; render(); });
    $('#settings-group-filter')?.addEventListener('change', (event) => { state.group = event.target.value; state.page = 1; render(); });
    $('#settings-category-filter')?.addEventListener('change', (event) => { state.category = event.target.value; state.page = 1; render(); });
    $('#settings-status-filter')?.addEventListener('change', (event) => { state.status = event.target.value; state.page = 1; render(); });
    $('#settings-enable-all')?.addEventListener('click', enableAll);
    $('#settings-refresh')?.addEventListener('click', refreshSettings);
    $('#settings-export')?.addEventListener('click', exportSettings);
    $('#settings-import')?.addEventListener('change', (event) => importSettings(event.target.files?.[0]));
    $('#settings-audit-toggle')?.addEventListener('click', () => { const panel = $('#settings-audit-panel'); panel?.classList.toggle('hidden'); if (panel && !panel.classList.contains('hidden')) loadAudit(); });
    $('#settings-audit-refresh')?.addEventListener('click', loadAudit);
    document.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === ',') {
        event.preventDefault();
        $('.settings-nav-entry')?.click();
        setTimeout(() => $('#settings-search')?.focus(), 50);
      }
    });
  }

  async function init() {
    if (!$('#admin-view')) return;
    injectShell();
    fillFilters();
    bindEvents();
    try {
      state.loading = true;
      await loadCatalog();
      fillFilters();
      state.settings = await api('/api/admin/settings');
      render();
      if (state.settings?.rootProtection?.email !== ROOT_EMAIL || !state.settings?.rootProtection?.permanentAccess) {
        toast('Protected root policy did not validate.', true);
      }
    } catch (error) {
      const grid = $('#settings-grid');
      if (grid) grid.innerHTML = `<div class="settings-empty">${esc(error.message || 'Admin settings could not initialize.')}</div>`;
    } finally {
      state.loading = false;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
