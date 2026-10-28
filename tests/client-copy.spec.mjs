import {test,expect} from '@playwright/test';

test('public homepage reads as a finished service website, not a rendering demo',async({page})=>{
 for(const route of ['/','/index-fast.html']){
  await page.goto(route);
  await expect(page.locator('#amt-showcase-title')).toContainText('Real services.');
  await expect(page.locator('#amt-showcase-title')).toContainText('Built around you.');
  await expect(page.locator('.amt-showcase-topline')).not.toContainText(/photo material study/i);
  await expect(page.locator('.amt-showcase-disclaimer')).toContainText('Images are illustrative.');
  await expect(page.locator('#quote-form')).toBeAttached();
  await expect(page.locator('#immersive [role="tab"]')).toHaveCount(5);
  await page.locator('[data-amt-item="meals"]').click();
  await expect(page.locator('[data-amt-subtitle]')).toHaveText('PACKED MEALS / 02');
  await expect(page.locator('[data-amt-link]')).toHaveAttribute('href','/catering-menu.html');
  expect((await page.locator('main').innerText()).toLowerCase()).not.toMatch(/photo material study|rendered in glass|interactive image refraction|brighter\s+tom+orrow/);
 }
});

test('company profile is a client brochure without admin or brand manual',async({page})=>{
 await page.goto('/company-profile.html');
 await expect(page.locator('main h1')).toBeVisible();
 await expect(page.getByText('Working with Amantusi')).toBeVisible();
 await expect(page.locator('main')).toContainText('A clear approach to every enquiry.');
 await expect(page.locator('a[href="/#quote"]')).toBeVisible();
 await expect(page.locator('.subsite-admin')).toHaveCount(0);
 const copy=(await page.locator('main').innerText()).toLowerCase();
 expect(copy).not.toMatch(/typography direction|brand system|logo identity|brand character|future company documents/);
});

test('company capability statement and information notice use clear factual customer copy',async({page})=>{
 await page.goto('/capability-statement.html');
 await expect(page.locator('.resource-document')).toContainText('Further information');
 await expect(page.locator('.resource-document')).toContainText('No certification, contract award or inventory availability');
 expect(await page.locator('main').innerText()).not.toMatch(/version 1\.0|document control/i);
 await page.goto('/information-handling.html');
 await expect(page.locator('main')).toContainText('not a complete privacy policy');
 expect(await page.locator('main').innerText()).not.toMatch(/website source does not specify|final company privacy policy/i);
 await page.goto('/procurement-templates.html');
 await expect(page.locator('main')).toContainText('Product: [name or SKU]');
});
