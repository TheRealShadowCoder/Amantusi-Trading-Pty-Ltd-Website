/* Authenticated admin UX helpers; never bypasses server-side access checks. */
(() => {
'use strict';

function addLocalFilter(listSelector,label){
 const list=document.querySelector(listSelector);
 if(!list||list.dataset.refinement==='1')return;
 list.dataset.refinement='1';
 const bar=document.createElement('div');bar.className='admin-list-refinement';
 const input=document.createElement('input');input.type='search';input.placeholder='Filter by name, category or details';input.setAttribute('aria-label',label);
 const select=document.createElement('select');select.setAttribute('aria-label','Sort displayed records');
 select.innerHTML='<option value="default">Original order</option><option value="asc">Name A–Z</option><option value="desc">Name Z–A</option>';
 const count=document.createElement('span');count.setAttribute('role','status');count.className='admin-refinement-count';
 bar.append(input,select,count);list.before(bar);
 const apply=()=>{
  const rows=[...list.querySelectorAll(':scope > .db-row')];
  if(!rows.length){count.textContent='No records to filter';return;}
  if(select.value!=='default'){
   const ordered=[...rows].sort((a,b)=>(a.querySelector('strong')?.textContent||'').localeCompare(b.querySelector('strong')?.textContent||'')*(select.value==='asc'?1:-1));
   if(ordered.some((row,index)=>row!==rows[index]))ordered.forEach(row=>list.append(row));
  }
  let shown=0;
  const term=input.value.toLocaleLowerCase().trim();
  for(const row of rows){
   const visible=!term||row.textContent.toLocaleLowerCase().includes(term);
   row.hidden=!visible;
   if(visible)shown++;
  }
  count.textContent=shown+' of '+rows.length+' records';
 };
 let frame=0;
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;apply();});};
 new MutationObserver(schedule).observe(list,{childList:true});
 input.addEventListener('input',schedule);
 select.addEventListener('change',schedule);
 apply();
}

function init(){
 addLocalFilter('#supplier-list','Filter displayed suppliers');
 addLocalFilter('#product-list','Filter displayed products');
 const dashboard=document.querySelector('#admin-view');if(!dashboard)return;
 document.querySelectorAll('.admin-field').forEach(group=>{
  const label=group.querySelector('label'),field=group.querySelector('input[id],textarea[id],select[id]');
  if(label&&field){label.htmlFor=field.id;}
 });
 const search=document.querySelector('#lead-search');
 search?.setAttribute('aria-label','Search leads by reference, organisation, contact or email');
 document.querySelector('#lead-status-filter')?.setAttribute('aria-label','Filter leads by status');
 for(const id of ['cms-status','passkey-status'])document.getElementById(id)?.setAttribute('role','status');
 const filters=document.querySelector('.lead-filters');
 if(!filters||filters.querySelector('[data-admin-export-csv]'))return;
 const button=document.createElement('button');
 button.type='button';button.className='admin-button secondary';button.textContent='Export filtered CSV';button.dataset.adminExportCsv='1';
 button.title='Download a CSV of the matching leads for your authorized procurement records';
 const result=document.createElement('span');result.className='admin-enhancement-status';result.setAttribute('role','status');result.setAttribute('aria-live','polite');
 filters.append(button,result);
 const cell=value=>{
  let str=String(value??'').replace(/[\r\n]+/g,' ').trim();
  if(/^[=+\-@]/.test(str))str="'"+str;
  return '"'+str.replaceAll('"','""')+'"';
 };
 button.addEventListener('click',async()=>{
  button.disabled=true;result.textContent='Preparing CSV…';
  try{
   const query=new URLSearchParams({search:search?.value||'',status:document.querySelector('#lead-status-filter')?.value||'',limit:'100'});
   const response=await fetch('/api/admin/leads?'+query.toString(),{credentials:'same-origin',cache:'no-store'});
   if(!response.ok)throw new Error(response.status===401?'Administrator session expired. Sign in again.':'Unable to retrieve lead records.');
   const payload=await response.json();
   const leads=Array.isArray(payload.leads)?payload.leads:[];
   if(!leads.length){result.textContent='No matching leads to export.';return;}
   const columns=[['reference','Reference'],['organisation','Organisation'],['contact_name','Contact'],['email','Email'],['phone','Phone'],['request_type','Request type'],['status','Status'],['created_at','Created at']];
   const csv=[columns.map(x=>cell(x[1])).join(','),...leads.map(lead=>columns.map(([key])=>cell(lead[key])).join(','))].join('\r\n');
   const blob=new Blob(['\ufeff',csv],{type:'text/csv;charset=utf-8'});
   const url=URL.createObjectURL(blob);
   const link=document.createElement('a');link.href=url;link.download='amantusi-leads-'+new Date().toISOString().slice(0,10)+'.csv';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
   result.textContent='Exported '+leads.length+' matching records. Store this file securely.';
  }catch(e){result.textContent=e.message||'CSV export failed.'}
  finally{button.disabled=false}
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
