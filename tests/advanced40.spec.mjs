import { test, expect } from '@playwright/test';

test('40 additional page elements receive 40 unique animation/object recipes', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.AmantusiAdvanced40?.ready === true);

  await expect(page.locator('script[src="/click-advanced40.js"]')).toHaveCount(1);
  await expect(page.locator('link[href="/click-advanced40.css"]')).toHaveCount(1);

  const snapshot = await page.evaluate(() => ({
    count: window.AmantusiAdvanced40.count,
    effects: window.AmantusiAdvanced40.effects,
    objects: window.AmantusiAdvanced40.objects,
    assigned: document.querySelectorAll('[data-a40-effect]').length
  }));

  expect(snapshot.count).toBe(40);
  expect(snapshot.assigned).toBe(40);
  expect(new Set(snapshot.effects).size).toBe(40);
  expect(new Set(snapshot.objects).size).toBe(40);
});

test('advanced 40 layer creates and removes the assigned object burst', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.AmantusiAdvanced40?.count === 40);

  const target = page.locator('.hero .eyebrow');
  await expect(target).toHaveAttribute('data-a40-effect', 'helix-sparks');
  await target.dispatchEvent('click', { clientX: 220, clientY: 180 });
  await page.waitForTimeout(80);
  await expect(page.locator('.a40-burst[data-effect="helix-sparks"]')).toHaveCount(1);
  expect(await page.locator('.a40-burst[data-effect="helix-sparks"] .a40-helix').count()).toBeGreaterThan(1);
  await page.waitForTimeout(1750);
  await expect(page.locator('.a40-burst[data-effect="helix-sparks"]')).toHaveCount(0);
});

test('advanced 40 animation assets never load in Admin', async ({ page }) => {
  await page.goto('/admin.html');
  await expect(page.locator('script[src="/click-advanced40.js"]')).toHaveCount(0);
  await expect(page.locator('link[href="/click-advanced40.css"]')).toHaveCount(0);
  expect(await page.evaluate(() => Boolean(window.AmantusiAdvanced40))).toBeFalsy();
});
