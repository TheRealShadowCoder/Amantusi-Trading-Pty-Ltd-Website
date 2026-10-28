import {test,expect} from '@playwright/test';
const services=[
 ['catering','/corporate-catering.html'],
 ['meals','/catering-menu.html'],
 ['institutional','/office-institutional.html'],
 ['hygiene','/cleaning-hygiene.html'],
 ['trading','/general-trading.html']
];
test('the photographic landing replaces orbital art, retains navigation and RFQ',async({page})=>{
 for(const path of ['/','/index-fast.html']){
  const response=await page.goto(path);
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('#landing-main-heading')).toBeVisible();
  await expect(page.locator('#landing-main-heading')).toContainText('FEEDING PEOPLE.');
  expect(await page.locator('h1').count()).toBe(1);
  await expect(page.locator('.am-glass-tile')).toHaveCount(5);
  await expect(page.locator('.orbital-card')).toHaveCount(0);
  await expect(page.locator('a[href="#quote"]').first()).toBeAttached();
  await expect(page.locator('#quote-form')).toBeAttached();
  await expect(page.locator('#immersive')).toBeAttached();
  for(const [service,href] of services){
   const tile=page.locator('.am-glass-tile--'+service);
   await expect(tile).toHaveAttribute('href',href);
   const img=tile.locator('img');
   expect(await img.getAttribute('alt')).toBeTruthy();
   await expect.poll(()=>img.evaluate(x=>x.complete&&x.naturalWidth>0),{timeout:10000}).toBe(true);
  }
  const html=await page.locator('.am-landing-hero').innerText();
  expect(html).not.toMatch(/brighter\s+tom+orrow/i);
 }
});
test('new landing fits narrow phone, tablet and desktop viewports',async({page})=>{
 for(const width of [320,360,390,430,700,768,980,1024,1280,1440]){
  await page.setViewportSize({width,height:850});
  await page.goto('/');
  const result=await page.evaluate(()=>{
   const el=document.querySelector('#landing-main-heading');
   const art=document.querySelector('.am-landing-art');
   const tiles=document.querySelector('.am-glass-tiles');
   const card=tiles?.querySelector('a');
   return {
    viewport:innerWidth,
    scroll:document.documentElement.scrollWidth,
    title:el?.getBoundingClientRect().toJSON(),
    art:art?.getBoundingClientRect().toJSON(),
    tile:card?.getBoundingClientRect().toJSON(),
    artDisplay:getComputedStyle(art).display,
    cardEvents:getComputedStyle(card).pointerEvents,
    galleryScroll:tiles?.scrollWidth||0,
    galleryWidth:tiles?.clientWidth||0
   };
  });
  expect(result.scroll,'horizontal overflow at '+width).toBeLessThanOrEqual(width+2);
  expect(result.title.width,'heading width at '+width).toBeGreaterThan(180);
  expect(result.title.height,'heading height at '+width).toBeGreaterThan(35);
  expect(result.artDisplay,'gallery visible at '+width).not.toBe('none');
  expect(result.cardEvents,'cards clickable at '+width).not.toBe('none');
  expect(result.art.height,'gallery height at '+width).toBeGreaterThan(200);
  if(width<=700){
   expect(result.galleryScroll,'native swipe at '+width).toBeGreaterThan(result.galleryWidth);
   expect(result.tile.width,'tile width at '+width).toBeGreaterThan(145);
  }
 }
});
test('gallery cards are keyboard operable service links',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 const tile=page.locator('.am-glass-tile--hygiene');
 await tile.scrollIntoViewIfNeeded();
 await tile.focus();
 await expect(tile).toBeFocused();
 await expect(tile).toHaveAttribute('href','/cleaning-hygiene.html');
 await expect(page.locator('#quote-form')).toBeAttached();
});
test('reduced motion keeps service images and quotation CTA',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await expect(page.locator('.am-glass-tile')).toHaveCount(5);
 await expect(page.locator('.am-glass-tile--catering img')).toBeVisible();
 await expect(page.getByRole('link',{name:'Request a Quotation'})).toBeVisible();
 await expect(page.locator('.am-landing-quote')).toHaveAttribute('href','#quote');
});
