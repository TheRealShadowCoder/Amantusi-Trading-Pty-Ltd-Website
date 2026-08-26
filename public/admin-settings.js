(() => {
  const catalog = Array.isArray(window.AMANTUSI_ADMIN_SETTINGS_CATALOG) ? window.AMANTUSI_ADMIN_SETTINGS_CATALOG : [];
  const settings = Array.isArray(window.AMANTUSI_ADMIN_SETTINGS) ? window.AMANTUSI_ADMIN_SETTINGS : [];
  const api = '/api/admin/settings-control';
  const els = {};
  let state = null;
  let identities = [];
  let diagnostics = null;
  let auditEvents = [];
  let stagedCapabilities = {};
  let visibleLimit = 120;
  let activeCategory = '';
  let searchTerm = '';
  let statusFilter = '';
  let toastTimer = null;

  const $ = (id) => document.getElementById(id);
  const text = (value) => String(value == null ? '' : value);
  const escapeHtml = (value) => text(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function cacheEls() {
    ['settings-nav','settings-sidebar','settings-menu-toggle','settings-save-state','permanent-admin-email','metric-capabilities','metric-enabled','metric-security','metric-infrastructure','identity-list','settings-search','settings-category-filter','settings-status-filter','settings-result-count','settings-grid','settings-load-more','diagnostics-grid','settings-audit','settings-toast','setting-theme','setting-density','setting-scale','setting-scale-value','setting-reduced-motion','setting-high-contrast','setting-passkey-critical','setting-new-device','setting-session-hours','setting-idle-minutes','save-core-settings','bulk-enable-visible','bulk-disable-visible','refresh-diagnostics','refresh-audit','settings-export','settings-export-side','settings-reset'].forEach((id) => { els[id] = $(id); });
  }

  function toast(message, isError = false) {
    if (!els['settings-toast']) return;
    clearTimeout(toastTimer);
    els['settings-toast'].textContent = message;
    els['settings-toast'].classList.toggle('error', isError);
    els['settings-toast'].classList.add('show');
    toastTimer = setTimeout(() => els['settings-toast'].classList.remove('show'), 3600);
  }

  function setSaveState(message) {
    if (els['settings-save-state']) els['settings-save-state'].textContent = message;
  }

  async function request(url, options = {}) {
    const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', ...options, headers: { accept: 'application/json', ...(options.body ? {'content-type':'application/json'} : {}), ...(options.headers || {}) } });
    if (response.status === 401) {
      window.location.replace('/admin.html');
      throw new Error('Authentication required.');
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
    return payload;
  }

  function capabilityState(id) {
    if (Object.prototype.hasOwnProperty.call(stagedCapabilities, id)) return stagedCapabilities[id];
    const saved = state?.capabilityStates?.[id];
    if (saved && typeof saved === 'object') return saved.enabled !== false;
    if (typeof saved === 'boolean') return saved;
    return true;
  }

  function capabilityStatus(id) {
    if (Object.prototype.hasOwnProperty.call(stagedCapabilities, id)) return stagedCapabilities[id] ? 'enabled' : 'disabled';
    const saved = state?.capabilityStates?.[id];
    return saved?.status || (capabilityState(id) ? 'enabled' : 'disabled');
  }

  function renderSidebar() {
    const buttons = ['<button type="button" class="active" data-category="">All settings <span>1000</span></button>'];
    catalog.forEach((group) => buttons.push(`<button type="button" data-category="${escapeHtml(group.category)}">${escapeHtml(group.category)} <span>20</span></button>`));
    els['settings-nav'].innerHTML = buttons.join('');
    els['settings-nav'].querySelectorAll('button').forEach((button) => button.addEventListener('click', () => {
      activeCategory = button.dataset.category || '';
      visibleLimit = 120;
      els['settings-nav'].querySelectorAll('button').forEach((item) => item.classList.toggle('active', item === button));
      els['settings-category-filter'].value = activeCategory;
      renderSettings();
      if (window.innerWidth <= 820) els['settings-sidebar'].classList.remove('open');
      document.querySelector('.capability-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
  }

  function fillCategoryFilter() {
    catalog.forEach((group) => {
      const option = document.createElement('option');
      option.value = group.category;
      option.textContent = group.category;
      els['settings-category-filter'].appendChild(option);
    });
  }

  function filteredSettings() {
    const needle = searchTerm.trim().toLowerCase();
    return settings.filter((item) => {
      if (activeCategory && item.category !== activeCategory) return false;
      if (statusFilter && capabilityStatus(item.id) !== statusFilter) return false;
      if (!needle) return true;
      return `${item.number} ${item.category} ${item.label}`.toLowerCase().includes(needle);
    });
  }

  function renderSettings() {
    const filtered = filteredSettings();
    const visible = filtered.slice(0, visibleLimit);
    els['settings-result-count'].textContent = `${filtered.length.toLocaleString()} setting${filtered.length === 1 ? '' : 's'}`;
    els['settings-grid'].innerHTML = visible.map((item) => {
      const enabled = capabilityState(item.id);
      const changed = Object.prototype.hasOwnProperty.call(stagedCapabilities, item.id);
      return `<article class="setting-card${changed ? ' changed' : ''}" data-id="${item.id}">
        <span class="setting-number">${String(item.number).padStart(4,'0')}</span>
        <div class="setting-copy"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.category)} · ${enabled ? 'Enabled' : 'Disabled'}</span></div>
        <label class="setting-toggle" title="${enabled ? 'Disable' : 'Enable'} ${escapeHtml(item.label)}"><input type="checkbox" ${enabled ? 'checked' : ''} data-setting-toggle="${item.id}"><i></i></label>
      </article>`;
    }).join('') || '<div class="diagnostic-card"><strong>No matching settings</strong><span>Adjust the search or filter.</span></div>';
    els['settings-load-more'].hidden = visible.length >= filtered.length;
    els['settings-grid'].querySelectorAll('[data-setting-toggle]').forEach((input) => input.addEventListener('change', () => {
      stagedCapabilities[input.dataset.settingToggle] = input.checked;
      setSaveState(`${Object.keys(stagedCapabilities).length} capability change${Object.keys(stagedCapabilities).length === 1 ? '' : 's'} staged`);
      renderSettings();
      renderMetrics();
    }));
  }

  function renderMetrics() {
    const enabled = settings.reduce((count, item) => count + (capabilityState(item.id) ? 1 : 0), 0);
    els['metric-capabilities'].textContent = settings.length.toLocaleString();
    els['metric-enabled'].textContent = enabled.toLocaleString();
    const security = state?.security || {};
    const securityChecks = [security.googleOnly, security.bruteForceProtection, security.suspiciousLoginBlocking, security.mfaCriticalActions];
    els['metric-security'].textContent = `${securityChecks.filter(Boolean).length}/${securityChecks.length}`;
    const bindings = diagnostics?.bindings || {};
    const bindingValues = Object.values(bindings);
    els['metric-infrastructure'].textContent = bindingValues.length ? `${bindingValues.filter(Boolean).length}/${bindingValues.length}` : '—';
  }

  function renderIdentities() {
    els['identity-list'].innerHTML = identities.map((item) => `<article class="identity-card${item.permanent ? ' permanent' : ''}">
      <div class="identity-card-head"><strong>${escapeHtml(item.email)}</strong><span class="identity-badge">${item.permanent ? 'PERMANENT ACCESS' : escapeHtml(item.role.toUpperCase())}</span></div>
      <p>${escapeHtml(item.label)} · Google verified identity · ${item.protected ? 'Protected authorization record' : 'Managed account'}</p>
      ${item.permanent ? '<p><strong>Cannot be removed, suspended, demoted or expired by Settings.</strong></p>' : ''}
    </article>`).join('');
    const permanent = identities.find((item) => item.permanent);
    if (permanent) els['permanent-admin-email'].textContent = permanent.email;
  }

  function renderDiagnostics() {
    const cards = [];
    const d = diagnostics || {};
    const bindings = d.bindings || {};
    Object.entries(bindings).forEach(([name, ok]) => cards.push({ name: name === 'googleClient' ? 'Google OAuth Client' : name === 'cloudRun' ? 'Google Cloud Run' : name.toUpperCase(), ok, detail: ok ? 'Connected / available' : 'Not detected' }));
    const security = d.security || {};
    Object.entries(security).forEach(([name, ok]) => cards.push({ name: name.replace(/([A-Z])/g,' $1').replace(/^./,(c)=>c.toUpperCase()), ok: Boolean(ok), detail: typeof ok === 'boolean' ? (ok ? 'Enforced' : 'Not active') : text(ok) }));
    if (d.permanentAccess) cards.unshift({ name: 'Permanent Superadmin', ok: d.permanentAccess.active, detail: d.permanentAccess.email });
    els['diagnostics-grid'].innerHTML = cards.map((card) => `<article class="diagnostic-card ${card.ok ? 'ok' : 'warn'}"><span class="diagnostic-dot"></span><strong>${escapeHtml(card.name)}</strong><span>${escapeHtml(card.detail)}</span></article>`).join('');
    renderMetrics();
  }

  function renderAudit() {
    els['settings-audit'].innerHTML = auditEvents.length ? auditEvents.map((event) => `<article class="audit-event"><time>${escapeHtml(new Date(event.at).toLocaleString())}</time><div><strong>${escapeHtml(event.action)}</strong><span>${escapeHtml(event.actor)} · ${escapeHtml(event.role)}</span></div><span class="audit-hash" title="${escapeHtml(event.hash)}">${escapeHtml(event.hash)}</span></article>`).join('') : '<div class="diagnostic-card"><strong>No settings changes recorded yet.</strong><span>The first save will create a tamper-evident audit event.</span></div>';
  }

  function fillCoreForm() {
    const appearance = state.appearance || {};
    const security = state.security || {};
    els['setting-theme'].value = appearance.mode || 'system';
    els['setting-density'].value = appearance.density || 'comfortable';
    els['setting-scale'].value = appearance.interfaceScale || 100;
    els['setting-scale-value'].textContent = `${els['setting-scale'].value}%`;
    els['setting-reduced-motion'].checked = Boolean(appearance.reducedMotion);
    els['setting-high-contrast'].checked = Boolean(appearance.highContrast);
    els['setting-passkey-critical'].checked = Boolean(security.passkeyCriticalActions);
    els['setting-new-device'].checked = security.newDeviceVerification !== false;
    els['setting-session-hours'].value = String(security.sessionHours || 8);
    els['setting-idle-minutes'].value = String(security.idleMinutes || 60);
    document.documentElement.dataset.adminTheme = appearance.mode || 'system';
    document.documentElement.dataset.adminDensity = appearance.density || 'comfortable';
  }

  async function saveCore() {
    setSaveState('Saving…');
    try {
      const body = {
        appearance: {
          mode: els['setting-theme'].value,
          density: els['setting-density'].value,
          interfaceScale: Number(els['setting-scale'].value),
          reducedMotion: els['setting-reduced-motion'].checked,
          highContrast: els['setting-high-contrast'].checked
        },
        security: {
          passkeyCriticalActions: els['setting-passkey-critical'].checked,
          newDeviceVerification: els['setting-new-device'].checked,
          sessionHours: Number(els['setting-session-hours'].value),
          idleMinutes: Number(els['setting-idle-minutes'].value)
        },
        reason: 'Updated core Admin Settings preferences'
      };
      const result = await request(api, { method: 'PUT', body: JSON.stringify(body) });
      state = result.state;
      fillCoreForm();
      renderMetrics();
      setSaveState(`Saved ${new Date().toLocaleTimeString()}`);
      toast('Core settings saved. Mandatory security controls remain enforced.');
      await refreshAudit();
    } catch (error) { setSaveState('Save failed'); toast(error.message, true); }
  }

  async function saveCapabilities() {
    const entries = Object.entries(stagedCapabilities);
    if (!entries.length) return;
    setSaveState(`Saving ${entries.length} capability changes…`);
    try {
      const capabilityStates = Object.fromEntries(entries.map(([id, enabled]) => [id, { enabled, status: enabled ? 'enabled' : 'disabled' }]));
      const result = await request(api, { method: 'PUT', body: JSON.stringify({ capabilityStates, reason: `Updated ${entries.length} administration capabilities` }) });
      state = result.state;
      stagedCapabilities = {};
      setSaveState(`Saved ${new Date().toLocaleTimeString()}`);
      toast(`${entries.length} capability setting${entries.length === 1 ? '' : 's'} saved.`);
      renderSettings();
      renderMetrics();
      await refreshAudit();
    } catch (error) { setSaveState('Save failed'); toast(error.message, true); }
  }

  function stageVisible(value) {
    filteredSettings().forEach((item) => { stagedCapabilities[item.id] = value; });
    setSaveState(`${Object.keys(stagedCapabilities).length} capability changes staged`);
    renderSettings();
    renderMetrics();
    saveCapabilities();
  }

  async function refreshAudit() {
    try {
      const payload = await request(`${api}/audit?limit=80`);
      auditEvents = payload.audit || [];
      renderAudit();
    } catch (error) { toast(error.message, true); }
  }

  async function refreshAll() {
    setSaveState('Loading control centre…');
    try {
      const payload = await request(`${api}?audit=1`);
      state = payload.state;
      identities = payload.identities || [];
      diagnostics = payload.diagnostics || null;
      auditEvents = payload.audit || [];
      stagedCapabilities = {};
      fillCoreForm();
      renderIdentities();
      renderSettings();
      renderDiagnostics();
      renderAudit();
      setSaveState(`Synced ${new Date().toLocaleTimeString()}`);
    } catch (error) { setSaveState('Unable to load'); toast(error.message, true); }
  }

  async function resetSettings() {
    const confirmed = window.confirm('Reset configurable Admin Settings to safe defaults? Permanent superadmin access and mandatory security policies will remain protected.');
    if (!confirmed) return;
    const reason = window.prompt('Reason for reset (required for governance):', 'Restore safe Admin Settings defaults') || '';
    if (!reason.trim()) { toast('Reset cancelled because a governance reason is required.', true); return; }
    try {
      const result = await request(`${api}/reset`, { method: 'POST', body: JSON.stringify({ confirm: 'RESET_SETTINGS', reason }) });
      state = result.state;
      stagedCapabilities = {};
      fillCoreForm();
      renderSettings();
      renderMetrics();
      toast('Configurable settings reset. Permanent access remained protected.');
      await refreshAudit();
    } catch (error) { toast(error.message, true); }
  }

  function exportSettings() {
    window.location.href = `${api}/export`;
  }

  function bindEvents() {
    els['settings-menu-toggle'].addEventListener('click', () => els['settings-sidebar'].classList.toggle('open'));
    document.addEventListener('click', (event) => {
      if (window.innerWidth <= 820 && els['settings-sidebar'].classList.contains('open') && !els['settings-sidebar'].contains(event.target) && event.target !== els['settings-menu-toggle']) els['settings-sidebar'].classList.remove('open');
    });
    els['settings-search'].addEventListener('input', () => { searchTerm = els['settings-search'].value; visibleLimit = 120; renderSettings(); });
    els['settings-category-filter'].addEventListener('change', () => { activeCategory = els['settings-category-filter'].value; visibleLimit = 120; renderSidebar(); renderSettings(); });
    els['settings-status-filter'].addEventListener('change', () => { statusFilter = els['settings-status-filter'].value; visibleLimit = 120; renderSettings(); });
    els['settings-load-more'].addEventListener('click', () => { visibleLimit += 160; renderSettings(); });
    els['setting-scale'].addEventListener('input', () => els['setting-scale-value'].textContent = `${els['setting-scale'].value}%`);
    els['save-core-settings'].addEventListener('click', saveCore);
    els['bulk-enable-visible'].addEventListener('click', () => stageVisible(true));
    els['bulk-disable-visible'].addEventListener('click', () => stageVisible(false));
    els['refresh-diagnostics'].addEventListener('click', refreshAll);
    els['refresh-audit'].addEventListener('click', refreshAudit);
    els['settings-export'].addEventListener('click', exportSettings);
    els['settings-export-side'].addEventListener('click', exportSettings);
    els['settings-reset'].addEventListener('click', resetSettings);
    window.addEventListener('beforeunload', (event) => { if (Object.keys(stagedCapabilities).length) { event.preventDefault(); event.returnValue = ''; } });
    document.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (Object.keys(stagedCapabilities).length) saveCapabilities(); else saveCore();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        els['settings-search'].focus();
      }
    });
  }

  function init() {
    cacheEls();
    if (settings.length !== 1000 || catalog.length !== 50) {
      toast('The 1,000-setting registry did not load correctly.', true);
      return;
    }
    renderSidebar();
    fillCategoryFilter();
    bindEvents();
    refreshAll();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
