import http from 'node:http';
import crypto from 'node:crypto';

const port=Number(process.env.PORT||8080);
const secret=String(process.env.AMANTUSI_OVERFLOW_SHARED_SECRET||'');
const maxBody=256_000;

function json(res,status,payload){
  const body=JSON.stringify(payload);
  res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','content-length':Buffer.byteLength(body)});
  res.end(body);
}
function safeEqual(a,b){
  const left=Buffer.from(String(a||'')),right=Buffer.from(String(b||''));
  if(left.length!==right.length)return false;
  return crypto.timingSafeEqual(left,right);
}
async function readBody(req){
  let size=0;const chunks=[];
  for await(const chunk of req){size+=chunk.length;if(size>maxBody)throw new Error('payload-too-large');chunks.push(chunk)}
  const raw=Buffer.concat(chunks).toString('utf8');
  return raw?JSON.parse(raw):{};
}

const server=http.createServer(async(req,res)=>{
  if(req.method==='GET'&&req.url==='/health')return json(res,200,{ok:true,provider:'google-cloud-run',mode:'overflow',version:1});
  if(req.method!=='POST'||req.url!=='/task')return json(res,404,{error:'not-found'});
  if(!secret||!safeEqual(req.headers['x-amantusi-overflow-secret'],secret))return json(res,401,{error:'unauthorized'});
  try{
    const body=await readBody(req);
    const type=String(body.type||'');
    if(!['document-preview','integration-batch','report-prep'].includes(type))return json(res,400,{error:'unsupported-task'});
    return json(res,200,{ok:true,type,requestId:crypto.randomUUID(),acceptedAt:new Date().toISOString()});
  }catch(error){
    if(error?.message==='payload-too-large')return json(res,413,{error:'payload-too-large'});
    return json(res,400,{error:'invalid-request'});
  }
});
server.keepAliveTimeout=5_000;
server.listen(port,'0.0.0.0',()=>console.log(`Amantusi overflow service listening on ${port}`));
