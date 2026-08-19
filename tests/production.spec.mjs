import { test, expect } from '@playwright/test';

test('homepage is indexable, branded and has server-side RFQ capture', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/Amantusi Trading/i);
  await expect(page.locator('h1').first()).toContainText(/Complex requirements/i);
  await expect(page.locator('#quote-form')).toBeVisible();
  await expect(page.locator('#quote-form input[name="rfqFiles"]')).toHaveCount(1);
  await expect(page.locator('#quote-form button[type="submit"]')).toContainText(/Submit Quotation Request/i);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(2);
});

test('500-effect animation registry initializes without replacing page content', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.AmantusiAnimations?.count === 500);
  const snapshot = await page.evaluate(() => ({
    count: window.AmantusiAnimations.count,
    activeCount: window.AmantusiAnimations.activeCount,
    tier: window.AmantusiAnimations.tier,
    hero: document.querySelector('h1')?.textContent || '',
    form: Boolean(document.querySelector('#quote-form')),
    registryLayer: Boolean(document.querySelector('.ar-overlay')),
    stage3d: Boolean(document.querySelector('.ar3d-stage'))
  }));
  expect(snapshot.count).toBe(500);
  expect(snapshot.activeCount).toBeGreaterThan(0);
  expect(['safe','lite','balanced','high','ultra']).toContain(snapshot.tier);
  expect(snapshot.hero).toMatch(/Complex requirements/i);
  expect(snapshot.form).toBeTruthy();
  expect(snapshot.registryLayer).toBeTruthy();
  expect(snapshot.stage3d).toBeTruthy();
  await expect(page.locator('script[src="/animation-registry.js"]')).toHaveCount(1);
  await expect(page.locator('script[src="/animation-3d-overlay.js"]')).toHaveCount(1);
});

test('responsive performance governor and word interactions initialize', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => document.body?.dataset.performanceV3Ready === '1');
  await expect(page.locator('script[src="/performance-v3.js"]')).toHaveCount(1);
  await expect(page.locator('link[href="/performance-v3.css"]')).toHaveCount(1);
  await page.waitForFunction(() => document.querySelectorAll('.perf-word').length > 0);
  const state = await page.evaluate(() => ({
    profile: document.body.dataset.runtimeProfile,
    words: document.querySelectorAll('.perf-word').length,
    hero: document.querySelector('h1')?.textContent || '',
    form: Boolean(document.querySelector('#quote-form'))
  }));
  expect(['mobile','standard','high']).toContain(state.profile);
  expect(state.words).toBeGreaterThan(0);
  expect(state.hero).toMatch(/Complex requirements/i);
  expect(state.form).toBeTruthy();
});

test('desktop mouse wheel is accelerated without a smooth-scroll engine', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Desktop fine-pointer wheel check');
  await page.goto('/');
  await page.waitForFunction(() => window.AmantusiWheel?.enabled === true);
  await expect(page.locator('script[src="/wheel-fast.js"]')).toHaveCount(1);
  await page.evaluate(() => scrollTo(0, 0));
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(80);
  const result = await page.evaluate(() => ({ y: scrollY, boosted: window.AmantusiWheel?.boostedEvents || 0 }));
  expect(result.boosted).toBeGreaterThan(0);
  expect(result.y).toBeGreaterThan(130);
});

test('desktop precision trackpad deltas are accelerated', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Desktop precision trackpad check');
  await page.goto('/');
  await page.waitForFunction(() => window.AmantusiWheel?.precisionEnabled === true);
  await page.evaluate(() => scrollTo(0, 0));
  await page.mouse.wheel(0, 16);
  await page.waitForTimeout(60);
  const result = await page.evaluate(() => ({
    y: scrollY,
    precision: window.AmantusiWheel?.precisionBoostedEvents || 0
  }));
  expect(result.precision).toBeGreaterThan(0);
  expect(result.y).toBeGreaterThan(22);
});

test('mobile navigation remains usable', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Mobile-only usability check');
  await page.goto('/');
  const menu = page.locator('.menu-button');
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(page.locator('#main-nav')).toHaveClass(/open/);
  await expect(page.locator('#main-nav a').first()).toBeVisible();
});

test('admin exposes passkey and operations surfaces without indexing', async ({ page }) => {
  const response = await page.goto('/admin.html');
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('#passkey-login')).toBeVisible();
  await expect(page.locator('.admin-nav [data-panel-target="leads-panel"]')).toHaveCount(1);
  await expect(page.locator('.admin-nav [data-panel-target="suppliers-panel"]')).toHaveCount(1);
  await expect(page.locator('.admin-nav [data-panel-target="products-panel"]')).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);
  await expect(page.locator('script[src="/animation-registry.js"]')).toHaveCount(0);
  await expect(page.locator('script[src="/animation-3d-overlay.js"]')).toHaveCount(0);
  await expect(page.locator('script[src="/performance-v3.js"]')).toHaveCount(0);
  await expect(page.locator('script[src="/wheel-fast.js"]')).toHaveCount(0);
  expect(await page.evaluate(() => Boolean(window.AmantusiAnimations))).toBeFalsy();
});

test('technical SEO endpoints are healthy', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBeTruthy();
  const sitemapText = await sitemap.text();
  expect(sitemapText).toContain('<urlset');
  expect(sitemapText).toContain('/catering-menu.html');

  const robots = await request.get('/robots.txt');
  expect(robots.ok()).toBeTruthy();
  const robotsText = await robots.text();
  expect(robotsText).toContain('Sitemap:');
  expect(robotsText).toContain('Disallow: /api/admin/');
});

test('security headers and platform resources are live', async ({ request }) => {
  const home = await request.get('/');
  expect(home.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(home.headers()['strict-transport-security']).toContain('max-age=');
  expect(home.headers()['x-frame-options']).toBe('DENY');
  expect(home.headers()['x-content-type-options']).toBe('nosniff');

  const health = await request.get('/api/health');
  expect(health.ok()).toBeTruthy();
  const data = await health.json();
  expect(data.ok).toBeTruthy();
  expect(data.kv).toBeTruthy();
  expect(data.database).toBeTruthy();
  expect(['r2','kv-fallback']).toContain(data.mediaBackend);
  expect(data.platformVersion).toBe(2);
});
