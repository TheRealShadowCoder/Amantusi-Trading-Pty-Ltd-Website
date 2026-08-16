const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.nav-links');
const progress = document.querySelector('.scroll-progress span');
const cursorGlow = document.querySelector('.cursor-glow');
const processProgress = document.querySelector('.process-progress span');
const processWrap = document.querySelector('.process-wrap');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarsePointer = window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches || navigator.maxTouchPoints > 0;

let scrollFrame = 0;
function updateScrollUI() {
  scrollFrame = 0;
  const y = window.scrollY;
  header?.classList.toggle('scrolled', y > 24);

  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  if (progress) progress.style.transform = `scaleX(${Math.min(1, y / max)})`;

  if (!coarsePointer && processProgress && processWrap) {
    const rect = processWrap.getBoundingClientRect();
    const start = window.innerHeight * .78;
    const distance = Math.max(1, rect.height + window.innerHeight * .48);
    const local = Math.min(1, Math.max(0, (start - rect.top) / distance));
    processProgress.style.transform = `scaleX(${local})`;
  }
}

function scheduleScrollUI() {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(updateScrollUI);
}

updateScrollUI();
window.addEventListener('scroll', scheduleScrollUI, { passive: true });
window.addEventListener('resize', scheduleScrollUI, { passive: true });

menuButton?.addEventListener('click', () => {
  const open = nav?.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(Boolean(open)));
  const bars = menuButton.querySelectorAll('span');
  if (bars.length === 2) {
    bars[0].style.transform = open ? 'translateY(3.5px) rotate(45deg)' : '';
    bars[1].style.transform = open ? 'translateY(-3.5px) rotate(-45deg)' : '';
  }
});

document.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', () => {
  nav?.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.querySelectorAll('span').forEach(bar => { bar.style.transform = ''; });
}));

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    observer.unobserve(entry.target);
  });
}, { threshold: 0.1, rootMargin: '0px 0px -3% 0px' });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

if (!reducedMotion && !coarsePointer && cursorGlow) {
  let cx = window.innerWidth * .65, cy = window.innerHeight * .35;
  let tx = cx, ty = cy;
  let visible = !document.hidden;
  window.addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
  const moveGlow = () => {
    if (visible) {
      cx += (tx - cx) * .12;
      cy += (ty - cy) * .12;
      cursorGlow.style.transform = `translate3d(${cx}px,${cy}px,0)`;
    }
    requestAnimationFrame(moveGlow);
  };
  moveGlow();
}

if (!reducedMotion && !coarsePointer) {
  const layer = document.querySelector('.particle-layer');
  if (layer && !document.documentElement.classList.contains('experience-active')) {
    const base = window.innerWidth / 90;
    const count = Math.min(20, Math.max(10, Math.round(base)));
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const p = document.createElement('i');
      p.className = 'particle';
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${Math.random() * 100}%`;
      p.style.setProperty('--dur', `${16 + Math.random() * 18}s`);
      p.style.setProperty('--drift', `${-80 + Math.random() * 160}px`);
      p.style.setProperty('--alpha', `${.15 + Math.random() * .4}`);
      p.style.animationDelay = `${-Math.random() * 20}s`;
      const size = 1 + Math.random() * 2;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      fragment.appendChild(p);
    }
    layer.appendChild(fragment);
  }

  document.querySelectorAll('[data-tilt]').forEach(card => {
    let frame = 0;
    let latest = null;
    card.addEventListener('pointermove', e => {
      latest = e;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!latest) return;
        const rect = card.getBoundingClientRect();
        const x = (latest.clientX - rect.left) / rect.width;
        const y = (latest.clientY - rect.top) / rect.height;
        const rx = (.5 - y) * 5.5;
        const ry = (x - .5) * 7;
        card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
        card.style.setProperty('--mx', `${x * 100}%`);
        card.style.setProperty('--my', `${y * 100}%`);
      });
    }, { passive: true });
    card.addEventListener('pointerleave', () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      latest = null;
      card.style.transform = '';
    }, { passive: true });
  });

  document.querySelectorAll('.magnetic').forEach(el => {
    let frame = 0;
    let latest = null;
    el.addEventListener('pointermove', e => {
      latest = e;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = el.getBoundingClientRect();
        const x = latest.clientX - (rect.left + rect.width / 2);
        const y = latest.clientY - (rect.top + rect.height / 2);
        el.style.transform = `translate3d(${x * .08}px,${y * .1}px,0)`;
      });
    }, { passive: true });
    el.addEventListener('pointerleave', () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      latest = null;
      el.style.transform = '';
    }, { passive: true });
  });
}

const quoteForm = document.getElementById('quote-form');
const status = document.getElementById('form-status');
quoteForm?.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(quoteForm);
  const org = data.get('organisation') || '';
  const contact = data.get('contact') || '';
  const email = data.get('email') || '';
  const phone = data.get('phone') || '';
  const type = data.get('type') || '';
  const reference = data.get('reference') || 'N/A';
  const deadline = data.get('deadline') || 'Not specified';
  const location = data.get('location') || 'Not specified';
  const requirements = data.get('requirements') || '';
  const subject = `Quotation Request - ${org}${reference && reference !== 'N/A' ? ` - ${reference}` : ''}`;
  const body = [
    'AMANTUSI TRADING - QUOTATION REQUEST', '',
    `Organisation / Department: ${org}`,
    `Contact Person: ${contact}`,
    `Email: ${email}`,
    `Cell: ${phone || 'Not supplied'}`,
    `Request Type: ${type}`,
    `RFQ / Tender / PO Reference: ${reference}`,
    `Required By: ${deadline}`,
    `Delivery Location: ${location}`, '',
    'ITEMS / SERVICES REQUIRED', requirements, '',
    'Please advise on pricing, availability, delivery / lead time and applicable terms.'
  ].join('\n');
  if (status) status.textContent = 'Opening your email application with the request prepared…';
  window.location.href = `mailto:zodwangema37@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
