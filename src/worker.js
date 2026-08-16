import {
  json,
  getAdminSession,
  login,
  logout,
  me,
  requestReset,
  confirmReset,
  status
} from "./security.js";

const MAX_CONTENT_BYTES = 750000;
const MAX_IMAGE_BYTES = 8000000;

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; }
  catch (_) { return false; }
}

async function serveHome(request, env) {
  const response = await env.ASSETS.fetch(request);
  if (!response.ok) return response;
  return new HTMLRewriter()
    .on("#main-nav", {
      element(element) {
        element.append('<a href="/catering-menu.html">Catering Menu</a><a href="/company-profile.html">Company Profile</a>', { html: true });
      }
    })
    .on(".capability-grid .cap-card:nth-child(3)", {
      element(element) {
        element.setAttribute("role", "link");
        element.setAttribute("tabindex", "0");
        element.setAttribute("onclick", "location.href='/catering-menu.html'");
        element.setAttribute("onkeydown", "if(event.key==='Enter'||event.key===' '){location.href='/catering-menu.html'}");
        element.setAttribute("style", "cursor:pointer");
      }
    })
    .transform(response);
}

async function publicContent(request, env) {
  if (env.CMS_KV) {
    const saved = await env.CMS_KV.get("catering-content");
    if (saved) {
      return new Response(saved, {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "public, max-age=60, stale-while-revalidate=300"
        }
      });
    }
  }
  const fallback = new URL("/data/catering.json", request.url);
  return env.ASSETS.fetch(new Request(fallback, request));
}

async function saveContent(request, env) {
  if (!sameOrigin(request)) return json({ error: "Origin rejected." }, 403);
  const admin = await getAdminSession(request, env);
  if (!admin) return json({ error: "Administrator login required." }, 401);
  if (!env.CMS_KV) return json({ error: "CMS_KV is not connected to this Worker." }, 503);

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_CONTENT_BYTES) {
    return json({ error: "Content payload is too large." }, 413);
  }

  let data;
  try { data = JSON.parse(text); }
  catch (_) { return json({ error: "Invalid JSON content." }, 400); }

  if (!Array.isArray(data?.categories) || !Array.isArray(data?.items) || !data?.profile) {
    return json({ error: "Content structure is invalid." }, 400);
  }

  data.meta = data.meta || {};
  data.meta.updatedAt = new Date().toISOString();
  data.meta.updatedBy = admin.email;
  await env.CMS_KV.put("catering-content", JSON.stringify(data));
  return json({ ok: true, updatedAt: data.meta.updatedAt, updatedBy: admin.email });
}

function safeExtension(type) {
  return ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" })[type] || null;
}

async function uploadMedia(request, env) {
  if (!sameOrigin(request)) return json({ error: "Origin rejected." }, 403);
  const admin = await getAdminSession(request, env);
  if (!admin) return json({ error: "Administrator login required." }, 401);
  if (!env.CMS_MEDIA) return json({ error: "CMS_MEDIA R2 storage is not connected to this Worker." }, 503);

  let form;
  try { form = await request.formData(); }
  catch (_) { return json({ error: "Invalid upload request." }, 400); }

  const file = form.get("file");
  if (!file || typeof file === "string") return json({ error: "Choose an image to upload." }, 400);
  if (file.size > MAX_IMAGE_BYTES) return json({ error: "Image is larger than 8 MB." }, 413);

  const extension = safeExtension(file.type);
  if (!extension) return json({ error: "Only JPG, PNG and WEBP images are allowed." }, 415);

  const key = `catering/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
  await env.CMS_MEDIA.put(key, file.stream(), {
    httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
    customMetadata: { originalName: file.name || "upload", uploadedBy: admin.email }
  });

  return json({ ok: true, key, url: `/media/${key}` });
}

async function serveMedia(request, env) {
  if (!env.CMS_MEDIA) return new Response("Media storage not configured.", { status: 404 });
  const key = decodeURIComponent(new URL(request.url).pathname.replace(/^\/media\//, ""));
  if (!key || key.includes("..")) return new Response("Not found.", { status: 404 });

  const object = await env.CMS_MEDIA.get(key);
  if (!object) return new Response("Not found.", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", headers.get("cache-control") || "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if ((url.pathname === "/" || url.pathname === "/index.html") && request.method === "GET") return serveHome(request, env);
    if (url.pathname === "/api/catering-content" && request.method === "GET") return publicContent(request, env);

    if (url.pathname === "/api/admin/status" && request.method === "GET") return status(env);
    if (url.pathname === "/api/admin/me" && request.method === "GET") return me(request, env);
    if (url.pathname === "/api/admin/session" && request.method === "POST") return login(request, env);
    if (url.pathname === "/api/admin/logout" && request.method === "POST") return logout();
    if (url.pathname === "/api/admin/password-reset/request" && request.method === "POST") return requestReset(request, env);
    if (url.pathname === "/api/admin/password-reset/confirm" && request.method === "POST") return confirmReset(request, env);
    if (url.pathname === "/api/admin/content" && request.method === "POST") return saveContent(request, env);
    if (url.pathname === "/api/admin/media" && request.method === "POST") return uploadMedia(request, env);
    if (url.pathname.startsWith("/media/") && request.method === "GET") return serveMedia(request, env);

    return env.ASSETS.fetch(request);
  }
};
