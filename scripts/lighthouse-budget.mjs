import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const url = process.env.BASE_URL || 'https://amantusi-trading-pty-ltd-website.dolomite-computer.workers.dev';
const outDir = path.resolve('lighthouse-report');
fs.mkdirSync(outDir, { recursive: true });
const reportPath = path.join(outDir, 'report.json');
const htmlPath = path.join(outDir, 'report.html');
const env = { ...process.env, CHROME_PATH: chromium.executablePath() };

const run = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', [
  'lighthouse', url,
  '--quiet',
  '--chrome-flags=--headless --no-sandbox --disable-gpu',
  '--only-categories=performance,accessibility,best-practices,seo',
  '--output=json',
  `--output-path=${reportPath}`
], { stdio: 'inherit', env });
if (run.status !== 0) process.exit(run.status || 1);

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const scores = Object.fromEntries(Object.entries(report.categories).map(([key, value]) => [key, Math.round((value.score || 0) * 100)]));
console.log('Lighthouse scores:', scores);

const htmlRun = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', [
  'lighthouse', url,
  '--quiet',
  '--chrome-flags=--headless --no-sandbox --disable-gpu',
  '--only-categories=performance,accessibility,best-practices,seo',
  '--output=html',
  `--output-path=${htmlPath}`
], { stdio: 'inherit', env });
if (htmlRun.status !== 0) console.warn('HTML Lighthouse report generation failed; JSON report is still available.');

const failures = [];
if ((scores.performance || 0) < 50) failures.push(`performance ${scores.performance} < 50`);
if ((scores.accessibility || 0) < 82) failures.push(`accessibility ${scores.accessibility} < 82`);
if ((scores['best-practices'] || 0) < 80) failures.push(`best-practices ${scores['best-practices']} < 80`);
if ((scores.seo || 0) < 90) failures.push(`seo ${scores.seo} < 90`);
if (failures.length) {
  console.error(`Lighthouse budget failed: ${failures.join(', ')}`);
  process.exit(1);
}
