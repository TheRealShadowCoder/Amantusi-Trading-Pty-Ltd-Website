import fs from 'node:fs';

const css = fs.readFileSync('public/catering-responsive-v3.css', 'utf8');
const js = fs.readFileSync('public/catering-responsive-v3.js', 'utf8');
const menu = fs.readFileSync('public/catering-menu.html', 'utf8');
const brochure = fs.readFileSync('public/catering-brochure.html', 'utf8');

function requireText(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`Responsive catering validation failed: missing ${label}`);
}

for (const bp of ['1180px','920px','760px','520px','380px']) requireText(css, `max-width:${bp}`, `breakpoint ${bp}`);
for (const feature of [
  'safe-area-inset-bottom', '100dvh', 'orientation:landscape', 'prefers-reduced-motion:reduce',
  'pointer:coarse', '.menu-grid{grid-template-columns:1fr', '.ux-builder-panel', '.ux-quickview-card',
  '.catering-mobile-nav-toggle', '.subsite-links.is-open', '.category-tabs', '.cm-gallery-card'
]) requireText(css, feature, feature);

for (const feature of [
  'visualViewport', 'ResizeObserver', 'orientationchange', 'catering-nav-open',
  'CateringMotion?.refresh', 'amantusi:catering:responsive', 'data-catering-nav-toggle'
]) requireText(js, feature, feature);

for (const [name, html] of [['menu', menu], ['brochure', brochure]]) {
  requireText(html, 'viewport-fit=cover', `${name} viewport-fit`);
  requireText(html, '/catering-responsive-v3.css', `${name} responsive stylesheet`);
  requireText(html, '/catering-responsive-v3.js', `${name} responsive runtime`);
  requireText(html, 'data-catering-nav-toggle', `${name} mobile nav toggle`);
  if (html.indexOf('/catering-responsive-v3.css') < html.indexOf('/catering-premium500.css')) {
    throw new Error(`Responsive catering validation failed: ${name} responsive CSS must load after premium CSS`);
  }
  if (html.indexOf('/catering-responsive-v3.js') < html.indexOf('/catering-premium500.js')) {
    throw new Error(`Responsive catering validation failed: ${name} responsive runtime must load after premium runtime`);
  }
}

console.log('Catering responsive v3 validated: phone, tablet, landscape, safe-area, touch and adaptive runtime wiring are present.');
