(() => {
  const path = new URL(window.location.href).pathname;
  if (path !== '/admin-dashboard.html') return;

  const loginView = document.getElementById('login-view');
  const adminView = document.getElementById('admin-view');
  if (!loginView || !adminView) return;

  // The dashboard is never an authentication surface. The Worker owns
  // authentication and redirects unauthenticated requests to /admin.html.
  // If a stale/direct static dashboard response ever reaches the browser,
  // hide all legacy login controls immediately and send the user to the
  // canonical Google-only sign-in page.
  loginView.hidden = true;
  loginView.setAttribute('aria-hidden', 'true');
  document.documentElement.classList.add('admin-dashboard-auth-guard');

  fetch('/api/admin/me', { credentials: 'same-origin', cache: 'no-store' })
    .then((response) => response.ok ? response.json() : null)
    .then((session) => {
      if (!session?.authenticated) window.location.replace('/admin.html?reason=dashboard-auth-guard');
    })
    .catch(() => window.location.replace('/admin.html?reason=dashboard-auth-guard'));
})();
