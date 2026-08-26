(() => {
  'use strict';

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const objectSelector = [
    '.login-card', '.admin-panel', '.metric-grid > *', '.health-grid > *',
    '.lead-list > *', '.database-list > *', '.ops-events > *', '.passkey-row',
    '.admin-field', '.panel-title-row', '.security-notice'
  ].join(',');
  const helpSelector = [
    '.admin-field', '.admin-panel', '.admin-nav button', '.admin-nav a', '.admin-button',
    '.metric-grid > *', '.health-grid > *', '.lead-list > *', '.database-list > *',
    '.passkey-row', '.login-card'
  ].join(',');

  let tooltip;
  let dialog;
  let lastTarget;

  const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();

  function labelFor(node) {
    if (!node) return 'Admin control';
    if (node.matches('.admin-field')) {
      return clean(node.querySelector('label')?.textContent) || clean(node.querySelector('input,select,textarea')?.getAttribute('placeholder')) || 'Admin field';
    }
    if (node.matches('.admin-panel')) return clean(node.querySelector('h2,h3,strong')?.textContent) || 'Admin panel';
    if (node.matches('.login-card')) return clean(node.querySelector('h1')?.textContent) || 'Administrator sign-in';
    return clean(node.getAttribute('aria-label')) || clean(node.getAttribute('title')) || clean(node.textContent).slice(0, 100) || 'Admin control';
  }

  function panelFor(node) {
    return clean(node.closest?.('.admin-section,.admin-panel')?.querySelector('h2,h3')?.textContent) || 'Amantusi Admin';
  }

  function helpFor(node) {
    const title = labelFor(node);
    if (node.matches('.admin-field')) {
      const control = node.querySelector('input,select,textarea');
      const kind = control?.tagName === 'SELECT' ? 'selection' : control?.type === 'file' ? 'file input' : control?.tagName === 'TEXTAREA' ? 'text area' : 'field';
      return {
        title,
        summary: `${title} is a ${kind} in ${panelFor(node)}.`,
        usage: 'Enter or choose the intended value, review it for accuracy, then use the nearest Save, Publish or Update action. Double-clicking opens this guide without changing the value.'
      };
    }
    if (node.matches('button,.admin-button,.admin-nav button')) {
      return { title, summary: `${title} runs an administrator action or opens part of the protected workspace.`, usage: 'Use it only when you intend to perform the named action. Where the action writes data, review the surrounding form first.' };
    }
    if (node.matches('a,.admin-nav a')) {
      return { title, summary: `${title} navigates to another protected administration or preview destination.`, usage: 'Activate it to open the destination. Unsaved form changes may remain on the current page, so save first when necessary.' };
    }
    return { title, summary: `${title} is part of ${panelFor(node)}.`, usage: 'Use the controls inside this area to review or manage the related administration data. Double-click individual controls for contextual guidance.' };
  }

  function ensureUi() {
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'admin-global-tooltip';
      tooltip.hidden = true;
      tooltip.setAttribute('role', 'tooltip');
      document.body.appendChild(tooltip);
    }
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.className = 'admin-global-dialog-shell';
      dialog.hidden = true;
      dialog.innerHTML = '<div class="admin-global-backdrop" data-admin-global-close></div><section class="admin-global-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-global-title"><div class="admin-global-dialog-head"><div><span>Interactive admin guide</span><h2 id="admin-global-title"></h2></div><button type="button" data-admin-global-close aria-label="Close information">×</button></div><p id="admin-global-summary"></p><div class="admin-global-usage"><strong>How to use</strong><p id="admin-global-usage"></p></div><div class="admin-global-actions"><button type="button" data-admin-global-locate>Locate control</button><button type="button" data-admin-global-close>Got it</button></div></section>';
      document.body.appendChild(dialog);
      dialog.querySelectorAll('[data-admin-global-close]').forEach((node) => node.addEventListener('click', closeDialog));
      dialog.querySelector('[data-admin-global-locate]')?.addEventListener('click', () => {
        const target = lastTarget;
        closeDialog();
        target?.scrollIntoView?.({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
        target?.classList?.add('admin-global-located');
        setTimeout(() => target?.classList?.remove('admin-global-located'), 1200);
      });
    }
  }

  function openDialog(target) {
    const node = target.closest?.(helpSelector) || target;
    const help = helpFor(node);
    ensureUi();
    lastTarget = node;
    tooltip.hidden = true;
    dialog.querySelector('#admin-global-title').textContent = help.title;
    dialog.querySelector('#admin-global-summary').textContent = help.summary;
    dialog.querySelector('#admin-global-usage').textContent = help.usage;
    dialog.hidden = false;
    requestAnimationFrame(() => dialog.classList.add('open'));
    dialog.querySelector('[data-admin-global-close]')?.focus();
  }

  function closeDialog() {
    if (!dialog || dialog.hidden) return;
    dialog.classList.remove('open');
    setTimeout(() => { dialog.hidden = true; }, reducedMotion.matches ? 0 : 180);
  }

  function showTooltip(node) {
    if (!finePointer.matches) return;
    const help = helpFor(node);
    ensureUi();
    tooltip.textContent = `${help.title} — double-click for details`;
    tooltip.hidden = false;
    const rect = node.getBoundingClientRect();
    const tip = tooltip.getBoundingClientRect();
    const left = Math.max(8, Math.min(window.innerWidth - tip.width - 8, rect.left + rect.width / 2 - tip.width / 2));
    const top = rect.top > tip.height + 18 ? rect.top - tip.height - 10 : rect.bottom + 10;
    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.top = `${Math.round(top)}px`;
    requestAnimationFrame(() => tooltip.classList.add('show'));
  }

  function hideTooltip() {
    if (!tooltip) return;
    tooltip.classList.remove('show');
    setTimeout(() => { if (!tooltip.classList.contains('show')) tooltip.hidden = true; }, 120);
  }

  function reset3d(node) {
    node.style.setProperty('--global-rx', '0deg');
    node.style.setProperty('--global-ry', '0deg');
    node.style.setProperty('--global-z', '0px');
    node.style.setProperty('--global-shine-x', '50%');
    node.style.setProperty('--global-shine-y', '50%');
    node.classList.remove('admin-global-3d-active', 'admin-global-3d-pressed');
  }

  function bindObject(node) {
    if (!node || node.dataset.adminGlobal3d === '1') return;
    node.dataset.adminGlobal3d = '1';
    node.classList.add('admin-global-3d');
    node.addEventListener('pointermove', (event) => {
      if (!finePointer.matches || reducedMotion.matches) return;
      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      node.style.setProperty('--global-rx', `${((0.5 - y) * 5).toFixed(2)}deg`);
      node.style.setProperty('--global-ry', `${((x - 0.5) * 6).toFixed(2)}deg`);
      node.style.setProperty('--global-z', '6px');
      node.style.setProperty('--global-shine-x', `${(x * 100).toFixed(1)}%`);
      node.style.setProperty('--global-shine-y', `${(y * 100).toFixed(1)}%`);
      node.classList.add('admin-global-3d-active');
    });
    node.addEventListener('pointerleave', () => reset3d(node));
    node.addEventListener('pointercancel', () => reset3d(node));
    node.addEventListener('pointerdown', () => { if (!reducedMotion.matches) node.classList.add('admin-global-3d-pressed'); });
    node.addEventListener('pointerup', () => node.classList.remove('admin-global-3d-pressed'));
    node.addEventListener('mouseenter', () => showTooltip(node));
    node.addEventListener('mouseleave', hideTooltip);
  }

  function decorate(root = document) {
    if (root.matches?.(objectSelector)) bindObject(root);
    root.querySelectorAll?.(objectSelector).forEach(bindObject);
  }

  function init() {
    ensureUi();
    decorate(document);
    document.addEventListener('dblclick', (event) => {
      const node = event.target.closest?.(helpSelector);
      if (!node) return;
      event.preventDefault();
      openDialog(node);
    }, true);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeDialog();
      if (event.key === 'F1') {
        const node = document.activeElement?.closest?.(helpSelector);
        if (node) { event.preventDefault(); openDialog(node); }
      }
    });
    const observer = new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
      if (node.nodeType === 1) decorate(node);
    })));
    observer.observe(document.body, { childList: true, subtree: true });
    reducedMotion.addEventListener?.('change', () => { if (reducedMotion.matches) document.querySelectorAll('.admin-global-3d').forEach(reset3d); });
    document.documentElement.classList.add('admin-global-interactions-ready');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
