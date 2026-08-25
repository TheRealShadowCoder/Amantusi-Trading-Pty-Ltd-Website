import workerV4 from './worker-v4.js';
import { googleAuthRoute } from './google-auth-canonical.js';

export default {
  async fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;
    if (path === '/api/admin/google/oauth/start' || path === '/api/admin/google/oauth/callback') {
      const response = await googleAuthRoute(request, env);
      if (response) return response;
    }
    return workerV4.fetch(request, env, ctx);
  }
};
