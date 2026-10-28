import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { adminRecoveryRoute } from '../src/admin-recovery.js';

globalThis.crypto ||= webcrypto;
const account='s.k.businessline@gmail.com';
const backupAccount='zodwangema37@gmail.com';
const destination='other.recovery@example.com'; // fictional test inbox; never send real mail.
const origin='https://amantusi-trading-pty-ltd-website.dolomite-computer.workers.dev';
const store=new Map();
const env={
 CMS_KV:{
  async get(key){return store.get(key)??null},
  async put(key,value){store.set(key,value)},
  async delete(key){store.delete(key)}
 },
 RESEND_API_KEY:'test-key',
 ALERT_FROM_EMAIL:'Amantusi Security <security@example.invalid>'
};
function b64url(input){return Buffer.from(input).toString('base64url')}
async function session(email){
 const verifier='unit-test-verifier-'+email;
 store.set('auth:credential:'+email, JSON.stringify({version:1,verifier}));
 const payload=b64url(JSON.stringify({email,version:1,exp:Date.now()+600_000,nonce:'test'}));
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(verifier),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signature=b64url(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(payload))));
 return 'amantusi_admin='+payload+'.'+signature;
}
const cookie=await session(account);
const otherCookie=await session(backupAccount);
const sent=[];
const savedFetch=globalThis.fetch;
globalThis.fetch=async (url,opts)=>{
 assert.equal(url,'https://api.resend.com/emails');
 const mail=JSON.parse(opts.body);
 sent.push(mail);
 return new Response(JSON.stringify({id:'test'}),{status:202,headers:{'content-type':'application/json'}});
};
async function call(path,body,cookieValue=cookie){
 const headers={'content-type':'application/json'};
 if(cookieValue)headers.cookie=cookieValue;
 const response=await adminRecoveryRoute(new Request(origin+path,{method:'POST',headers,body:JSON.stringify(body)}),env);
 let payload={};try{payload=await response.json()}catch(_){}
 return {status:response.status,payload};
}
try{
 let r=await call('/api/admin/recovery/email/request',{recoveryEmail:destination},'');
 assert.equal(r.status,401,'Anonymous user must not enroll');
 r=await call('/api/admin/recovery/email/request',{recoveryEmail:destination});
 assert.equal(r.status,200,'Authenticated admin can request destination proof');
 assert.equal(sent.length,1);
 assert.deepEqual(sent[0].to,[destination]);
 assert.equal(store.has('auth:verified-recovery-address:'+account),false,'Unverified destination must never become active');
 const flow=r.payload.flowId;
 const code=sent[0].text.match(/verification code is: (\d{8})/i)?.[1];
 assert.ok(code,'A mock code should be created');
 r=await call('/api/admin/recovery/email/confirm',{flowId:flow,code:'00000000'});
 assert.equal(r.status,400,'Invalid code cannot activate destination');
 assert.equal(store.has('auth:verified-recovery-address:'+account),false);
 r=await call('/api/admin/recovery/email/confirm',{flowId:flow,code});
 assert.equal(r.status,200,'Correct proof should activate separate inbox');
 assert.equal(JSON.parse(store.get('auth:verified-recovery-address:'+account)).email,destination);
 assert.equal(store.has('auth:verified-recovery-address:'+backupAccount),false,'Other admins must be untouched');
 // First setup goes to the confirmed alternate recipient, not the admin login identity.
 r=await call('/api/admin/recovery/setup/request',{});
 assert.equal(r.status,200,'Setup request should send to newly verified inbox');
 assert.deepEqual(sent[sent.length-1].to,[destination]);
 const code2=sent[sent.length-1].text.match(/verification code is: (\d{8})/i)?.[1];
 assert.ok(code2);
 r=await call('/api/admin/recovery/setup/confirm',{flowId:r.payload.flowId,code:code2,password:'Test-passphrase-2026!ThisIsStrong'});
 assert.equal(r.status,200,'Backup password can be set using alternate recovery code');
 // Existing backup method demands existing backup password when changing inbox.
 r=await call('/api/admin/recovery/email/request',{recoveryEmail:'new.recovery@example.com'});
 assert.equal(r.status,403,'Session alone cannot change existing backup inbox');
 assert.equal(JSON.parse(store.get('auth:verified-recovery-address:'+account)).email,destination);
 r=await call('/api/admin/recovery/email/request',{recoveryEmail:'new.recovery@example.com',currentBackupPassword:'Test-passphrase-2026!ThisIsStrong'});
 assert.equal(r.status,200,'Old backup password + session may request a different inbox');
 assert.equal(store.has('auth:verified-recovery-address:'+backupAccount),false);
 console.log('PASS separate inbox: session authorization, wrong-code rejection, verified activation, per-admin isolation, setup delivery, password guard and mock mail only');
} finally {
 globalThis.fetch=savedFetch;
}
