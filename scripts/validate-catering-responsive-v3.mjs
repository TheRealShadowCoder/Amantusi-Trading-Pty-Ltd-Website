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
  'pointer:coarse', '.menu-grid{grid-template-columns:1fr', '.catering-mobile-nav-toggle',
  '.subsite-links.is-open', '.category-tabs', '.cm-gallery-card'
]) requireText(css, feature, feature);

for (const feature of [
  'orientationchange', 'catering-nav-open', 'amantusi:catering:responsive',
  'data-catering-nav-toggle', 'centerRailItemHorizontally', 'overflowAnchor'
]) requireText(js, feature, feature);

if (js.includes('scrollIntoView(')) throw new Error('Responsive catering runtime must not use scrollIntoView; it can move the document vertically.');
if (js.includes("visualViewport?.addEventListener('scroll'")) throw new Error('Responsive catering runtime must not react to visualViewport scroll events.');
if (js.includes("visualViewport?.addEventListener('resize'")) throw new Error('Responsive catering runtime must not react to mobile browser chrome height changes.');
if (js.includes('new ResizeObserver')) throw new Error('Responsive catering runtime must not resize-observe the header and feed its own CSS height back into layout.');
if (!js.includes('rail.scrollTo({')) throw new Error('Category centering must use horizontal rail scrolling only.');
if (!js.includes('Math.abs(nextWidth - lastWidth) < 8')) throw new Error('Resize handling must ignore height-only/mobile browser UI changes.');

for (const [name, html] of [['menu', menu], ['brochure', brochure]]) {
  requireText(html, 'viewport-fit=cover', `${name} viewport-fit`);
  requireText(html, '/catering-responsive-v3.css', `${name} responsive stylesheet`);
  requireText(html, '/catering-responsive-v3.js', `${name} responsive runtime`);
  requireText(html, 'data-catering-nav-toggle', `${name} mobile nav toggle`);
}

console.log('Catering responsive v3 validated: responsive breakpoints are present and vertical scroll/layout feedback paths are disabled.');
