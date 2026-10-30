import {test,expect} from '@playwright/test';
test('every public collection image is accessible, decodes, and does not require a fallback',async({page,request})=>{
 await page.goto('/index-fast.html');
 const cards=page.locator('#collections [data-offer]');
 await expect(cards).toHaveCount(10);
 const assets=await cards.locator('img').evaluateAll(nodes=>nodes.map(img=>({src:new URL(img.getAttribute('src'),location.href).href,alt:img.alt,backup:img.dataset.fallbackSrc||null})));
 for(const asset of assets){
  const response=await request.get(asset.src);
  expect(response.status(),asset.src+' returned '+response.status()).toBe(200);
  expect(response.headers()['content-type'],asset.src+' must return an image').toMatch(/^image\/webp(?:;|$)/i);
  const bytes=await response.body();
  expect(bytes.length,asset.src+' must not be empty').toBeGreaterThan(10000);
  expect(bytes.subarray(8,12).toString('ascii'),asset.src+' must be a genuine WebP').toBe('WEBP');
 }
 const statuses=await cards.locator('img').evaluateAll(async nodes=>{
  return await Promise.all(nodes.map(async img=>{
   img.loading='eager';
   try{await img.decode()}catch(err){}
   return {src:img.getAttribute('src'),complete:img.complete,width:img.naturalWidth,height:img.naturalHeight,backup:img.dataset.fallbackUsed||'0'};
  }));
 });
 for(const image of statuses){
  expect(image.width,JSON.stringify(image)).toBeGreaterThan(0);
  expect(image.height,JSON.stringify(image)).toBeGreaterThan(0);
  expect(image.complete,JSON.stringify(image)).toBeTruthy();
  expect(image.backup,JSON.stringify(image)).toBe('0');
 }
});
test('opening all ten offerings shows decoded photographs inside detail dialog',async({page})=>{
 await page.goto('/index-fast.html');
 for(const card of await page.locator('#collections [data-offer]').all()){
  const id=await card.getAttribute('data-offer');
  await card.click();
  const dialog=page.locator('#am-offer-dialog');
  await expect(dialog).toBeVisible();
  const state=await dialog.locator('#am-offer-image').evaluate(async img=>{
   try{await img.decode()}catch(err){}
   return {id:img.dataset.serviceImage,width:img.naturalWidth,backup:img.dataset.fallbackUsed||'0',src:img.currentSrc};
  });
  expect(state.width,JSON.stringify(state)).toBeGreaterThan(0);
  expect(state.id).toBe(id);
  expect(state.backup,JSON.stringify(state)).toBe('0');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
 }
});
test('mobile and reduced-motion still display all ten gallery images',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/index-fast.html');
 const status=await page.locator('#collections img').evaluateAll(async imgs=>Promise.all(imgs.map(async img=>{
  img.loading='eager';try{await img.decode()}catch(err){}return img.naturalWidth;
 })));
 expect(status).toHaveLength(10);
 expect(status.every(n=>n>0),status.join(',')).toBeTruthy();
 await expect(page.locator('video')).toHaveCount(0);
 await expect(page.locator('#quote-form')).toBeAttached();
});
