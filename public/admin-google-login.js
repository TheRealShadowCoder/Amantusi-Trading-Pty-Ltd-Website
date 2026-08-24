(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const GOOGLE_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
  let flow = null;
  let initialized = false;
  let loadingGoogle = null;

  function setStatus(message, state = '') {
    const node = $('#google-login-status');
    if (!node) return;
    node.textContent = message || '';
    node.dataset.state = state;
  }

  function hidePasswordOnlyControls() {
    const form = $('#login-form');
    const forgot = $('#forgot-toggle');
    const reset = $('#reset-request-form');
    const resetButton = $('#dashboard-reset-password');
    const mfaToggle = $('#require-passkey-mfa')?.closest('label');
    if (form) {
      form.hidden = true;
      form.setAttribute('aria-hidden', 'true');
    }
    if (forgot) forgot.hidden = true;
    if (reset) reset.hidden = true;
    if (resetButton) resetButton.hidden = true;
    if (mfaToggle) mfaToggle.hidden = true;
  }

  function googleReady() {
    return Boolean(window.google?.accounts?.id);
  }

  function waitForScript(script, timeoutMs = 12000) {
    return new Promise((resolve, reject) => {
      if (googleReady()) {
        resolve(true);
        return;
      }

      let settled = false;
      const finish = (fn, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        script.removeEventListener('load', onLoad);
        script.removeEventListener('error', onError);
        fn(value);
      };
      const onLoad = () => {
        if (googleReady()) finish(resolve, true);
        else finish(reject, new Error('Google Identity Services loaded without its sign-in API.'));
      };
      const onError = () => finish(reject, new Error('Google Identity Services could not be downloaded.'));
      const timer = setTimeout(() => finish(reject, new Error('Google Identity Services timed out while loading.')), timeoutMs);

      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', onError, { once: true });
    });
  }

  async function loadGoogleIdentity() {
    if (googleReady()) return true;
    if (loadingGoogle) return loadingGoogle;

    loadingGoogle = (async () => {
      const existing = document.querySelector(`script[src^="${GOOGLE_SCRIPT_URL}"]`);
      if (existing) {
        try {
          await waitForScript(existing, 6000);
          if (googleReady()) return true;
        } catch (_) {
          existing.remove();
        }
      }

      let lastError = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        const stale = document.getElementById('amantusi-google-identity-services');
        if (stale) stale.remove();

        const script = document.createElement('script');
        script.id = 'amantusi-google-identity-services';
        script.src = `${GOOGLE_SCRIPT_URL}?hl=en`;
        script.async = true;
        script.defer = true;
        script.referrerPolicy = 'strict-origin-when-cross-origin';
        document.head.appendChild(script);

        try {
          await waitForScript(script, 12000);
          if (googleReady()) return true;
        } catch (error) {
          lastError = error;
          script.remove();
          if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 700));
        }
      }

      throw lastError || new Error('Google Identity Services could not load in this browser.');
    })();

    try {
      return await loadingGoogle;
    } finally {
      loadingGoogle = null;
    }
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
    if (!payload.clientId || !payload.flowId || !payload.nonce) {
      throw new Error('Google Sign-In configuration is incomplete.');
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
    location.replace('/admin-dashboard.html');
  }

  function renderRetry(error) {
    const shell = $('#google-auth-shell');
    if (!shell) return;
    let retry = $('#google-login-retry');
    if (!retry) {
      retry = document.createElement('button');
      retry.id = 'google-login-retry';
      retry.type = 'button';
      retry.className = 'admin-button secondary security-primary';
      retry.textContent = 'Retry Google Sign-In';
      retry.addEventListener('click', () => {
        retry.disabled = true;
        initialized = false;
        initializeGoogleLogin().finally(() => { retry.disabled = false; });
      });
      shell.appendChild(retry);
    }
    retry.hidden = false;
    setStatus(`${error?.message || 'Google Sign-In is not available.'} Check that accounts.google.com is not blocked, then retry.`, 'error');
  }

  async function initializeGoogleLogin() {
    const shell = $('#google-auth-shell');
    const button = $('#google-signin-button');
    if (!shell || !button || initialized) return;

    const active = await fetch('/api/admin/me', {
      cache: 'no-store',
      credentials: 'same-origin'
    }).catch(() => null);

    if (active?.ok) {
      location.replace('/admin-dashboard.html');
      return;
    }

    hidePasswordOnlyControls();
    setStatus('Preparing secure Google Sign-In…', 'loading');

    try {
      flow = await requestConfig();
      await loadGoogleIdentity();

      initialized = true;
      window.google.accounts.id.initialize({
        client_id: flow.clientId,
        callback: handleCredential,
        nonce: flow.nonce,
        ux_mode: 'popup',
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signin',
        use_fedcm_for_button: true,
        button_auto_select: false,
        itp_support: true
      });

      button.replaceChildren();
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

      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      if (!button.childElementCount) {
        initialized = false;
        throw new Error('Google Sign-In loaded but the button could not be rendered.');
      }

      const retry = $('#google-login-retry');
      if (retry) retry.hidden = true;
      setStatus('Use your authorized Google account to continue.', 'ready');
    } catch (error) {
      initialized = false;
      renderRetry(error);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    hidePasswordOnlyControls();
    initializeGoogleLogin();
  }, { once: true });
})();
