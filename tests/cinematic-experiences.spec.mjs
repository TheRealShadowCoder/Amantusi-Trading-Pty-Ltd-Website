import {test,expect} from '@playwright/test';
test('homepage has five independent films integrated into five real sections',async({page})=>{
 await page.goto('/index-fast.html');
 await expect(page.locator('[data-motion-film]')).toHaveCount(5);
 await expect(page.locator('video[data-motion-src]')).toHaveCount(5);
 await expect(page.locator('[data-cin-stage]')).toHaveCount(0);
 await expect(page.locator('[data-cin-seek]')).toHaveCount(0);
 await expect(page.locator('#quote-form')).toBeAttached();
 for(const film of ['intro','product','architecture','food','marquee']){
  await expect(page.locator('[data-motion-film="'+film+'"] video')).toHaveAttribute('data-motion-src','/assets/films/'+film+'.mp4');
 }
 await expect(page.locator('#spaces-film')).toContainText('what comes next');
 await expect(page.locator('#catering-film')).toContainText('Every occasion');
 await expect(page.locator('#events-film')).toContainText('Make it memorable');
});
test('scroll triggers motion and starts nearby real footage without video UI',async({page})=>{
 await page.goto('/index-fast.html');
 await expect.poll(()=>page.evaluate(()=>typeof window.gsap==='object'&&typeof window.ScrollTrigger==='function')).toBe(true);
 const product=page.locator('[data-motion-film="product"]');
 await product.scrollIntoViewIfNeeded();
 await expect(product.locator('video')).toHaveAttribute('src','/assets/films/product.mp4',{timeout:18000});
 await expect(page.locator('.am-motion-still')).toHaveCount(5);
 await expect(page.locator('video[controls]')).toHaveCount(0);
});
test('mobile touch navigation works and cinematography does not block service links',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/index-fast.html');
 await expect(page.locator('a[href="/catering-menu.html"]').first()).toBeVisible();
 await page.locator('#catering-film').scrollIntoViewIfNeeded();
 await expect(page.locator('#catering-film video')).toHaveAttribute('playsinline','');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBeTruthy();
 await expect(page.locator('#quote-form')).toBeAttached();
 await expect(page.locator('video[controls]')).toHaveCount(0);
});
test('reduced motion presents static art instead of autoplaying videos',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/index-fast.html');
 await page.locator('#events-film').scrollIntoViewIfNeeded();
 await expect(page.locator('#events-film video')).not.toHaveAttribute('src',/.+/);
 await expect(page.locator('#events-film .am-motion-still')).toBeVisible();
 await expect(page.locator('#events-film')).toContainText('Set the scene');
});
