/* Read-only release probe. Does not submit forms, authenticate, or mutate records. */
const root=process.env.PUBLIC_URL||process.argv[2];
if(!root){console.error('Set PUBLIC_URL to an authorized deployed website');process.exit(2)}
const base=new URL(root);
if(base.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(base.hostname))throw Error('Use HTTPS for external release verification');
const urls=['/','/catering-menu.html','/company-profile.html','/government-procurement.html','/procurement-checklist.html','/capability-statement.html','/procurement-faq.html'];
let failed=0;
const get=(pathname,opts={})=>fetch(new URL(pathname,base),{signal:AbortSignal.timeout(12000),redirect:'follow',...opts});
for(const url of urls){
 try{
  const resp=await get(url);
  const html=await resp.text();
  const ok=resp.ok&&/<h1(?:\s|>)/i.test(html)&&/<title(?:\s|>)/i.test(html);
  console.log((ok?'PASS':'FAIL')+' Public '+url+' HTTP '+resp.status);
  if(!ok)failed++;
  const csp=resp.headers.get('content-security-policy')||'';
  if(!csp.includes('frame-ancestors')){console.error('FAIL '+url+' missing frame protection');failed++;}
 }catch(e){console.error('FAIL '+url+' '+e.message);failed++;}
}
for(const [url,fragment] of [['/sitemap.xml','<urlset'],['/robots.txt','Disallow: /api/admin/']]){
 try{const resp=await get(url);const body=await resp.text();if(!resp.ok||!body.includes(fragment)){console.error('FAIL '+url);failed++;}else console.log('PASS '+url)}
 catch(e){console.error('FAIL '+url+' '+e.message);failed++}
}
try{
 const resp=await get('/api/health');
 const data=await resp.json();
 const healthy=resp.ok&&data.ok===true;
 console.log((healthy?'PASS':'FAIL')+' API health '+resp.status);
 if(!healthy)failed++;
}catch(e){console.error('FAIL API health '+e.message);failed++}
try{
 const resp=await get('/api/admin/dashboard',{redirect:'manual'});
 const ok=resp.status===401||resp.status===403||resp.status===302||resp.status===303;
 console.log((ok?'PASS':'FAIL')+' Admin authorization '+resp.status);
 if(!ok)failed++;
}catch(e){console.error('FAIL Admin authorization '+e.message);failed++}
if(failed){console.error(failed+' release check(s) failed');process.exitCode=1}
else console.log('PASS All read-only release checks');
