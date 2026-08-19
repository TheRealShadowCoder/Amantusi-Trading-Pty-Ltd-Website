(() => {
  'use strict';

  const boot = () => {
    const body = document.body;
    if (!body || body.dataset.luxuryUiReady === '1') return;
    body.dataset.luxuryUiReady = '1';
    body.classList.add('luxury-ui');

    const form = document.querySelector('#quote-form');
    if (!form) return;
    form.dataset.luxuryQuoteReady = '1';

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
    const status = form.querySelector('#form-status');
    const submit = form.querySelector('button[type="submit"]');

    const icons = {
      contact:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>',
      requirement:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10l3 3v15H4V3z"/><path d="M8 10h8M8 14h8M8 18h5"/></svg>',
      files:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 12.5 14.5 7a3 3 0 0 1 4.2 4.2l-7.4 7.4a5 5 0 0 1-7.1-7.1l8-8"/></svg>',
      submit:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
      upload:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 14v5h14v-5"/></svg>',
      check:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>'
    };

    const steps = [
      { key:'contact', label:'Contact', hint:'Your details', names:['organisation','contact','email','phone'] },
      { key:'requirement', label:'Requirement', hint:'What you need', names:['type','reference','deadline','location','requirements'] },
      { key:'files', label:'Attachments', hint:'RFQ / specs', names:['rfqFiles'] },
      { key:'submit', label:'Submit', hint:'Secure request', names:[] }
    ];

    const stepBar = document.createElement('div');
    stepBar.className = 'lux-steps';
    stepBar.setAttribute('aria-label','Quotation request progress');
    stepBar.innerHTML = steps.map((step,index) => `
      <div class="lux-step${index===0?' is-active':''}" data-lux-step="${index}">
        <span class="lux-step-icon">${icons[step.key]}</span>
        <span class="lux-step-copy"><strong>${step.label}</strong><small>${step.hint}</small></span>
      </div>`).join('');
    const firstGrid = form.querySelector('.field-grid');
    if (firstGrid) form.insertBefore(stepBar, firstGrid);

    const stepEls = [...stepBar.querySelectorAll('.lux-step')];
    let activeStep = 0;
    const setStep = (index,{completeBefore=true}={}) => {
      activeStep = Math.max(0,Math.min(3,index));
      stepEls.forEach((el,i) => {
        el.classList.toggle('is-active', i === activeStep);
        el.classList.toggle('is-complete', completeBefore && i < activeStep);
        if (i === activeStep) el.setAttribute('aria-current','step'); else el.removeAttribute('aria-current');
      });
    };

    const findStepForControl = control => {
      const name = control?.name || '';
      const index = steps.findIndex(step => step.names.includes(name));
      return index < 0 ? 0 : index;
    };

    const decorateField = label => {
      if (!(label instanceof HTMLLabelElement) || label.dataset.luxFieldReady === '1') return;
      if (label.classList.contains('quote-file-field')) return;
      const control = label.querySelector('input,select,textarea');
      if (!control || control.type === 'file') return;
      label.dataset.luxFieldReady = '1';
      label.classList.add('lux-field');
      if (control.tagName === 'SELECT') label.classList.add('lux-select-field');
      if (control.type === 'date') label.classList.add('lux-date-field');
      if (control.tagName === 'TEXTAREA') label.classList.add('lux-textarea-field');

      const textNodes = [...label.childNodes].filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
      const labelText = textNodes.map(node => node.textContent.trim()).join(' ').trim();
      textNodes.forEach(node => node.remove());
      const floating = document.createElement('span');
      floating.className = 'lux-float-label';
      floating.textContent = labelText || control.getAttribute('aria-label') || control.name;
      label.insertBefore(floating, control);

      if (control.tagName === 'TEXTAREA') {
        const meter = document.createElement('span');
        meter.className = 'lux-field-meter';
        meter.textContent = `${control.value.length} characters`;
        label.appendChild(meter);
        control.addEventListener('input',()=>{ meter.textContent = `${control.value.length} characters`; },{passive:true});
      }

      const sync = () => {
        const value = control.value || '';
        label.classList.toggle('is-filled', Boolean(value.trim()) || control.tagName === 'SELECT' || control.type === 'date');
      };
      sync();
      control.addEventListener('focus',()=>{ label.classList.add('is-active'); setStep(findStepForControl(control)); },{passive:true});
      control.addEventListener('blur',()=>{ label.classList.remove('is-active'); sync(); },{passive:true});
      control.addEventListener('input',sync,{passive:true});
      control.addEventListener('change',sync,{passive:true});
    };

    form.querySelectorAll('label').forEach(decorateField);

    const fileLabel = form.querySelector('.quote-file-field');
    const fileInput = fileLabel?.querySelector('input[type="file"]');
    let fileList;
    if (fileLabel && fileInput) {
      fileLabel.classList.add('lux-upload-field');
      fileLabel.dataset.luxUploadReady = '1';
      const nativeStrong = fileLabel.querySelector('strong');
      const nativeSmall = fileLabel.querySelector('small');
      const title = nativeStrong?.textContent?.trim() || 'RFQ / Specification Attachments';
      const helper = nativeSmall?.textContent?.trim() || 'Attach up to 5 files. Maximum 10 MB per file and 30 MB combined.';
      if (nativeStrong) nativeStrong.hidden = true;
      if (nativeSmall) nativeSmall.hidden = true;

      const uploadLabel = document.createElement('span');
      uploadLabel.className = 'lux-upload-label';
      uploadLabel.textContent = title;
      const zone = document.createElement('div');
      zone.className = 'lux-upload-zone';
      zone.tabIndex = 0;
      zone.setAttribute('role','button');
      zone.setAttribute('aria-label','Choose RFQ or specification attachments');
      zone.innerHTML = `<span class="lux-upload-icon">${icons.upload}</span><span class="lux-upload-copy"><strong>Drop files here or browse</strong><small>${helper}</small></span><span class="lux-upload-button">Choose files</span>`;
      fileList = document.createElement('div');
      fileList.className = 'lux-file-list';
      fileLabel.insertBefore(uploadLabel, fileInput);
      fileLabel.insertBefore(zone, fileInput);
      fileLabel.appendChild(fileList);

      const formatSize = bytes => bytes < 1024*1024 ? `${Math.max(1,Math.round(bytes/1024))} KB` : `${(bytes/(1024*1024)).toFixed(1)} MB`;
      const renderFiles = () => {
        fileList.textContent = '';
        const files = [...fileInput.files];
        files.forEach(file => {
          const pill = document.createElement('div');
          pill.className = 'lux-file-pill';
          pill.innerHTML = `<strong></strong><span>${formatSize(file.size)}</span>`;
          pill.querySelector('strong').textContent = file.name;
          fileList.appendChild(pill);
        });
        if (files.length) setStep(2);
      };
      zone.addEventListener('click',()=>fileInput.click());
      zone.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){e.preventDefault();fileInput.click();} });
      fileInput.addEventListener('change',renderFiles);
      ['dragenter','dragover'].forEach(type=>zone.addEventListener(type,e=>{e.preventDefault();zone.classList.add('is-dragging');}));
      ['dragleave','drop'].forEach(type=>zone.addEventListener(type,e=>{e.preventDefault();zone.classList.remove('is-dragging');}));
      zone.addEventListener('drop',e=>{
        const dropped = [...(e.dataTransfer?.files || [])];
        if (!dropped.length) return;
        try {
          const transfer = new DataTransfer();
          dropped.slice(0,5).forEach(file=>transfer.items.add(file));
          fileInput.files = transfer.files;
          fileInput.dispatchEvent(new Event('change',{bubbles:true}));
        } catch (_) {}
      });
    }

    if (submit) {
      submit.addEventListener('focus',()=>setStep(3),{passive:true});
      submit.addEventListener('pointerenter',()=>setStep(3),{passive:true});
    }

    const overlay = document.createElement('div');
    overlay.className = 'lux-success-overlay';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML = `<div class="lux-success-card"><div class="lux-success-medallion">${icons.check}</div><h3>Request received.</h3><p>Your quotation request has been securely recorded and is ready for the Amantusi team to review.</p><span class="lux-success-reference"></span><br><button class="lux-success-dismiss" type="button">Submit another request</button></div>`;
    form.appendChild(overlay);
    const successReference = overlay.querySelector('.lux-success-reference');
    const dismiss = overlay.querySelector('.lux-success-dismiss');

    const createSparks = () => {
      if (reduced) return;
      overlay.querySelectorAll('.lux-success-spark').forEach(el=>el.remove());
      const vectors = [[0,-92],[64,-66],[93,0],[66,65],[0,94],[-66,65],[-94,0],[-65,-66],[38,-88],[-42,86]];
      vectors.forEach(([x,y],index)=>{
        const spark = document.createElement('i');
        spark.className = 'lux-success-spark';
        spark.style.setProperty('--sx',`${x}px`);
        spark.style.setProperty('--sy',`${y}px`);
        spark.style.animationDelay = `${index*22}ms`;
        overlay.appendChild(spark);
      });
    };

    const showSuccess = () => {
      const ref = status?.querySelector('.quote-reference')?.textContent?.trim() || (status?.textContent.match(/AMT-[A-Z0-9-]+/i)?.[0] || 'Reference recorded');
      if (successReference) successReference.textContent = ref;
      form.classList.add('lux-success');
      overlay.setAttribute('aria-hidden','false');
      stepEls.forEach(el=>{el.classList.add('is-complete');el.classList.remove('is-active');});
      createSparks();
      requestAnimationFrame(()=>dismiss?.focus({preventScroll:true}));
    };
    const hideSuccess = () => {
      form.classList.remove('lux-success');
      overlay.setAttribute('aria-hidden','true');
      setStep(0,{completeBefore:false});
      fileList?.replaceChildren();
      form.querySelector('input,select,textarea')?.focus({preventScroll:true});
    };
    dismiss?.addEventListener('click',hideSuccess);

    if (status) {
      const syncStatus = () => {
        if (status.classList.contains('success')) showSuccess();
        else if (status.classList.contains('error')) form.classList.remove('lux-success');
      };
      new MutationObserver(syncStatus).observe(status,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
      syncStatus();
    }

    if (fine && !reduced) {
      let pointerFrame = 0, px = 50, py = 20;
      form.addEventListener('pointermove',event=>{
        const rect = form.getBoundingClientRect();
        px = ((event.clientX-rect.left)/Math.max(1,rect.width))*100;
        py = ((event.clientY-rect.top)/Math.max(1,rect.height))*100;
        if (pointerFrame) return;
        pointerFrame = requestAnimationFrame(()=>{
          pointerFrame = 0;
          form.style.setProperty('--lux-px',`${px.toFixed(1)}%`);
          form.style.setProperty('--lux-py',`${py.toFixed(1)}%`);
        });
      },{passive:true});
    }

    const formGlow = form.querySelector('.form-glow');
    if (formGlow) formGlow.classList.add('lux-form-spotlight');

    window.AmantusiLuxuryUI = Object.freeze({
      get ready(){return body.dataset.luxuryUiReady === '1';},
      get step(){return activeStep;},
      get floatingFields(){return form.querySelectorAll('.lux-field').length;},
      get customUpload(){return Boolean(fileLabel?.classList.contains('lux-upload-field'));}
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
