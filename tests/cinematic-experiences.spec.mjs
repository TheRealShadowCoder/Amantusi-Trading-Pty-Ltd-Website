import {test,expect} from '@playwright/test';
for(const route of ['/index.html','/index-fast.html']){
 test(route+' shows normal Amantusi website without recent stock videos',async({page})=>{
  await page.goto(route);
  await expect(page.locator('video')).toHaveCount(0);
  await expect(page.locator('[data-motion-film], [data-motion-src], [data-cin-stage], [data-cin-chapter]')).toHaveCount(0);
  await expect(page.locator('#quote-form')).toBeAttached();
  await expect(page.locator('#capabilities')).toBeAttached();
  await expect(page.locator('#immersive')).toBeAttached();
  await expect(page.locator('#government')).toBeAttached();
  await expect(page.locator('#contact')).toBeAttached();
  await expect(page.locator('a[href="#quote"]').first()).toBeAttached();
 });
}
test('mobile page remains usable after video removal',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/index-fast.html');
 await expect(page.locator('video')).toHaveCount(0);
 await expect(page.locator('#quote-form')).toBeAttached();
 await expect(page.locator('.am-landing-hero')).toBeVisible();
 await page.locator('#capabilities').scrollIntoViewIfNeeded();
 await expect(page.locator('#capabilities')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBeTruthy();
});
test('old standalone cinematic video page is removed',async({request})=>{
 const result=await request.get('/cinematic-experiences.html',{maxRedirects:0});
 expect([301,302,303,307,308,404,410]).toContain(result.status());
 if(result.status()>=300&&result.status()<400)expect(result.headers().location).not.toMatch(/cinematic-experiences\.html/);
});
