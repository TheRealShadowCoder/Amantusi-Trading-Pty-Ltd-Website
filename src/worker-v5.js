import workerV4 from './worker-v4.js';
import { googleAuthRoute } from './google-auth-canonical.js';
import { googleOauthStartFixed } from './google-oidc-startfix.js';

export default {
  async fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;

    if (path === '/api/admin/google/oauth/start' && request.method === 'GET') {
      return googleOauthStartFixed(env);
    }

    if (path === '/api/admin/google/oauth/callback') {
      const response = await googleAuthRoute(request, env);
      if (response) return response;
    }

    return workerV4.fetch(request, env, ctx);
  }
};
