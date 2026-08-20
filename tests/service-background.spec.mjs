import { test, expect } from '@playwright/test';

test('cinematic service backgrounds expose a 10-image 9-second cycle', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.AmantusiServiceBackground?.ready === true);
  await expect(page.locator('script[src="/service-background.js"]')).toHaveCount(1);
  await expect(page.locator('link[href="/service-background.css"]')).toHaveCount(1);

  const state = await page.evaluate(() => ({
    count: window.AmantusiServiceBackground.count,
    interval: window.AmantusiServiceBackground.interval,
    hosts: window.AmantusiServiceBackground.hosts,
    currentIndex: window.AmantusiServiceBackground.currentIndex,
    labels: window.AmantusiServiceBackground.services.map(item => item.label),
    frames: document.querySelectorAll('.svc-cinema-frame').length
  }));
  expect(state.count).toBe(10);
  expect(state.interval).toBe(9000);
  expect(state.hosts).toBeGreaterThanOrEqual(6);
  expect(state.frames).toBe(state.hosts * 2);
  expect(new Set(state.labels).size).toBe(10);

  const before = state.currentIndex;
  await page.evaluate(() => window.AmantusiServiceBackground.advance());
  await page.waitForFunction(previous => window.AmantusiServiceBackground.currentIndex !== previous, before, { timeout: 3500 });
  const after = await page.evaluate(() => window.AmantusiServiceBackground.currentIndex);
  expect(after).not.toBe(before);
});

test('service background image proxy returns a cacheable same-origin image', async ({ request }) => {
  const response = await request.get('/service-bg/1');
  expect(response.ok()).toBeTruthy();
  expect(response.headers()['content-type']).toMatch(/^image\//);
  expect(response.headers()['cache-control']).toContain('max-age=604800');
  expect(response.headers()['x-amantusi-service-background']).toBe('1');
});

test('admin does not load cinematic service backgrounds', async ({ page }) => {
  await page.goto('/admin.html');
  await expect(page.locator('script[src="/service-background.js"]')).toHaveCount(0);
  await expect(page.locator('link[href="/service-background.css"]')).toHaveCount(0);
  expect(await page.evaluate(() => Boolean(window.AmantusiServiceBackground))).toBeFalsy();
});
