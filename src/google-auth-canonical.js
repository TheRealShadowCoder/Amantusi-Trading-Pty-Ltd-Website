import { googleAuthRoute as oidcGoogleAuthRoute } from './google-oidc-fragment.js';

export const GOOGLE_CANONICAL_ORIGIN = 'https://amantusi-trading-pty-ltd-website.dolomite-computer.workers.dev';
export const GOOGLE_CANONICAL_REDIRECT_URI = `${GOOGLE_CANONICAL_ORIGIN}/api/admin/google/oauth/callback`;

function canonicalize(request) {
  const source = new URL(request.url);
  const target = new URL(source.pathname + source.search, GOOGLE_CANONICAL_ORIGIN);
  return new Request(target.toString(), request);
}

export async function googleAuthRoute(request, env) {
  const path = new URL(request.url).pathname;
  if (path === '/api/admin/google/oauth/start' || path === '/api/admin/google/oauth/callback') {
    return oidcGoogleAuthRoute(canonicalize(request), env);
  }
  return oidcGoogleAuthRoute(request, env);
}
