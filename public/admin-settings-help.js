(() => {
  'use strict';

  const STATIC_HELP = {
    'settings-menu-toggle': ['Settings navigation', 'Open or close the settings category menu.', 'Use this on smaller screens to reach any of the 50 settings groups.'],
    'settings-export-side': ['Export configuration', 'Download the current Admin Settings configuration as JSON.', 'Use this before major changes or when you need a portable governance snapshot.'],
    'settings-save-state': ['Save status', 'Shows whether settings are loading, synced, staged, or saved.', 'If changes are staged, save them before leaving the page.'],
    'save-core-settings': ['Save core settings', 'Saves the Security & Preferences controls shown in this section.', 'Mandatory security controls stay enforced even when editable preferences change.'],
    'setting-theme': ['Interface theme', 'Controls the visual theme used by the Admin Settings interface.', 'Choose System to follow the device, or select a fixed appearance.'],
    'setting-density': ['Information density', 'Controls how tightly information is spaced in the admin interface.', 'Compact and Dense show more content; Comfortable is easier to scan.'],
    'setting-scale': ['Interface scale', 'Changes the overall size of the admin interface.', 'Increase it for larger controls and text, or reduce it to fit more on screen.'],
    'setting-reduced-motion': ['Reduced motion', 'Reduces non-essential interface animation.', 'Enable this for a calmer interface or when motion sensitivity is a concern.'],
    'setting-high-contrast': ['High contrast', 'Increases visual separation between text, controls, and backgrounds.', 'Useful in bright environments or when stronger contrast improves readability.'],
    'setting-google-only': ['Google-only authentication', 'Forces administrator sign-in through approved Google identities.', 'This is a mandatory protection and cannot be disabled from Settings.'],
    'setting-brute-force': ['Brute-force protection', 'Protects administrator sign-in from repeated credential-guessing attempts.', 'This protection is mandatory and remains active.'],
    'setting-critical-mfa': ['Critical-action MFA', 'Requires stronger authentication around sensitive administrator actions.', 'This protection is mandatory and cannot be disabled here.'],
    'setting-passkey-critical': ['Passkey for critical actions', 'Adds passkey verification to sensitive administrator actions when supported.', 'Enable this for stronger protection against account takeover.'],
    'setting-new-device': ['New-device verification', 'Adds verification when an administrator signs in from a device the platform does not recognize.', 'Keep this enabled unless you have a controlled reason to relax device checks.'],
    'setting-session-hours': ['Session duration', 'Sets the maximum normal lifetime of an administrator session.', 'Shorter sessions reduce exposure; longer sessions reduce repeated sign-ins.'],
    'setting-idle-minutes': ['Idle timeout', 'Signs administrators out after a period with no activity.', 'Use a shorter timeout on shared or high-risk devices.'],
    'bulk-enable-visible': ['Enable visible', 'Stages all settings currently matching your search and filters as enabled.', 'Nothing is permanent until you press Save capability changes.'],
    'bulk-disable-visible': ['Disable visible', 'Stages all settings currently matching your search and filters as disabled.', 'Review the visible list carefully before saving a bulk change.'],
    'save-capability-settings': ['Save capability changes', 'Persists all currently staged capability toggles.', 'The button shows how many changes are waiting to be saved.'],
    'settings-search': ['Search settings', 'Search across all 1,000 administration capabilities by number, category, or name.', 'Press Ctrl/Cmd + K to jump here quickly.'],
    'settings-category-filter': ['Category filter', 'Limits the capability list to one of the 50 administration categories.', 'Use this with search and state filters to narrow large result sets.'],
    'settings-status-filter': ['State filter', 'Shows settings by enabled, disabled, or attention state.', 'Useful for finding disabled capabilities or areas that need review.'],
    'settings-load-more': ['Show more settings', 'Loads more matching capability cards into the current view.', 'Filters remain active while more results are added.'],
    'refresh-diagnostics': ['Refresh diagnostics', 'Re-checks infrastructure and security status from the settings control plane.', 'Use this after deployments, credential changes, or platform incidents.'],
    'refresh-audit': ['Refresh audit', 'Reloads the tamper-evident settings audit timeline.', 'Use this to verify who changed configuration and when.'],
    'settings-export': ['Export JSON', 'Downloads the complete configurable settings state as JSON.', 'Export before risky changes or for governance records.'],
    'settings-reset': ['Reset configurable settings', 'Restores configurable Admin Settings to safe defaults.', 'Permanent administrator access and mandatory security rules are preserved.'],
  };

  const CATEGORY_GUIDANCE = {
    security: 'Security settings affect authentication, authorization, monitoring, or protective controls.',
    appearance: 'Appearance settings change presentation and usability without changing business data.',
    accessibility: 'Accessibility settings improve keyboard, visual, motion, and assistive-technology support.',
    notification: 'Notification settings control how operational and security events are delivered.',
    performance: 'Performance settings change loading, rendering, caching, or device resource behavior.',
    cloudflare: 'Cloudflare settings affect Worker, cache, KV, routing, bindings, or edge diagnostics.',
    google: 'Google settings affect authentication, Google Cloud connectivity, OAuth, or related diagnostics.',
    audit: 'Audit settings affect governance visibility and traceability of administrator actions.',
    role: 'Role and permission settings affect what administrators are allowed to see or do.',
    session: 'Session settings affect administrator login lifetime and device/session security.',
    mobile: 'Mobile settings optimize administration for touch devices, smaller screens, and mobile performance.',
    search: 'Search settings control discovery, filtering, and navigation through administrative data.',
    catering: 'Catering settings affect menu, event, quote, content, or catering operations.',
    supplier: 'Supplier settings affect procurement records, supplier workflows, and sourcing operations.',
    product: 'Product settings affect catalogue, pricing, availability, and product operations.',
    finance: 'Finance settings affect monetary records, reporting, controls, or integrations.',
    backup: 'Backup settings affect recovery, export, retention, and restore operations.'
  };

  let tooltip = null;
  let dialog = null;
  let activeTarget = null;
  let closeTimer = null;

  const text = (value) => String(value == null ? '' : value).trim();
  const escapeHtml = (value) => text(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  function stateForCard(card) {
    const input = card?.querySelector('[data-setting-toggle]');
    if (!input) return '';
    return input.checked ? 'Enabled' : 'Disabled';
  }

  function guidanceForCategory(category) {
    const normalized = text(category).toLowerCase();
    const match = Object.entries(CATEGORY_GUIDANCE).find(([key]) => normalized.includes(key));
    return match ? match[1] : 'This setting is part of the Amantusi administration control plane and should be changed only when its operational effect is understood.';
  }

  function buildCapabilityHelp(card) {
    const label = text(card.querySelector('.setting-copy strong')?.textContent) || 'Administration setting';
    const meta = text(card.querySelector('.setting-copy span')?.textContent);
    const category = meta.split('·')[0]?.trim() || 'Administration';
    const number = text(card.querySelector('.setting-number')?.textContent);
    const currentState = stateForCard(card) || (meta.includes('Disabled') ? 'Disabled' : 'Enabled');
    return {
      title: label,
      summary: `${label} is capability ${number || ''} in ${category}.`,
      detail: guidanceForCategory(category),
      impact: currentState === 'Enabled'
        ? 'It is currently enabled. Disabling it can remove or suppress the related administrative capability.'
        : 'It is currently disabled. Enabling it makes the related administrative capability available in the control plane.',
      usage: 'Change the toggle, review the staged-change count, then press Save capability changes. Use search or category filters to compare related controls.',
      state: currentState,
      category
    };
  }

  function buildStaticHelp(el) {
    const entry = STATIC_HELP[el.id];
    if (entry) {
      return {
        title: entry[0],
        summary: entry[1],
        detail: entry[2],
        impact: 'This control changes only the setting or action described here. Protected server-side security invariants remain enforced.',
        usage: el.matches('input,select')
          ? 'Adjust the value, then use the relevant Save control.'
          : 'Activate this control when you want to perform the described action.',
        state: el.disabled ? 'Locked / unavailable' : 'Available',
        category: 'Core Admin Settings'
      };
    }

    if (el.matches('.settings-nav button')) {
      const label = text(el.childNodes[0]?.textContent || el.textContent);
      return {
        title: `${label} category`,
        summary: `Filters the capability registry to ${label}.`,
        detail: 'Each category groups related administration controls so you can manage a smaller, easier-to-understand set of settings.',
        impact: 'Filtering does not change any setting by itself.',
        usage: 'Select the category, inspect the matching capabilities, then enable or disable only the controls you intend to change.',
        state: el.classList.contains('active') ? 'Currently selected' : 'Available',
        category: 'Navigation'
      };
    }

    if (el.matches('.identity-card')) {
      const label = text(el.querySelector('strong')?.textContent) || 'Administrator identity';
      return {
        title: label,
        summary: 'Shows an authorized administrator identity and its protection status.',
        detail: 'Protected identities are governed by server-side access policy, not only by what is displayed in the browser.',
        impact: 'Identity protection affects who can retain administrative access.',
        usage: 'Review this information before making role, account, or authentication-policy changes elsewhere.',
        state: el.classList.contains('permanent') ? 'Permanent protected access' : 'Managed access',
        category: 'Identity Protection'
      };
    }

    if (el.matches('.diagnostic-card')) {
      const label = text(el.querySelector('strong')?.textContent) || 'Diagnostic';
      return {
        title: label,
        summary: 'Reports the current health or enforcement state of a platform dependency or security control.',
        detail: 'Diagnostics are read-only indicators. A warning does not automatically mean the website is offline, but it does mean the dependency should be reviewed.',
        impact: 'Use warnings to identify configuration, binding, integration, or security issues.',
        usage: 'Press Refresh diagnostics after deployments or configuration changes to re-check the live state.',
        state: el.classList.contains('ok') ? 'Healthy / enforced' : 'Review recommended',
        category: 'Infrastructure Diagnostics'
      };
    }

    if (el.matches('.settings-metrics article')) {
      const label = text(el.querySelector('span')?.textContent) || 'Metric';
      const value = text(el.querySelector('strong')?.textContent);
      return {
        title: label,
        summary: `Current control-centre metric: ${value || 'loading'}.`,
        detail: text(el.querySelector('small')?.textContent) || 'This metric summarizes the current Admin Settings state.',
        impact: 'Metrics are informational and do not change configuration.',
        usage: 'Use them as a quick health and configuration overview before changing settings.',
        state: value || 'Loading',
        category: 'Control Centre Overview'
      };
    }

    return null;
  }

  function getHelp(target) {
    const card = target.closest?.('.setting-card');
    if (card) return buildCapabilityHelp(card);
    const helpNode = target.closest?.('[data-admin-help-bound="true"]');
    return helpNode ? buildStaticHelp(helpNode) : buildStaticHelp(target);
  }

  function ensureUi() {
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'admin-help-tooltip';
      tooltip.id = 'admin-help-tooltip';
      tooltip.setAttribute('role', 'tooltip');
      tooltip.hidden = true;
      document.body.appendChild(tooltip);
    }
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.className = 'admin-help-dialog-shell';
      dialog.hidden = true;
      dialog.innerHTML = `
        <div class="admin-help-backdrop" data-help-close></div>
        <section class="admin-help-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-help-title">
          <div class="admin-help-dialog-top">
            <div>
              <span class="admin-help-kicker">Interactive setting guide</span>
              <h2 id="admin-help-title"></h2>
            </div>
            <button class="admin-help-close" type="button" aria-label="Close information" data-help-close>×</button>
          </div>
          <div class="admin-help-state-row">
            <span id="admin-help-category"></span>
            <strong id="admin-help-state"></strong>
          </div>
          <div class="admin-help-tabs" role="tablist" aria-label="Information sections">
            <button type="button" role="tab" aria-selected="true" data-help-tab="summary">What it does</button>
            <button type="button" role="tab" aria-selected="false" data-help-tab="impact">Impact</button>
            <button type="button" role="tab" aria-selected="false" data-help-tab="usage">How to use</button>
          </div>
          <div class="admin-help-tab-panel" id="admin-help-panel"></div>
          <div class="admin-help-dialog-actions">
            <button type="button" data-help-locate>Locate control</button>
            <button type="button" class="admin-help-primary" data-help-close>Got it</button>
          </div>
        </section>`;
      document.body.appendChild(dialog);

      dialog.querySelectorAll('[data-help-close]').forEach((node) => node.addEventListener('click', closeDialog));
      dialog.querySelector('[data-help-locate]')?.addEventListener('click', () => {
        const target = activeTarget;
        closeDialog();
        target?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
        target?.classList?.add('admin-help-located');
        setTimeout(() => target?.classList?.remove('admin-help-located'), 1600);
        const focusable = target?.matches?.('button,input,select,textarea,a[href]') ? target : target?.querySelector?.('button,input,select,textarea,a[href]');
        focusable?.focus?.({ preventScroll: true });
      });
      dialog.querySelectorAll('[data-help-tab]').forEach((button) => button.addEventListener('click', () => selectTab(button.dataset.helpTab)));
    }
  }

  function selectTab(tab) {
    if (!dialog || !dialog._help) return;
    dialog.querySelectorAll('[data-help-tab]').forEach((button) => button.setAttribute('aria-selected', button.dataset.helpTab === tab ? 'true' : 'false'));
    const help = dialog._help;
    const panel = dialog.querySelector('#admin-help-panel');
    const content = tab === 'impact'
      ? help.impact
      : tab === 'usage'
        ? help.usage
        : `${help.summary} ${help.detail}`;
    panel.innerHTML = `<p>${escapeHtml(content)}</p>`;
    panel.classList.remove('admin-help-tab-enter');
    void panel.offsetWidth;
    panel.classList.add('admin-help-tab-enter');
  }

  function openDialog(target, help) {
    ensureUi();
    if (!help) return;
    hideTooltip();
    activeTarget = target.closest?.('.setting-card,[data-admin-help-bound="true"]') || target;
    dialog._help = help;
    dialog.querySelector('#admin-help-title').textContent = help.title;
    dialog.querySelector('#admin-help-category').textContent = help.category || 'Admin Settings';
    dialog.querySelector('#admin-help-state').textContent = help.state || 'Available';
    dialog.hidden = false;
    document.documentElement.classList.add('admin-help-open');
    requestAnimationFrame(() => dialog.classList.add('open'));
    selectTab('summary');
    dialog.querySelector('.admin-help-close')?.focus();
  }

  function closeDialog() {
    if (!dialog || dialog.hidden) return;
    dialog.classList.remove('open');
    document.documentElement.classList.remove('admin-help-open');
    const restore = activeTarget;
    setTimeout(() => {
      dialog.hidden = true;
      restore?.focus?.({ preventScroll: true });
    }, 220);
  }

  function positionTooltip(anchor) {
    if (!tooltip || tooltip.hidden) return;
    const rect = anchor.getBoundingClientRect();
    const tip = tooltip.getBoundingClientRect();
    const gap = 10;
    let left = rect.left + rect.width / 2 - tip.width / 2;
    left = Math.max(10, Math.min(left, window.innerWidth - tip.width - 10));
    let top = rect.top - tip.height - gap;
    let side = 'top';
    if (top < 10) {
      top = rect.bottom + gap;
      side = 'bottom';
    }
    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.top = `${Math.round(top)}px`;
    tooltip.dataset.side = side;
  }

  function showTooltip(anchor, help) {
    if (!help || matchMedia('(hover: none)').matches) return;
    ensureUi();
    clearTimeout(closeTimer);
    tooltip.innerHTML = `<strong>${escapeHtml(help.title)}</strong><span>${escapeHtml(help.summary)}</span><small>Double-click for full guidance</small>`;
    tooltip.hidden = false;
    tooltip.classList.remove('show');
    requestAnimationFrame(() => {
      positionTooltip(anchor);
      tooltip.classList.add('show');
    });
  }

  function hideTooltip(delay = 60) {
    if (!tooltip) return;
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      tooltip.classList.remove('show');
      setTimeout(() => { if (!tooltip.classList.contains('show')) tooltip.hidden = true; }, 160);
    }, delay);
  }

  function addInfoButton(card) {
    if (card.querySelector('.setting-help-button')) return;
    const help = buildCapabilityHelp(card);
    const button = document.createElement('button');
    button.className = 'setting-help-button';
    button.type = 'button';
    button.setAttribute('aria-label', `Information about ${help.title}`);
    button.setAttribute('title', `Information about ${help.title}`);
    button.innerHTML = '<span aria-hidden="true">i</span>';
    const toggle = card.querySelector('.setting-toggle');
    card.insertBefore(button, toggle || null);
    button.addEventListener('mouseenter', () => showTooltip(button, buildCapabilityHelp(card)));
    button.addEventListener('mouseleave', () => hideTooltip());
    button.addEventListener('focus', () => showTooltip(button, buildCapabilityHelp(card)));
    button.addEventListener('blur', () => hideTooltip());
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (matchMedia('(hover: none)').matches) openDialog(card, buildCapabilityHelp(card));
      else showTooltip(button, buildCapabilityHelp(card));
    });
    button.addEventListener('dblclick', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openDialog(card, buildCapabilityHelp(card));
    });
  }

  function bindCapabilityCards(root = document) {
    root.querySelectorAll?.('.setting-card').forEach((card) => {
      if (card.dataset.adminHelpBound === 'true') return;
      card.dataset.adminHelpBound = 'true';
      card.setAttribute('title', 'Hover the info icon for a quick tip. Double-click this setting for full guidance.');
      addInfoButton(card);
      card.addEventListener('dblclick', (event) => {
        if (event.target.closest('input,label,.setting-help-button')) return;
        openDialog(card, buildCapabilityHelp(card));
      });
    });
  }

  function bindStaticControls(root = document) {
    Object.keys(STATIC_HELP).forEach((id) => {
      const el = root.querySelector?.(`#${CSS.escape(id)}`);
      if (!el || el.dataset.adminHelpBound === 'true') return;
      el.dataset.adminHelpBound = 'true';
      const help = buildStaticHelp(el);
      el.setAttribute('title', `${help.summary} Double-click for full guidance.`);
      el.addEventListener('mouseenter', () => showTooltip(el, buildStaticHelp(el)));
      el.addEventListener('mouseleave', () => hideTooltip());
      el.addEventListener('focus', () => showTooltip(el, buildStaticHelp(el)));
      el.addEventListener('blur', () => hideTooltip());
      el.addEventListener('dblclick', (event) => {
        event.preventDefault();
        openDialog(el, buildStaticHelp(el));
      });
    });

    root.querySelectorAll?.('.settings-nav button,.identity-card,.diagnostic-card,.settings-metrics article').forEach((el) => {
      if (el.dataset.adminHelpBound === 'true') return;
      el.dataset.adminHelpBound = 'true';
      const help = buildStaticHelp(el);
      if (!help) return;
      if (!el.hasAttribute('tabindex') && !el.matches('button,input,select,a[href]')) el.tabIndex = 0;
      el.setAttribute('title', `${help.summary} Double-click for full guidance.`);
      el.addEventListener('mouseenter', () => showTooltip(el, buildStaticHelp(el)));
      el.addEventListener('mouseleave', () => hideTooltip());
      el.addEventListener('focus', () => showTooltip(el, buildStaticHelp(el)));
      el.addEventListener('blur', () => hideTooltip());
      el.addEventListener('dblclick', (event) => openDialog(el, buildStaticHelp(el)));
    });
  }

  function decorate(root = document) {
    bindCapabilityCards(root);
    bindStaticControls(root);
  }

  function initObserver() {
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node.nodeType === 1) decorate(node);
        });
      }
      decorate(document);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function bindGlobalEvents() {
    window.addEventListener('resize', () => activeTarget && tooltip && !tooltip.hidden && positionTooltip(activeTarget));
    window.addEventListener('scroll', () => hideTooltip(0), true);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        hideTooltip(0);
        closeDialog();
      }
      if (event.key === 'F1') {
        const target = document.activeElement;
        const help = getHelp(target);
        if (help) {
          event.preventDefault();
          openDialog(target, help);
        }
      }
    });
  }

  function init() {
    ensureUi();
    decorate(document);
    initObserver();
    bindGlobalEvents();
    document.documentElement.classList.add('admin-help-ready');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
