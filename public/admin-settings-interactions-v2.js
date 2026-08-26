(() => {
  'use strict';

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  const threeDSelector = '.setting-card,.settings-metrics article,.identity-card,.diagnostic-card,.permanent-access-card,.audit-event';
  const controlSelector = '.settings-primary,.capability-actions button,.settings-panel-head button,.settings-load-more button,.danger-actions button,.settings-side-actions button';

  function motionReduced() {
    return reducedMotionMedia.matches || Boolean(document.getElementById('setting-reduced-motion')?.checked);
  }

  function reset3d(element) {
    element.style.setProperty('--admin-rotate-x', '0deg');
    element.style.setProperty('--admin-rotate-y', '0deg');
    element.style.setProperty('--admin-depth', '0px');
    element.style.setProperty('--admin-shine-x', '50%');
    element.style.setProperty('--admin-shine-y', '50%');
    element.classList.remove('admin-3d-active', 'admin-3d-pressed');
  }

  function bind3dObject(element) {
    if (!element || element.dataset.admin3dBound === 'true') return;
    element.dataset.admin3dBound = 'true';
    element.classList.add('admin-3d-object');

    element.addEventListener('pointermove', (event) => {
      if (!finePointer.matches || motionReduced()) return;
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      const rotateY = (x - 0.5) * 8;
      const rotateX = (0.5 - y) * 7;
      element.style.setProperty('--admin-rotate-x', `${rotateX.toFixed(2)}deg`);
      element.style.setProperty('--admin-rotate-y', `${rotateY.toFixed(2)}deg`);
      element.style.setProperty('--admin-depth', '8px');
      element.style.setProperty('--admin-shine-x', `${(x * 100).toFixed(1)}%`);
      element.style.setProperty('--admin-shine-y', `${(y * 100).toFixed(1)}%`);
      element.classList.add('admin-3d-active');
    });

    element.addEventListener('pointerleave', () => reset3d(element));
    element.addEventListener('pointercancel', () => reset3d(element));
    element.addEventListener('pointerdown', () => {
      if (!motionReduced()) element.classList.add('admin-3d-pressed');
    });
    element.addEventListener('pointerup', () => element.classList.remove('admin-3d-pressed'));
  }

  function bind3dControl(element) {
    if (!element || element.dataset.admin3dControl === 'true') return;
    element.dataset.admin3dControl = 'true';
    element.classList.add('admin-3d-control');
  }

  function decorate(root = document) {
    if (root.matches?.(threeDSelector)) bind3dObject(root);
    root.querySelectorAll?.(threeDSelector).forEach(bind3dObject);
    if (root.matches?.(controlSelector)) bind3dControl(root);
    root.querySelectorAll?.(controlSelector).forEach(bind3dControl);
  }

  function dispatchDetailedHelp(target) {
    const capabilityCard = target.closest?.('.setting-card');
    if (capabilityCard) {
      const infoButton = capabilityCard.querySelector('.setting-help-button');
      if (!infoButton) return false;
      infoButton.dispatchEvent(new MouseEvent('dblclick', {
        bubbles: false,
        cancelable: true,
        view: window
      }));
      return true;
    }

    const coreSetting = target.closest?.('.core-settings-grid label');
    if (coreSetting) {
      const control = coreSetting.querySelector('input,select');
      if (!control) return false;
      control.dispatchEvent(new MouseEvent('dblclick', {
        bubbles: false,
        cancelable: true,
        view: window
      }));
      return true;
    }

    return false;
  }

  function bindUniversalDoubleClickHelp() {
    document.addEventListener('dblclick', (event) => {
      if (!event.isTrusted) return;
      if (!event.target.closest?.('.setting-card,.core-settings-grid label')) return;
      event.preventDefault();
      event.stopImmediatePropagation();

      if (dispatchDetailedHelp(event.target)) return;
      requestAnimationFrame(() => dispatchDetailedHelp(event.target));
    }, true);
  }

  function initObserver() {
    const observer = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node.nodeType === 1) decorate(node);
      }));
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function syncReducedMotionState() {
    document.documentElement.classList.toggle('admin-3d-reduced', motionReduced());
    if (motionReduced()) document.querySelectorAll('.admin-3d-object').forEach(reset3d);
  }

  function init() {
    decorate(document);
    bindUniversalDoubleClickHelp();
    initObserver();
    syncReducedMotionState();
    reducedMotionMedia.addEventListener?.('change', syncReducedMotionState);
    document.getElementById('setting-reduced-motion')?.addEventListener('change', syncReducedMotionState);
    document.documentElement.classList.add('admin-3d-ready');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
