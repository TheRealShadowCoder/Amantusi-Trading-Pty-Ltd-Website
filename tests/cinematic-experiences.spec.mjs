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

test('homepage has a scroll-pinned live-footage cinema just after the hero',async({page})=>{
 await page.goto('/index-fast.html');
 await expect(page.locator('[data-cin-stage]')).toHaveCount(1);
 await expect(page.locator('[data-cin-chapter]')).toHaveCount(5);
 await expect(page.locator('.cin-stage-video')).toHaveCount(1);
 await expect(page.locator('.cin-stage-video')).not.toHaveAttribute('src',/.+/);
 await expect(page.locator('nav#main-nav a[href="#cinematic"]')).toHaveText('Films');
 await expect(page.locator('main')).toContainText('Footage is illustrative licensed stock video');
});
test('scrolling and chapter selection change the real MP4 source',async({page})=>{
 await page.goto('/index-fast.html');
 await page.locator('[data-cin-chapter="product"]').scrollIntoViewIfNeeded();
 await expect(page.locator('[data-cin-stage]')).toHaveAttribute('data-film','product');
 await expect(page.locator('[data-cin-video]')).toHaveAttribute('src','/assets/films/product.mp4');
 await page.locator('[data-cin-chapter="food"]').click();
 await expect(page.locator('[data-cin-stage]')).toHaveAttribute('data-film','food');
 await expect(page.locator('[data-cin-title]')).toContainText('Made for the moment');
 await page.locator('[data-cin-previous]').click();
 await expect(page.locator('[data-cin-stage]')).toHaveAttribute('data-film','marquee');
});
test('reduced-motion keeps film paused until visitor explicitly plays',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/index-fast.html');
 await page.locator('[data-cin-chapter="architecture"]').scrollIntoViewIfNeeded();
 await expect(page.locator('[data-cin-stage]')).toHaveAttribute('data-film','architecture');
 await expect(page.locator('[data-cin-video]')).not.toHaveAttribute('src',/.+/);
 await page.locator('[data-cin-toggle]').click();
 await expect(page.locator('[data-cin-video]')).toHaveAttribute('src','/assets/films/architecture.mp4');
 await expect(page.locator('[data-cin-seek]')).toBeVisible();
});
test('phone supports responsive inline footage, taps and left-right chapter swipes',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/index-fast.html');
 await page.locator('[data-cin-chapter="intro"]').scrollIntoViewIfNeeded();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBeTruthy();
 const target=page.locator('[data-cin-screen]');
 await target.dispatchEvent('pointerdown',{pointerType:'touch',clientX:320,clientY:400});
 await target.dispatchEvent('pointerup',{pointerType:'touch',clientX:120,clientY:400});
 await expect(page.locator('[data-cin-stage]')).toHaveAttribute('data-film','product');
 await expect(page.locator('[data-cin-video]')).toHaveAttribute('playsinline','');
});
