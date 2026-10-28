/**
 * Gmail API delivery for Amantusi.
 * Requires a Gmail-authorized OAuth2 refresh token with ONLY gmail.send scope.
 * This does not alter the existing Google admin login or access to inbox contents.
 * Never log or persist access tokens, refresh tokens, or message bodies.
 */
const EMAIL=/^[^\s<>"@,]+@[^\s<>"@,]+\.[^\s<>"@,]+$/;

export function gmailConfigured(env) {
  return Boolean(
    String(env.GMAIL_OAUTH_CLIENT_ID || '').trim() &&
    String(env.GMAIL_OAUTH_CLIENT_SECRET || '').trim() &&
    String(env.GMAIL_REFRESH_TOKEN || '').trim() &&
    EMAIL.test(String(env.GMAIL_SENDER_EMAIL || '').trim())
  );
}

const toBytes=(value)=>new TextEncoder().encode(String(value));
function encodeBase64(bytes) {
  let binary='';
  for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(binary);
}
const encodeBase64Url=(bytes)=>encodeBase64(bytes).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');

function buildMime(sender, recipients, subject, message) {
  // Reject header injection rather than attempting to escape untrusted headers.
  if (/[\r\n]/.test(subject) || /[\r\n]/.test(sender) || recipients.some(x=>/[\r\n]/.test(x))) {
    throw new Error('invalid-email-header');
  }
  const encodedSubject='=?UTF-8?B?'+encodeBase64(toBytes(subject))+'?=';
  const encodedBody=encodeBase64(toBytes(message)).match(/.{1,76}/g)?.join('\r\n') || '';
  return [
    'From: '+sender,
    'To: '+recipients.join(', '),
    'Subject: '+encodedSubject,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    encodedBody
  ].join('\r\n');
}

export async function sendGmailEmail(env, to, subject, text, _idempotencyKey='') {
  if(!gmailConfigured(env))return {sent:false,provider:'gmail',reason:'not-configured'};
  const sender=String(env.GMAIL_SENDER_EMAIL).trim();
  const recipients=(Array.isArray(to)?to:[to]).map(x=>String(x||'').trim());
  if(!recipients.length || recipients.length>20 || !recipients.every(x=>EMAIL.test(x))) {
    return {sent:false,provider:'gmail',reason:'invalid-recipient'};
  }
  if(String(subject||'').length>250 || String(text||'').length>25000) {
    return {sent:false,provider:'gmail',reason:'message-too-large'};
  }
  let mime;
  try {mime=buildMime(sender,recipients,String(subject||''),String(text||''))}
  catch(_) {return {sent:false,provider:'gmail',reason:'invalid-header'}}
  try {
    const grant=await fetch('https://oauth2.googleapis.com/token',{
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({
        client_id:String(env.GMAIL_OAUTH_CLIENT_ID),
        client_secret:String(env.GMAIL_OAUTH_CLIENT_SECRET),
        refresh_token:String(env.GMAIL_REFRESH_TOKEN),
        grant_type:'refresh_token'
      }),
      signal:AbortSignal.timeout(15000)
    });
    if(!grant.ok)return {sent:false,provider:'gmail',status:grant.status,reason:'token-refresh-failed'};
    const token=await grant.json();
    if(typeof token.access_token!=='string' || !token.access_token) {
      return {sent:false,provider:'gmail',reason:'missing-access-token'};
    }
    const sent=await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{
      method:'POST',
      headers:{
        Authorization:'Bearer '+token.access_token,
        'Content-Type':'application/json'
      },
      body:JSON.stringify({raw:encodeBase64Url(toBytes(mime))}),
      signal:AbortSignal.timeout(15000)
    });
    return sent.ok
      ? {sent:true,provider:'gmail',status:sent.status}
      : {sent:false,provider:'gmail',status:sent.status,reason:'gmail-send-failed'};
  } catch(_error) {
    return {sent:false,provider:'gmail',reason:'provider-unavailable'};
  }
}
