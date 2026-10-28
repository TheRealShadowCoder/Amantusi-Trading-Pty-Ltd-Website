/* Structured RFQ line items, context-specific fields, accessible upload progress.
   Submits only through the existing /api/quote endpoint and does not save attachments. */
(() => {
'use strict';
const form=document.getElementById('quote-form');
if(!form)return;
const requirements=form.elements.namedItem('requirements');
const type=form.elements.namedItem('type');
const status=document.getElementById('form-status');
if(!(requirements instanceof HTMLTextAreaElement)||!(type instanceof HTMLSelectElement))return;
const panel=document.createElement('fieldset');
panel.className='rfq-composer';panel.setAttribute('aria-labelledby','rfq-items-title');
panel.innerHTML=`<legend id="rfq-items-title">Optional structured line items</legend>
<p>Use this table to organize quantities and unit specifications. Your list will be included in the written RFQ when submitted.</p>
<div class="rfq-items" data-rfq-items></div>
<button class="rfq-add-row" type="button" data-rfq-add>+ Add item</button>
<p class="rfq-composer-state" data-rfq-item-status role="status" aria-live="polite"></p>`;
const target=requirements.closest('label')||requirements;
target.before(panel);
const container=panel.querySelector('[data-rfq-items]'),add=panel.querySelector('[data-rfq-add]'),itemStatus=panel.querySelector('[data-rfq-item-status]');
function makeRow(item={}) {
 const row=document.createElement('div');row.className='rfq-item-row';
 row.innerHTML=`<label>Item / specification <input type="text" data-rfq-name maxlength="180" autocomplete="off" placeholder="e.g. A4 paper, 80 gsm"></label>
 <label>Qty <input type="number" data-rfq-qty min="1" max="1000000" step="1" inputmode="numeric" value="1"></label>
 <label>Unit <select data-rfq-unit><option>Each</option><option>Pack</option><option>Box</option><option>Carton</option><option>Case</option><option>Kg</option><option>Litre</option><option>Set</option><option>Service</option></select></label>
 <button type="button" class="rfq-remove-row" aria-label="Remove this line item">Remove</button>`;
 row.querySelector('[data-rfq-name]').value=item.name||'';
 row.querySelector('[data-rfq-qty]').value=item.qty||1;
 row.querySelector('[data-rfq-unit]').value=item.unit||'Each';
 row.querySelector('.rfq-remove-row').addEventListener('click',()=>{row.remove();sync();});
 container.append(row);sync();row.querySelector('[data-rfq-name]').focus();
}
function readRows(){
 return [...container.querySelectorAll('.rfq-item-row')].map(row=>({
  name:row.querySelector('[data-rfq-name]').value.trim(),
  qty:row.querySelector('[data-rfq-qty]').value.trim(),
  unit:row.querySelector('[data-rfq-unit]').value
 }));
}
function sync(){
 const n=container.querySelectorAll('.rfq-item-row').length;
 itemStatus.textContent=n? n+' line item'+(n===1?'':'s')+' included in this draft.':'No structured line items added.';
}
add.addEventListener('click',()=>makeRow());
container.addEventListener('input',sync);
const extras=document.createElement('div');extras.className='rfq-context';
extras.innerHTML=`<fieldset class="rfq-context-group" data-context="Government RFQ / Tender" hidden><legend>Government procurement detail</legend><div class="rfq-context-grid"><label>Tender / RFQ closing time (optional)<input type="time" name="tenderClosingTime"></label><label>Mandatory specification standard (optional)<input name="standardReference" maxlength="150" placeholder="Reference or standard"></label></div><p>Attach the official RFQ documents if available; always follow the buyer's published conditions.</p></fieldset>
<fieldset class="rfq-context-group" data-context="Catering" hidden><legend>Catering event detail</legend><div class="rfq-context-grid"><label>Guest count (optional)<input name="eventGuests" type="number" min="1" max="50000" inputmode="numeric" placeholder="Number of guests"></label><label>Event time (optional)<input name="eventTime" type="time"></label><label>Event venue (optional)<input name="eventVenue" autocomplete="street-address" maxlength="220"></label><label>Service format (optional)<select name="eventService"><option value="">Select</option><option>Delivery only</option><option>Buffet</option><option>On-site service</option><option>Platters / refreshments</option><option>To be agreed</option></select></label></div><label>Dietary requirements / allergies (optional)<textarea name="eventDietary" rows="3" placeholder="Describe any restrictions that must be confirmed"></textarea></label><p>Please independently confirm allergy requirements and final menus before placing an order.</p></fieldset>
<fieldset class="rfq-context-group" data-context="General Procurement" hidden><legend>Other sourcing detail</legend><label>Substitutions <select name="alternatives"><option value="">Please clarify alternatives if needed</option><option>Accept equivalent specifications</option><option>Exact specifications only</option></select></label></fieldset>`;
panel.after(extras);
const referral=document.createElement('label');
referral.className='rfq-referral';
referral.innerHTML='How did you hear about Amantusi? (optional)<select name="referralSource"><option value="">Select if relevant</option><option>Returning client</option><option>Business referral</option><option>Search engine</option><option>Online directory</option><option>Public procurement communication</option><option>Other</option></select>';
extras.after(referral);
const deadline=form.elements.namedItem('deadline');
if(deadline instanceof HTMLInputElement){
 const guidance=document.createElement('small');guidance.className='rfq-deadline-hint';guidance.textContent='Target date only. Supply and delivery dates require confirmation.';
 guidance.id='rfq-deadline-hint';
 deadline.setAttribute('aria-describedby','rfq-deadline-hint');deadline.after(guidance);
}

function updateContext(){
 const selected=type.value;
 extras.querySelectorAll('fieldset[data-context]').forEach(field=>{
  const show=field.dataset.context===selected;
  field.hidden=!show;
  field.querySelectorAll('input,select,textarea').forEach(control=>{control.disabled=!show;});
 });
}
type.addEventListener('change',updateContext);
updateContext();
let generated='',baseText='';
function safeText(value){return String(value||'').replace(/[\r\n\t]+/g,' ').trim().slice(0,240)}
function decorateRequirements(){
 const rows=readRows();
 const incomplete=rows.find(r=>!r.name||!Number.isInteger(+r.qty)||+r.qty<1||+r.qty>1000000);
 if(incomplete){
  itemStatus.textContent='Complete item names and positive whole-number quantities before submitting.';
  const row=[...container.querySelectorAll('.rfq-item-row')][rows.indexOf(incomplete)];
  row?.querySelector(!incomplete.name?'[data-rfq-name]':'[data-rfq-qty]')?.focus();
  return false;
 }
 const base=generated&&requirements.value.endsWith(generated) ? requirements.value.slice(0,-generated.length) : requirements.value;
 baseText=base;
 let lines=[];
 if(rows.length)lines.push('LINE ITEMS:',...rows.map((r,i)=>`${i+1}. ${safeText(r.name)} — ${r.qty} ${safeText(r.unit)}`));
 for(const fs of extras.querySelectorAll('fieldset[data-context]:not([hidden])')){
  const values=[...fs.querySelectorAll('input,select,textarea')].filter(el=>!el.disabled&&el.value.trim()).map(el=>{
    const label=el.closest('label')?.textContent.replace(/\(optional\)/gi,'').trim()||el.name;
    return `${safeText(label)}: ${safeText(el.value)}`;
  });
  if(values.length)lines.push('ADDITIONAL '+safeText(type.value).toUpperCase()+' DETAILS:',...values);
 }
 if(referral.querySelector('select').value)lines.push('REFERRAL SOURCE: '+safeText(referral.querySelector('select').value));
 generated=lines.length?'\n\n'+lines.join('\n'):'';
 requirements.value=base+generated;
 requirements.dispatchEvent(new Event('input',{bubbles:true}));
 return true;
}
form.addEventListener('submit',event=>{
 if(!decorateRequirements()){event.preventDefault();event.stopImmediatePropagation();return;}
},true);
form.addEventListener('reset',()=>{
 generated='';baseText='';
 container.replaceChildren();sync();
 requestAnimationFrame(updateContext);
});
const privacy=document.createElement('p');privacy.className='rfq-privacy';
privacy.innerHTML='Information in your RFQ is sent to Amantusi for responding to your enquiry. <a href="/information-handling.html">Read the information-handling notice</a>. Only share personal or confidential documents when necessary.';
const submit=form.querySelector('[type="submit"]');if(submit)submit.before(privacy);
const progress=document.createElement('div');progress.className='rfq-upload-progress';progress.hidden=true;
progress.innerHTML='<div role="progressbar" aria-label="RFQ upload" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div><p role="status" aria-live="polite">Preparing upload…</p>';
if(submit)submit.after(progress);
function setProgress(pct){
 progress.hidden=false;
 const n=Math.max(0,Math.min(100,Math.round(pct)));
 progress.querySelector('[role="progressbar"]').setAttribute('aria-valuenow',String(n));
 progress.querySelector('[role="progressbar"] span').style.width=n+'%';
 progress.querySelector('p').textContent=n<100?'Uploading RFQ · '+n+'%':'Upload sent · waiting for confirmation…';
}
window.AmantusiQuoteTransport={
 send(formElement){
  return new Promise((resolve,reject)=>{
   const xhr=new XMLHttpRequest();
   xhr.open('POST','/api/quote',true);
   xhr.timeout=120000;
   xhr.upload.addEventListener('progress',e=>{if(e.lengthComputable)setProgress(e.loaded/e.total*100);});
   xhr.onload=()=>{progress.hidden=true;resolve(new Response(xhr.responseText,{status:xhr.status,headers:{'content-type':xhr.getResponseHeader('content-type')||'application/json'}}));};
   xhr.onerror=()=>{progress.hidden=true;reject(new Error('Network connection failed. Your form is preserved; please try again.'))};
   xhr.ontimeout=()=>{progress.hidden=true;reject(new Error('Upload timed out. Check connectivity before retrying to avoid a duplicate enquiry.'))};
   xhr.onabort=()=>{progress.hidden=true;reject(new Error('Upload was cancelled.'))};
   xhr.send(new FormData(formElement));
  });
 }
};
})();
