(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);

  async function api(path, { method = 'GET', body } = {}) {
    const response = await fetch(path, {
      method,
      cache: 'no-store',
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    }).catch(() => null);
    if (!response) return { ok: false, status: 0, error: 'Recovery service is not reachable.' };
    let payload = {};
    try { payload = await response.json(); } catch (_) {}
    return { ok: response.ok, status: response.status, ...payload };
  }

  function status(element, message = '', type = '') {
    if (!element) return;
    element.textContent = message;
    element.classList.remove('error', 'success');
    if (type) element.classList.add(type);
  }

  function showStep(first, second, secondVisible) {
    first?.classList.toggle('active', !secondVisible);
    second?.classList.toggle('active', secondVisible);
  }

  function samePasswords(first, second, output) {
    if (first.value !== second.value) {
      status(output, 'The two password entries do not match.', 'error');
      second.focus();
      return false;
    }
    return true;
  }

  function resetLoginFlow() {
    $('#backup-login-flow').value = '';
    $('#backup-login-code').value = '';
    $('#backup-login-password').value = '';
    status($('#backup-login-verify-status'));
    showStep($('#backup-login-start'), $('#backup-login-verify'), false);
  }

  function resetResetFlow() {
    $('#backup-reset-flow').value = '';
    $('#backup-reset-code').value = '';
    $('#backup-reset-password').value = '';
    $('#backup-reset-confirm-password').value = '';
    status($('#backup-reset-confirm-status'));
    showStep($('#backup-reset-start'), $('#backup-reset-confirm'), false);
  }

  function resetSetupFlow() {
    $('#backup-setup-flow').value = '';
    $('#backup-setup-code').value = '';
    $('#backup-setup-password').value = '';
    $('#backup-setup-confirm-password').value = '';
    status($('#backup-setup-confirm-status'));
    showStep($('#backup-setup-start'), $('#backup-setup-confirm'), false);
  }

  async function initialize() {
    const config = await api('/api/admin/recovery/config');
    if (!config.ok || !config.enabled) {
      const message = config.error || 'Backup recovery is not available on this Worker.';
      status($('#backup-login-status'), message, 'error');
      status($('#backup-reset-status'), message, 'error');
      return;
    }

    if (!config.emailDelivery) {
      const message = 'Recovery email delivery is not configured yet. Google sign-in remains available.';
      status($('#backup-login-status'), message, 'error');
      status($('#backup-reset-status'), message, 'error');
    }

    if (config.authenticated) {
      const panel = $('#backup-setup-panel');
      panel.hidden = false;
      const badge = $('#backup-setup-badge');
      const configured = Boolean(config.currentAdminConfigured);
      badge.textContent = configured ? 'BACKUP RECOVERY CONFIGURED' : 'SETUP REQUIRED';
      badge.classList.toggle('off', !configured);
      $('#backup-setup-copy').textContent = configured
        ? 'Your account already has backup recovery. You can replace the backup password here after email verification.'
        : 'Create your backup password now so you still have an emergency path if Google access is unavailable later.';
    }

    const requestedMode = new URLSearchParams(location.search).get('mode');
    if (requestedMode === 'setup' && config.authenticated) $('#backup-setup-panel')?.scrollIntoView({ block: 'center' });
    if (requestedMode === 'reset') $('#backup-reset-start')?.scrollIntoView({ block: 'center' });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initialize();

    $('#backup-login-start')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const output = $('#backup-login-status');
      status(output, 'Checking backup password…');
      const result = await api('/api/admin/recovery/login/start', {
        method: 'POST',
        body: {
          email: $('#backup-login-email').value.trim(),
          password: $('#backup-login-password').value
        }
      });
      if (!result.ok) {
        const suffix = result.status === 429 && result.retryAfter
          ? ` Try again in about ${Math.max(1, Math.ceil(result.retryAfter / 60))} minute(s).`
          : '';
        status(output, `${result.error || 'Backup sign-in could not start.'}${suffix}`, 'error');
        return;
      }
      $('#backup-login-flow').value = result.flowId || '';
      status(output, result.message || 'A one-time code was sent.', 'success');
      showStep($('#backup-login-start'), $('#backup-login-verify'), true);
      $('#backup-login-code').focus();
    });

    $('#backup-login-verify')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const output = $('#backup-login-verify-status');
      status(output, 'Verifying one-time code…');
      const result = await api('/api/admin/recovery/login/verify', {
        method: 'POST',
        body: {
          flowId: $('#backup-login-flow').value,
          code: $('#backup-login-code').value.trim()
        }
      });
      if (!result.ok) {
        status(output, result.error || 'Verification failed.', 'error');
        return;
      }
      status(output, 'Verified. Opening the admin dashboard…', 'success');
      location.assign('/admin-dashboard.html');
    });

    $('#backup-login-restart')?.addEventListener('click', resetLoginFlow);

    $('#backup-reset-start')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const output = $('#backup-reset-status');
      status(output, 'Requesting recovery code…');
      const result = await api('/api/admin/recovery/reset/request', {
        method: 'POST',
        body: { email: $('#backup-reset-email').value.trim() }
      });
      if (!result.ok) {
        status(output, result.error || 'Recovery code could not be requested.', 'error');
        return;
      }
      $('#backup-reset-flow').value = result.flowId || '';
      status(output, result.message || 'If recovery is configured, a code was sent.', 'success');
      showStep($('#backup-reset-start'), $('#backup-reset-confirm'), true);
      $('#backup-reset-code').focus();
    });

    $('#backup-reset-confirm')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const output = $('#backup-reset-confirm-status');
      if (!samePasswords($('#backup-reset-password'), $('#backup-reset-confirm-password'), output)) return;
      status(output, 'Verifying code and resetting backup password…');
      const result = await api('/api/admin/recovery/reset/confirm', {
        method: 'POST',
        body: {
          flowId: $('#backup-reset-flow').value,
          code: $('#backup-reset-code').value.trim(),
          password: $('#backup-reset-password').value
        }
      });
      if (!result.ok) {
        status(output, result.error || 'Backup password could not be reset.', 'error');
        return;
      }
      status(output, 'Backup password reset. Opening the dashboard…', 'success');
      location.assign('/admin-dashboard.html');
    });

    $('#backup-reset-restart')?.addEventListener('click', resetResetFlow);

    $('#backup-setup-start')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const output = $('#backup-setup-status');
      status(output, 'Sending setup verification code…');
      const result = await api('/api/admin/recovery/setup/request', { method: 'POST', body: {} });
      if (!result.ok) {
        status(output, result.error || 'Setup code could not be sent.', 'error');
        return;
      }
      $('#backup-setup-flow').value = result.flowId || '';
      status(output, result.message || 'Setup code sent.', 'success');
      showStep($('#backup-setup-start'), $('#backup-setup-confirm'), true);
      $('#backup-setup-code').focus();
    });

    $('#backup-setup-confirm')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const output = $('#backup-setup-confirm-status');
      if (!samePasswords($('#backup-setup-password'), $('#backup-setup-confirm-password'), output)) return;
      status(output, 'Saving protected backup recovery…');
      const result = await api('/api/admin/recovery/setup/confirm', {
        method: 'POST',
        body: {
          flowId: $('#backup-setup-flow').value,
          code: $('#backup-setup-code').value.trim(),
          password: $('#backup-setup-password').value
        }
      });
      if (!result.ok) {
        status(output, result.error || 'Backup recovery could not be configured.', 'error');
        return;
      }
      const badge = $('#backup-setup-badge');
      badge.textContent = 'BACKUP RECOVERY CONFIGURED';
      badge.classList.remove('off');
      status(output, result.message || 'Backup recovery is ready.', 'success');
      $('#backup-setup-password').value = '';
      $('#backup-setup-confirm-password').value = '';
    });

    $('#backup-setup-restart')?.addEventListener('click', resetSetupFlow);
  });
})();
