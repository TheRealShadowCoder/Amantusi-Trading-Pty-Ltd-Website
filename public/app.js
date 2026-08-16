const responsiveStyles = document.createElement('link');
responsiveStyles.rel = 'stylesheet';
responsiveStyles.href = '/responsive.css';
document.head.appendChild(responsiveStyles);

const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.nav-links');
const progress = document.querySelector('.scroll-progress span');
const cursorGlow = document.querySelector('.cursor-glow');
const processProgress = document.querySelector('.process-progress span');
const processWrap = document.querySelector('.process-wrap');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

const updateScrollUI = () => {
  header?.classList.toggle('scrolled', window.scrollY > 24);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
  if (progress) progress.style.width = `${pct}%`;

  if (processProgress && processWrap) {
    const rect = processWrap.getBoundingClientRect();
    const start = window.innerHeight * 0.78;
    const distance = Math.max(1, rect.height + window.innerHeight * 0.48);
    const local = Math.min(1, Math.max(0, (start - rect.top) / distance));
    processProgress.style.width = `${local * 100}%`;
  }
};

updateScrollUI();
window.addEventListener('scroll', updateScrollUI, { passive: true });
window.addEventListener('resize', updateScrollUI, { passive: true });

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
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
document.getElementById('year').textContent = new Date().getFullYear();

if (!reducedMotion && !coarsePointer && cursorGlow) {
  let cx = window.innerWidth * .65, cy = window.innerHeight * .35;
  let tx = cx, ty = cy;
  window.addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  const moveGlow = () => {
    cx += (tx - cx) * .12;
    cy += (ty - cy) * .12;
    cursorGlow.style.left = `${cx}px`;
    cursorGlow.style.top = `${cy}px`;
    requestAnimationFrame(moveGlow);
  };
  moveGlow();
}

if (!reducedMotion) {
  const layer = document.querySelector('.particle-layer');
  if (layer) {
    const base = coarsePointer ? window.innerWidth / 150 : window.innerWidth / 80;
    const count = Math.min(coarsePointer ? 12 : 26, Math.max(coarsePointer ? 6 : 14, Math.round(base)));
    for (let i = 0; i < count; i++) {
      const p = document.createElement('i');
      p.className = 'particle';
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${Math.random() * 100}%`;
      p.style.setProperty('--dur', `${14 + Math.random() * 20}s`);
      p.style.setProperty('--drift', `${-90 + Math.random() * 180}px`);
      p.style.setProperty('--alpha', `${.15 + Math.random() * .45}`);
      p.style.animationDelay = `${-Math.random() * 24}s`;
      const size = 1 + Math.random() * 2.2;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      layer.appendChild(p);
    }
  }

  if (!coarsePointer) {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      card.addEventListener('pointermove', e => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const rx = (0.5 - y) * 5.5;
        const ry = (x - 0.5) * 7;
        card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
        card.style.setProperty('--mx', `${x * 100}%`);
        card.style.setProperty('--my', `${y * 100}%`);
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });

    document.querySelectorAll('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);
        el.style.transform = `translate(${x * .08}px, ${y * .10}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }
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
  status.textContent = 'Opening your email application with the request prepared…';
  window.location.href = `mailto:zodwangema37@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
