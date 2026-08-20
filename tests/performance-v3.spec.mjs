import { test, expect } from '@playwright/test';

test('landing page is static-first, branded and immediately usable', async ({ page, request }) => {
  const response=await page.goto('/');
  expect(response?.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/Amantusi Trading/i);
  await expect(page.locator('h1').first()).toContainText(/Complex requirements/i);
  await expect(page.locator('#quote-form')).toBeVisible();
  await expect(page.locator('#quote-form input[name="rfqFiles"]')).toHaveCount(1);
  await expect(page.locator('#experience-loader')).toHaveCount(0);
  await expect(page.locator('script[src="/runtime-gate.js"]')).toHaveCount(1);
  await expect(page.locator('script[src="/app-fast.js"]')).toHaveCount(1);
  const home=await request.get('/');
  expect(home.headers()['x-amantusi-request-id']).toBeUndefined();
});

test('heavy realtime experience is not part of first paint and hydrates after scroll on desktop', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'),'Desktop progressive enhancement check');
  await page.goto('/');
  await expect(page.locator('script[src="/experience.js"]')).toHaveCount(0);
  await page.evaluate(() => scrollTo(0,Math.max(700,innerHeight*.75)));
  await page.waitForFunction(() => Boolean(document.querySelector('script[src="/experience.js"]')),{timeout:10000});
  await expect(page.locator('script[src="/experience.js"]')).toHaveCount(1);
  await expect(page.locator('h1').first()).toContainText(/Complex requirements/i);
});

test('mobile remains content-first and does not initialize WebGL', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'),'Mobile-only performance check');
  await page.goto('/');
  await page.evaluate(() => scrollTo(0,Math.max(1600,document.body.scrollHeight*.45)));
  await page.waitForTimeout(1200);
  await expect(page.locator('script[src="/experience.js"]')).toHaveCount(0);
  const menu=page.locator('.menu-button');
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(page.locator('#main-nav')).toHaveClass(/open/);
});

test('dynamic procurement platform remains healthy and isolated from static browsing', async ({ request }) => {
  const health=await request.get('/api/health');
  expect(health.ok()).toBeTruthy();
  expect(health.headers()['x-amantusi-request-id']).toBeTruthy();
  const data=await health.json();
  expect(data.ok).toBeTruthy();
  expect(data.kv).toBeTruthy();
  expect(data.database).toBeTruthy();
  expect(['r2','kv-fallback']).toContain(data.mediaBackend);
  expect(data.platformVersion).toBe(2);
});

test('static security headers and admin isolation remain active', async ({ request, page }) => {
  const home=await request.get('/');
  expect(home.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(home.headers()['strict-transport-security']).toContain('max-age=');
  expect(home.headers()['x-frame-options']).toBe('DENY');
  expect(home.headers()['x-content-type-options']).toBe('nosniff');

  const admin=await page.goto('/admin.html');
  expect(admin?.ok()).toBeTruthy();
  await expect(page.locator('#passkey-login')).toBeVisible();
  await expect(page.locator('script[src="/experience.js"]')).toHaveCount(0);
  await expect(page.locator('script[src="/animation-registry.js"]')).toHaveCount(0);
});

test('technical SEO utility routes remain healthy', async ({ request }) => {
  const sitemap=await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain('<urlset');
  const robots=await request.get('/robots.txt');
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toContain('Disallow: /api/admin/');
});
