import {test,expect} from '@playwright/test';
test('homepage retains five real film links and original quotation form',async({page})=>{
 await page.goto('/index-fast.html');
 await expect(page.locator('#cinematic .cin-home-card')).toHaveCount(5);
 for(const scene of ['intro','product','architecture','marquee','food'])
  await expect(page.locator('#cinematic a[href="/cinematic-experiences.html?scene='+scene+'"]')).toHaveCount(1);
 await expect(page.locator('#quote-form')).toBeAttached();
});
test('film selection updates footage without 3D geometry',async({page})=>{
 await page.goto('/cinematic-experiences.html?scene=product');
 await expect(page.locator('[data-experience]')).toHaveCount(5);
 await expect(page.locator('#cin-film')).toHaveCount(1);
 await expect(page.locator('#cin-canvas canvas')).toHaveCount(0);
 await page.locator('[data-experience="marquee"]').click();
 await expect(page.locator('#cin-scene-title')).toContainText('Space becomes occasion.');
 await expect(page.locator('#cin-detail-link')).toHaveAttribute('href','/corporate-catering.html');
 await page.locator('#cin-play').click();
 await expect(page.locator('#cin-film')).toHaveAttribute('src','/assets/films/marquee.mp4');
});
test('reduced-motion users can explicitly choose to watch real footage',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/cinematic-experiences.html');
 await expect(page.locator('#cin-film')).not.toHaveAttribute('src',/.+/);
 await expect(page.locator('#cin-status')).toContainText('Motion reduction');
 await expect(page.locator('#cin-play')).toBeVisible();
});
test('cinematic videos remain usable on narrow phones',async({page})=>{
 await page.setViewportSize({width:375,height:812});
 await page.goto('/cinematic-experiences.html?scene=food');
 await expect(page.locator('#cin-scene-title')).toContainText('Crafted for the occasion.');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBeTruthy();
});
