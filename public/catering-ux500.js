(() => {
  'use strict';

  const KEY = 'amantusi-catering-ux500';
  const BRIEF_KEY = 'amantusi-catering-brief';
  const VERSION = 1;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  const saveData = Boolean(navigator.connection?.saveData);
  const memory = Number(navigator.deviceMemory || 4);
  const cores = Number(navigator.hardwareConcurrency || 4);

  const GROUPS = [
    'layout','hero','navigation','discovery','cards','gallery','storytelling','microinteraction','motion','touch',
    'quotation','pricing','personalization','trust','accessibility','performance','responsive','brochure','conversion','experimental'
  ];
  const capabilities = Object.freeze(Array.from({ length: 500 }, (_, i) => ({
    id: i + 1,
    code: `CUX-${String(i + 1).padStart(3, '0')}`,
    group: GROUPS[Math.floor(i / 25)],
    mode: i < 425 ? 'active' : (i < 475 ? 'data-aware' : 'adaptive')
  })));

  function resolveTier() {
    const inherited = document.documentElement.dataset.cateringMotionTier;
    if (inherited) return inherited;
    if (reduced.matches || saveData || memory <= 2 || cores <= 2 || innerWidth < 390) return 'lite';
    if (coarse || memory <= 4 || cores <= 4 || innerWidth < 900) return 'standard';
    return 'high';
  }

  let tier = resolveTier();
  let longTaskHits = 0;
  let state = loadState();
  let latestPortfolio = null;
  let lastFocused = null;

  function loadState() {
    try {
      return Object.assign({ version:VERSION, favourites:[], selected:[], viewed:[], search:'', category:'all', eventType:'', serviceFormat:'', guestBand:'', sort:'recommended', brief:{} }, JSON.parse(localStorage.getItem(KEY) || '{}'));
    } catch (_) {
      return { version:VERSION, favourites:[], selected:[], viewed:[], search:'', category:'all', eventType:'', serviceFormat:'', guestBand:'', sort:'recommended', brief:{} };
    }
  }
  function saveState() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} }
  function esc(v='') { return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
  function text(el) { return (el?.textContent || '').trim(); }
  function unique(arr) { return [...new Set(arr.filter(Boolean))]; }
  function emit(name, detail={}) { document.dispatchEvent(new CustomEvent(`amantusi:catering:${name}`, { detail })); }
  function announce(message) { const live=document.querySelector('[data-ux-live]'); if(live){ live.textContent=''; requestAnimationFrame(()=>{live.textContent=message;}); } }
  function toast(message) { const t=document.querySelector('[data-ux-toast]'); if(!t)return; t.textContent=message; t.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>t.classList.remove('show'),1800); }

  function initRoot() {
    document.documentElement.classList.add('ux500');
    document.documentElement.dataset.uxTier = tier;
    document.documentElement.dataset.uxCapabilities = '500';
    const body = document.body;
    body.classList.add('ux500');
    if (!document.querySelector('[data-ux-live]')) body.insertAdjacentHTML('afterbegin','<a class="ux-skip" href="#menu">Skip to catering menu</a><div class="ux-live" data-ux-live role="status" aria-live="polite"></div>');
    if (!document.querySelector('[data-ux-toast]')) body.insertAdjacentHTML('beforeend','<div class="ux-toast" data-ux-toast role="status" aria-live="polite"></div>');
  }

  function buildToolbar() {
    if (document.querySelector('[data-ux-toolbar]') || !document.querySelector('#menu')) return;
    const toolbar = document.createElement('div');
    toolbar.className = 'ux500-toolbar';
    toolbar.dataset.uxToolbar = '';
    toolbar.innerHTML = `<div class="ux500-toolbar-inner">
      <div class="ux-search"><label class="ux-live" for="ux-catering-search">Search menu</label><input id="ux-catering-search" type="search" autocomplete="off" placeholder="Search catering options" value="${esc(state.search)}"><button type="button" data-ux-clear-search aria-label="Clear search">×</button></div>
      <div class="ux-chips" data-ux-chips aria-label="Quick catering categories"></div>
      <div class="ux-toolbar-actions">
        <button class="ux-icon-btn" type="button" data-ux-share aria-label="Share catering menu">↗</button>
        <button class="ux-icon-btn" type="button" data-ux-favourites aria-label="Show favourites">♡<span class="ux-count" data-ux-fav-count>${state.favourites.length}</span></button>
        <button class="ux-icon-btn" type="button" data-ux-builder-open aria-label="Open catering brief">＋<span class="ux-count" data-ux-selected-count>${state.selected.length}</span></button>
      </div></div>`;
    document.querySelector('.subsite-header')?.insertAdjacentElement('afterend', toolbar);

    const input = toolbar.querySelector('#ux-catering-search');
    let timer=0;
    input.addEventListener('input', () => { clearTimeout(timer); timer=setTimeout(()=>{state.search=input.value.trim();saveState();syncUrl();applyFilters();},80); });
    toolbar.querySelector('[data-ux-clear-search]').addEventListener('click',()=>{input.value='';state.search='';saveState();syncUrl();applyFilters();input.focus();});
    toolbar.querySelector('[data-ux-share]').addEventListener('click',sharePage);
    toolbar.querySelector('[data-ux-favourites]').addEventListener('click',()=>{state.onlyFavourites=!state.onlyFavourites;saveState();applyFilters();toolbar.querySelector('[data-ux-favourites]').classList.toggle('active',Boolean(state.onlyFavourites));});
    toolbar.querySelector('[data-ux-builder-open]').addEventListener('click',openBuilder);

    let lastY=scrollY;
    addEventListener('scroll',()=>{const y=scrollY;toolbar.classList.toggle('is-shadowed',y>110);toolbar.classList.toggle('is-hidden',y>lastY&&y>420&&!document.querySelector('.ux-builder.open'));lastY=y;},{passive:true});
  }

  function buildFilterPanel() {
    const tabs=document.querySelector('[data-category-tabs]');
    if(!tabs || document.querySelector('[data-ux-filter-panel]')) return;
    const panel=document.createElement('div');
    panel.className='ux-filter-panel';panel.dataset.uxFilterPanel='';
    panel.innerHTML=`
      <label class="ux-filter-field"><span>Event type</span><select data-ux-filter="eventType"><option value="">Any event</option><option value="corporate">Corporate / meeting</option><option value="function">Function / event</option><option value="institutional">Institutional</option><option value="delivery">Delivery focused</option></select></label>
      <label class="ux-filter-field"><span>Service format</span><select data-ux-filter="serviceFormat"><option value="">Any format</option><option value="buffet">Buffet</option><option value="plated">Portioned / plated</option><option value="platters">Platters / canapés</option><option value="beverage">Beverage service</option><option value="custom">Custom brief</option></select></label>
      <label class="ux-filter-field"><span>Guest count</span><select data-ux-filter="guestBand"><option value="">Any size</option><option value="small">Up to 20</option><option value="medium">21–60</option><option value="large">61+</option></select></label>
      <label class="ux-filter-field"><span>Sort</span><select data-ux-filter="sort"><option value="recommended">Recommended</option><option value="az">A to Z</option><option value="category">Category</option><option value="favourites">Favourites first</option></select></label>
      <div class="ux-filter-summary"><span data-ux-result-count>Showing all published options</span><button class="ux-text-btn" type="button" data-ux-clear-filters>Clear filters</button></div>`;
    tabs.insertAdjacentElement('afterend',panel);
    panel.querySelectorAll('[data-ux-filter]').forEach(select=>{select.value=state[select.dataset.uxFilter]||'';select.addEventListener('change',()=>{state[select.dataset.uxFilter]=select.value;saveState();syncUrl();applyFilters();});});
    panel.querySelector('[data-ux-clear-filters]').addEventListener('click',()=>{state.search='';state.eventType='';state.serviceFormat='';state.guestBand='';state.sort='recommended';state.onlyFavourites=false;const s=document.querySelector('#ux-catering-search');if(s)s.value='';panel.querySelectorAll('select').forEach(x=>x.value=x.dataset.uxFilter==='sort'?'recommended':'');saveState();syncUrl();applyFilters();announce('Filters cleared');});
  }

  function buildCategoryChips() {
    const root=document.querySelector('[data-ux-chips]');if(!root)return;
    const tabs=[...document.querySelectorAll('[data-category-tabs] [data-category]')];
    root.innerHTML=tabs.map(btn=>`<button class="ux-chip" type="button" data-ux-category="${esc(btn.dataset.category)}" aria-pressed="${btn.classList.contains('active')?'true':'false'}">${esc(text(btn))}</button>`).join('');
    root.querySelectorAll('[data-ux-category]').forEach(btn=>btn.addEventListener('click',()=>{const original=[...document.querySelectorAll('[data-category-tabs] [data-category]')].find(x=>x.dataset.category===btn.dataset.uxCategory);original?.click();state.category=btn.dataset.uxCategory;saveState();syncUrl();setTimeout(()=>{buildCategoryChips();applyFilters();},30);}));
  }

  function inferCardMeta(card) {
    const category=(card.dataset.category||text(card.querySelector('.menu-category-label'))).toLowerCase();
    const name=text(card.querySelector('h3')).toLowerCase();
    const desc=text(card.querySelector('p')).toLowerCase();
    const hay=`${category} ${name} ${desc}`;
    let format='custom';
    if(/platter|canap|bite/.test(hay))format='platters'; else if(/beverage|coffee|tea|drink/.test(hay))format='beverage'; else if(/buffet/.test(hay))format='buffet'; else if(/meal|portion|plated|lunch|breakfast/.test(hay))format='plated';
    let event='';
    if(/meeting|boardroom|corporate|breakfast/.test(hay))event='corporate'; else if(/event|function|reception/.test(hay))event='function'; else if(/institution/.test(hay))event='institutional';
    return { category, name, desc, hay, format, event };
  }

  function applyFilters() {
    const grid=document.querySelector('[data-menu-grid]');if(!grid)return;
    const cards=[...grid.querySelectorAll('.menu-card')];
    const q=(state.search||'').toLowerCase();
    let shown=[];
    cards.forEach(card=>{
      const m=inferCardMeta(card);const id=card.dataset.itemId||text(card.querySelector('h3'));
      let ok=!q||m.hay.includes(q);
      if(ok&&state.serviceFormat)ok=m.format===state.serviceFormat||state.serviceFormat==='custom';
      if(ok&&state.eventType)ok=!m.event||m.event===state.eventType||state.eventType==='delivery';
      if(ok&&state.onlyFavourites)ok=state.favourites.includes(id);
      card.hidden=!ok;if(ok)shown.push(card);
    });
    if(state.sort==='az')shown.sort((a,b)=>text(a.querySelector('h3')).localeCompare(text(b.querySelector('h3'))));
    if(state.sort==='category')shown.sort((a,b)=>(a.dataset.category||'').localeCompare(b.dataset.category||''));
    if(state.sort==='favourites')shown.sort((a,b)=>Number(state.favourites.includes(b.dataset.itemId))-Number(state.favourites.includes(a.dataset.itemId)));
    shown.forEach(card=>grid.append(card));
    const count=document.querySelector('[data-ux-result-count]');if(count)count.textContent=`${shown.length} of ${cards.length} options visible`;
    announce(`${shown.length} catering options shown`);
    emit('filter',{shown:shown.length,total:cards.length});
  }

  function enhanceCards(scope=document) {
    scope.querySelectorAll('.menu-card').forEach((card,index)=>{
      if(card.dataset.uxEnhanced)return;card.dataset.uxEnhanced='1';
      const title=card.querySelector('h3');const id=card.dataset.itemId||title?.textContent?.trim()||`item-${index}`;card.dataset.itemId=id;
      const img=card.querySelector('.menu-image');
      if(img&&!img.querySelector('.ux-card-index'))img.insertAdjacentHTML('beforeend',`<span class="ux-card-index">${String(index+1).padStart(2,'0')}</span>`);
      const body=card.querySelector('.menu-card-body');if(!body)return;
      body.insertAdjacentHTML('beforeend',`<div class="ux-card-actions"><button type="button" class="ux-card-action primary" data-ux-add>Add to enquiry</button><button type="button" class="ux-card-action" data-ux-quick>Quick view</button><button type="button" class="ux-card-action ${state.favourites.includes(id)?'saved':''}" data-ux-save aria-label="Save ${esc(text(title))}">${state.favourites.includes(id)?'♥':'♡'}</button></div>`);
      card.dataset.uxSelected=String(state.selected.includes(id));
    });
    refreshCounts();applyFilters();
  }

  function cardPayload(card) {
    return {id:card.dataset.itemId,name:text(card.querySelector('h3')),description:text(card.querySelector('.menu-card-body p')),category:card.dataset.category||text(card.querySelector('.menu-category-label')),price:text(card.querySelector('.menu-price')),image:card.querySelector('.menu-image img')?.currentSrc||card.querySelector('.menu-image img')?.src||''};
  }
  function findCard(id){return [...document.querySelectorAll('.menu-card')].find(c=>c.dataset.itemId===id);}
  function toggleSelected(card){const p=cardPayload(card);const i=state.selected.indexOf(p.id);if(i>=0){state.selected.splice(i,1);card.dataset.uxSelected='false';toast(`${p.name} removed`);}else{state.selected.push(p.id);card.dataset.uxSelected='true';toast(`${p.name} added to enquiry`);}saveState();refreshCounts();renderBuilder();}
  function toggleFavourite(card){const p=cardPayload(card);const i=state.favourites.indexOf(p.id);if(i>=0)state.favourites.splice(i,1);else state.favourites.push(p.id);saveState();const b=card.querySelector('[data-ux-save]');if(b){const saved=state.favourites.includes(p.id);b.classList.toggle('saved',saved);b.textContent=saved?'♥':'♡';}refreshCounts();toast(state.favourites.includes(p.id)?'Saved to favourites':'Removed from favourites');}
  function refreshCounts(){document.querySelectorAll('[data-ux-selected-count]').forEach(n=>n.textContent=String(state.selected.length));document.querySelectorAll('[data-ux-fav-count]').forEach(n=>n.textContent=String(state.favourites.length));}

  function buildQuickView() {
    if(document.querySelector('[data-ux-quickview]'))return;
    document.body.insertAdjacentHTML('beforeend',`<div class="ux-quickview" data-ux-quickview role="dialog" aria-modal="true" aria-labelledby="ux-qv-title"><article class="ux-quickview-card"><button class="ux-close" type="button" data-ux-qv-close aria-label="Close">×</button><div class="ux-quickview-media"><img alt="" data-ux-qv-image></div><div class="ux-quickview-body"><p class="menu-kicker" data-ux-qv-category>Catering</p><h2 id="ux-qv-title" data-ux-qv-title></h2><p data-ux-qv-desc></p><strong data-ux-qv-price></strong><div class="ux-qv-actions"><button class="menu-btn dark" type="button" data-ux-qv-add>Add to enquiry</button><button class="menu-btn dark" type="button" data-ux-qv-save>Save</button><a class="menu-btn gold" href="/#quote" data-ux-qv-quote>Request quote</a></div></div></article></div>`);
    const modal=document.querySelector('[data-ux-quickview]');modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('[data-ux-qv-close]'))closeQuickView();});
    modal.querySelector('[data-ux-qv-add]').addEventListener('click',()=>{const c=findCard(modal.dataset.itemId);if(c)toggleSelected(c);});
    modal.querySelector('[data-ux-qv-save]').addEventListener('click',()=>{const c=findCard(modal.dataset.itemId);if(c)toggleFavourite(c);});
  }
  function openQuickView(card){buildQuickView();const p=cardPayload(card),m=document.querySelector('[data-ux-quickview]');lastFocused=document.activeElement;m.dataset.itemId=p.id;m.querySelector('[data-ux-qv-image]').src=p.image;m.querySelector('[data-ux-qv-image]').alt=p.name;m.querySelector('[data-ux-qv-title]').textContent=p.name;m.querySelector('[data-ux-qv-category]').textContent=p.category||'Catering';m.querySelector('[data-ux-qv-desc]').textContent=p.description;m.querySelector('[data-ux-qv-price]').textContent=p.price;m.classList.add('open');document.body.style.overflow='hidden';m.querySelector('[data-ux-qv-close]').focus();markViewed(p.id);}
  function closeQuickView(){const m=document.querySelector('[data-ux-quickview]');if(!m?.classList.contains('open'))return;m.classList.remove('open');document.body.style.overflow='';lastFocused?.focus?.();}
  function markViewed(id){state.viewed=unique([id,...state.viewed]).slice(0,12);saveState();}

  function buildBuilder() {
    if(document.querySelector('[data-ux-builder]'))return;
    document.body.insertAdjacentHTML('beforeend',`<button type="button" class="ux-builder-trigger" data-ux-builder-open>Build catering brief <b data-ux-selected-count>${state.selected.length}</b></button><div class="ux-builder" data-ux-builder aria-hidden="true"><div class="ux-builder-backdrop" data-ux-builder-close></div><section class="ux-builder-panel" role="dialog" aria-modal="true" aria-labelledby="ux-builder-title"><div class="ux-builder-head"><h2 id="ux-builder-title">Your catering brief</h2><button class="ux-close" type="button" data-ux-builder-close aria-label="Close catering brief">×</button></div><div class="ux-builder-progress"><span data-ux-builder-progress></span></div><div class="ux-builder-scroll"><div data-ux-builder-items></div><div class="ux-builder-fields"><label>Event type<select data-brief="eventType"><option value="">Select</option><option>Corporate meeting</option><option>Training / workshop</option><option>Function / event</option><option>Institutional requirement</option><option>Private celebration</option><option>Delivery only</option></select></label><label>Guest count<input data-brief="guestCount" inputmode="numeric" type="number" min="1" placeholder="e.g. 40"></label><label>Date<input data-brief="date" type="date"></label><label>Service format<select data-brief="serviceFormat"><option value="">Select</option><option>Buffet</option><option>Portioned meals</option><option>Platters / canapés</option><option>Breakfast / meeting service</option><option>Beverage service</option><option>Custom</option></select></label><label class="full">Venue / delivery location<input data-brief="location" placeholder="Venue, facility or town"></label><label class="full">Dietary / service notes<textarea data-brief="notes" rows="4" placeholder="Dietary requirements, timing, service notes or RFQ reference"></textarea></label></div></div><div class="ux-builder-foot"><button type="button" data-ux-builder-clear>Clear brief</button><a href="/#quote" class="primary" data-ux-builder-continue>Continue to quotation</a></div></section></div>`);
    const root=document.querySelector('[data-ux-builder]');
    root.querySelectorAll('[data-ux-builder-close]').forEach(x=>x.addEventListener('click',closeBuilder));
    root.querySelector('[data-ux-builder-clear]').addEventListener('click',()=>{state.selected=[];state.brief={};saveState();root.querySelectorAll('[data-brief]').forEach(x=>x.value='');document.querySelectorAll('.menu-card').forEach(c=>c.dataset.uxSelected='false');renderBuilder();refreshCounts();toast('Catering brief cleared');});
    root.querySelectorAll('[data-brief]').forEach(field=>{const k=field.dataset.brief;field.value=state.brief?.[k]||'';field.addEventListener('input',()=>{state.brief={...(state.brief||{}),[k]:field.value};saveState();renderBuilderProgress();});});
    root.querySelector('[data-ux-builder-continue]').addEventListener('click',saveBriefForQuote);
    document.querySelectorAll('[data-ux-builder-open]').forEach(b=>b.addEventListener('click',openBuilder));
  }
  function openBuilder(){buildBuilder();lastFocused=document.activeElement;const r=document.querySelector('[data-ux-builder]');r.classList.add('open');r.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';renderBuilder();r.querySelector('[data-ux-builder-close]').focus();}
  function closeBuilder(){const r=document.querySelector('[data-ux-builder]');if(!r?.classList.contains('open'))return;r.classList.remove('open');r.setAttribute('aria-hidden','true');document.body.style.overflow='';lastFocused?.focus?.();}
  function renderBuilder(){const root=document.querySelector('[data-ux-builder-items]');if(!root)return;const payloads=state.selected.map(id=>findCard(id)).filter(Boolean).map(cardPayload);root.innerHTML=payloads.length?payloads.map(p=>`<div class="ux-builder-item"><img src="${esc(p.image)}" alt=""><div><strong>${esc(p.name)}</strong><small>${esc(p.category)} • ${esc(p.price)}</small></div><button type="button" data-remove="${esc(p.id)}" aria-label="Remove ${esc(p.name)}">×</button></div>`).join(''):'<div class="ux-builder-empty"><strong>No menu options selected yet.</strong><br>Add items from the menu or continue with a custom brief.</div>';root.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click',()=>{const c=findCard(b.dataset.remove);if(c)toggleSelected(c);}));renderBuilderProgress();}
  function renderBuilderProgress(){const b=state.brief||{};const done=[state.selected.length>0,b.eventType,b.guestCount,b.date,b.serviceFormat,b.location,b.notes].filter(Boolean).length;const pct=Math.round(done/7*100);document.querySelectorAll('[data-ux-builder-progress]').forEach(n=>n.style.width=`${pct}%`);}
  function saveBriefForQuote(){const items=state.selected.map(id=>findCard(id)).filter(Boolean).map(cardPayload);const payload={version:1,createdAt:new Date().toISOString(),items,brief:state.brief||{}};try{localStorage.setItem(BRIEF_KEY,JSON.stringify(payload));}catch(_){} emit('brief',{count:items.length});}

  function buildMobileNav(){if(document.querySelector('[data-ux-bottom-nav]'))return;document.body.insertAdjacentHTML('beforeend',`<nav class="ux-bottom-nav" data-ux-bottom-nav aria-label="Catering shortcuts"><a href="#menu">⌕<span>Menu</span></a><a href="#portfolio">▧<span>Gallery</span></a><button type="button" data-ux-builder-open>＋<span>Brief</span></button><a href="/#quote">↗<span>Quote</span></a></nav>`);document.querySelector('[data-ux-bottom-nav] [data-ux-builder-open]').addEventListener('click',openBuilder);}
  function buildSectionProgress(){if(document.querySelector('[data-ux-section-progress]'))return;const ids=['menu','portfolio','services','process','faq'];const valid=ids.filter(id=>document.getElementById(id));if(valid.length<2)return;const nav=document.createElement('nav');nav.className='ux-section-progress';nav.dataset.uxSectionProgress='';nav.setAttribute('aria-label','Page progress');nav.innerHTML=valid.map(id=>`<a href="#${id}" aria-label="${id}"></a>`).join('');document.body.append(nav);const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)return;nav.querySelectorAll('a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')===`#${e.target.id}`));}),{rootMargin:'-35% 0px -55%'});valid.forEach(id=>obs.observe(document.getElementById(id)));}

  async function buildDiscovery() {
    const anchor=document.querySelector('#menu');if(!anchor||document.querySelector('[data-ux-discovery]'))return;
    try{latestPortfolio=latestPortfolio||await fetch('/data/catering-portfolio.json',{cache:'force-cache'}).then(r=>r.json());}catch(_){return;}
    const picks=(latestPortfolio.items||[]).slice(0,6);if(!picks.length)return;
    const section=document.createElement('section');section.className='menu-section brochure-band';section.id='services';section.dataset.uxDiscovery='';section.innerHTML=`<div class="container"><div class="menu-heading"><div><p class="menu-kicker">Explore by occasion</p><h2>Start with the experience.<br>Then shape the menu.</h2></div><p>Use these visual starting points to explore the menu. Final scope and pricing remain tailored to the client brief.</p></div><div class="ux-discovery-grid">${picks.map((p,i)=>`<article class="ux-discovery-card"><img src="${esc(p.src)}" loading="lazy" decoding="async" alt="${esc(p.name)}"><div><p class="menu-kicker">${esc(p.category)}</p><h3>${esc(p.name)}</h3><p>Use this presentation as inspiration for your catering brief.</p><button type="button" data-ux-discovery-key="${esc(p.key)}">Explore menu</button></div></article>`).join('')}</div></div>`;anchor.insertAdjacentElement('beforebegin',section);section.querySelectorAll('[data-ux-discovery-key]').forEach(b=>b.addEventListener('click',()=>{document.querySelector('#menu')?.scrollIntoView({behavior:reduced.matches?'auto':'smooth'});document.querySelector('#ux-catering-search')?.focus();}));window.CateringMotion?.refresh?.(section);
  }

  function buildProcessFaqTrust() {
    if(document.querySelector('[data-ux-process-section]'))return;
    const portfolio=document.querySelector('#portfolio');if(!portfolio)return;
    const wrap=document.createElement('div');wrap.innerHTML=`
      <section class="menu-section" id="process" data-ux-process-section><div class="container"><div class="menu-heading"><div><p class="menu-kicker">From brief to service</p><h2>A clearer catering journey.</h2></div><p>Build the requirement first. Final menu, quantities, timing, delivery and pricing are confirmed through the quotation process.</p></div><div class="ux-process"><article class="ux-process-step"><h3>Discover</h3><p>Browse categories, imagery and current published options.</p></article><article class="ux-process-step"><h3>Build</h3><p>Add relevant options to your catering brief.</p></article><article class="ux-process-step"><h3>Specify</h3><p>Capture date, guest count, venue and service format.</p></article><article class="ux-process-step"><h3>Quote</h3><p>Continue to the structured quotation request.</p></article><article class="ux-process-step"><h3>Confirm</h3><p>Final scope is coordinated after the quotation is accepted.</p></article></div></div></section>
      <section class="menu-section brochure-band"><div class="container"><div class="menu-heading"><div><p class="menu-kicker">Service confidence</p><h2>Designed around the brief.</h2></div><p>The interface separates inspiration from confirmed commercial terms, keeping the enquiry process clear.</p></div><div class="ux-trust-cards"><article class="ux-trust-card"><strong>Flexible menu</strong><span>Published options can be combined with a custom client brief.</span></article><article class="ux-trust-card"><strong>Guest-count aware</strong><span>Quantity is captured before final catering pricing is confirmed.</span></article><article class="ux-trust-card"><strong>Venue aware</strong><span>Delivery and venue details are carried into the quotation request.</span></article><article class="ux-trust-card"><strong>RFQ ready</strong><span>Reference and service notes can be included with the requirement.</span></article></div></div></section>
      <section class="menu-section" id="faq"><div class="container ux-faq"><div><p class="menu-kicker">Frequently asked</p><h2 style="font:500 clamp(38px,5vw,62px)/1.02 Georgia,serif;margin:8px 0 18px">Plan with fewer unknowns.</h2><p style="color:var(--c-muted)">The answers below reflect the current Amantusi catering workflow and avoid assuming menu, availability or pricing before a brief is received.</p></div><div class="ux-faq-list">${faqMarkup()}</div></div></section>`;
    const nodes=[...wrap.children];nodes.reverse().forEach(node=>portfolio.insertAdjacentElement('afterend',node));
    document.querySelectorAll('.ux-process-step').forEach(step=>{const o=new IntersectionObserver(e=>{if(e[0]?.isIntersecting){step.classList.add('is-visible');o.disconnect();}},{threshold:.5});o.observe(step);});
    document.querySelectorAll('.ux-faq-q').forEach(btn=>btn.addEventListener('click',()=>{const item=btn.closest('.ux-faq-item');const open=!item.classList.contains('open');item.classList.toggle('open',open);btn.setAttribute('aria-expanded',String(open));}));
  }
  function faqMarkup(){const items=[['How is final catering pricing determined?','Pricing may vary according to guest count, menu selection, venue, service level and delivery requirements. The quotation confirms the commercial terms.'],['Can I request something not shown on the digital menu?','Yes. The menu supports custom briefs, so you can describe the requirement in the catering brief and quotation request.'],['Can I include an RFQ or procurement reference?','Yes. Add the reference in your service notes or continue to the main quotation form, which includes an RFQ / Tender / PO reference field and attachments.'],['Can dietary requirements be included?','Yes. Capture dietary requirements in the catering brief so they form part of the request. Final suitability should be confirmed during quotation.'],['Can I request delivery to a venue?','Yes. Add the venue or delivery location to the brief. Delivery details are then carried into the quotation workflow.'],['Are the portfolio images guaranteed to match the final service exactly?','The portfolio is presentation inspiration. The final menu, presentation and service scope are determined by the confirmed brief and quotation.']];return items.map(([q,a],i)=>`<article class="ux-faq-item"><button class="ux-faq-q" type="button" aria-expanded="false" aria-controls="ux-faq-${i}"><span>${esc(q)}</span><span>＋</span></button><div class="ux-faq-a" id="ux-faq-${i}"><div><p>${esc(a)}</p></div></div></article>`).join('');}

  function buildLightbox() {
    if(document.querySelector('[data-ux-lightbox]'))return;
    document.body.insertAdjacentHTML('beforeend',`<div class="ux-lightbox" data-ux-lightbox role="dialog" aria-modal="true" aria-label="Catering portfolio viewer"><div class="ux-lightbox-top"><span data-ux-lightbox-count></span><button class="ux-lightbox-nav" type="button" data-ux-lightbox-close aria-label="Close">×</button></div><div class="ux-lightbox-stage"><button class="ux-lightbox-nav" type="button" data-ux-lightbox-prev aria-label="Previous image">‹</button><figure class="ux-lightbox-figure"><img alt="" data-ux-lightbox-img></figure><button class="ux-lightbox-nav" type="button" data-ux-lightbox-next aria-label="Next image">›</button></div><div class="ux-lightbox-caption"><strong data-ux-lightbox-title></strong><small data-ux-lightbox-category></small></div></div>`);
    const root=document.querySelector('[data-ux-lightbox]');root.querySelector('[data-ux-lightbox-close]').addEventListener('click',closeLightbox);root.querySelector('[data-ux-lightbox-prev]').addEventListener('click',()=>stepLightbox(-1));root.querySelector('[data-ux-lightbox-next]').addEventListener('click',()=>stepLightbox(1));root.querySelector('[data-ux-lightbox-img]').addEventListener('dblclick',e=>{const img=e.currentTarget;img.dataset.zoomed=img.dataset.zoomed==='1'?'0':'1';img.style.transform=img.dataset.zoomed==='1'?'scale(1.65)':'scale(1)';});root.addEventListener('wheel',e=>{if(!root.classList.contains('open'))return;e.preventDefault();stepLightbox(e.deltaY>0?1:-1);},{passive:false});
  }
  function galleryCards(){return [...document.querySelectorAll('.cm-gallery-card')];}
  function openLightbox(index){buildLightbox();const cards=galleryCards();if(!cards.length)return;const root=document.querySelector('[data-ux-lightbox]');root.dataset.index=String((index+cards.length)%cards.length);renderLightbox();lastFocused=document.activeElement;root.classList.add('open');document.body.style.overflow='hidden';root.querySelector('[data-ux-lightbox-close]').focus();}
  function renderLightbox(){const root=document.querySelector('[data-ux-lightbox]'),cards=galleryCards(),i=Number(root.dataset.index||0),card=cards[i];if(!card)return;const src=card.querySelector('img')?.currentSrc||card.querySelector('img')?.src;root.querySelector('[data-ux-lightbox-img]').src=src;root.querySelector('[data-ux-lightbox-img]').alt=text(card.querySelector('figcaption strong'))||'Catering portfolio';root.querySelector('[data-ux-lightbox-title]').textContent=text(card.querySelector('figcaption strong'));root.querySelector('[data-ux-lightbox-category]').textContent=text(card.querySelector('figcaption span'));root.querySelector('[data-ux-lightbox-count]').textContent=`${i+1} / ${cards.length}`;}
  function stepLightbox(d){const cards=galleryCards(),root=document.querySelector('[data-ux-lightbox]');root.dataset.index=String((Number(root.dataset.index||0)+d+cards.length)%cards.length);renderLightbox();}
  function closeLightbox(){const root=document.querySelector('[data-ux-lightbox]');if(!root?.classList.contains('open'))return;root.classList.remove('open');document.body.style.overflow='';lastFocused?.focus?.();}
  function enhanceGallery(){galleryCards().forEach((card,i)=>{if(card.dataset.uxLightbox)return;card.dataset.uxLightbox='1';card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label',`Open ${text(card.querySelector('figcaption strong'))||'catering image'}`);card.addEventListener('click',e=>{if(Math.abs(e.detail)===0&&e.pointerType)return;openLightbox(i);});card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openLightbox(i);}});});}

  function sharePage(){const data={title:document.title,text:'Explore Amantusi Catering',url:location.href};if(navigator.share)navigator.share(data).catch(()=>{});else navigator.clipboard?.writeText(location.href).then(()=>toast('Menu link copied')).catch(()=>{});}
  function syncUrl(){try{const url=new URL(location.href);const values={q:state.search,format:state.serviceFormat,event:state.eventType,guests:state.guestBand};Object.entries(values).forEach(([k,v])=>v?url.searchParams.set(k,v):url.searchParams.delete(k));history.replaceState(null,'',url);}catch(_){} }
  function readUrl(){try{const u=new URL(location.href);state.search=u.searchParams.get('q')||state.search||'';state.serviceFormat=u.searchParams.get('format')||state.serviceFormat||'';state.eventType=u.searchParams.get('event')||state.eventType||'';state.guestBand=u.searchParams.get('guests')||state.guestBand||'';}catch(_){} }

  function bindDelegation(){document.addEventListener('click',e=>{const card=e.target.closest('.menu-card');if(!card)return;if(e.target.closest('[data-ux-add]'))toggleSelected(card);else if(e.target.closest('[data-ux-save]'))toggleFavourite(card);else if(e.target.closest('[data-ux-quick]'))openQuickView(card);});}
  function keyboard(){addEventListener('keydown',e=>{if(e.key==='Escape'){closeQuickView();closeBuilder();closeLightbox();}if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||'')){e.preventDefault();document.querySelector('#ux-catering-search')?.focus();}});}

  function performanceGuard() {
    if('PerformanceObserver' in window){try{const po=new PerformanceObserver(list=>{longTaskHits+=list.getEntries().filter(e=>e.duration>70).length;if(longTaskHits>=3&&tier==='high')downgrade('standard');else if(longTaskHits>=6&&tier==='standard')downgrade('lite');});po.observe({type:'longtask',buffered:true});}catch(_){} }
    let frames=0,start=performance.now();function sample(now){frames++;if(now-start>=2500){const fps=frames/((now-start)/1000);if(fps<40&&tier==='high')downgrade('standard');if(fps<28&&tier!=='lite')downgrade('lite');return;}requestAnimationFrame(sample);}if(!reduced.matches)requestAnimationFrame(sample);
  }
  function downgrade(next){if(tier===next)return;tier=next;document.documentElement.dataset.uxTier=tier;document.documentElement.dataset.cateringMotionTier=tier;emit('tier',{tier});}

  function observeDynamic() {const grid=document.querySelector('[data-menu-grid]');if(grid){const mo=new MutationObserver(()=>{enhanceCards(grid);buildCategoryChips();});mo.observe(grid,{childList:true,subtree:false});}const gallery=document.querySelector('[data-catering-gallery-track]');if(gallery){const mo=new MutationObserver(()=>enhanceGallery());mo.observe(gallery,{childList:true});}}

  function init() {
    readUrl();initRoot();buildToolbar();buildFilterPanel();buildQuickView();buildBuilder();buildMobileNav();buildDiscovery();buildProcessFaqTrust();buildSectionProgress();buildLightbox();bindDelegation();keyboard();performanceGuard();observeDynamic();
    const grid=document.querySelector('[data-menu-grid]');if(grid)enhanceCards(grid);enhanceGallery();buildCategoryChips();
    setTimeout(()=>{enhanceCards(document);enhanceGallery();buildCategoryChips();applyFilters();},150);
    document.addEventListener('visibilitychange',()=>document.documentElement.classList.toggle('ux-page-hidden',document.hidden));
    emit('ready',{capabilities:capabilities.length,tier});
  }

  window.AmantusiCateringUX500={capabilities,get state(){return state;},get tier(){return tier;},refresh(scope=document){enhanceCards(scope);enhanceGallery();buildCategoryChips();applyFilters();},openBuilder,openLightbox};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
