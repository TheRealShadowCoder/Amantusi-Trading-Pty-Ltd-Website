import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const guard = read('public/catering-mutation-guard.js');
const ux = read('public/catering-ux500.js');
const pages = ['public/catering-menu.html', 'public/catering-brochure.html'];

if (!guard.includes("[data-menu-grid]")) throw new Error('Mutation guard is not scoped to the catering menu grid.');
if (!guard.includes(".menu-card:not([data-ux-enhanced])")) throw new Error('Mutation guard does not distinguish genuinely new menu cards.');
if (!guard.includes('if (!hasFreshMenuContent) return')) throw new Error('Mutation guard does not suppress reorder-only feedback mutations.');
if (!ux.includes('new MutationObserver')) throw new Error('Expected UX500 dynamic observer was not found.');
if (!ux.includes('grid.append(card)')) throw new Error('Expected UX500 card reordering path was not found; review the stability guard.');

for (const path of pages) {
  const html = read(path);
  const safeMode = html.includes('data-catering-safe-mode="true"');
  const guardIndex = html.indexOf('/catering-mutation-guard.js');
  const uxIndex = html.indexOf('/catering-ux500.js');

  if (safeMode) {
    if (guardIndex >= 0 || uxIndex >= 0 || html.includes('/catering-premium500.js') || html.includes('/catering-motion.js')) {
      throw new Error(`${path} safe mode still loads an advanced runtime.`);
    }
    if (!html.includes('/catering.js') || !html.includes('/catering-responsive-v3.js')) {
      throw new Error(`${path} safe mode must retain core catering and responsive runtimes.`);
    }
    continue;
  }

  if (guardIndex < 0) throw new Error(`${path} does not load the catering mutation guard.`);
  if (uxIndex < 0) throw new Error(`${path} does not load UX500.`);
  if (guardIndex > uxIndex) throw new Error(`${path} loads UX500 before the mutation guard.`);
}

console.log('Catering stability validated: production pages are either guarded before UX500 or running minimal safe mode with only core catering and responsive runtimes.');
