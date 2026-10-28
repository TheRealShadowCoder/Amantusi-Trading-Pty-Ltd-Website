/**
 * Interactive local-only Gmail OAuth authorization.
 * Run in your own terminal. Do not paste the resulting refresh token into chat.
 */
import http from 'node:http';
import {randomBytes} from 'node:crypto';
import {URL} from 'node:url';

const CLIENT_ID=String(process.env.GMAIL_OAUTH_CLIENT_ID||'').trim();
const CLIENT_SECRET=String(process.env.GMAIL_OAUTH_CLIENT_SECRET||'').trim();
const SENDER=String(process.env.GMAIL_SENDER_EMAIL||'').trim().toLowerCase();
if(!CLIENT_ID||!CLIENT_SECRET||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(SENDER)){
 console.error('Set GMAIL_OAUTH_CLIENT_ID, GMAIL_OAUTH_CLIENT_SECRET and GMAIL_SENDER_EMAIL in your LOCAL terminal.');
 process.exit(2);
}
const redirect='http://127.0.0.1:8765/callback';
const state=randomBytes(32).toString('hex');
const oauth=new URL('https://accounts.google.com/o/oauth2/v2/auth');
for(const [k,v] of Object.entries({
 client_id:CLIENT_ID,redirect_uri:redirect,response_type:'code',
 access_type:'offline',prompt:'consent',
 scope:'openid email https://www.googleapis.com/auth/gmail.send',
 state,login_hint:SENDER,include_granted_scopes:'false'
}))oauth.searchParams.set(k,v);

let finished=false;
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url||'/',redirect);
 if(url.pathname!=='/callback'){res.writeHead(404).end('Not found');return}
 if(finished){res.writeHead(409).end('Authorization already completed');return}
 if(url.searchParams.get('state')!==state){
  res.writeHead(403).end('Invalid OAuth state');return;
 }
 const code=url.searchParams.get('code');
 if(!code){
  res.writeHead(400).end('Google did not return an authorization code');
  console.error('Authorization rejected or cancelled.');
  finished=true;server.close();return;
 }
 finished=true;
 try{
  const result=await fetch('https://oauth2.googleapis.com/token',{
   method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
   body:new URLSearchParams({
    client_id:CLIENT_ID,client_secret:CLIENT_SECRET,redirect_uri:redirect,
    grant_type:'authorization_code',code
   })
  });
  if(!result.ok)throw Error('Google code exchange failed (HTTP '+result.status+')');
  const tokens=await result.json();
  if(!tokens.refresh_token||!tokens.access_token)throw Error('Offline refresh token unavailable. Revoke the old grant if necessary and retry.');
  const user=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{
   headers:{Authorization:'Bearer '+tokens.access_token}
  });
  if(!user.ok)throw Error('Unable to verify the sending Google identity');
  const identity=await user.json();
  if(!identity.email_verified || String(identity.email||'').toLowerCase()!==SENDER){
   throw Error('Signed-in Gmail identity does not match GMAIL_SENDER_EMAIL. Do NOT save this token.');
  }
  res.writeHead(200,{'content-type':'text/plain;charset=UTF-8','cache-control':'no-store'}).end('Gmail sender authorized. Return to your terminal.');
  console.log('\nSender verified: '+SENDER);
  console.log('Store this token immediately as the private GitHub Actions secret GMAIL_REFRESH_TOKEN.');
  console.log('Never paste it in chat or commit it to a repository.');
  console.log('\nGMAIL_REFRESH_TOKEN='+tokens.refresh_token+'\n');
 }catch(error){
  res.writeHead(400,{'content-type':'text/plain;charset=UTF-8','cache-control':'no-store'}).end('Authorization failed. See your local terminal.');
  console.error(error.message);
 }finally{server.close()}
});
server.listen(8765,'127.0.0.1',()=>{
 console.log('Open this authorization URL in your OWN browser on the same computer:\n'+oauth.toString());
 console.log('\nWaiting for Google callback on '+redirect+' (Ctrl+C to cancel).');
});
server.on('error',error=>{console.error('Unable to start localhost callback:',error.message);process.exitCode=1});
