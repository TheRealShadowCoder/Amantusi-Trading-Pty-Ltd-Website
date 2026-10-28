/* Read-only inspection of a deployed Amantusi Worker. No OAuth attempts, email sends, uploads or customer record changes. */
const baseRaw=process.env.PUBLIC_URL||process.argv[2];
if(!baseRaw){console.error('Set PUBLIC_URL to the authorized production or staging URL');process.exit(2)}
const base=new URL(baseRaw);
if(base.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(base.hostname))throw Error('HTTPS required');
const get=async path=>{
 const u=new URL(path,base);
 const r=await fetch(u,{headers:{accept:'application/json'},redirect:'manual',signal:AbortSignal.timeout(18000)});
 let data={};try{data=await r.json()}catch(_){}
 return {ok:r.ok,status:r.status,data};
};
const [health,google,recovery]=await Promise.allSettled([
 get('/api/health'),
 get('/api/admin/google/oauth/diagnostics'),
 get('/api/admin/recovery/config')
]);
const good=x=>x.status==='fulfilled'&&x.value.ok;
const availability={
 core:good(health)&&health.value.data.ok===true&&health.value.data.kv===true&&health.value.data.database===true,
 googleClientConfigured:good(google)&&google.value.data.configured===true,
 googleEndToEndLogin:'UNVERIFIED_REQUIRES_AUTHORIZED_BROWSER_SIGN_IN',
 recoveryEmailConfigured:good(recovery)&&recovery.value.data.emailDelivery===true,
 privateR2Bound:good(health)&&health.value.data.r2===true
};
const names={
 core:'D1 + KV platform',
 googleClientConfigured:'Google client ID and redirect diagnostics',
 recoveryEmailConfigured:'Verified email recovery configuration',
 privateR2Bound:'Private R2 binding'
};
for(const [key,label] of Object.entries(names))console.log((availability[key]?'READY':'NOT READY')+' '+label);
console.log('UNVERIFIED Google end-to-end login (must authenticate with allowlisted admin account)');
console.log('This probe does not test delivery, permissions, actual upload/readback or Google account authorization.');
const hardFailures=Object.keys(names).filter(k=>!availability[k]);
if(process.env.GITHUB_STEP_SUMMARY){
 const fs=await import('node:fs');
 fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
  '\n### Amantusi integration readiness (read-only)\n\n'+
  Object.entries(names).map(([key,label])=>'- '+(availability[key]?'READY':'NOT READY')+' — '+label).join('\n')+
  '\n- Google authorized administrator login: not tested by this probe\n');
}
if(process.env.STRICT_INTEGRATIONS==='1'&&hardFailures.length){
 console.error('Required integrations incomplete: '+hardFailures.join(', '));process.exitCode=1;
}
