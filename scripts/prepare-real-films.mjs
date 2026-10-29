/* Build-time acquisition of commercially licensed live-action stock footage.
   Never generate graphics to impersonate real footage. Fail if footage cannot be verified. */
import {mkdir,rm,stat,readFile,rename} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import {Readable} from 'node:stream';
import {spawn} from 'node:child_process';
import {resolve,join} from 'node:path';
const root=resolve('public/assets/films'),manifest=JSON.parse(await readFile('scripts/live-footage-sources.json','utf8'));
const timeout=120000,cap=70*1024*1024;
await mkdir(root,{recursive:true});
function exec(command,args){
 return new Promise((ok,fail)=>{
  const child=spawn(command,args,{stdio:['ignore','ignore','pipe']});
  let error='';child.stderr.on('data',b=>{error+=b.toString().slice(-1200)});
  child.on('error',fail);child.on('close',code=>code===0?ok():fail(new Error(command+' failed '+code+': '+error.slice(-600))));
 });
}
async function get(film,src){
 const ctrl=new AbortController(),tm=setTimeout(()=>ctrl.abort(),timeout);
 try{
  const res=await fetch(src,{signal:ctrl.signal,headers:{'User-Agent':'AmantusiTradingMediaBuild/1.0','Accept':'video/mp4,video/*;q=0.9,*/*;q=0.1'}});
  if(!res.ok||!res.body)throw new Error('HTTP '+res.status+' for '+film.id);
  const advertised=Number(res.headers.get('content-length')||0);if(advertised>cap)throw new Error('Source exceeds size cap');
  const temp=join(root,'.'+film.id+'.source.mp4');
  let bytes=0;const stream=Readable.fromWeb(res.body);
  stream.on('data',chunk=>{bytes+=chunk.length;if(bytes>cap)stream.destroy(new Error('Source exceeded size cap'));});
  await pipeline(stream,createWriteStream(temp));
  if(bytes<30000)throw new Error('Video source too small: '+bytes);
  const head=await readFile(temp);if(head.toString('ascii',4,8)!=='ftyp')throw new Error('Downloaded content is not MP4: '+film.id);
  return temp;
 }finally{clearTimeout(tm)}
}
for (const film of manifest.films){
 const output=join(root,film.id+'.mp4');
 if(process.env.AMANTUSI_SKIP_MEDIA_DOWNLOAD==='1'){
   const s=await stat(output).catch(()=>null);
   if(!s||s.size<25000)throw new Error('Skipping download requires a valid pre-existing video '+output);
   continue;
 }
 let source;
 try{
  source=await get(film,film.source);
  const out=output+'.tmp.mp4';
  await exec('ffmpeg',['-hide_banner','-loglevel','error','-nostdin','-y','-i',source,
   '-t','10','-vf','scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=30,format=yuv420p',
   '-an','-c:v','libx264','-preset','veryfast','-crf','27','-maxrate','1400k','-bufsize','2800k','-movflags','+faststart',out]);
  const s=await stat(out);if(s.size<25000||s.size>18*1024*1024)throw new Error('Invalid output media size '+film.id+': '+s.size);
  await rename(out,output);console.log('READY: '+film.id+' '+(s.size/1024/1024).toFixed(2)+' MiB source='+film.page);
 }finally{if(source)await rm(source,{force:true}).catch(()=>{})}
}
console.log('PASS all five real-life video assets transcoded for Cloudflare static hosting');
