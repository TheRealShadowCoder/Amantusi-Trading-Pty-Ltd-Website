let schemaReadyPromise = null;

const schema = [
  `CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    reference TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'New',
    priority TEXT NOT NULL DEFAULT 'Normal',
    source TEXT NOT NULL DEFAULT 'Website',
    organisation TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    request_type TEXT,
    external_reference TEXT,
    required_by TEXT,
    delivery_location TEXT,
    requirements TEXT NOT NULL,
    assigned_to TEXT,
    notes TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`,
  `CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email)`,
  `CREATE TABLE IF NOT EXISTS lead_files (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL,
    storage_key TEXT NOT NULL,
    backend TEXT NOT NULL,
    original_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_lead_files_lead ON lead_files(lead_id)`,
  `CREATE TABLE IF NOT EXISTS lead_events (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    status TEXT,
    note TEXT,
    actor TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_lead_events_lead ON lead_events(lead_id, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS quotations (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL,
    quote_no TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Draft',
    amount REAL,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_quotes_lead ON quotations(lead_id, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    categories TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name)`,
  `CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    sku TEXT,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    unit TEXT,
    cost_price REAL,
    sell_price REAL,
    supplier_id TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)`,
  `CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id)`,
  `CREATE TABLE IF NOT EXISTS passkeys (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    webauthn_user_id TEXT NOT NULL,
    public_key TEXT NOT NULL,
    counter INTEGER NOT NULL DEFAULT 0,
    transports TEXT,
    device_type TEXT,
    backed_up INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    last_used_at TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_passkeys_email ON passkeys(email)`,
  `CREATE TABLE IF NOT EXISTS analytics_events (
    id TEXT PRIMARY KEY,
    event_name TEXT NOT NULL,
    path TEXT,
    referrer_host TEXT,
    country TEXT,
    device TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(event_name, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS app_events (
    id TEXT PRIMARY KEY,
    severity TEXT NOT NULL,
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    path TEXT,
    metadata TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_app_events_created ON app_events(created_at DESC)`
];

const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}_${crypto.randomUUID()}`;
const dateCode = () => new Date().toISOString().slice(0, 10).replaceAll('-', '');
const leadReference = () => `AMT-${dateCode()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

function rows(result) {
  return result?.results || [];
}

export async function ensureDatabase(env) {
  if (!env.DB) return false;
  if (!schemaReadyPromise) {
    schemaReadyPromise = env.DB.batch(schema.map((sql) => env.DB.prepare(sql)))
      .then(() => true)
      .catch((error) => {
        schemaReadyPromise = null;
        throw error;
      });
  }
  return schemaReadyPromise;
}

export async function createLead(env, input) {
  await ensureDatabase(env);
  const leadId = id('lead');
  const reference = leadReference();
  const createdAt = now();
  await env.DB.prepare(`
    INSERT INTO leads (
      id, reference, created_at, updated_at, status, priority, source,
      organisation, contact_name, email, phone, request_type, external_reference,
      required_by, delivery_location, requirements, assigned_to, notes
    ) VALUES (?, ?, ?, ?, 'New', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)
  `).bind(
    leadId, reference, createdAt, createdAt,
    input.priority || 'Normal', input.source || 'Website',
    input.organisation, input.contactName, input.email, input.phone || '',
    input.requestType || '', input.externalReference || '', input.requiredBy || '',
    input.deliveryLocation || '', input.requirements
  ).run();
  await addLeadEvent(env, leadId, 'created', 'New', 'Website quotation request received.', 'Website');
  return { id: leadId, reference, createdAt, status: 'New' };
}

export async function addLeadFile(env, leadId, file) {
  await ensureDatabase(env);
  const fileId = id('file');
  await env.DB.prepare(`
    INSERT INTO lead_files (id, lead_id, storage_key, backend, original_name, content_type, size_bytes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(fileId, leadId, file.storageKey, file.backend, file.originalName, file.contentType, file.sizeBytes, now()).run();
  return fileId;
}

export async function addLeadEvent(env, leadId, eventType, status = '', note = '', actor = '') {
  await ensureDatabase(env);
  await env.DB.prepare(`
    INSERT INTO lead_events (id, lead_id, event_type, status, note, actor, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id('event'), leadId, eventType, status || '', note || '', actor || '', now()).run();
}

export async function listLeads(env, { status = '', search = '', limit = 100 } = {}) {
  await ensureDatabase(env);
  const safeLimit = Math.min(250, Math.max(1, Number(limit) || 100));
  const clauses = [];
  const bindings = [];
  if (status && status !== 'All') {
    clauses.push('status = ?');
    bindings.push(status);
  }
  if (search) {
    clauses.push('(reference LIKE ? OR organisation LIKE ? OR contact_name LIKE ? OR email LIKE ? OR external_reference LIKE ?)');
    const q = `%${search}%`;
    bindings.push(q, q, q, q, q);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const result = await env.DB.prepare(`SELECT * FROM leads ${where} ORDER BY created_at DESC LIMIT ${safeLimit}`).bind(...bindings).all();
  return rows(result);
}

export async function getLead(env, leadId) {
  await ensureDatabase(env);
  return env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(leadId).first();
}

export async function getLeadBundle(env, leadId) {
  await ensureDatabase(env);
  const [lead, files, events, quotes] = await Promise.all([
    getLead(env, leadId),
    env.DB.prepare('SELECT * FROM lead_files WHERE lead_id = ? ORDER BY created_at DESC').bind(leadId).all(),
    env.DB.prepare('SELECT * FROM lead_events WHERE lead_id = ? ORDER BY created_at DESC').bind(leadId).all(),
    env.DB.prepare('SELECT * FROM quotations WHERE lead_id = ? ORDER BY created_at DESC').bind(leadId).all()
  ]);
  if (!lead) return null;
  return { lead, files: rows(files), events: rows(events), quotations: rows(quotes) };
}

export async function getLeadFile(env, leadId, fileId) {
  await ensureDatabase(env);
  return env.DB.prepare('SELECT * FROM lead_files WHERE id = ? AND lead_id = ?').bind(fileId, leadId).first();
}

export async function updateLeadStatus(env, leadId, status, actor, note = '') {
  await ensureDatabase(env);
  await env.DB.prepare('UPDATE leads SET status = ?, updated_at = ? WHERE id = ?').bind(status, now(), leadId).run();
  await addLeadEvent(env, leadId, 'status', status, note || `Status changed to ${status}.`, actor);
  return getLead(env, leadId);
}

export async function addLeadNote(env, leadId, note, actor) {
  await addLeadEvent(env, leadId, 'note', '', note, actor);
}

export async function createQuotation(env, leadId, input, actor) {
  await ensureDatabase(env);
  const quoteId = id('quote');
  const createdAt = now();
  const quoteNo = input.quoteNo || `Q-${dateCode()}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;
  await env.DB.prepare(`
    INSERT INTO quotations (id, lead_id, quote_no, status, amount, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(quoteId, leadId, quoteNo, input.status || 'Draft', input.amount ?? null, input.notes || '', createdAt, createdAt).run();
  await addLeadEvent(env, leadId, 'quotation', input.status || 'Draft', `Quotation ${quoteNo} created${input.amount != null ? ` for R${Number(input.amount).toFixed(2)}` : ''}.`, actor);
  return env.DB.prepare('SELECT * FROM quotations WHERE id = ?').bind(quoteId).first();
}

export async function updateQuotation(env, quoteId, input, actor) {
  await ensureDatabase(env);
  const current = await env.DB.prepare('SELECT * FROM quotations WHERE id = ?').bind(quoteId).first();
  if (!current) return null;
  const status = input.status || current.status;
  const amount = input.amount === undefined ? current.amount : input.amount;
  const notes = input.notes === undefined ? current.notes : input.notes;
  await env.DB.prepare('UPDATE quotations SET status = ?, amount = ?, notes = ?, updated_at = ? WHERE id = ?')
    .bind(status, amount ?? null, notes || '', now(), quoteId).run();
  if (status !== current.status) {
    await addLeadEvent(env, current.lead_id, 'quotation-status', status, `Quotation ${current.quote_no} changed to ${status}.`, actor);
  }
  return env.DB.prepare('SELECT * FROM quotations WHERE id = ?').bind(quoteId).first();
}

export async function dashboardStats(env) {
  await ensureDatabase(env);
  const [total, newCount, active, quoted, delivered, suppliers, products, today, week, month, errors] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) AS count FROM leads').first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM leads WHERE status = 'New'").first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM leads WHERE status NOT IN ('Delivered','Closed','Lost')").first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM quotations WHERE status IN ('Sent','Accepted')").first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM leads WHERE status = 'Delivered'").first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM suppliers WHERE status = 'Active'").first(),
    env.DB.prepare('SELECT COUNT(*) AS count FROM products WHERE active = 1').first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM analytics_events WHERE created_at >= datetime('now','-1 day')").first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM analytics_events WHERE created_at >= datetime('now','-7 day')").first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM analytics_events WHERE created_at >= datetime('now','-30 day')").first(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM app_events WHERE severity = 'error' AND created_at >= datetime('now','-7 day')").first()
  ]);
  return {
    leads: Number(total?.count || 0),
    newLeads: Number(newCount?.count || 0),
    activeLeads: Number(active?.count || 0),
    quotationsActive: Number(quoted?.count || 0),
    delivered: Number(delivered?.count || 0),
    suppliers: Number(suppliers?.count || 0),
    products: Number(products?.count || 0),
    analytics: { day: Number(today?.count || 0), week: Number(week?.count || 0), month: Number(month?.count || 0) },
    errors7d: Number(errors?.count || 0)
  };
}

export async function listSuppliers(env) {
  await ensureDatabase(env);
  return rows(await env.DB.prepare('SELECT * FROM suppliers ORDER BY name COLLATE NOCASE').all());
}

export async function upsertSupplier(env, input) {
  await ensureDatabase(env);
  const supplierId = input.id || id('supplier');
  const created = now();
  const existing = input.id ? await env.DB.prepare('SELECT id, created_at FROM suppliers WHERE id = ?').bind(input.id).first() : null;
  await env.DB.prepare(`
    INSERT INTO suppliers (id, name, contact_name, email, phone, categories, status, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, contact_name=excluded.contact_name, email=excluded.email, phone=excluded.phone,
      categories=excluded.categories, status=excluded.status, notes=excluded.notes, updated_at=excluded.updated_at
  `).bind(
    supplierId, input.name, input.contactName || '', input.email || '', input.phone || '',
    input.categories || '', input.status || 'Active', input.notes || '', existing?.created_at || created, created
  ).run();
  return env.DB.prepare('SELECT * FROM suppliers WHERE id = ?').bind(supplierId).first();
}

export async function deleteSupplier(env, supplierId) {
  await ensureDatabase(env);
  await env.DB.prepare('UPDATE products SET supplier_id = NULL WHERE supplier_id = ?').bind(supplierId).run();
  return env.DB.prepare('DELETE FROM suppliers WHERE id = ?').bind(supplierId).run();
}

export async function listProducts(env) {
  await ensureDatabase(env);
  const result = await env.DB.prepare(`
    SELECT p.*, s.name AS supplier_name
    FROM products p LEFT JOIN suppliers s ON p.supplier_id = s.id
    ORDER BY p.name COLLATE NOCASE
  `).all();
  return rows(result);
}

export async function upsertProduct(env, input) {
  await ensureDatabase(env);
  const productId = input.id || id('product');
  const created = now();
  const existing = input.id ? await env.DB.prepare('SELECT id, created_at FROM products WHERE id = ?').bind(input.id).first() : null;
  await env.DB.prepare(`
    INSERT INTO products (id, sku, name, category, description, unit, cost_price, sell_price, supplier_id, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      sku=excluded.sku, name=excluded.name, category=excluded.category, description=excluded.description,
      unit=excluded.unit, cost_price=excluded.cost_price, sell_price=excluded.sell_price,
      supplier_id=excluded.supplier_id, active=excluded.active, updated_at=excluded.updated_at
  `).bind(
    productId, input.sku || '', input.name, input.category || '', input.description || '', input.unit || '',
    input.costPrice ?? null, input.sellPrice ?? null, input.supplierId || null, input.active === false ? 0 : 1,
    existing?.created_at || created, created
  ).run();
  return env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(productId).first();
}

export async function deleteProduct(env, productId) {
  await ensureDatabase(env);
  return env.DB.prepare('DELETE FROM products WHERE id = ?').bind(productId).run();
}

export async function listPasskeys(env, email) {
  await ensureDatabase(env);
  return rows(await env.DB.prepare(`
    SELECT id, email, webauthn_user_id, counter, transports, device_type, backed_up, created_at, last_used_at
    FROM passkeys WHERE email = ? ORDER BY created_at DESC
  `).bind(email).all());
}

export async function getPasskey(env, email, credentialId) {
  await ensureDatabase(env);
  return env.DB.prepare('SELECT * FROM passkeys WHERE email = ? AND id = ?').bind(email, credentialId).first();
}

export async function savePasskey(env, record) {
  await ensureDatabase(env);
  await env.DB.prepare(`
    INSERT INTO passkeys (id, email, webauthn_user_id, public_key, counter, transports, device_type, backed_up, created_at, last_used_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
    ON CONFLICT(id) DO UPDATE SET public_key=excluded.public_key, counter=excluded.counter,
      transports=excluded.transports, device_type=excluded.device_type, backed_up=excluded.backed_up
  `).bind(
    record.id, record.email, record.webauthnUserID, record.publicKey, Number(record.counter || 0),
    JSON.stringify(record.transports || []), record.deviceType || '', record.backedUp ? 1 : 0, now()
  ).run();
}

export async function updatePasskeyCounter(env, email, credentialId, counter) {
  await ensureDatabase(env);
  await env.DB.prepare('UPDATE passkeys SET counter = ?, last_used_at = ? WHERE email = ? AND id = ?')
    .bind(Number(counter || 0), now(), email, credentialId).run();
}

export async function deletePasskey(env, email, credentialId) {
  await ensureDatabase(env);
  return env.DB.prepare('DELETE FROM passkeys WHERE email = ? AND id = ?').bind(email, credentialId).run();
}

export async function recordAnalytics(env, event) {
  if (!env.DB) return;
  await ensureDatabase(env);
  await env.DB.prepare(`
    INSERT INTO analytics_events (id, event_name, path, referrer_host, country, device, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id('analytics'), event.eventName, event.path || '', event.referrerHost || '', event.country || '', event.device || '', now()).run();
}

export async function recordAppEvent(env, event) {
  if (!env.DB) return;
  try {
    await ensureDatabase(env);
    await env.DB.prepare(`
      INSERT INTO app_events (id, severity, category, message, path, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id('app'), event.severity || 'info', event.category || 'application', String(event.message || '').slice(0, 2000),
      event.path || '', JSON.stringify(event.metadata || {}).slice(0, 8000), now()
    ).run();
  } catch (_) {}
}

export async function recentAppEvents(env, limit = 40) {
  await ensureDatabase(env);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 40));
  return rows(await env.DB.prepare(`SELECT * FROM app_events ORDER BY created_at DESC LIMIT ${safeLimit}`).all());
}
