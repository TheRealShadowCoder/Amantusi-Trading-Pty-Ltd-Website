import assert from 'node:assert/strict';
import {notifyNewLead} from '../src/notifications.js';

const original=globalThis.fetch;
const calls=[];
globalThis.fetch=async (url,options={})=>{
 calls.push({url:String(url),body:JSON.parse(options.body||'{}')});
 return new Response(JSON.stringify({id:'test-message'}),{status:202,headers:{'content-type':'application/json'}});
};
try{
 const lead={id:'lead-test',reference:'AMT-TEST-RFQ-1'};
 const details={organisation:'Example Company',contactName:'Test Person',email:'buyer@example.com',phone:'000',requestType:'General Procurement',requirements:'CONFIDENTIAL ITEM LIST NOT FOR CLIENT RECEIPT'};
 const env={RESEND_API_KEY:'mock-token',ALERT_FROM_EMAIL:'Amantusi <no-reply@example.com>',LEAD_NOTIFICATION_EMAILS:'admin@example.com'};
 const disabled=await notifyNewLead(env,lead,details);
 assert.equal(disabled.email.sent,true);
 assert.equal(disabled.receipt.sent,false);
 assert.equal(calls.length,1,'No automatic customer receipt without explicit opt-in');
 assert.deepEqual(calls[0].body.to,['admin@example.com']);
 const enabled=await notifyNewLead({...env,SEND_CUSTOMER_RECEIPT_EMAIL:'true'},lead,details);
 assert.equal(enabled.email.sent,true);
 assert.equal(enabled.receipt.sent,true);
 assert.equal(calls.length,3,'Admin and customer notification when enabled');
 assert.deepEqual(calls[2].body.to,['buyer@example.com']);
 assert.ok(calls[2].body.subject.includes(lead.reference));
 assert.ok(!calls[2].body.text.includes('CONFIDENTIAL ITEM LIST'));
 assert.ok(calls[2].body.text.includes('not confirmation of inventory'));
 console.log('PASS customer acknowledgement remains opt-in and omits confidential RFQ contents');
} finally {globalThis.fetch=original}
