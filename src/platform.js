import { json, getAdminSession } from './security-v3.js';
import {
  ensureDatabase, createLead, addLeadFile, listLeads, getLead, getLeadBundle, getLeadFile,
  updateLeadStatus, addLeadNote, createQuotation, updateQuotation, dashboardStats,
  listSuppliers, upsertSupplier, deleteSupplier, listProducts, upsertProduct, deleteProduct,
  recordAnalytics, recordAppEvent, recentAppEvents, listPasskeys
} from './database.js';
import { notifyNewLead, notifyLeadStatus, notifyQuotation, notificationStatus } from './notifications.js';

const MAX_RFQ_FILES = 5;
const MAX_RFQ_FILE_BYTES = 10_000_000;
const MAX_RFQ_TOTAL_BYTES = 30_000_000;
const SITE_SETTINGS_KEY = 'site:settings';
const LEAD_STATUSES = new Set(['New','Reviewing','Sourcing','Quoted','Awaiting Approval','Approved','Fulfilment','Delivered','Closed','Lost']);
const QUOTE_STATUSES = new Set(['Draft','Sent','Accepted','Rejected','Expired']);
const FILE_TYPES = new Map([
  ['application/pdf','pdf'],
  ['application/msword','doc'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document','docx'],
  ['application/vnd.ms-excel','xls'],
  ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','xlsx'],
  ['text/csv','csv'],
  ['text/plain','txt'],
  ['image/jpeg','jpg'],
  ['image/png','png'],
  ['image/webp','webp']
]);

const clampText = (value, max = 2000) => String(value || '').trim().slice(0, max);
const numberOrNull = (value) => value === '' || value === null || value === undefined ? null : (Number.isFinite(Number(value)) ? Number(value) : null);

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; }
  catch (_) { return false; }
}

function requestIp(request) {
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

function base64url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function hash(value) {
  return base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value)))));
}

async function rateLimit(request, env, bucket, limit, ttl) {
  if (!env.CMS_KV) return true;
  const key = `rate:${bucket}:${await hash(requestIp(request))}`;
  const current = Number(await env.CMS_KV.get(key)) || 0;
  if (current >= limit) return false;
  await env.CMS_KV.put(key, String(current + 1), { expirationTtl: ttl });
  return true;
}

async function parseJson(request) {
  try { return await request.json(); } catch (_) { return {}; }
}

async function requireAdmin(request, env) {
  const admin = await getAdminSession(request, env);
  if (!admin) return { error: json({ error: 'Administrator login required.' }, 401) };
  return { admin };
}

function fileName(value) {
  return String(value || 'file').replace(/[\r\n"\\/]/g, '_').slice(0, 160) || 'file';
}

async function saveRfqObject(env, leadId, file) {
  const ext = FILE_TYPES.get(file.type);
  const key = `rfq/${new Date().toISOString().slice(0, 7).replace('-', '/')}/${leadId}/${crypto.randomUUID()}.${ext}`;
  if (env.CMS_MEDIA) {
    await env.CMS_MEDIA.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
      customMetadata: { originalName: fileName(file.name), leadId, uploadedAt: new Date().toISOString() }
    });
    return { storageKey: key, backend: 'r2' };
  }
  if (!env.CMS_KV) throw new Error('RFQ storage is unavailable.');
  await env.CMS_KV.put(`rfq-file:${key}`, await file.arrayBuffer(), {
    metadata: { contentType: file.type, originalName: fileName(file.name), leadId }
  });
  return { storageKey: key, backend: 'kv' };
}

export async function submitQuotationRequest(request, env) {
  if (!sameOrigin(request)) return json({ error: 'Origin rejected.' }, 403);
  if (!env.DB) return json({ error: 'Quotation database is not connected.' }, 503);
  if (!(await rateLimit(request, env, 'quote', 8, 600))) return json({ error: 'Too many quotation requests from this connection. Please try again later.' }, 429);

  let form;
  try { form = await request.formData(); } catch (_) { return json({ error: 'Invalid quotation request.' }, 400); }

  const details = {
    organisation: clampText(form.get('organisation'), 180),
    contactName: clampText(form.get('contact'), 160),
    email: clampText(form.get('email'), 200).toLowerCase(),
    phone: clampText(form.get('phone'), 80),
    requestType: clampText(form.get('type'), 120),
    externalReference: clampText(form.get('reference'), 160),
    requiredBy: clampText(form.get('deadline'), 40),
    deliveryLocation: clampText(form.get('location'), 300),
    requirements: clampText(form.get('requirements'), 12_000),
    source: 'Website'
  };

  if (!details.organisation || !details.contactName || !details.email || !details.requirements) {
    return json({ error: 'Organisation, contact person, email and requirements are required.' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) return json({ error: 'Enter a valid email address.' }, 400);

  const files = form.getAll('rfqFiles').filter((entry) => entry && typeof entry !== 'string' && entry.size > 0);
  if (files.length > MAX_RFQ_FILES) return json({ error: `Attach no more than ${MAX_RFQ_FILES} files.` }, 400);
  let total = 0;
  for (const file of files) {
    total += file.size;
    if (file.size > MAX_RFQ_FILE_BYTES) return json({ error: `${fileName(file.name)} is larger than 10 MB.` }, 413);
    if (!FILE_TYPES.has(file.type)) return json({ error: `${fileName(file.name)} is not an allowed RFQ file type.` }, 415);
  }
  if (total > MAX_RFQ_TOTAL_BYTES) return json({ error: 'Combined RFQ attachments must be 30 MB or less.' }, 413);

  await ensureDatabase(env);
  const lead = await createLead(env, details);
  const storedFiles = [];
  for (const file of files) {
    const stored = await saveRfqObject(env, lead.id, file);
    const fileId = await addLeadFile(env, lead.id, {
      ...stored,
      originalName: fileName(file.name),
      contentType: file.type,
      sizeBytes: file.size
    });
    storedFiles.push({ id: fileId, name: fileName(file.name), backend: stored.backend });
  }

  const notifications = await notifyNewLead(env, lead, details);
  console.log(JSON.stringify({ type: 'lead_created', reference: lead.reference, files: storedFiles.length }));
  return json({
    ok: true,
    reference: lead.reference,
    leadId: lead.id,
    status: lead.status,
    files: storedFiles.length,
    notificationChannels: {
      email: Boolean(notifications.email?.sent),
      whatsapp: Boolean(notifications.whatsapp?.sent)
    },
    message: `Your request has been received. Reference ${lead.reference}.`
  }, 201);
}

export async function downloadRfqFile(request, env, leadId, fileId) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  const file = await getLeadFile(env, leadId, fileId);
  if (!file) return new Response('Not found.', { status: 404 });
  let body = null;
  let contentType = file.content_type;
  if (file.backend === 'r2' && env.CMS_MEDIA) {
    const object = await env.CMS_MEDIA.get(file.storage_key);
    if (!object) return new Response('Not found.', { status: 404 });
    body = object.body;
    contentType = object.httpMetadata?.contentType || contentType;
  } else if (env.CMS_KV) {
    const result = await env.CMS_KV.getWithMetadata(`rfq-file:${file.storage_key}`, { type: 'arrayBuffer' });
    if (!result?.value) return new Response('Not found.', { status: 404 });
    body = result.value;
    contentType = result.metadata?.contentType || contentType;
  }
  if (!body) return new Response('Not found.', { status: 404 });
  return new Response(body, {
    headers: {
      'content-type': contentType || 'application/octet-stream',
      'content-disposition': `attachment; filename="${fileName(file.original_name)}"`,
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff'
    }
  });
}

async function leadsRoute(request, env, url, segments) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  if (request.method !== 'GET' && !sameOrigin(request)) return json({ error: 'Origin rejected.' }, 403);
  const leadId = segments[3];
  const action = segments[4];
  const childId = segments[5];

  if (!leadId && request.method === 'GET') {
    const leads = await listLeads(env, {
      status: url.searchParams.get('status') || '',
      search: clampText(url.searchParams.get('search'), 120),
      limit: url.searchParams.get('limit') || 100
    });
    return json({ leads });
  }
  if (leadId && !action && request.method === 'GET') {
    const bundle = await getLeadBundle(env, leadId);
    return bundle ? json(bundle) : json({ error: 'Lead not found.' }, 404);
  }
  if (leadId && action === 'status' && request.method === 'POST') {
    const body = await parseJson(request);
    const status = clampText(body.status, 80);
    if (!LEAD_STATUSES.has(status)) return json({ error: 'Invalid lead status.' }, 400);
    const lead = await updateLeadStatus(env, leadId, status, auth.admin.email, clampText(body.note, 1200));
    if (!lead) return json({ error: 'Lead not found.' }, 404);
    await notifyLeadStatus(env, lead, status);
    return json({ ok: true, lead });
  }
  if (leadId && action === 'notes' && request.method === 'POST') {
    const body = await parseJson(request);
    const note = clampText(body.note, 2500);
    if (!note) return json({ error: 'Enter a note.' }, 400);
    await addLeadNote(env, leadId, note, auth.admin.email);
    return json({ ok: true });
  }
  if (leadId && action === 'quotes' && request.method === 'POST') {
    const body = await parseJson(request);
    const quotation = await createQuotation(env, leadId, {
      quoteNo: clampText(body.quoteNo, 120),
      status: QUOTE_STATUSES.has(body.status) ? body.status : 'Draft',
      amount: numberOrNull(body.amount),
      notes: clampText(body.notes, 2500)
    }, auth.admin.email);
    const lead = await getLead(env, leadId);
    if (lead && quotation.status === 'Sent') await updateLeadStatus(env, leadId, 'Quoted', auth.admin.email, `Quotation ${quotation.quote_no} sent.`);
    if (lead) await notifyQuotation(env, lead, quotation);
    return json({ ok: true, quotation });
  }
  if (leadId && action === 'files' && childId && request.method === 'GET') {
    return downloadRfqFile(request, env, leadId, childId);
  }
  return json({ error: 'Unsupported lead operation.' }, 404);
}

async function quotationsRoute(request, env, segments) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  if (!sameOrigin(request)) return json({ error: 'Origin rejected.' }, 403);
  const quoteId = segments[3];
  if (!quoteId || request.method !== 'POST') return json({ error: 'Unsupported quotation operation.' }, 404);
  const body = await parseJson(request);
  if (body.status && !QUOTE_STATUSES.has(body.status)) return json({ error: 'Invalid quotation status.' }, 400);
  const quotation = await updateQuotation(env, quoteId, {
    status: body.status,
    amount: body.amount === undefined ? undefined : numberOrNull(body.amount),
    notes: body.notes === undefined ? undefined : clampText(body.notes, 2500)
  }, auth.admin.email);
  if (!quotation) return json({ error: 'Quotation not found.' }, 404);
  const lead = await getLead(env, quotation.lead_id);
  if (lead) await notifyQuotation(env, lead, quotation);
  return json({ ok: true, quotation });
}

async function suppliersRoute(request, env, segments) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  if (request.method !== 'GET' && !sameOrigin(request)) return json({ error: 'Origin rejected.' }, 403);
  const supplierId = segments[3];
  if (request.method === 'GET' && !supplierId) return json({ suppliers: await listSuppliers(env) });
  if (request.method === 'POST' && !supplierId) {
    const body = await parseJson(request);
    const name = clampText(body.name, 180);
    if (!name) return json({ error: 'Supplier name is required.' }, 400);
    const supplier = await upsertSupplier(env, {
      id: clampText(body.id, 100) || undefined,
      name,
      contactName: clampText(body.contactName, 160), email: clampText(body.email, 200), phone: clampText(body.phone, 80),
      categories: clampText(body.categories, 500), status: clampText(body.status, 50) || 'Active', notes: clampText(body.notes, 2500)
    });
    return json({ ok: true, supplier });
  }
  if (request.method === 'DELETE' && supplierId) {
    await deleteSupplier(env, supplierId);
    return json({ ok: true });
  }
  return json({ error: 'Unsupported supplier operation.' }, 404);
}

async function productsRoute(request, env, segments) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  if (request.method !== 'GET' && !sameOrigin(request)) return json({ error: 'Origin rejected.' }, 403);
  const productId = segments[3];
  if (request.method === 'GET' && !productId) return json({ products: await listProducts(env) });
  if (request.method === 'POST' && !productId) {
    const body = await parseJson(request);
    const name = clampText(body.name, 200);
    if (!name) return json({ error: 'Product name is required.' }, 400);
    const product = await upsertProduct(env, {
      id: clampText(body.id, 100) || undefined,
      sku: clampText(body.sku, 100), name, category: clampText(body.category, 160), description: clampText(body.description, 2500),
      unit: clampText(body.unit, 80), costPrice: numberOrNull(body.costPrice), sellPrice: numberOrNull(body.sellPrice),
      supplierId: clampText(body.supplierId, 100) || null, active: body.active !== false
    });
    return json({ ok: true, product });
  }
  if (request.method === 'DELETE' && productId) {
    await deleteProduct(env, productId);
    return json({ ok: true });
  }
  return json({ error: 'Unsupported product operation.' }, 404);
}

export async function getSiteSettings(env) {
  if (!env.CMS_KV) return {};
  const raw = await env.CMS_KV.get(SITE_SETTINGS_KEY);
  try { return raw ? JSON.parse(raw) : {}; } catch (_) { return {}; }
}

async function siteSettingsRoute(request, env) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  if (request.method === 'GET') return json({ settings: await getSiteSettings(env) });
  if (request.method !== 'POST' || !sameOrigin(request)) return json({ error: 'Unsupported settings operation.' }, 405);
  const body = await parseJson(request);
  const gaMeasurementId = clampText(body.gaMeasurementId, 40).toUpperCase();
  if (gaMeasurementId && !/^G-[A-Z0-9]+$/.test(gaMeasurementId)) return json({ error: 'GA4 Measurement ID should look like G-XXXXXXXXXX.' }, 400);
  const googleSiteVerification = clampText(body.googleSiteVerification, 300);
  const publicSiteUrl = clampText(body.publicSiteUrl, 300).replace(/\/$/, '');
  if (publicSiteUrl && !/^https:\/\//i.test(publicSiteUrl)) return json({ error: 'Public site URL must use HTTPS.' }, 400);
  const settings = { gaMeasurementId, googleSiteVerification, publicSiteUrl, updatedAt: new Date().toISOString(), updatedBy: auth.admin.email };
  await env.CMS_KV.put(SITE_SETTINGS_KEY, JSON.stringify(settings));
  return json({ ok: true, settings });
}

export async function analyticsEvent(request, env) {
  if (!env.DB) return json({ ok: true });
  if (!(await rateLimit(request, env, 'analytics', 120, 60))) return json({ ok: true });
  const body = await parseJson(request);
  const eventName = clampText(body.eventName, 80).replace(/[^a-zA-Z0-9_.-]/g, '');
  if (!eventName) return json({ ok: true });
  const referrer = clampText(body.referrer, 500);
  let referrerHost = '';
  try { referrerHost = referrer ? new URL(referrer).hostname : ''; } catch (_) {}
  const ua = request.headers.get('user-agent') || '';
  const device = /Mobile|Android|iPhone|iPad/i.test(ua) ? 'mobile' : 'desktop';
  await recordAnalytics(env, {
    eventName,
    path: clampText(body.path, 300),
    referrerHost,
    country: request.cf?.country || '',
    device
  });
  return json({ ok: true });
}

export async function clientError(request, env) {
  if (!(await rateLimit(request, env, 'client-error', 20, 600))) return json({ ok: true });
  const body = await parseJson(request);
  await recordAppEvent(env, {
    severity: 'error',
    category: 'client',
    message: clampText(body.message, 1800),
    path: clampText(body.path, 300),
    metadata: { source: clampText(body.source, 400), line: Number(body.line || 0), column: Number(body.column || 0) }
  });
  return json({ ok: true });
}

export async function platformHealth(env) {
  let db = false;
  try { db = await ensureDatabase(env); } catch (_) {}
  return json({
    ok: Boolean(env.CMS_KV && db),
    kv: Boolean(env.CMS_KV),
    database: Boolean(db),
    r2: Boolean(env.CMS_MEDIA),
    mediaBackend: env.CMS_MEDIA ? 'r2' : (env.CMS_KV ? 'kv-fallback' : 'none'),
    observability: true,
    platformVersion: 2
  }, db && env.CMS_KV ? 200 : 503);
}

export async function adminDashboard(request, env) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  const [stats, leads] = await Promise.all([dashboardStats(env), listLeads(env, { limit: 12 })]);
  return json({ stats, recentLeads: leads });
}

export async function systemStatus(request, env) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  const [stats, errors, passkeys] = await Promise.all([
    dashboardStats(env), recentAppEvents(env, 30), listPasskeys(env, auth.admin.email)
  ]);
  return json({
    storage: { kv: Boolean(env.CMS_KV), d1: Boolean(env.DB), r2: Boolean(env.CMS_MEDIA) },
    notifications: notificationStatus(env),
    recovery: { emailPasswordReset: Boolean(env.RESEND_API_KEY && env.ALERT_FROM_EMAIL) },
    passkeys: passkeys.length,
    stats,
    recentEvents: errors
  });
}

export async function platformRoute(request, env) {
  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean);
  if (url.pathname === '/api/quote' && request.method === 'POST') return submitQuotationRequest(request, env);
  if (url.pathname === '/api/analytics/event' && request.method === 'POST') return analyticsEvent(request, env);
  if (url.pathname === '/api/client-error' && request.method === 'POST') return clientError(request, env);
  if (url.pathname === '/api/health' && request.method === 'GET') return platformHealth(env);
  if (url.pathname === '/api/admin/dashboard' && request.method === 'GET') return adminDashboard(request, env);
  if (url.pathname === '/api/admin/system' && request.method === 'GET') return systemStatus(request, env);
  if (url.pathname === '/api/admin/site-settings') return siteSettingsRoute(request, env);
  if (segments[0] === 'api' && segments[1] === 'admin' && segments[2] === 'leads') return leadsRoute(request, env, url, segments);
  if (segments[0] === 'api' && segments[1] === 'admin' && segments[2] === 'quotations') return quotationsRoute(request, env, segments);
  if (segments[0] === 'api' && segments[1] === 'admin' && segments[2] === 'suppliers') return suppliersRoute(request, env, segments);
  if (segments[0] === 'api' && segments[1] === 'admin' && segments[2] === 'products') return productsRoute(request, env, segments);
  return null;
}
