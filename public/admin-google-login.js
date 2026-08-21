(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  let flow = null;
  let initialized = false;

  function setStatus(message, state = '') {
    const node = $('#google-login-status');
    if (!node) return;
    node.textContent = message || '';
    node.dataset.state = state;
  }

  function revealEmergencyPassword(message = '') {
    const form = $('#login-form');
    const forgot = $('#forgot-toggle');
    if (form) {
      form.hidden = false;
      form.classList.remove('google-password-hidden');
      form.removeAttribute('aria-hidden');
    }
    if (forgot) forgot.hidden = false;
    if (message) setStatus(message, 'warning');
  }

  function hidePasswordOnlyControls() {
    const resetButton = $('#dashboard-reset-password');
    const mfaToggle = $('#require-passkey-mfa')?.closest('label');
    if (resetButton) resetButton.hidden = true;
    if (mfaToggle) mfaToggle.hidden = true;
  }

  async function waitForGoogle() {
    for (let i = 0; i < 80; i++) {
      if (window.google?.accounts?.id) return true;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return false;
  }

  async function requestConfig() {
    const response = await fetch('/api/admin/google/config', {
      cache: 'no-store',
      credentials: 'same-origin'
    });
    let payload = {};
    try { payload = await response.json(); } catch (_) {}
    if (!response.ok) {
      const error = new Error(payload.error || 'Google Sign-In configuration is unavailable.');
      error.code = payload.code || '';
      throw error;
    }
    return payload;
  }

  async function handleCredential(response) {
    if (!response?.credential || !flow?.flowId) {
      setStatus('Google did not return a usable sign-in credential.', 'error');
      return;
    }

    setStatus('Verifying your Google account…', 'loading');
    const result = await fetch('/api/admin/google/session', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flowId: flow.flowId, credential: response.credential })
    });

    let payload = {};
    try { payload = await result.json(); } catch (_) {}
    if (!result.ok) {
      setStatus(payload.error || 'Google sign-in could not be verified. Reload the page and try again.', 'error');
      return;
    }

    setStatus('Google account verified. Opening Amantusi Admin…', 'success');
    location.replace('/admin.html');
  }

  async function initializeGoogleLogin() {
    const shell = $('#google-auth-shell');
    const button = $('#google-signin-button');
    if (!shell || !button || initialized) return;

    const active = await fetch('/api/admin/me', { cache: 'no-store', credentials: 'same-origin' }).catch(() => null);
    if (active?.ok) {
      hidePasswordOnlyControls();
      return;
    }

    setStatus('Preparing secure Google Sign-In…', 'loading');

    try {
      flow = await requestConfig();
      const ready = await waitForGoogle();
      if (!ready) throw new Error('Google Sign-In could not load in this browser.');

      initialized = true;
      window.google.accounts.id.initialize({
        client_id: flow.clientId,
        callback: handleCredential,
        nonce: flow.nonce,
        ux_mode: 'popup',
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signin',
        use_fedcm_for_button: false
      });

      const width = Math.max(240, Math.min(360, Math.floor(button.getBoundingClientRect().width || 320)));
      window.google.accounts.id.renderButton(button, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'left',
        width
      });
      setStatus('Use your authorized Google account to continue.', 'ready');
    } catch (error) {
      revealEmergencyPassword(`${error.message || 'Google Sign-In is not available.'} Existing emergency login is shown temporarily.`);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    hidePasswordOnlyControls();
    initializeGoogleLogin();
  }, { once: true });
})();
