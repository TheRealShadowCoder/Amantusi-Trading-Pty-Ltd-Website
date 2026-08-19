(() => {
  'use strict';
  const body=document.body;
  if(!body)return;
  const touchCapable=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!touchCapable||reduced)return;
  body.classList.add('touch60-active');
  if(!document.getElementById('touch60-legacy-guard')){
    const style=document.createElement('style');
    style.id='touch60-legacy-guard';
    style.textContent='.touch60-active .c3d-stage,.touch60-active .a20-stage,.touch60-active .a40-stage{display:none!important}';
    document.head.appendChild(style);
  }
  document.addEventListener('click',()=>{
    if(body.dataset.touch60SuppressClick==='1')body.dataset.touch60SuppressClick='0';
  },true);
})();