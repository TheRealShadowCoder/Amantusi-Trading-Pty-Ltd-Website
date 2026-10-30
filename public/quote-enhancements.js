/* Amantusi public RFQ experience — progressive enhancement, no remote dependencies. */
(() => {
  'use strict';
  const form=document.querySelector('#quote-form');
  if(!form)return;
  const DRAFT_KEY='amantusi-rfq-draft-v1';
  const MAX_AGE=7*24*60*60*1000;
  const ALLOWED=new Set(['pdf','doc','docx','xls','xlsx','csv','txt','jpg','jpeg','png','webp']);
  const MAX_FILE=10_000_000, MAX_TOTAL=30_000_000;
  const upload=form.querySelector('input[name="rfqFiles"]');
  const status=form.querySelector('#form-status');
  const submit=form.querySelector('button[type="submit"]');
  const create=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el};
  const body=document.querySelector('.quote-grid')||form.parentElement;
  body?.classList.add('rfq-enhanced');
  const flag=document.createElement('div');
  flag.className='rfq-progress';
  flag.innerHTML='<span class="rfq-progress-title">Your procurement enquiry</span><div class="rfq-progress-meter" role="progressbar" aria-label="Required fields completed" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div><small data-rfq-complete>0 of 4 required fields complete</small>';
  form.insertBefore(flag,form.firstChild);
  const notice=create('div','rfq-notice');
  notice.innerHTML='<strong>Secure RFQ submission</strong><p>Submit your brief to Amantusi for review. Supporting documents are optional. Your request will receive a reference number when the server accepts it.</p>';
  const btn=submit;
  if(btn)form.insertBefore(notice,btn);
  const controls=create('div','rfq-control');
  const label=create('label','rfq-save-label');
  const save=create('input');
  save.type='checkbox';save.id='rfq-save-draft';save.setAttribute('aria-describedby','rfq-draft-note');
  label.append(save,document.createTextNode(' Save my draft on this device'));
  const note=create('p','rfq-control-note','Optional: stores form text locally for up to 7 days. Attachments are never stored. Clear it anytime.');
  note.id='rfq-draft-note';
  const clear=create('button','rfq-clear','Clear saved draft');
  clear.type='button';
  controls.append(label,note,clear);
  if(btn)form.insertBefore(controls,btn);
  const uploadSummary=create('p','rfq-file-summary','No files selected (optional).');
  uploadSummary.id='rfq-upload-summary';
  uploadSummary.setAttribute('role','status');
  uploadSummary.setAttribute('aria-live','polite');
  upload?.setAttribute('aria-describedby',((upload.getAttribute('aria-describedby')||'')+' rfq-upload-summary').trim());
  upload?.parentElement?.appendChild(uploadSummary);
  const required=['organisation','contact','email','requirements'];
  for(const name of required){
    const field=form.elements.namedItem(name);
    if(!field)continue;
    field.setAttribute('aria-required','true');
    const label=field.closest('label');
    if(label&&!label.querySelector('.rfq-required-marker')){
      const mark=document.createElement('small');
      mark.className='rfq-required-marker';
      mark.textContent='Required';mark.setAttribute('aria-hidden','true');
      label.append(mark);
    }
  }
  if(upload){
    upload.setAttribute('aria-invalid','false');
    upload.setAttribute('aria-errormessage','form-status');
  }

  const meter=flag.querySelector('[role="progressbar"]');
  const bar=flag.querySelector('.rfq-progress-meter span');
  const count=flag.querySelector('[data-rfq-complete]');
  const progress=()=>{
    const complete=required.filter(name=>String(form.elements.namedItem(name)?.value||'').trim()).length;
    const percent=Math.round(complete/required.length*100);
    meter?.setAttribute('aria-valuenow',String(percent));
    if(bar)bar.style.width=percent+'%';
    if(count)count.textContent=complete+' of '+required.length+' required fields complete';
  };
  const fail=(message)=>{
    if(upload)upload.setAttribute('aria-invalid','true');
    if(status){status.className='form-status error';status.setAttribute('role','alert');status.tabIndex=-1;status.textContent=message;status.scrollIntoView({block:'nearest',behavior:'auto'});status.focus({preventScroll:true});}
  };
  const validate=()=>{
    if(!upload)return true;
    const files=Array.from(upload.files||[]);
    if(files.length>5){fail('You may attach a maximum of 5 files.');upload.focus();return false;}
    let total=0;
    for(const file of files){
      total+=file.size;
      const ext=String(file.name).split('.').pop().toLowerCase();
      if(!ALLOWED.has(ext)){fail('Unsupported attachment format. Use PDF, Office documents, CSV, TXT, JPG, PNG or WEBP.');upload.focus();return false;}
      if(file.size>MAX_FILE){fail('Each attachment must be 10 MB or smaller.');upload.focus();return false;}
    }
    if(total>MAX_TOTAL){fail('Combined attachments must be 30 MB or smaller.');upload.focus();return false;}
    upload.setAttribute('aria-invalid','false');
    return true;
  };
  const fileSummary=()=>{
    const files=Array.from(upload?.files||[]);
    uploadSummary.textContent=files.length
      ? files.map(f=>f.name+' ('+(f.size/(1024*1024)).toFixed(1)+' MB)').join(' · ')
      : 'No files selected (optional).';
    if(files.length)validate();
    else{
      upload?.setAttribute('aria-invalid','false');
      if(status?.classList.contains('error')&&/attach|file|MB|format/i.test(status.textContent||'')){
      status.className='form-status';status.textContent='';
      }
    }
  };
  const serializable=()=>Object.fromEntries(Array.from(form.elements)
    .filter(el=>el.name&&el.type!=='file'&&el.type!=='submit'&&el.type!=='checkbox'&&(el instanceof HTMLInputElement||el instanceof HTMLSelectElement||el instanceof HTMLTextAreaElement))
    .map(el=>[el.name,el.value]));
  let timer;
  const write=()=>{
    if(!save.checked)return;
    try{localStorage.setItem(DRAFT_KEY,JSON.stringify({time:Date.now(),values:serializable()}));}catch(_){note.textContent='Local storage is unavailable. Your form will not be saved.';}
  };
  const schedule=()=>{progress();if(!save.checked)return;clearTimeout(timer);timer=setTimeout(write,350)};
  const remove=()=>{try{localStorage.removeItem(DRAFT_KEY)}catch(_){}};
  const restore=()=>{
    try{
      const raw=localStorage.getItem(DRAFT_KEY);
      if(!raw)return;
      const draft=JSON.parse(raw);
      if(!draft||!draft.time||Date.now()-draft.time>MAX_AGE){remove();return;}
      save.checked=true;
      for(const [name,value] of Object.entries(draft.values||{})){
        const field=form.elements.namedItem(name);
        if(field&&typeof value==='string'&&field.type!=='file'&&!field.value)field.value=value;
      }
      note.textContent='Saved draft restored from this browser. Attachments need to be selected again.';
    }catch(_){remove();}
  };
  save.addEventListener('change',()=>{save.checked?write():remove();note.textContent=save.checked?'Draft storage enabled for this browser for up to 7 days; no attachments are saved.':'Draft storage disabled. Saved form text was cleared.'});
  clear.addEventListener('click',()=>{remove();save.checked=false;note.textContent='Saved draft cleared from this browser.'});
  upload?.addEventListener('change',fileSummary);
  form.addEventListener('input',schedule);
  form.addEventListener('change',schedule);
  addEventListener('pagehide',()=>{if(save.checked){clearTimeout(timer);write();}});
  // Warn only when abandoning unsaved, non-empty form text. Browsers decide whether to display a generic message.
  let submissionComplete=false;
  const hasUnsavedChanges=()=>required.some(name=>String(form.elements.namedItem(name)?.value||'').trim()) ||
    Boolean(upload?.files?.length);
  addEventListener('beforeunload',event=>{
    if(submissionComplete||save.checked||form.dataset.submitting==='1'||!hasUnsavedChanges())return;
    event.preventDefault();event.returnValue='';
  });

  const prefillService=new URLSearchParams(location.search).get('service');
  if(prefillService){
    const select=form.elements.namedItem('type');
    if(select instanceof HTMLSelectElement){
      const choice=Array.from(select.options).find(o=>o.value.toLowerCase()===prefillService.toLowerCase()||o.textContent.trim().toLowerCase()===prefillService.toLowerCase());
      if(choice)select.value=choice.value;
    }
  }
  const date=form.elements.namedItem('deadline');
  if(date instanceof HTMLInputElement&&date.type==='date'){
    const today=new Date();
    const localToday=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
    date.min=localToday;
  }
  restore();progress();fileSummary();
  window.AmantusiQuoteEnhancements={
    validate,
    onSuccess(data){
      submissionComplete=true;
      remove();save.checked=false;
      try{localStorage.removeItem('amantusi-catering-brief');}catch(_){}
      note.textContent='Quotation received. This browser’s saved draft has been cleared.';
      progress();
      if(status&&data?.reference){status.dataset.reference=String(data.reference).replace(/[^A-Za-z0-9-]/g,'');}
    }
  };
})();
