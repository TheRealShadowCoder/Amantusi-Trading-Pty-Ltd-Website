(() => {
  const status = document.getElementById('google-callback-status');
  const setStatus = (message, error = false) => {
    if (!status) return;
    status.textContent = message;
    status.style.color = error ? '#991b1b' : '#33444f';
  };

  async function complete() {
    const raw = location.hash.startsWith('#') ? location.hash.slice(1) : '';
    const params = new URLSearchParams(raw);
    const payload = {
      state: params.get('state') || '',
      credential: params.get('id_token') || '',
      error: params.get('error') || '',
      error_description: params.get('error_description') || ''
    };

    history.replaceState(null, '', location.pathname);

    if (payload.error) {
      setStatus(payload.error_description || payload.error, true);
      return;
    }
    if (!payload.state || !payload.credential) {
      setStatus('Google returned an incomplete sign-in response. Return to Admin and try again.', true);
      return;
    }

    setStatus('Verifying your Google account…');
    try {
      const response = await fetch(location.pathname, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || 'Google sign-in could not be verified.');
      setStatus('Sign-in successful. Opening Amantusi Admin…');
      location.replace('/admin-dashboard.html');
    } catch (error) {
      setStatus(error?.message || 'Google sign-in could not be verified.', true);
    }
  }

  complete();
})();
