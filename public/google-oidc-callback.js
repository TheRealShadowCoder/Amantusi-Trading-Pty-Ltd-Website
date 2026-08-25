(() => {
  const status = document.getElementById('google-callback-status');
  const setStatus = (message, error = false) => {
    if (!status) return;
    status.textContent = message;
    status.style.color = error ? '#991b1b' : '#33444f';
  };

  function responseParams() {
    const hash = location.hash.startsWith('#') ? location.hash.slice(1) : '';
    const query = location.search.startsWith('?') ? location.search.slice(1) : '';
    const hashParams = new URLSearchParams(hash);
    const queryParams = new URLSearchParams(query);

    // Google OIDC implicit responses normally use the fragment. Query parsing is
    // retained as a defensive compatibility fallback for redirected errors.
    return hashParams.has('id_token') || hashParams.has('state') || hashParams.has('error')
      ? hashParams
      : queryParams;
  }

  async function complete() {
    const params = responseParams();
    const payload = {
      state: params.get('state') || '',
      credential: params.get('id_token') || '',
      error: params.get('error') || '',
      error_description: params.get('error_description') || ''
    };

    // Remove OAuth/OIDC response material from browser history immediately.
    history.replaceState(null, '', location.pathname);

    if (payload.error) {
      setStatus(payload.error_description || payload.error, true);
      return;
    }

    if (!payload.state || !payload.credential) {
      setStatus('Google did not return the signed identity token required to complete sign-in. Return to Admin and try again.', true);
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
