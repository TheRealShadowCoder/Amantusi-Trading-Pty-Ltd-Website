(() => {
  const config = window.AMANTUSI_ANALYTICS || {};
  const endpoint = '/api/analytics/event';

  function firstParty(eventName, detail = {}) {
    const payload = JSON.stringify({
      eventName,
      path: location.pathname,
      referrer: document.referrer || '',
      ...detail
    });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, new Blob([payload], { type: 'application/json' }));
      } else {
        fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
      }
    } catch (_) {}
  }

  function reportClientError(message, source = '', line = 0, column = 0) {
    const body = JSON.stringify({ message: String(message || '').slice(0, 1800), source, line, column, path: location.pathname });
    fetch('/api/client-error', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  }

  function loadGa() {
    const gaId = String(config.gaId || '');
    if (!gaId || window.gtag) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(){ window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', gaId, { anonymize_ip: true });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    document.head.appendChild(script);
  }

  function consentBanner() {
    if (!config.gaId) return;
    const stored = localStorage.getItem('amantusi-analytics-consent');
    if (stored === 'accepted') return loadGa();
    if (stored === 'declined') return;
    const banner = document.createElement('div');
    banner.className = 'analytics-consent';
    banner.innerHTML = `
      <div><strong>Analytics preferences</strong><span>We use privacy-respecting first-party analytics. Optional Google Analytics helps us understand website performance and enquiry journeys.</span></div>
      <div class="analytics-consent-actions"><button type="button" data-consent="declined">Essential only</button><button type="button" class="accept" data-consent="accepted">Allow analytics</button></div>`;
    document.body.appendChild(banner);
    banner.addEventListener('click', (event) => {
      const button = event.target.closest('[data-consent]');
      if (!button) return;
      const choice = button.dataset.consent;
      localStorage.setItem('amantusi-analytics-consent', choice);
      banner.remove();
      if (choice === 'accepted') loadGa();
    });
  }

  window.amantusiTrack = (eventName, detail = {}) => {
    firstParty(eventName, detail);
    if (window.gtag && config.gaId) window.gtag('event', eventName, detail);
  };

  addEventListener('error', (event) => reportClientError(event.message, event.filename, event.lineno, event.colno));
  addEventListener('unhandledrejection', (event) => reportClientError(event.reason?.message || String(event.reason || 'Unhandled promise rejection')));

  document.addEventListener('click', (event) => {
    const cta = event.target.closest('.button,.menu-btn,.nav-cta,.text-link');
    if (cta) firstParty('cta_click', { label: String(cta.textContent || '').trim().slice(0, 100) });
  }, { passive: true });

  firstParty('page_view');
  consentBanner();
})();
