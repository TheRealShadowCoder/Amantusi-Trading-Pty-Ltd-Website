import assert from 'node:assert/strict';
import {gmailConfigured,sendGmailEmail} from '../src/gmail-delivery.js';
const env={
 GMAIL_OAUTH_CLIENT_ID:'test-client-id',GMAIL_OAUTH_CLIENT_SECRET:'test-client-secret',
 GMAIL_REFRESH_TOKEN:'test-refresh-token',GMAIL_SENDER_EMAIL:'sender@example.com'
};
assert.equal(gmailConfigured({}),false);
assert.equal((await sendGmailEmail({},['recipient@example.com'],'Test','Hello')).sent,false);
assert.equal(gmailConfigured(env),true);
const calls=[];
const original=globalThis.fetch;
globalThis.fetch=async (url,options)=>{
 calls.push({url,options});
 if(url==='https://oauth2.googleapis.com/token')return new Response(JSON.stringify({access_token:'test-access'}),{status:200,headers:{'content-type':'application/json'}});
 assert.equal(url,'https://gmail.googleapis.com/gmail/v1/users/me/messages/send');
 assert.equal(options.headers.Authorization,'Bearer test-access');
 const mime=Buffer.from(JSON.parse(options.body).raw,'base64url').toString('utf8');
 assert.match(mime,/From: sender@example.com/);
 assert.match(mime,/To: receiver@example.com/);
 assert.match(mime,/Content-Transfer-Encoding: base64/);
 const content=Buffer.from(mime.split('\r\n\r\n')[1].replace(/\s/g,''),'base64').toString('utf8');
 assert.equal(content,'One-time code for Åmántusi');
 return new Response(JSON.stringify({id:'sent-id'}),{status:200,headers:{'content-type':'application/json'}});
};
try{
 const result=await sendGmailEmail(env,['receiver@example.com'],'Account verification','One-time code for Åmántusi');
 assert.equal(result.sent,true);
 assert.equal(result.provider,'gmail');
 assert.equal(new URLSearchParams(calls[0].options.body).get('refresh_token'),'test-refresh-token');
 assert.equal(calls.length,2);
 assert.equal((await sendGmailEmail(env,['receiver@example.com'],'Injected\r\nBcc:someone@example.com','test')).sent,false);
 assert.equal(calls.length,2,'Invalid headers must fail before hitting Google');
 assert.equal((await sendGmailEmail(env,['invalid\r\nBcc@example.com'],'test','test')).sent,false);
 assert.equal(calls.length,2,'Invalid recipients must fail before token refresh');
 console.log('PASS Gmail-only send: refresh scope credential, UTF-8 message MIME, API dispatch, header safeguards');
} finally{globalThis.fetch=original}
