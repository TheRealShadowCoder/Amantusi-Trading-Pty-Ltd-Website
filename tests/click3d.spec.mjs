import { test, expect } from '@playwright/test';

test('click 3D engine creates a short-lived spatial burst on public objects', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.AmantusiClick3D?.enabled === true);
  await expect(page.locator('script[src="/click-3d-fx.js"]')).toHaveCount(1);
  await expect(page.locator('link[href="/click-3d-fx.css"]')).toHaveCount(1);
  await expect(page.locator('.c3d-stage')).toHaveCount(1);

  const card = page.locator('.cap-card').first();
  await card.scrollIntoViewIfNeeded();
  await card.click({ position: { x: 30, y: 30 } });
  await expect(page.locator('.c3d-burst')).toHaveCount(1);
  const snapshot = await page.evaluate(() => ({
    bursts: window.AmantusiClick3D.bursts,
    active: window.AmantusiClick3D.active,
    tier: window.AmantusiClick3D.tier,
    particles: document.querySelectorAll('.c3d-burst .c3d-particle').length,
    rings: document.querySelectorAll('.c3d-burst .c3d-ring').length,
    effect: document.querySelector('.c3d-burst')?.dataset.effect || ''
  }));
  expect(snapshot.bursts).toBeGreaterThan(0);
  expect(snapshot.active).toBeGreaterThan(0);
  expect(['safe','lite','balanced','high','ultra']).toContain(snapshot.tier);
  expect(snapshot.particles).toBeGreaterThanOrEqual(4);
  expect(snapshot.rings).toBeGreaterThanOrEqual(2);
  expect(snapshot.effect).toBe('constellation');
  await page.waitForTimeout(1500);
  await expect(page.locator('.c3d-burst')).toHaveCount(0);
});

test('click 3D engine is never injected into Admin', async ({ page }) => {
  await page.goto('/admin.html');
  await expect(page.locator('script[src="/click-3d-fx.js"]')).toHaveCount(0);
  await expect(page.locator('link[href="/click-3d-fx.css"]')).toHaveCount(0);
  expect(await page.evaluate(() => Boolean(window.AmantusiClick3D))).toBeFalsy();
});
