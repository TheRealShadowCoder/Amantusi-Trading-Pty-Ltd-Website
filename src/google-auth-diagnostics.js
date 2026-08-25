import { GOOGLE_CANONICAL_REDIRECT_URI } from './google-auth-canonical.js';

const GOOGLE_AUTHORIZATION_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, no-cache, must-revalidate',
      pragma: 'no-cache',
      expires: '0',
      'x-content-type-options': 'nosniff'
    }
  });
}

export function googleOauthDiagnostics(env) {
  const clientId = String(env.GOOGLE_SIGNIN_CLIENT_ID || '').trim();
  if (!clientId) {
    return json({
      ok: false,
      configured: false,
      error: 'GOOGLE_SIGNIN_CLIENT_ID is not configured on the Worker.',
      redirectUri: GOOGLE_CANONICAL_REDIRECT_URI
    }, 503);
  }

  return json({
    ok: true,
    configured: true,
    clientId,
    redirectUri: GOOGLE_CANONICAL_REDIRECT_URI,
    authorizationEndpoint: GOOGLE_AUTHORIZATION_ENDPOINT,
    responseType: 'id_token token',
    responseMode: 'fragment',
    requiredGoogleClientType: 'Web application',
    requiredSetting: 'Authorized redirect URIs',
    exactMatchRequired: true
  });
}
