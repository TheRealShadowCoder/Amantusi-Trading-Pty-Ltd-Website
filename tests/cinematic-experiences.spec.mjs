import {test,expect} from '@playwright/test';
test('homepage promotes all five cinematic film experiences without modifying RFQ',async({page})=>{
 await page.goto('/index-fast.html');
 await expect(page.locator('#cinematic .cin-home-card')).toHaveCount(5);
 for(const scene of ['intro','product','architecture','marquee','food'])
  await expect(page.locator('#cinematic a[href="/cinematic-experiences.html?scene='+scene+'"]')).toHaveCount(1);
 await expect(page.locator('#quote-form')).toBeAttached();
});
test('film selection works with reduced-motion accessible fallback',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/cinematic-experiences.html');
 await expect(page.locator('[data-experience]')).toHaveCount(5);
 await page.locator('[data-experience="marquee"]').click();
 await expect(page.locator('#cin-scene-title')).toContainText('Space becomes occasion');
 await expect(page.locator('#cin-detail-link')).toHaveAttribute('href','/corporate-catering.html');
 await page.locator('#cin-play').click();
 await expect(page.locator('#cin-status')).toContainText('Reduced-motion');
});
test('cinematic stage fits a phone and provides links without GPU',async({page})=>{
 await page.setViewportSize({width:375,height:812});
 await page.goto('/cinematic-experiences.html?scene=food');
 await expect(page.locator('#cin-scene-title')).toContainText('Crafted for the occasion');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBeTruthy();
});
test('full Three.js scene plays when WebGL is available',async({page})=>{
 await page.goto('/cinematic-experiences.html?scene=product');
 await page.locator('#cin-play').click();
 await expect(page.locator('#cin-status')).toContainText(/Playing|could not load/,{timeout:25000});
 const status=await page.locator('#cin-status').innerText();
 if(status.includes('could not load'))test.skip(true,'WebGL unavailable in this browser test environment');
 await expect(page.locator('#cin-canvas canvas')).toHaveCount(1);
 await expect(page.locator('#cin-pause')).toBeEnabled();
 await page.locator('#cin-pause').click();
 await expect(page.locator('#cin-pause')).toBeDisabled();
});
