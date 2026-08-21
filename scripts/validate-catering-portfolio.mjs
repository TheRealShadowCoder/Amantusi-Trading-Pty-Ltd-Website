import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const manifestPath = path.resolve('public/data/catering-portfolio.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const items = Array.isArray(manifest.items) ? manifest.items : [];

if (items.length !== 20) throw new Error(`Catering portfolio must contain exactly 20 items; found ${items.length}.`);

const keys = new Set();
const sources = new Set();
let totalBytes = 0;
const maxSingleBytes = 220 * 1024;
const maxTotalBytes = 2.5 * 1024 * 1024;

for (const item of items) {
  if (!item?.key || !item?.name || !item?.src) throw new Error('Every catering portfolio entry requires key, name and src.');
  if (keys.has(item.key)) throw new Error(`Duplicate portfolio key: ${item.key}`);
  if (sources.has(item.src)) throw new Error(`Duplicate portfolio source: ${item.src}`);
  keys.add(item.key);
  sources.add(item.src);

  if (!item.src.startsWith('/assets/catering/') || !item.src.endsWith('.webp')) {
    throw new Error(`Portfolio image must be a local WebP under /assets/catering/: ${item.src}`);
  }

  const filePath = path.resolve('public', item.src.replace(/^\//, ''));
  const info = await stat(filePath);
  if (!info.isFile()) throw new Error(`Portfolio asset is not a file: ${filePath}`);
  if (info.size > maxSingleBytes) throw new Error(`Portfolio image exceeds 220 KiB: ${item.src} (${info.size} bytes)`);
  totalBytes += info.size;

  const header = Buffer.alloc(12);
  const handle = await import('node:fs/promises').then(fs => fs.open(filePath, 'r'));
  try { await handle.read(header, 0, 12, 0); } finally { await handle.close(); }
  const riff = header.subarray(0, 4).toString('ascii') === 'RIFF';
  const webp = header.subarray(8, 12).toString('ascii') === 'WEBP';
  if (!riff || !webp) throw new Error(`Invalid WebP signature: ${item.src}`);
}

for (const heroKey of manifest.hero || []) {
  if (!keys.has(heroKey)) throw new Error(`Hero key is missing from portfolio: ${heroKey}`);
}
for (const [category, fallbackKey] of Object.entries(manifest.menuFallbacks || {})) {
  if (!keys.has(fallbackKey)) throw new Error(`Fallback ${category} references missing key ${fallbackKey}.`);
}
if (totalBytes > maxTotalBytes) throw new Error(`Total catering portfolio exceeds 2.5 MiB: ${totalBytes} bytes.`);

console.log(`Catering portfolio validated: ${items.length} WebP assets, ${(totalBytes / 1024 / 1024).toFixed(2)} MiB total.`);
