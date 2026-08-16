const SESSION_COOKIE = "amantusi_admin";
const SESSION_HOURS = 8;
const MAX_CONTENT_BYTES = 750000;
const MAX_IMAGE_BYTES = 8000000;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store",...headers}});
}
function parseCookies(request){const raw=request.headers.get("cookie")||"";return Object.fromEntries(raw.split(";").map(part=>part.trim()).filter(Boolean).map(part=>{const i=part.indexOf("=");return i===-1?[part,""]:[part.slice(0,i),part.slice(i+1)];}));}
function base64url(bytes){let binary="";for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");}
function base64urlText(text){return base64url(new TextEncoder().encode(text));}
function decodeBase64urlText(value){const padded=value.replace(/-/g,"+").replace(/_/g,"/")+"===".slice((value.length+3)%4);const binary=atob(padded);const bytes=Uint8Array.from(binary,ch=>ch.charCodeAt(0));return new TextDecoder().decode(bytes);}
async function hmac(secret,value){const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const signature=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(value));return base64url(new Uint8Array(signature));}
async function createSession(secret){const payload=base64urlText(JSON.stringify({exp:Date.now()+SESSION_HOURS*60*60*1000}));const signature=await hmac(secret,payload);return `${payload}.${signature}`;}
async function verifySession(secret,token){if(!secret||!token||!token.includes("."))return false;const [payload,signature]=token.split(".");if(!payload||!signature)return false;const expected=await hmac(secret,payload);if(expected!==signature)return false;try{return Number(JSON.parse(decodeBase64urlText(payload)).exp)>Date.now();}catch(_){return false;}}
function sameOrigin(request){const origin=request.headers.get("origin");if(!origin)return true;try{return new URL(origin).host===new URL(request.url).host;}catch(_){return false;}}
async function isAdmin(request,env){if(!env.SESSION_SECRET)return false;return verifySession(env.SESSION_SECRET,parseCookies(request)[SESSION_COOKIE]);}

async function serveHome(request,env){
  const response=await env.ASSETS.fetch(request);if(!response.ok)return response;
  return new HTMLRewriter()
    .on("#main-nav",{element(element){element.append('<a href="/catering-menu.html">Catering Menu</a><a href="/company-profile.html">Company Profile</a>',{html:true});}})
    .on(".capability-grid .cap-card:nth-child(3)",{element(element){element.setAttribute("role","link");element.setAttribute("tabindex","0");element.setAttribute("onclick","location.href=\'/catering-menu.html\'");element.setAttribute("onkeydown","if(event.key===\'Enter\'||event.key===\' \'){location.href=\'/catering-menu.html\'}");element.setAttribute("style","cursor:pointer");}})
    .transform(response);
}

async function publicContent(request,env){
  if(env.CMS_KV){const saved=await env.CMS_KV.get("catering-content");if(saved)return new Response(saved,{headers:{"content-type":"application/json; charset=utf-8","cache-control":"public, max-age=60, stale-while-revalidate=300"}});}
  const fallback=new URL("/data/catering.json",request.url);return env.ASSETS.fetch(new Request(fallback,request));
}

async function login(request,env){
  if(!env.ADMIN_PASSWORD||!env.SESSION_SECRET)return json({error:"The production admin login is not configured on this Worker yet.",setup:"Add ADMIN_PASSWORD and SESSION_SECRET as Cloudflare Worker secrets."},503);
  if(!sameOrigin(request))return json({error:"Origin rejected."},403);
  let body;try{body=await request.json();}catch(_){return json({error:"Invalid request."},400);}
  if(!body?.password||body.password!==env.ADMIN_PASSWORD)return json({error:"Incorrect administrator password."},401);
  const token=await createSession(env.SESSION_SECRET);return json({ok:true,cmsStorage:Boolean(env.CMS_KV),mediaStorage:Boolean(env.CMS_MEDIA)},200,{"set-cookie":`${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS*60*60}`});
}
function logout(){return json({ok:true},200,{"set-cookie":`${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`});}

async function saveContent(request,env){
  if(!sameOrigin(request))return json({error:"Origin rejected."},403);if(!await isAdmin(request,env))return json({error:"Administrator login required."},401);if(!env.CMS_KV)return json({error:"CMS_KV is not connected to this Worker."},503);
  const text=await request.text();if(new TextEncoder().encode(text).byteLength>MAX_CONTENT_BYTES)return json({error:"Content payload is too large."},413);
  let data;try{data=JSON.parse(text);}catch(_){return json({error:"Invalid JSON content."},400);}if(!Array.isArray(data?.categories)||!Array.isArray(data?.items)||!data?.profile)return json({error:"Content structure is invalid."},400);
  data.meta=data.meta||{};data.meta.updatedAt=new Date().toISOString();await env.CMS_KV.put("catering-content",JSON.stringify(data));return json({ok:true,updatedAt:data.meta.updatedAt});
}
function safeExtension(type){return ({"image/jpeg":"jpg","image/png":"png","image/webp":"webp"})[type]||null;}
async function uploadMedia(request,env){
  if(!sameOrigin(request))return json({error:"Origin rejected."},403);if(!await isAdmin(request,env))return json({error:"Administrator login required."},401);if(!env.CMS_MEDIA)return json({error:"CMS_MEDIA R2 storage is not connected to this Worker."},503);
  let form;try{form=await request.formData();}catch(_){return json({error:"Invalid upload request."},400);}const file=form.get("file");if(!file||typeof file==="string")return json({error:"Choose an image to upload."},400);if(file.size>MAX_IMAGE_BYTES)return json({error:"Image is larger than 8 MB."},413);
  const extension=safeExtension(file.type);if(!extension)return json({error:"Only JPG, PNG and WEBP images are allowed."},415);const key=`catering/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}.${extension}`;
  await env.CMS_MEDIA.put(key,file.stream(),{httpMetadata:{contentType:file.type,cacheControl:"public, max-age=31536000, immutable"},customMetadata:{originalName:file.name||"upload"}});return json({ok:true,key,url:`/media/${key}`});
}
async function serveMedia(request,env){if(!env.CMS_MEDIA)return new Response("Media storage not configured.",{status:404});const url=new URL(request.url),key=decodeURIComponent(url.pathname.replace(/^\/media\//,""));if(!key||key.includes(".."))return new Response("Not found.",{status:404});const object=await env.CMS_MEDIA.get(key);if(!object)return new Response("Not found.",{status:404});const headers=new Headers();object.writeHttpMetadata(headers);headers.set("etag",object.httpEtag);headers.set("cache-control",headers.get("cache-control")||"public, max-age=31536000, immutable");return new Response(object.body,{headers});}

export default {async fetch(request,env){const url=new URL(request.url);
  if((url.pathname==="/"||url.pathname==="/index.html")&&request.method==="GET")return serveHome(request,env);
  if(url.pathname==="/api/catering-content"&&request.method==="GET")return publicContent(request,env);
  if(url.pathname==="/api/admin/status"&&request.method==="GET")return json({loginConfigured:Boolean(env.ADMIN_PASSWORD&&env.SESSION_SECRET),contentStorage:Boolean(env.CMS_KV),mediaStorage:Boolean(env.CMS_MEDIA),ready:Boolean(env.ADMIN_PASSWORD&&env.SESSION_SECRET&&env.CMS_KV)});
  if(url.pathname==="/api/admin/session"&&request.method==="POST")return login(request,env);
  if(url.pathname==="/api/admin/logout"&&request.method==="POST")return logout();
  if(url.pathname==="/api/admin/content"&&request.method==="POST")return saveContent(request,env);
  if(url.pathname==="/api/admin/media"&&request.method==="POST")return uploadMedia(request,env);
  if(url.pathname.startsWith("/media/")&&request.method==="GET")return serveMedia(request,env);
  return env.ASSETS.fetch(request);
}};
