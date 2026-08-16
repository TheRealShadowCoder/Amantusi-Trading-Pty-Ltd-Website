const DEFAULT_ADMINS = ["zodwangema37@gmail.com", "s.k.businessline@gmail.com"];

function adminRecipients(env) {
  const configured = String(env.LEAD_NOTIFICATION_EMAILS || '').split(',').map((v) => v.trim()).filter(Boolean);
  return configured.length ? configured : DEFAULT_ADMINS;
}

export async function sendEmail(env, to, subject, text, idempotencyKey = '') {
  if (!env.RESEND_API_KEY || !env.ALERT_FROM_EMAIL) return { sent: false, provider: 'resend', reason: 'not-configured' };
  const recipients = Array.isArray(to) ? to : [to];
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        ...(idempotencyKey ? { 'Idempotency-Key': String(idempotencyKey).slice(0, 240) } : {})
      },
      body: JSON.stringify({ from: env.ALERT_FROM_EMAIL, to: recipients, subject, text })
    });
    return { sent: response.ok, provider: 'resend', status: response.status };
  } catch (error) {
    return { sent: false, provider: 'resend', reason: String(error?.message || error) };
  }
}

export async function sendWhatsApp(env, text) {
  const version = env.WHATSAPP_GRAPH_VERSION;
  const token = env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = env.WHATSAPP_PHONE_NUMBER_ID;
  const to = String(env.OWNER_WHATSAPP_NUMBER || '').replace(/\D/g, '');
  const template = env.WHATSAPP_ALERT_TEMPLATE;
  const language = env.WHATSAPP_TEMPLATE_LANGUAGE || 'en';
  if (!version || !token || !phoneId || !to || !template) {
    return { sent: false, provider: 'whatsapp', reason: 'not-configured' };
  }
  try {
    const response = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: template,
          language: { code: language },
          components: [{ type: 'body', parameters: [{ type: 'text', text: String(text).slice(0, 900) }] }]
        }
      })
    });
    return { sent: response.ok, provider: 'whatsapp', status: response.status };
  } catch (error) {
    return { sent: false, provider: 'whatsapp', reason: String(error?.message || error) };
  }
}

export function notificationStatus(env) {
  return {
    email: Boolean(env.RESEND_API_KEY && env.ALERT_FROM_EMAIL),
    whatsapp: Boolean(
      env.WHATSAPP_GRAPH_VERSION && env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID &&
      env.OWNER_WHATSAPP_NUMBER && env.WHATSAPP_ALERT_TEMPLATE
    )
  };
}

export async function notifyNewLead(env, lead, details) {
  const text = [
    'AMANTUSI NEW QUOTATION REQUEST',
    `Reference: ${lead.reference}`,
    `Organisation: ${details.organisation}`,
    `Contact: ${details.contactName}`,
    `Email: ${details.email}`,
    `Cell: ${details.phone || 'Not supplied'}`,
    `Type: ${details.requestType || 'General Procurement'}`,
    `Client reference: ${details.externalReference || 'N/A'}`,
    `Required by: ${details.requiredBy || 'Not specified'}`,
    `Delivery: ${details.deliveryLocation || 'Not specified'}`,
    '',
    'Requirement:',
    String(details.requirements || '').slice(0, 3000)
  ].join('\n');

  const [email, whatsapp] = await Promise.all([
    sendEmail(env, adminRecipients(env), `New Amantusi RFQ — ${lead.reference}`, text, `new-lead-${lead.id}`),
    sendWhatsApp(env, `New RFQ ${lead.reference} from ${details.organisation}. Open the Amantusi admin dashboard to review it.`)
  ]);
  return { email, whatsapp };
}

export async function notifyLeadStatus(env, lead, status) {
  const adminText = `Lead ${lead.reference} for ${lead.organisation} changed to ${status}.`;
  const tasks = [
    sendEmail(env, adminRecipients(env), `Amantusi lead ${lead.reference} — ${status}`, adminText, `lead-status-${lead.id}-${status}`),
    sendWhatsApp(env, adminText)
  ];
  if (lead.email && env.RESEND_API_KEY && env.ALERT_FROM_EMAIL) {
    tasks.push(sendEmail(
      env,
      [lead.email],
      `Update on your Amantusi request ${lead.reference}`,
      `Hello ${lead.contact_name || ''},\n\nYour request ${lead.reference} is now marked as: ${status}.\n\nAmantusi Trading Pty Ltd\n073 247 6716`,
      `client-lead-status-${lead.id}-${status}`
    ));
  }
  return Promise.all(tasks);
}

export async function notifyQuotation(env, lead, quotation) {
  const amount = quotation.amount == null ? '' : ` Amount: R${Number(quotation.amount).toFixed(2)}.`;
  const text = `Quotation ${quotation.quote_no} for ${lead.reference} is ${quotation.status}.${amount}`;
  const tasks = [
    sendEmail(env, adminRecipients(env), `Quotation ${quotation.quote_no} — ${quotation.status}`, text, `quote-${quotation.id}-${quotation.status}`),
    sendWhatsApp(env, text)
  ];
  if (lead.email && quotation.status === 'Sent' && env.RESEND_API_KEY && env.ALERT_FROM_EMAIL) {
    tasks.push(sendEmail(
      env,
      [lead.email],
      `Amantusi quotation ${quotation.quote_no}`,
      `Hello ${lead.contact_name || ''},\n\nYour quotation ${quotation.quote_no} linked to request ${lead.reference} has been marked as sent.${amount}\n\nPlease contact Amantusi Trading if you need any clarification.`,
      `client-quote-${quotation.id}-sent`
    ));
  }
  return Promise.all(tasks);
}
