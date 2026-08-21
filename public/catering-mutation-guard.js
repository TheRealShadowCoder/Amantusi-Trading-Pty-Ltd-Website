(() => {
  'use strict';

  const NativeMutationObserver = window.MutationObserver;
  if (!NativeMutationObserver || window.__amantusiCateringMutationGuardInstalled) return;
  window.__amantusiCateringMutationGuardInstalled = true;

  class CateringSafeMutationObserver {
    constructor(callback) {
      this.callback = callback;
      this.target = null;
      this.native = new NativeMutationObserver((records) => {
        if (this.target?.matches?.('[data-menu-grid]')) {
          const hasFreshMenuContent = records.some((record) => {
            if (record.type !== 'childList' || !record.addedNodes?.length) return false;
            return [...record.addedNodes].some((node) => {
              if (node.nodeType !== 1) return false;
              if (node.matches?.('.menu-card:not([data-ux-enhanced])')) return true;
              return Boolean(node.querySelector?.('.menu-card:not([data-ux-enhanced])'));
            });
          });

          // UX500 reorders existing cards with grid.append(card). Those moves are
          // childList mutations too, but must never re-enter enhanceCards/applyFilters.
          if (!hasFreshMenuContent) return;
        }

        callback(records, this);
      });
    }

    observe(target, options) {
      this.target = target;
      this.native.observe(target, options);
    }

    disconnect() {
      this.native.disconnect();
    }

    takeRecords() {
      return this.native.takeRecords();
    }
  }

  window.MutationObserver = CateringSafeMutationObserver;
  window.__amantusiNativeMutationObserver = NativeMutationObserver;
})();
