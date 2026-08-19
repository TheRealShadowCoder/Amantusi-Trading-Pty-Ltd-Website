import { test, expect } from '@playwright/test';

test('20 mapped elements receive 20 distinct advanced click animations', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.AmantusiAdvanced20?.ready === true);
  await expect(page.locator('script[src="/click-advanced20.js"]')).toHaveCount(1);
  await expect(page.locator('link[href="/click-advanced20.css"]')).toHaveCount(1);

  const snapshot = await page.evaluate(() => ({
    count: window.AmantusiAdvanced20.count,
    effects: window.AmantusiAdvanced20.effects,
    assignments: window.AmantusiAdvanced20.assignments,
    targets: document.querySelectorAll('.a20-target').length
  }));

  expect(snapshot.count).toBe(20);
  expect(snapshot.targets).toBe(20);
  expect(snapshot.effects).toHaveLength(20);
  expect(new Set(snapshot.effects).size).toBe(20);
  expect(new Set(snapshot.assignments.map(item => item.effect)).size).toBe(20);

  const expected = [
    'liquid-metal-morph','energy-tunnel','hologram-scan','magnetic-fragment-recall','shock-cone',
    'light-pillar','wireframe-reveal','hex-grid','domino-wave','page-fold','gravity-well','crystal-growth',
    'plasma-arc','depth-slice','radar-sweep','vortex-implosion','light-ribbon','satellite-deployment',
    'prismatic-refraction','constellation-draw'
  ];
  expect(snapshot.effects).toEqual(expected);
});

test('advanced effect creates and cleans a short-lived 3D burst', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Desktop interaction verification');
  await page.goto('/');
  await page.waitForFunction(() => window.AmantusiAdvanced20?.count === 20);
  const brand = page.locator('.brand');
  await brand.click();
  await expect(page.locator('.a20-burst[data-effect="liquid-metal-morph"]')).toHaveCount(1);
  await expect(page.locator('.a20-metal-blob').first()).toBeVisible();
  await page.waitForTimeout(1800);
  await expect(page.locator('.a20-burst')).toHaveCount(0);
});

test('advanced 20 animation layer is excluded from Admin', async ({ page }) => {
  await page.goto('/admin.html');
  await expect(page.locator('script[src="/click-advanced20.js"]')).toHaveCount(0);
  await expect(page.locator('link[href="/click-advanced20.css"]')).toHaveCount(0);
  expect(await page.evaluate(() => Boolean(window.AmantusiAdvanced20))).toBeFalsy();
});
