import assert from 'node:assert/strict';
import {notifyNewLead} from '../src/notifications.js';

const original=globalThis.fetch;
const calls=[];
globalThis.fetch=async (url,options={})=>{
 if(url==='https://oauth2.googleapis.com/token') {
  const grant=new URLSearchParams(options.body);
  assert.equal(grant.get('grant_type'),'refresh_token');
  return new Response(JSON.stringify({access_token:'mock-access-token'}),{status:200,headers:{'content-type':'application/json'}});
 }
 assert.equal(url,'https://gmail.googleapis.com/gmail/v1/users/me/messages/send');
 const mime=Buffer.from(JSON.parse(options.body||'{}').raw,'base64url').toString('utf8');
 const [header,body]=mime.split('\r\n\r\n');
 const to=header.match(/^To: ([^\r\n]+)/m)?.[1]?.split(', ');
 calls.push({to,header,body:Buffer.from((body||'').replace(/\s/g,''),'base64').toString('utf8')});
 return new Response(JSON.stringify({id:'test-message'}),{status:200,headers:{'content-type':'application/json'}});
};
try {
 const lead={id:'lead-test',reference:'AMT-TEST-RFQ-1'};
 const details={organisation:'Example Company',contactName:'Test Person',email:'buyer@example.com',phone:'000',requestType:'General Procurement',requirements:'CONFIDENTIAL ITEM LIST NOT FOR CLIENT RECEIPT'};
 const env={GMAIL_OAUTH_CLIENT_ID:'mock-client-id',GMAIL_OAUTH_CLIENT_SECRET:'mock-client-secret',GMAIL_REFRESH_TOKEN:'mock-refresh-token',GMAIL_SENDER_EMAIL:'sender@example.com',LEAD_NOTIFICATION_EMAILS:'admin@example.com'};
 const disabled=await notifyNewLead(env,lead,details);
 assert.equal(disabled.email.sent,true);
 assert.equal(disabled.receipt.sent,false);
 assert.equal(calls.length,1,'No automatic customer receipt without explicit opt-in');
 assert.deepEqual(calls[0].to,['admin@example.com']);
 const enabled=await notifyNewLead({...env,SEND_CUSTOMER_RECEIPT_EMAIL:'true'},lead,details);
 assert.equal(enabled.email.sent,true);
 assert.equal(enabled.receipt.sent,true);
 assert.equal(calls.length,3,'Admin and customer notification when enabled');
 assert.deepEqual(calls[2].to,['buyer@example.com']);
 assert.ok(calls[2].header.includes(lead.reference));
 assert.ok(!calls[2].body.includes('CONFIDENTIAL ITEM LIST'));
 assert.ok(calls[2].body.includes('not confirmation of inventory'));
 console.log('PASS Gmail customer receipt remains opt-in and omits confidential RFQ contents');
} finally {globalThis.fetch=original}
