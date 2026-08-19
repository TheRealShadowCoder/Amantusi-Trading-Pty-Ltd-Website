import { test, expect } from '@playwright/test';

test('six targeted click 3D families are registered and mapped', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.AmantusiClick3D?.enabled === true);
  const state = await page.evaluate(() => {
    const api = window.AmantusiClick3D;
    const pick = selector => api.effectFor(document.querySelector(selector));
    return {
      families: [...api.families],
      heroCta: pick('.hero .button'),
      card: pick('.cap-card'),
      service: pick('.process-step'),
      panel: pick('.government-panel'),
      important: pick('.contact-links a'),
      heroObject: pick('.orbital-card')
    };
  });
  expect(state.families).toEqual(['ring-burst','glass-gold','orbital-node','ripple-depth','spark-wave','mini-swarm']);
  expect(state.heroCta).toBe('ring-swarm');
  expect(state.card).toBe('glass-gold');
  expect(state.service).toBe('orbital-node');
  expect(state.panel).toBe('ripple-depth');
  expect(state.important).toBe('spark-wave');
  expect(state.heroObject).toBe('mini-swarm');
});

test('click families create the expected 3D object structures', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Desktop structure check');
  await page.goto('/');
  await page.waitForFunction(() => window.AmantusiClick3D?.enabled === true);

  const card = page.locator('.cap-card').first();
  await card.scrollIntoViewIfNeeded();
  await card.click();
  const glass = page.locator('.c3d-burst[data-effect="glass-gold"]');
  await expect(glass).toHaveCount(1);
  expect(await glass.locator('.c3d-shard').count()).toBeGreaterThan(0);
  expect(await glass.locator('.c3d-particle').count()).toBeGreaterThan(0);

  await page.waitForTimeout(1550);
  const heroObject = page.locator('.orbital-card');
  await heroObject.scrollIntoViewIfNeeded();
  await heroObject.click({ position: { x: 80, y: 80 } });
  const swarm = page.locator('.c3d-burst[data-effect="mini-swarm"]');
  await expect(swarm).toHaveCount(1);
  expect(await swarm.locator('.c3d-mini-object').count()).toBeGreaterThan(0);
});
