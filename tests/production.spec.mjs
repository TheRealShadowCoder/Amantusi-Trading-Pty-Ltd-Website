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
  await expect(page.locator('[data-panel-target="leads-panel"]')).toHaveCount(1);
  await expect(page.locator('[data-panel-target="suppliers-panel"]')).toHaveCount(1);
  await expect(page.locator('[data-panel-target="products-panel"]')).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);
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
  expect(data.r2).toBeTruthy();
  expect(data.platformVersion).toBe(2);
});
