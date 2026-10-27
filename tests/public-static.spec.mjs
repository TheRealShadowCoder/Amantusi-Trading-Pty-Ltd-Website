import { test, expect } from '@playwright/test';

test('homepage is accessible, fast-first, and links to sector detail pages', async ({ page }) => {
  const response=await page.goto('/');
  expect(response?.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/Amantusi Trading/i);
  await expect(page.locator('h1').first()).toContainText('Complex requirements');
  await expect(page.locator('.skip-link')).toHaveAttribute('href','#main-content');
  await expect(page.locator('#quote-form [name="rfqFiles"]')).toHaveCount(1);
  await expect(page.locator('#rfq-save-draft')).toHaveCount(1);
  await expect(page.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow','0');
  await expect(page.locator('#experience-loader')).toHaveCount(0);
  for(const route of ['government-procurement','fmcg-supply','corporate-catering','cleaning-hygiene','office-institutional','general-trading'])
    await expect(page.locator('a[href="/'+route+'.html"]').first()).toHaveCount(1);
});

test('six sectors and printable checklist render responsive content', async ({ page }) => {
  for(const route of ['government-procurement','fmcg-supply','corporate-catering','cleaning-hygiene','office-institutional','general-trading','procurement-checklist']){
    const response=await page.goto('/'+route+'.html');
    expect(response?.ok(),route).toBeTruthy();
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('.sector-skip')).toHaveAttribute('href','#content');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),route).toBeTruthy();
  }
});

test('mobile menu is keyboard dismissible', async ({ page },testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'),'Mobile-only');
  await page.goto('/');
  const menu=page.locator('.menu-button');
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded','true');
  await expect(page.locator('#main-nav')).toHaveClass(/open/);
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded','false');
  await expect(menu).toBeFocused();
  await expect(page.locator('#main-nav')).not.toHaveClass(/open/);
});

test('RFQ submission validates attachments and handles success without real backend writes', async ({ page }) => {
  let submitted=0;
  await page.route('**/api/quote',async route=>{
    submitted++;
    await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({ok:true,reference:'AMT-TEST-0001',files:0})});
  });
  await page.goto('/?service=FMCG%20Supply#quote');
  await expect(page.locator('#quote-form select[name="type"]')).toHaveValue('FMCG Supply');
  await page.locator('#quote-form [name="organisation"]').fill('Sample buyer');
  await page.locator('#quote-form [name="contact"]').fill('Jane Test');
  await page.locator('#quote-form [name="email"]').fill('test@example.com');
  await page.locator('#quote-form [name="requirements"]').fill('25 units of specified items');
  await page.locator('#quote-form [name="rfqFiles"]').setInputFiles({name:'too-large.pdf',mimeType:'application/pdf',buffer:Buffer.alloc(10_000_001)});
  await page.locator('#quote-form button[type="submit"]').click();
  await expect(page.locator('#form-status')).toContainText('10 MB or smaller');
  expect(submitted).toBe(0);
  await page.locator('#quote-form [name="rfqFiles"]').setInputFiles([]);
  await page.locator('#quote-form button[type="submit"]').click();
  await expect(page.locator('#form-status')).toContainText('AMT-TEST-0001');
  expect(submitted).toBe(1);
});

test('RFQ draft requires opt-in and can be recovered', async ({ page }) => {
  await page.goto('/');
  await page.locator('#rfq-save-draft').check();
  await page.locator('#quote-form [name="organisation"]').fill('Sample company draft');
  await expect.poll(()=>page.evaluate(()=>{
    const saved=localStorage.getItem('amantusi-rfq-draft-v1');
    return saved?JSON.parse(saved).values?.organisation:null;
  })).toBe('Sample company draft');
  await page.reload();
  await expect(page.locator('#quote-form [name="organisation"]')).toHaveValue('Sample company draft');
  await page.locator('.rfq-clear').click();
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('amantusi-rfq-draft-v1'))).toBeNull();
});

test('catering menu search and selected options bridge into RFQ',async ({ page })=>{
  await page.goto('/catering-menu.html');
  const cards=page.locator('[data-menu-grid] .menu-card');
  await expect(cards.first()).toBeVisible();
  await expect(page.locator('[data-catering-search]')).toBeVisible();
  await expect(page.locator('.category-count').first()).toBeVisible();
  await page.locator('[data-catering-gallery-track] .catering-image-open').first().click();
  await expect(page.locator('.catering-lightbox')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.catering-lightbox')).not.toBeVisible();
  await page.locator('[data-catering-search]').fill('unmatched-test-phrase-zz');
  await expect(page.locator('[data-catering-results]')).toContainText('0 menu options shown');
  await page.locator('[data-catering-search]').fill('');
  await cards.first().locator('[data-catering-add]').click();
  await expect(page.locator('[data-catering-basket]')).toContainText('1 option selected');
  await expect(page.locator('.catering-floating-basket')).toBeVisible();
  await page.locator('#catering-brief-form [name="eventType"]').selectOption({label:'Business meeting'});
  await page.locator('#catering-brief-form [name="guestCount"]').fill('25');
  await page.locator('#catering-brief-form [name="date"]').fill('2026-12-02');
  await page.locator('#catering-brief-form [name="location"]').fill('Durban');
  await page.locator('#catering-brief-form button[type="submit"]').click();
  await page.waitForURL(/service=Catering.*#quote/);
  await expect(page.locator('#quote-form select[name="type"]')).toHaveValue('Catering');
  await expect(page.locator('#quote-form textarea[name="requirements"]')).toHaveValue(/Guest count: 25/);
});

test('company profile and catering brochure are reachable and print-friendly',async ({ page })=>{
  for(const route of ['/company-profile.html','/catering-brochure.html']){
    const response=await page.goto(route);
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('main h1').first()).toBeVisible();
    await expect(page.locator('[data-print]')).toHaveCount(1);
    await expect(page.locator('[data-catering-nav-toggle]')).toHaveCount(1);
  }
});
