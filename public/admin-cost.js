(() => {
  const MODE_ORDER = ['NORMAL', 'CONSERVE', 'CRITICAL', 'EMERGENCY'];
  const MODE_COPY = {
    AUTO: 'Follow the hourly free-tier governor automatically.',
    NORMAL: 'All platform functions enabled.',
    CONSERVE: 'Shed optional telemetry while keeping business functions and Google overflow available.',
    CRITICAL: 'Shed optional telemetry and background overflow tasks.',
    EMERGENCY: 'Prioritize only business-critical dynamic traffic.'
  };

  const esc = (value = '') => String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[ch]);

  function injectShell() {
    const nav = document.querySelector('.admin-nav');
    const main = document.querySelector('.admin-main');
    if (!nav || !main || document.querySelector('#cost-panel')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.panelTarget = 'cost-panel';
    button.id = 'cost-control-nav';
    button.textContent = 'Cost & Resilience';
    const firstPreview = nav.querySelector('a');
    nav.insertBefore(button, firstPreview || document.querySelector('#logout-btn'));

    const section = document.createElement('section');
    section.id = 'cost-panel';
    section.className = 'admin-section hidden cost-control-section';
    section.innerHTML = `
      <div class="ops-heading cost-heading">
        <div>
          <p class="menu-kicker">Free-tier protection</p>
          <h2>Cost & Resilience Control Centre</h2>
          <p class="cost-subcopy">Monitor dynamic usage, control the protection mode and verify the private Google Cloud overflow path without exposing credentials.</p>
        </div>
        <div class="cost-heading-actions">
          <button class="admin-button secondary" id="cost-refresh" type="button">Refresh</button>
          <button class="admin-button secondary" id="cost-probe-google" type="button">Test Google Connection</button>
        </div>
      </div>

      <div id="cost-mode-banner" class="cost-mode-banner mode-normal" aria-live="polite">
        <div><span>Effective protection mode</span><strong id="cost-mode-name">Checking…</strong></div>
        <small id="cost-mode-source">Loading governor state</small>
      </div>

      <div class="cost-metric-grid" id="cost-metrics"></div>

      <div class="cost-layout">
        <div class="admin-panel cost-usage-panel">
          <div class="panel-title-row"><h2>Cloudflare Worker Capacity</h2><span id="cost-state-age" class="cost-state-age">—</span></div>
          <div class="cost-usage-main">
            <div class="cost-usage-number"><strong id="worker-usage-percent">—</strong><span>of daily Worker request guardrail</span></div>
            <div class="cost-progress" aria-label="Worker request utilization"><i id="worker-usage-bar"></i></div>
            <div class="cost-progress-markers" aria-hidden="true"><span style="left:60%">60%</span><span style="left:80%">80%</span><span style="left:93%">93%</span></div>
          </div>
          <div class="cost-threshold-grid">
            <div><i class="threshold-normal"></i><strong>NORMAL</strong><span>&lt; 60%</span></div>
            <div><i class="threshold-conserve"></i><strong>CONSERVE</strong><span>60–79%</span></div>
            <div><i class="threshold-critical"></i><strong>CRITICAL</strong><span>80–92%</span></div>
            <div><i class="threshold-emergency"></i><strong>EMERGENCY</strong><span>93%+</span></div>
          </div>
        </div>

        <div class="admin-panel cost-control-panel">
          <div class="panel-title-row"><h2>Protection Mode</h2><span id="cost-automatic-mode" class="cost-auto-label">Auto: —</span></div>
          <p class="panel-copy">AUTO is recommended. Manual modes persist in KV until you restore AUTO. Forcing less protection than the automatic recommendation requires explicit confirmation.</p>
          <div class="cost-mode-buttons" id="cost-mode-buttons">
            ${['AUTO', ...MODE_ORDER].map((mode) => `<button type="button" data-cost-mode="${mode}"><strong>${mode}</strong><small>${esc(MODE_COPY[mode])}</small></button>`).join('')}
          </div>
          <p id="cost-action-status" class="reset-status" aria-live="polite"></p>
        </div>
      </div>

      <div class="cost-layout cost-layout-lower">
        <div class="admin-panel">
          <div class="panel-title-row"><h2>Feature Shedding</h2><span class="cost-auto-label">Effective now</span></div>
          <div id="cost-shed-grid" class="cost-shed-grid"></div>
          <div class="cost-safety-note"><strong>Protected at every mode</strong><span>Public static pages, quotation requests, admin authentication and lead records remain prioritized.</span></div>
        </div>

        <div class="admin-panel">
          <div class="panel-title-row"><h2>Google Cloud Overflow</h2><span id="google-overflow-badge" class="cost-cloud-badge">Checking…</span></div>
          <div id="google-overflow-details" class="cost-cloud-details"></div>
          <div id="google-probe-result" class="cost-probe-result">The private service is not awakened during normal dashboard loading. Use “Test Google Connection” for an authenticated health probe.</div>
        </div>
      </div>

      <div class="admin-panel cost-reference-panel">
        <div class="panel-title-row"><h2>Free-Tier Reference</h2><span>Governor reference values</span></div>
        <div id="cost-reference-grid" class="cost-reference-grid"></div>
      </div>`;
    main.appendChild(section);
  }

  async function api(url, options = {}) {
    const response = await fetch(url, { cache: 'no-store', ...options });
    let payload = {};
    try { payload = await response.json(); } catch (_) {}
    if (!response.ok) {
      const error = new Error(payload.error || `Request failed (${response.status}).`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return payload;
  }

  function formatNumber(value) {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—';
    return new Intl.NumberFormat('en-ZA').format(Number(value));
  }

  function formatPercent(value) {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—';
    return `${(Number(value) * 100).toFixed(Number(value) < 0.1 ? 1 : 0)}%`;
  }

  function formatAge(value) {
    if (!value) return 'No usage snapshot yet';
    const then = new Date(value).getTime();
    if (!Number.isFinite(then)) return 'Unknown snapshot time';
    const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.round(minutes / 60)}h ago`;
  }

  function metric(label, value, detail) {
    return `<article class="cost-metric"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small></article>`;
  }

  function renderShed(data) {
    const shed = data.shed || {};
    const items = [
      ['Static public site', shed.staticPublicSite, 'Served from static assets; not intentionally shed.'],
      ['RFQ + admin core', shed.rfqAndAdmin, 'Quotation and protected business operations stay prioritized.'],
      ['Optional telemetry', shed.optionalTelemetry, shed.optionalTelemetry ? 'Analytics/event work is enabled.' : 'Shed to preserve dynamic capacity.'],
      ['Google background overflow', shed.backgroundOverflow, shed.backgroundOverflow ? 'Background overflow tasks may run.' : 'Deferred until the protection mode recovers.']
    ];
    const node = document.querySelector('#cost-shed-grid');
    if (node) node.innerHTML = items.map(([label, enabled, detail]) => `
      <div class="cost-shed-item ${enabled ? 'enabled' : 'shed'}">
        <i></i><div><strong>${esc(label)}</strong><small>${esc(detail)}</small></div><span>${enabled ? 'AVAILABLE' : 'SHED'}</span>
      </div>`).join('');
  }

  function renderReference(ref = {}) {
    const node = document.querySelector('#cost-reference-grid');
    if (!node) return;
    const rows = [
      ['Worker requests/day', ref.workersRequestsPerDay],
      ['KV reads/day', ref.kvReadsPerDay],
      ['KV writes/day', ref.kvWritesPerDay],
      ['D1 rows read/day', ref.d1RowsReadPerDay],
      ['D1 rows written/day', ref.d1RowsWrittenPerDay]
    ];
    node.innerHTML = rows.map(([label, value]) => `<div><span>${esc(label)}</span><strong>${formatNumber(value)}</strong></div>`).join('');
  }

  function renderQuota(data) {
    const state = data.state || {};
    const usage = data.usage || {};
    const mode = state.mode || 'NORMAL';
    const ratio = Math.max(0, Math.min(1, Number(usage.workerRequestRatio) || 0));
    const banner = document.querySelector('#cost-mode-banner');
    if (banner) banner.className = `cost-mode-banner mode-${mode.toLowerCase()}`;
    const modeName = document.querySelector('#cost-mode-name');
    if (modeName) modeName.textContent = mode;
    const source = document.querySelector('#cost-mode-source');
    if (source) {
      const override = state.override || {};
      source.textContent = override.type === 'manual'
        ? `Manual override by ${override.updatedBy || 'administrator'} · ${formatAge(override.updatedAt)}`
        : override.type === 'environment'
          ? 'Environment-level override'
          : `Automatic governor · usage snapshot ${formatAge(state.updatedAt)}`;
    }

    const automatic = document.querySelector('#cost-automatic-mode');
    if (automatic) automatic.textContent = `Auto: ${state.automaticMode || 'NORMAL'}`;
    const age = document.querySelector('#cost-state-age');
    if (age) age.textContent = formatAge(state.updatedAt);
    const percent = document.querySelector('#worker-usage-percent');
    if (percent) percent.textContent = formatPercent(usage.workerRequestRatio);
    const bar = document.querySelector('#worker-usage-bar');
    if (bar) bar.style.width = `${Math.max(0, Math.min(100, ratio * 100))}%`;

    const metrics = document.querySelector('#cost-metrics');
    if (metrics) metrics.innerHTML = [
      metric('Worker Requests', formatNumber(usage.workerRequests), 'Current daily snapshot'),
      metric('Capacity Used', formatPercent(usage.workerRequestRatio), 'Governor utilization'),
      metric('Requests Remaining', formatNumber(usage.workerRequestsRemaining), 'Before 100k reference'),
      metric('Automatic Mode', state.automaticMode || 'NORMAL', 'Analytics-driven recommendation'),
      metric('Effective Mode', mode, state.source || 'default'),
      metric('KV Writes', formatNumber(state.kvWrites), 'Aggregated snapshot')
    ].join('');

    document.querySelectorAll('[data-cost-mode]').forEach((button) => {
      const selected = state.override?.type === 'manual' ? state.override.mode : (state.override?.type === 'environment' ? state.override.mode : 'AUTO');
      button.classList.toggle('active', button.dataset.costMode === selected);
    });

    renderShed(data);
    renderReference(data.freeTierReference || {});
  }

  function renderOverflow(data) {
    const badge = document.querySelector('#google-overflow-badge');
    const details = document.querySelector('#google-overflow-details');
    const configured = Boolean(data?.configured);
    if (badge) {
      badge.textContent = configured ? 'CONFIGURED' : 'DISABLED';
      badge.className = `cost-cloud-badge ${configured ? 'ok' : 'warn'}`;
    }
    if (details) details.innerHTML = `
      <div><span>Provider</span><strong>${esc(data?.provider || 'google-cloud-run')}</strong></div>
      <div><span>Private IAM</span><strong>${data?.privateIam ? 'ENFORCED' : 'UNKNOWN'}</strong></div>
      <div><span>Overflow enabled</span><strong>${data?.enabled ? 'YES' : 'NO'}</strong></div>
      <div><span>WIF pool</span><strong>${esc(data?.pool || '—')}</strong></div>
      <div><span>OIDC provider</span><strong>${esc(data?.providerId || '—')}</strong></div>
      <div><span>Invoker</span><strong class="cost-break">${esc(data?.invoker || '—')}</strong></div>
      <div class="full"><span>Service</span><strong class="cost-break">${esc(data?.serviceUrl || '—')}</strong></div>`;
  }

  function renderProbe(probe) {
    const node = document.querySelector('#google-probe-result');
    if (!node) return;
    if (!probe) return;
    node.className = `cost-probe-result ${probe.ok ? 'ok' : 'warn'}`;
    node.innerHTML = probe.ok
      ? `<strong>Private connection verified</strong><span>Cloud Run responded ${esc(String(probe.status || 200))} in ${esc(String(probe.latencyMs || 0))} ms. WIF → IAM ID token → private service is working.</span>`
      : `<strong>Private connection test failed</strong><span>${esc(probe.error || 'Unknown Google overflow error.')}</span>`;
  }

  async function loadCostState({ probe = false } = {}) {
    const status = document.querySelector('#cost-action-status');
    if (status && probe) status.textContent = 'Testing private Google connection…';
    try {
      const [quota, overflow] = await Promise.all([
        api('/api/admin/quota'),
        api(`/api/admin/overflow/status${probe ? '?probe=1' : ''}`)
      ]);
      renderQuota(quota);
      renderOverflow(overflow);
      if (probe) renderProbe(overflow.probe);
      if (status) status.textContent = probe ? (overflow.probe?.ok ? 'Google private overflow connection verified.' : 'Google connection needs attention.') : '';
    } catch (error) {
      if (status) status.textContent = error.message || 'Could not load cost controls.';
    }
  }

  async function setMode(mode) {
    const status = document.querySelector('#cost-action-status');
    if (status) status.textContent = `Applying ${mode}…`;
    let confirmRisk = false;
    try {
      let response;
      try {
        response = await api('/api/admin/quota', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode, confirmRisk })
        });
      } catch (error) {
        if (error.status !== 409 || !error.payload?.requiresConfirmation) throw error;
        const ok = confirm(`Automatic protection currently recommends ${error.payload.automaticMode}. Forcing ${mode} reduces protection and could consume free-tier capacity faster. Continue?`);
        if (!ok) { if (status) status.textContent = 'Mode change cancelled.'; return; }
        confirmRisk = true;
        response = await api('/api/admin/quota', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode, confirmRisk })
        });
      }
      renderQuota(response);
      if (status) status.textContent = response.message || `Protection mode changed to ${mode}.`;
    } catch (error) {
      if (status) status.textContent = error.message || 'Could not update protection mode.';
    }
  }

  injectShell();

  document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('#cost-control-nav');
    nav?.addEventListener('click', () => loadCostState());
    document.querySelector('#cost-refresh')?.addEventListener('click', () => loadCostState());
    document.querySelector('#cost-probe-google')?.addEventListener('click', () => loadCostState({ probe: true }));
    document.querySelector('#cost-mode-buttons')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-cost-mode]');
      if (button) setMode(button.dataset.costMode);
    });

    const adminView = document.querySelector('#admin-view');
    if (!adminView) return;
    let initialLoaded = false;
    const maybeLoad = () => {
      if (!initialLoaded && !adminView.classList.contains('hidden')) {
        initialLoaded = true;
        loadCostState();
      }
    };
    maybeLoad();
    new MutationObserver(maybeLoad).observe(adminView, { attributes: true, attributeFilter: ['class'] });
  });
})();