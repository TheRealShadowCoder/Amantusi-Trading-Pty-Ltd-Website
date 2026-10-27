import { test, expect } from '@playwright/test';

test('homepage is accessible, fast-first, and links to sector detail pages', async ({ page }) => {
  const response=await page.goto('/');
  expect(response?.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/Amantusi Trading/i);
  await expect(page.locator('h1').first()).toContainText('Complex requirements');
  await expect(page.locator('.skip-link')).toHaveAttribute('href','#main-content');
  await expect(page.locator('#quote-form [name="rfqFiles"]')).toHaveCount(1);
  await expect(page.locator('#rfq-save-draft')).toHaveCount(1);
  await expect(page.getByRole('progressbar',{name:'Required fields completed'})).toHaveAttribute('aria-valuenow','0');
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
  await expect(page.locator('#quote-form [name="rfqFiles"]')).toHaveAttribute('aria-invalid','true');
  expect(submitted).toBe(0);
  await page.locator('#quote-form [name="rfqFiles"]').setInputFiles([]);
  await expect(page.locator('#quote-form [name="rfqFiles"]')).toHaveAttribute('aria-invalid','false');
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

test('shared site directory, back-to-top and 404 recovery work',async ({page})=>{
  await page.goto('/');
  await expect(page.locator('[data-public-site-directory]')).toBeVisible();
  await expect(page.locator('[data-public-site-directory] a[href="/procurement-checklist.html"]')).toHaveCount(1);
  await page.evaluate(()=>scrollTo(0,1600));
  await expect(page.locator('.public-back-to-top')).toBeVisible();
  await page.locator('.public-back-to-top').click();
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeLessThan(50);
  await page.goto('/404.html');
  await expect(page.getByRole('heading',{name:/page has moved/i})).toBeVisible();
  await expect(page.getByRole('link',{name:'Return to homepage'})).toHaveAttribute('href','/');
});

test('resource centre, information notice, and FAQ pages are usable',async ({page})=>{
 for(const path of ['procurement-guides','supplier-onboarding','procurement-templates','capability-statement','procurement-faq','information-handling']){
   const resp=await page.goto('/'+path+'.html');
   expect(resp?.ok(),path).toBeTruthy();
   await expect(page.locator('h1')).toHaveCount(1);
   await expect(page.locator('[data-public-site-directory]')).toBeVisible();
 }
 await page.goto('/procurement-faq.html');
 await page.locator('.resource-faq summary').first().click();
 await expect(page.locator('.resource-faq details').first()).toHaveAttribute('open','');
});

test('structured RFQ line items are submitted through the real form interface',async({page})=>{
 let raw='';
 await page.route('**/api/quote',async route=>{
   raw=route.request().postData()||'';
   await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({ok:true,reference:'AMT-TEST-ROWS'})});
 });
 await page.goto('/');
 await page.locator('#quote-form [name="organisation"]').fill('Client Org');
 await page.locator('#quote-form [name="contact"]').fill('Client Test');
 await page.locator('#quote-form [name="email"]').fill('client@example.com');
 await page.locator('#quote-form [name="requirements"]').fill('Supply materials for project');
 await page.locator('[data-rfq-add]').click();
 await page.locator('[data-rfq-name]').fill('A4 printing paper 80 gsm');
 await page.locator('[data-rfq-qty]').fill('10');
 await page.locator('[data-rfq-unit]').selectOption({label:'Pack'});
 await page.locator('#quote-form button[type="submit"]').click();
 await expect(page.locator('#form-status')).toContainText('AMT-TEST-ROWS');
 expect(raw).toContain('A4 printing paper 80 gsm');
 expect(raw).toContain('10 Pack');
});

test('catering and tender RFQs display relevant conditional fields',async({page})=>{
 await page.goto('/?service=Catering#quote');
 await expect(page.locator('fieldset[data-context="Catering"]')).toBeVisible();
 await expect(page.locator('[name="eventGuests"]')).toBeEnabled();
 await page.locator('#quote-form select[name="type"]').selectOption('Government RFQ / Tender');
 await expect(page.locator('fieldset[data-context="Government RFQ / Tender"]')).toBeVisible();
 await expect(page.locator('[name="eventGuests"]')).toBeDisabled();
 await expect(page.locator('[name="tenderClosingTime"]')).toBeEnabled();
});

test('public pages fit baseline responsive viewports',async({page})=>{
 const paths=['/','/government-procurement.html','/procurement-guides.html','/procurement-faq.html','/capability-statement.html','/catering-menu.html'];
 for(const size of [{width:320,height:720},{width:375,height:800},{width:768,height:1024},{width:1024,height:768}]){
   await page.setViewportSize(size);
   for(const path of paths){
     await page.goto(path);
     await expect(page.locator('h1').first()).toBeVisible();
     const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
     expect(overflow, path+' at '+size.width+'px').toBeLessThanOrEqual(2);
   }
 }
});

test('public interfaces do not generate uncaught script errors at first load',async({page})=>{
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 for(const path of ['/','/procurement-guides.html','/procurement-faq.html','/catering-menu.html']){
   await page.goto(path);
   await page.waitForTimeout(400);
 }
 expect(errors).toEqual([]);
});

test('failed RFQ response preserves customer inputs and describes the problem',async ({page})=>{
 await page.route('**/api/quote',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Quotation database is temporarily unavailable.'})}));
 await page.goto('/');
 await page.locator('#quote-form [name="organisation"]').fill('Save test customer');
 await page.locator('#quote-form [name="contact"]').fill('Tester');
 await page.locator('#quote-form [name="email"]').fill('customer@example.com');
 await page.locator('#quote-form [name="requirements"]').fill('Please quote for 100 packs');
 await page.locator('#quote-form button[type="submit"]').click();
 await expect(page.locator('#form-status')).toContainText('Quotation database is temporarily unavailable');
 await expect(page.locator('#quote-form [name="organisation"]')).toHaveValue('Save test customer');
 await expect(page.locator('#quote-form button[type="submit"]')).toBeEnabled();
});

test('mobile quotation shortcut remains keyboard-accessible',async({page})=>{
 await page.setViewportSize({width:375,height:800});
 await page.goto('/');
 await expect(page.locator('[data-mobile-quote-cta]')).toBeVisible();
 await expect(page.locator('[data-mobile-quote-cta]')).toHaveAttribute('href','#quote');
});

test('required RFQ fields have persistent visible badges and accessible state',async({page})=>{
 await page.goto('/');
 const field=page.locator('#quote-form [name="organisation"]');
 await expect(field).toHaveAttribute('aria-required','true');
 await expect(page.locator('#quote-form label.rfq-required-field, #quote-form .rfq-required-marker').first()).toBeVisible();
 await expect(page.locator('#quote-form .rfq-required-marker')).toHaveCount(4);
});
