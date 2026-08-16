(() => {
  const $ = (selector) => document.querySelector(selector);
  const esc = (value = '') => String(value).replace(/[&<>"']/g, (ch) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' })[ch]);
  const money = (value) => value === null || value === undefined || value === '' ? '—' : new Intl.NumberFormat('en-ZA', { style:'currency', currency:'ZAR' }).format(Number(value) || 0);
  const fmtDate = (value) => value ? new Intl.DateTimeFormat('en-ZA', { dateStyle:'medium', timeStyle:'short' }).format(new Date(value)) : '—';
  const LEAD_STATUSES = ['New','Reviewing','Sourcing','Quoted','Awaiting Approval','Approved','Fulfilment','Delivered','Closed','Lost'];
  const QUOTE_STATUSES = ['Draft','Sent','Accepted','Rejected','Expired'];
  let booted = false;
  let suppliers = [];
  let products = [];
  let selectedLeadId = '';

  async function api(url, options = {}) {
    const response = await fetch(url, { cache:'no-store', ...options });
    let payload = {};
    try { payload = await response.json(); } catch (_) {}
    if (!response.ok) {
      const error = new Error(payload.error || `Request failed (${response.status}).`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return payload;
  }

  function b64urlToBytes(value) {
    const base64 = String(value || '').replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(String(value || '').length / 4) * 4, '=');
    const binary = atob(base64);
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
  }
  function bytesToB64url(value) {
    if (!value) return '';
    const bytes = value instanceof ArrayBuffer ? new Uint8Array(value) : new Uint8Array(value.buffer || value);
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
  function registrationOptionsForBrowser(options) {
    return {
      ...options,
      challenge: b64urlToBytes(options.challenge),
      user: { ...options.user, id: b64urlToBytes(options.user.id) },
      excludeCredentials: (options.excludeCredentials || []).map((item) => ({ ...item, id: b64urlToBytes(item.id) }))
    };
  }
  function authenticationOptionsForBrowser(options) {
    return {
      ...options,
      challenge: b64urlToBytes(options.challenge),
      allowCredentials: (options.allowCredentials || []).map((item) => ({ ...item, id: b64urlToBytes(item.id) }))
    };
  }
  function registrationJson(credential) {
    return {
      id: credential.id,
      rawId: bytesToB64url(credential.rawId),
      type: credential.type,
      authenticatorAttachment: credential.authenticatorAttachment || undefined,
      clientExtensionResults: credential.getClientExtensionResults(),
      response: {
        clientDataJSON: bytesToB64url(credential.response.clientDataJSON),
        attestationObject: bytesToB64url(credential.response.attestationObject),
        transports: credential.response.getTransports?.() || []
      }
    };
  }
  function authenticationJson(credential) {
    return {
      id: credential.id,
      rawId: bytesToB64url(credential.rawId),
      type: credential.type,
      authenticatorAttachment: credential.authenticatorAttachment || undefined,
      clientExtensionResults: credential.getClientExtensionResults(),
      response: {
        clientDataJSON: bytesToB64url(credential.response.clientDataJSON),
        authenticatorData: bytesToB64url(credential.response.authenticatorData),
        signature: bytesToB64url(credential.response.signature),
        userHandle: credential.response.userHandle ? bytesToB64url(credential.response.userHandle) : undefined
      }
    };
  }

  async function authenticatePasskey(email) {
    if (!window.PublicKeyCredential || !navigator.credentials) throw new Error('Passkeys are not supported by this browser/device.');
    const start = await api('/api/admin/passkeys/authentication/options', {
      method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ email })
    });
    const credential = await navigator.credentials.get({ publicKey: authenticationOptionsForBrowser(start.options) });
    if (!credential) throw new Error('Passkey verification was cancelled.');
    return api('/api/admin/passkeys/authentication/verify', {
      method:'POST', headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify({ flowId:start.flowId, credential:authenticationJson(credential) })
    });
  }
  window.AmantusiPasskeys = { authenticate: authenticatePasskey };

  // Own the login submit flow before legacy admin.js sees it, so 202 MFA responses are handled correctly.
  document.addEventListener('submit', async (event) => {
    if (event.target?.id !== 'login-form') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const error = $('#login-error');
    const email = $('#admin-email')?.value.trim() || '';
    const password = $('#admin-password')?.value || '';
    if (error) error.textContent = 'Checking credentials…';
    try {
      const response = await fetch('/api/admin/session', {
        method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ email, password })
      });
      let payload = {};
      try { payload = await response.json(); } catch (_) {}
      if (response.status === 202 && payload.mfaRequired) {
        if (error) error.textContent = 'Password accepted. Complete passkey verification…';
        await authenticatePasskey(payload.email || email);
        location.reload();
        return;
      }
      if (!response.ok) {
        if (response.status === 429 && payload.retryAfter) {
          const minutes = Math.max(1, Math.ceil(payload.retryAfter / 60));
          throw new Error(`Too many failed attempts. Try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.`);
        }
        throw new Error(payload.error || 'Login failed.');
      }
      location.reload();
    } catch (err) {
      if (error) error.textContent = err.message || 'Login failed.';
    }
  }, true);

  async function directPasskeyLogin() {
    const email = $('#admin-email')?.value.trim() || '';
    const error = $('#login-error');
    if (!email) { if (error) error.textContent = 'Enter your administrator email first.'; return; }
    if (error) error.textContent = 'Waiting for passkey…';
    try {
      await authenticatePasskey(email);
      location.reload();
    } catch (err) {
      if (error) error.textContent = err.message || 'Passkey sign-in failed.';
    }
  }

  function metric(label, value, detail = '') {
    return `<article class="metric-card"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small></article>`;
  }
  function statusBadge(value) {
    const slug = String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `<span class="status-pill status-${slug}">${esc(value || 'Unknown')}</span>`;
  }
  function leadRow(lead, compact = false) {
    return `<button class="lead-row${selectedLeadId === lead.id ? ' selected' : ''}" type="button" data-lead-id="${esc(lead.id)}">
      <span class="lead-ref">${esc(lead.reference)}</span>
      <span class="lead-org"><strong>${esc(lead.organisation)}</strong><small>${esc(lead.contact_name || lead.email || '')}</small></span>
      ${statusBadge(lead.status)}
      ${compact ? '' : `<span class="lead-type">${esc(lead.request_type || 'General')}</span>`}
      <time>${esc(fmtDate(lead.created_at))}</time>
    </button>`;
  }

  async function loadDashboard() {
    const grid = $('#metric-grid');
    try {
      const data = await api('/api/admin/dashboard');
      const s = data.stats || {};
      if (grid) grid.innerHTML = [
        metric('Total Leads', s.leads || 0, `${s.newLeads || 0} new`),
        metric('Active Pipeline', s.activeLeads || 0, 'Open requirements'),
        metric('Active Quotes', s.quotationsActive || 0, 'Sent / accepted'),
        metric('Delivered', s.delivered || 0, 'Completed leads'),
        metric('Suppliers', s.suppliers || 0, 'Active network'),
        metric('Products', s.products || 0, 'Active catalogue'),
        metric('30 Day Events', s.analytics?.month || 0, 'First-party analytics'),
        metric('Errors 7d', s.errors7d || 0, 'Application monitoring')
      ].join('');
      const recent = $('#recent-leads');
      if (recent) recent.innerHTML = data.recentLeads?.length ? data.recentLeads.map((lead) => leadRow(lead, true)).join('') : '<div class="empty-state">No quotation requests yet.</div>';
    } catch (err) {
      if (grid) grid.innerHTML = `<div class="empty-state error-state">${esc(err.message)}</div>`;
    }
  }

  function healthItem(label, good, detail = '') {
    return `<div class="health-item ${good ? 'ok' : 'warn'}"><i></i><span><strong>${esc(label)}</strong><small>${esc(detail || (good ? 'Connected' : 'Needs configuration'))}</small></span></div>`;
  }
  async function loadSystem() {
    try {
      const data = await api('/api/admin/system');
      const storage = data.storage || {};
      const notifications = data.notifications || {};
      const items = [
        healthItem('Cloudflare KV', storage.kv), healthItem('D1 Operations DB', storage.d1), healthItem('R2 Media & RFQs', storage.r2),
        healthItem('Email Automation', notifications.email, notifications.email ? 'Resend connected' : 'Resend credentials required'),
        healthItem('WhatsApp Automation', notifications.whatsapp, notifications.whatsapp ? 'WhatsApp connected' : 'Meta credentials required'),
        healthItem('Password Recovery', data.recovery?.emailPasswordReset), healthItem('Passkeys', true, `${data.passkeys || 0} registered`)
      ];
      ['#platform-health','#system-status','#integration-health'].forEach((selector) => { const node = $(selector); if (node) node.innerHTML = items.join(''); });
      const events = (data.recentEvents || []).slice(0, 12);
      const html = events.length ? events.map((event) => `<div class="event-row"><span>${statusBadge(event.severity || 'info')}</span><div><strong>${esc(event.category || 'application')}</strong><p>${esc(event.message || '')}</p></div><time>${esc(fmtDate(event.created_at))}</time></div>`).join('') : '<div class="empty-state">No recent application errors recorded.</div>';
      ['#recent-errors','#system-events'].forEach((selector) => { const node = $(selector); if (node) node.innerHTML = html; });
    } catch (err) {
      const node = $('#system-status'); if (node) node.innerHTML = `<div class="empty-state error-state">${esc(err.message)}</div>`;
    }
  }

  async function loadLeads() {
    const search = encodeURIComponent($('#lead-search')?.value.trim() || '');
    const status = encodeURIComponent($('#lead-status-filter')?.value || '');
    const node = $('#lead-list');
    try {
      const data = await api(`/api/admin/leads?search=${search}&status=${status}&limit=100`);
      node.innerHTML = data.leads?.length ? data.leads.map((lead) => leadRow(lead)).join('') : '<div class="empty-state">No matching leads.</div>';
    } catch (err) { node.innerHTML = `<div class="empty-state error-state">${esc(err.message)}</div>`; }
  }

  async function openLead(id) {
    selectedLeadId = id;
    await loadLeads();
    const node = $('#lead-detail');
    node.innerHTML = '<div class="empty-state">Loading enquiry…</div>';
    try {
      const data = await api(`/api/admin/leads/${encodeURIComponent(id)}`);
      const lead = data.lead || data;
      const files = data.files || [];
      const events = data.events || [];
      const quotations = data.quotations || [];
      node.innerHTML = `
        <div class="lead-detail-head"><div><span class="lead-ref">${esc(lead.reference)}</span><h2>${esc(lead.organisation)}</h2><p>${esc(lead.contact_name)} · ${esc(lead.email)}${lead.phone ? ` · ${esc(lead.phone)}` : ''}</p></div>${statusBadge(lead.status)}</div>
        <div class="lead-facts"><div><span>Request type</span><strong>${esc(lead.request_type || '—')}</strong></div><div><span>External reference</span><strong>${esc(lead.external_reference || '—')}</strong></div><div><span>Required by</span><strong>${esc(lead.required_by || '—')}</strong></div><div><span>Delivery</span><strong>${esc(lead.delivery_location || '—')}</strong></div></div>
        <div class="lead-requirements"><span>Items / Services Required</span><p>${esc(lead.requirements || '').replace(/\n/g,'<br>')}</p></div>
        <div class="detail-section"><h3>RFQ / Specification Files</h3>${files.length ? files.map((file) => `<a class="file-row" href="/api/admin/leads/${encodeURIComponent(id)}/files/${encodeURIComponent(file.id)}"><span>↧</span><strong>${esc(file.original_name)}</strong><small>${Math.ceil(Number(file.size_bytes || 0)/1024)} KB · ${esc(file.backend)}</small></a>`).join('') : '<p class="muted">No attachments submitted.</p>'}</div>
        <div class="detail-section"><h3>Update Lead Status</h3><div class="inline-form"><select id="lead-detail-status">${LEAD_STATUSES.map((s) => `<option${s===lead.status?' selected':''}>${esc(s)}</option>`).join('')}</select><input id="lead-status-note" placeholder="Optional status note"><button class="admin-button gold" type="button" id="save-lead-status">Update</button></div></div>
        <div class="detail-section"><h3>Internal Note</h3><div class="inline-form"><input id="lead-note" placeholder="Add sourcing, client or follow-up note"><button class="admin-button secondary" type="button" id="add-lead-note">Add Note</button></div></div>
        <div class="detail-section"><h3>Quotations</h3><div class="quote-create"><input id="quote-no" placeholder="Quote number"><input id="quote-amount" type="number" min="0" step="0.01" placeholder="Amount"><select id="quote-status">${QUOTE_STATUSES.map((s)=>`<option>${s}</option>`).join('')}</select><input id="quote-notes" placeholder="Quotation note"><button class="admin-button gold" id="create-quote" type="button">Add Quotation</button></div><div class="quote-list">${quotations.length ? quotations.map((q)=>`<div class="quote-row" data-quote-id="${esc(q.id)}"><div><strong>${esc(q.quote_no)}</strong><small>${money(q.amount)}</small></div><select data-quote-status>${QUOTE_STATUSES.map((s)=>`<option${s===q.status?' selected':''}>${s}</option>`).join('')}</select><button class="admin-button mini" data-save-quote type="button">Save</button></div>`).join('') : '<p class="muted">No quotations recorded yet.</p>'}</div></div>
        <div class="detail-section"><h3>Activity Timeline</h3><div class="timeline">${events.length ? events.map((e)=>`<div class="timeline-row"><i></i><div><strong>${esc(e.event_type || 'update')} ${e.status ? `· ${esc(e.status)}` : ''}</strong><p>${esc(e.note || '')}</p><small>${esc(e.actor || 'system')} · ${esc(fmtDate(e.created_at))}</small></div></div>`).join('') : '<p class="muted">No timeline events yet.</p>'}</div></div>`;

      $('#save-lead-status')?.addEventListener('click', async () => {
        await api(`/api/admin/leads/${encodeURIComponent(id)}/status`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ status:$('#lead-detail-status').value, note:$('#lead-status-note').value }) });
        await Promise.all([openLead(id), loadDashboard()]);
      });
      $('#add-lead-note')?.addEventListener('click', async () => {
        const note = $('#lead-note').value.trim(); if (!note) return;
        await api(`/api/admin/leads/${encodeURIComponent(id)}/notes`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ note }) });
        await openLead(id);
      });
      $('#create-quote')?.addEventListener('click', async () => {
        await api(`/api/admin/leads/${encodeURIComponent(id)}/quotes`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ quoteNo:$('#quote-no').value, amount:$('#quote-amount').value, status:$('#quote-status').value, notes:$('#quote-notes').value }) });
        await Promise.all([openLead(id), loadDashboard()]);
      });
      node.querySelectorAll('[data-save-quote]').forEach((button) => button.addEventListener('click', async () => {
        const row = button.closest('[data-quote-id]');
        await api(`/api/admin/quotations/${encodeURIComponent(row.dataset.quoteId)}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ status:row.querySelector('[data-quote-status]').value }) });
        await openLead(id);
      }));
    } catch (err) { node.innerHTML = `<div class="empty-state error-state">${esc(err.message)}</div>`; }
  }

  function clearSupplier() { ['#supplier-id','#supplier-name','#supplier-contact','#supplier-email','#supplier-phone','#supplier-categories','#supplier-notes'].forEach((s)=>{ if($(s)) $(s).value=''; }); if($('#supplier-status')) $('#supplier-status').value='Active'; }
  function clearProduct() { ['#product-id','#product-sku','#product-name','#product-category','#product-unit','#product-cost','#product-sell','#product-description'].forEach((s)=>{ if($(s)) $(s).value=''; }); if($('#product-supplier')) $('#product-supplier').value=''; if($('#product-active')) $('#product-active').value='true'; }

  async function loadSuppliers() {
    const data = await api('/api/admin/suppliers'); suppliers = data.suppliers || [];
    const list = $('#supplier-list');
    list.innerHTML = suppliers.length ? suppliers.map((s)=>`<div class="db-row"><div><strong>${esc(s.name)}</strong><small>${esc(s.categories || '')}${s.email ? ` · ${esc(s.email)}` : ''}</small></div>${statusBadge(s.status)}<div class="db-actions"><button data-edit-supplier="${esc(s.id)}">Edit</button><button data-delete-supplier="${esc(s.id)}">×</button></div></div>`).join('') : '<div class="empty-state">No suppliers yet.</div>';
    const select = $('#product-supplier'); if (select) select.innerHTML = `<option value="">Unassigned</option>${suppliers.map((s)=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}`;
  }
  async function loadProducts() {
    const data = await api('/api/admin/products'); products = data.products || [];
    const list = $('#product-list');
    list.innerHTML = products.length ? products.map((p)=>`<div class="db-row"><div><strong>${esc(p.name)}</strong><small>${esc(p.sku || 'No SKU')} · ${esc(p.category || 'Uncategorised')} · ${esc(p.supplier_name || 'No supplier')}</small></div><span>${money(p.sell_price)}</span><div class="db-actions"><button data-edit-product="${esc(p.id)}">Edit</button><button data-delete-product="${esc(p.id)}">×</button></div></div>`).join('') : '<div class="empty-state">No products yet.</div>';
  }

  async function loadSettings() {
    try {
      const data = await api('/api/admin/site-settings'); const s = data.settings || {};
      $('#site-public-url').value = s.publicSiteUrl || '';
      $('#site-ga-id').value = s.gaMeasurementId || '';
      $('#site-google-verification').value = s.googleSiteVerification || '';
    } catch (_) {}
  }

  async function loadPasskeys() {
    const node = $('#passkey-list');
    try {
      const data = await api('/api/admin/passkeys');
      $('#require-passkey-mfa').checked = Boolean(data.mfaRequired);
      node.innerHTML = data.credentials?.length ? data.credentials.map((key)=>`<div class="passkey-row"><div><strong>${esc(key.device_type || 'Passkey')}</strong><small>Created ${esc(fmtDate(key.created_at))}${key.last_used_at ? ` · Last used ${esc(fmtDate(key.last_used_at))}` : ''}</small></div><button type="button" data-delete-passkey="${esc(key.id)}">Remove</button></div>`).join('') : '<div class="empty-state">No passkeys registered yet.</div>';
    } catch (err) { node.innerHTML = `<div class="empty-state error-state">${esc(err.message)}</div>`; }
  }

  async function registerPasskey() {
    const status = $('#passkey-status'); if (status) status.textContent = 'Preparing passkey registration…';
    try {
      if (!window.PublicKeyCredential || !navigator.credentials) throw new Error('Passkeys are not supported by this browser/device.');
      const start = await api('/api/admin/passkeys/registration/options', { method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' });
      const credential = await navigator.credentials.create({ publicKey:registrationOptionsForBrowser(start.options) });
      if (!credential) throw new Error('Passkey registration was cancelled.');
      await api('/api/admin/passkeys/registration/verify', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ flowId:start.flowId, credential:registrationJson(credential) }) });
      if (status) status.textContent = 'Passkey registered successfully.';
      await loadPasskeys();
    } catch (err) { if (status) status.textContent = err.message || 'Could not register passkey.'; }
  }

  async function bootOps() {
    if (booted) return; booted = true;
    await Promise.allSettled([loadDashboard(), loadSystem(), loadLeads(), loadSuppliers(), loadProducts(), loadSettings(), loadPasskeys()]);
  }

  function bind() {
    $('#passkey-login')?.addEventListener('click', directPasskeyLogin);
    $('#refresh-dashboard')?.addEventListener('click', () => Promise.all([loadDashboard(), loadSystem()]));
    $('#refresh-system')?.addEventListener('click', loadSystem);
    $('#refresh-leads')?.addEventListener('click', loadLeads);
    let searchTimer = 0;
    $('#lead-search')?.addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(loadLeads, 250); });
    $('#lead-status-filter')?.addEventListener('change', loadLeads);
    $('#lead-list')?.addEventListener('click', (e) => { const row=e.target.closest('[data-lead-id]'); if(row) openLead(row.dataset.leadId); });
    $('#recent-leads')?.addEventListener('click', (e) => { const row=e.target.closest('[data-lead-id]'); if(row){ document.querySelector('[data-panel-target="leads-panel"]')?.click(); openLead(row.dataset.leadId); } });

    $('#supplier-form')?.addEventListener('submit', async (e) => { e.preventDefault(); await api('/api/admin/suppliers',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id:$('#supplier-id').value || undefined, name:$('#supplier-name').value, contactName:$('#supplier-contact').value, email:$('#supplier-email').value, phone:$('#supplier-phone').value, categories:$('#supplier-categories').value, status:$('#supplier-status').value, notes:$('#supplier-notes').value }) }); clearSupplier(); await Promise.all([loadSuppliers(),loadDashboard()]); });
    $('#supplier-clear')?.addEventListener('click', clearSupplier);
    $('#supplier-list')?.addEventListener('click', async (e) => {
      const edit=e.target.closest('[data-edit-supplier]'); const del=e.target.closest('[data-delete-supplier]');
      if(edit){ const s=suppliers.find(x=>x.id===edit.dataset.editSupplier); if(!s)return; $('#supplier-id').value=s.id; $('#supplier-name').value=s.name||''; $('#supplier-contact').value=s.contact_name||''; $('#supplier-email').value=s.email||''; $('#supplier-phone').value=s.phone||''; $('#supplier-categories').value=s.categories||''; $('#supplier-status').value=s.status||'Active'; $('#supplier-notes').value=s.notes||''; }
      if(del && confirm('Delete this supplier?')){ await api(`/api/admin/suppliers/${encodeURIComponent(del.dataset.deleteSupplier)}`,{method:'DELETE'}); await Promise.all([loadSuppliers(),loadProducts(),loadDashboard()]); }
    });

    $('#product-form')?.addEventListener('submit', async (e) => { e.preventDefault(); await api('/api/admin/products',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id:$('#product-id').value || undefined, sku:$('#product-sku').value, name:$('#product-name').value, category:$('#product-category').value, unit:$('#product-unit').value, costPrice:$('#product-cost').value, sellPrice:$('#product-sell').value, supplierId:$('#product-supplier').value || null, active:$('#product-active').value==='true', description:$('#product-description').value }) }); clearProduct(); await Promise.all([loadProducts(),loadDashboard()]); });
    $('#product-clear')?.addEventListener('click', clearProduct);
    $('#product-list')?.addEventListener('click', async (e) => {
      const edit=e.target.closest('[data-edit-product]'); const del=e.target.closest('[data-delete-product]');
      if(edit){ const p=products.find(x=>x.id===edit.dataset.editProduct); if(!p)return; $('#product-id').value=p.id; $('#product-sku').value=p.sku||''; $('#product-name').value=p.name||''; $('#product-category').value=p.category||''; $('#product-unit').value=p.unit||''; $('#product-cost').value=p.cost_price??''; $('#product-sell').value=p.sell_price??''; $('#product-supplier').value=p.supplier_id||''; $('#product-active').value=p.active ? 'true':'false'; $('#product-description').value=p.description||''; }
      if(del && confirm('Delete this product?')){ await api(`/api/admin/products/${encodeURIComponent(del.dataset.deleteProduct)}`,{method:'DELETE'}); await Promise.all([loadProducts(),loadDashboard()]); }
    });

    $('#site-settings-form')?.addEventListener('submit', async (e) => { e.preventDefault(); const status=$('#site-settings-status'); if(status)status.textContent='Saving…'; try{ await api('/api/admin/site-settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({publicSiteUrl:$('#site-public-url').value,gaMeasurementId:$('#site-ga-id').value,googleSiteVerification:$('#site-google-verification').value})}); if(status)status.textContent='SEO and analytics settings saved. Public pages update immediately.'; }catch(err){if(status)status.textContent=err.message;} });

    $('#register-passkey')?.addEventListener('click', registerPasskey);
    $('#require-passkey-mfa')?.addEventListener('change', async (e) => { const status=$('#passkey-status'); try{ await api('/api/admin/passkeys/mfa',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:e.target.checked})}); if(status)status.textContent=e.target.checked?'Passkey MFA is now required after password login.':'Passkey MFA disabled.'; }catch(err){ e.target.checked=!e.target.checked; if(status)status.textContent=err.message; } });
    $('#passkey-list')?.addEventListener('click', async (e) => { const btn=e.target.closest('[data-delete-passkey]'); if(!btn)return; if(!confirm('Remove this passkey?'))return; await api(`/api/admin/passkeys/${encodeURIComponent(btn.dataset.deletePasskey)}`,{method:'DELETE'}); await loadPasskeys(); });

    document.querySelectorAll('[data-panel-target]').forEach((button) => button.addEventListener('click', () => {
      const id=button.dataset.panelTarget;
      if(id==='ops-panel') loadDashboard(); if(id==='leads-panel') loadLeads(); if(id==='suppliers-panel') loadSuppliers(); if(id==='products-panel') loadProducts(); if(id==='integrations-panel'){loadSettings();loadSystem();} if(id==='backup-panel'){loadPasskeys();loadSystem();}
    }));
  }

  document.addEventListener('DOMContentLoaded', () => {
    bind();
    const adminView = $('#admin-view');
    if (!adminView) return;
    const maybeBoot = () => { if (!adminView.classList.contains('hidden')) bootOps(); };
    maybeBoot();
    new MutationObserver(maybeBoot).observe(adminView, { attributes:true, attributeFilter:['class'] });
  });
})();
