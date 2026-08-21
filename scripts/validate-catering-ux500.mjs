import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const requiredFiles = [
  'public/catering-ux500.css',
  'public/catering-ux500.js',
  'public/catering-premium500.css',
  'public/catering-premium500.js',
  'public/catering-quote-bridge.js',
  'public/data/catering-ux500.json'
];

for (const file of requiredFiles) {
  const info = await stat(path.resolve(file));
  if (!info.isFile() || info.size === 0) throw new Error(`Missing or empty UX500 asset: ${file}`);
}

const [uxJs, premiumJs, menuHtml, brochureHtml, fastHtml, indexHtml, configText] = await Promise.all([
  readFile('public/catering-ux500.js', 'utf8'),
  readFile('public/catering-premium500.js', 'utf8'),
  readFile('public/catering-menu.html', 'utf8'),
  readFile('public/catering-brochure.html', 'utf8'),
  readFile('public/index-fast.html', 'utf8'),
  readFile('public/index.html', 'utf8'),
  readFile('public/data/catering-ux500.json', 'utf8')
]);

const config = JSON.parse(configText);
if (config.capabilityCount !== 500) throw new Error(`UX500 config must declare exactly 500 capabilities; found ${config.capabilityCount}.`);
if (!/Array\.from\(\{\s*length:\s*500\s*\}/.test(uxJs)) throw new Error('UX500 runtime does not register exactly 500 capability slots.');
if (!/CUX-/.test(uxJs)) throw new Error('UX500 capability IDs are missing.');
if (!/AmantusiCateringUX500/.test(uxJs)) throw new Error('UX500 public runtime API is missing.');
if (!/AmantusiCateringPremium500/.test(premiumJs)) throw new Error('Premium500 runtime API is missing.');

for (const [name, html] of [['menu', menuHtml], ['brochure', brochureHtml]]) {
  const safeMode = html.includes('data-catering-safe-mode="true"');
  if (!html.includes('viewport-fit=cover')) throw new Error(`${name} page is missing safe-area viewport support.`);
  if (safeMode) {
    for (const marker of ['/catering-ux500.js','/catering-premium500.js','/catering-mutation-guard.js','/catering-motion.js']) {
      if (html.includes(marker)) throw new Error(`${name} safe mode must not load ${marker}.`);
    }
    if (!html.includes('/catering-responsive-v3.js')) throw new Error(`${name} safe mode must retain responsive runtime.`);
  } else {
    for (const marker of ['/catering-ux500.css','/catering-ux500.js','/catering-premium500.css','/catering-premium500.js']) {
      if (!html.includes(marker)) throw new Error(`${name} page does not load ${marker}.`);
    }
  }
}

for (const [name, html] of [['index-fast', fastHtml], ['index', indexHtml]]) {
  if (!html.includes('/catering-quote-bridge.js')) throw new Error(`${name} does not load the catering quote bridge.`);
  if (!html.includes('id="quote-form"')) throw new Error(`${name} quote form is missing.`);
}

const safety = config.principles || {};
for (const key of ['staticFirst','adaptiveMotion','reducedMotion','saveData','noFabricatedClaims','noFabricatedPricing','noFabricatedAvailability','noDarkPatterns']) {
  if (safety[key] !== true) throw new Error(`UX500 safety/performance principle must be true: ${key}`);
}

const bound = config.dataBoundFeatures || {};
for (const key of ['packages','testimonials','clientLogos','serviceAreas','liveAvailability','livePricing','dietaryCertifications','actualEventPhotography']) {
  if (!(key in bound)) throw new Error(`Missing data-bound feature hook: ${key}`);
}

if (!/prefers-reduced-motion/.test(await readFile('public/catering-ux500.css','utf8'))) throw new Error('UX500 CSS lacks reduced-motion handling.');
if (!/PerformanceObserver/.test(uxJs)) throw new Error('UX500 adaptive performance guard is missing.');
if (!/navigator\.share/.test(uxJs)) throw new Error('UX500 share enhancement is missing.');
if (!/amantusi-catering-brief/.test(uxJs)) throw new Error('UX500 catering brief persistence is missing.');
if (!/amantusi-catering-brief/.test(await readFile('public/catering-quote-bridge.js','utf8'))) throw new Error('Quote bridge does not consume catering briefs.');

console.log('Catering UX500 assets validated; live catering pages may run in stability safe mode while advanced runtime assets remain available for isolated re-entry testing.');
