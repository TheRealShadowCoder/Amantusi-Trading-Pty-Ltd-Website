import { test, expect } from '@playwright/test';

test('service cinema uses ten Amantusi-logo-only scenes with five animation layers', async ({ page, request }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.AmantusiServiceBackground?.ready === true);

  const state = await page.evaluate(() => ({
    count: window.AmantusiServiceBackground.count,
    interval: window.AmantusiServiceBackground.interval,
    source: window.AmantusiServiceBackground.source,
    animations: window.AmantusiServiceBackground.animationsPerScene,
    logo: window.AmantusiServiceBackground.logo,
    hosts: window.AmantusiServiceBackground.hosts,
    frames: document.querySelectorAll('.svc-cinema-frame.is-current').length,
    layers: document.querySelector('.svc-cinema-frame.is-current')?.querySelectorAll(':scope > i').length || 0,
    bodySource: document.body.dataset.serviceBackgroundSource,
    bodyAnimations: Number(document.body.dataset.serviceBackgroundAnimations || 0)
  }));

  expect(state.count).toBe(10);
  expect(state.interval).toBe(9000);
  expect(state.source).toBe('amantusi-logo-only');
  expect(state.animations).toBe(5);
  expect(state.logo).toBe('/assets/amantusi-logo.svg');
  expect(state.hosts).toBeGreaterThan(0);
  expect(state.frames).toBeGreaterThan(0);
  expect(state.layers).toBe(5);
  expect(state.bodySource).toBe('amantusi-logo-only');
  expect(state.bodyAnimations).toBe(5);

  await expect(page.locator('link[href="/service-background.css"]')).toHaveCount(1);
  await expect(page.locator('script[src="/service-background.js"]')).toHaveCount(1);

  const logo = await request.get('/assets/amantusi-logo.svg');
  expect(logo.ok()).toBeTruthy();
  const legacyPhotoRoute = await request.get('/service-bg/1');
  expect(legacyPhotoRoute.status()).toBe(404);
});

test('logo cinema remains excluded from admin', async ({ page }) => {
  await page.goto('/admin.html');
  await expect(page.locator('link[href="/service-background.css"]')).toHaveCount(0);
  await expect(page.locator('script[src="/service-background.js"]')).toHaveCount(0);
  expect(await page.evaluate(() => Boolean(window.AmantusiServiceBackground))).toBeFalsy();
});
