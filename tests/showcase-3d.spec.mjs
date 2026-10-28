import {test,expect} from '@playwright/test';

test('home variants show real service imagery and preserve RFQ',async({page})=>{
 for(const route of ['/','/index-fast.html']){
  const res=await page.goto(route);
  expect(res?.ok()).toBeTruthy();
  await expect(page.locator('#immersive h2')).toContainText('Real services.');
  await expect(page.locator('#immersive [role="tab"]')).toHaveCount(5);
  await expect(page.locator('[data-amt-photo-frame] img')).toHaveAttribute('src','/assets/service-scenes/catering.webp');
  await expect(page.locator('#quote-form button[type="submit"]')).toBeAttached();
  await expect(page.locator('.amt-studio-hero-link')).toHaveAttribute('href','#immersive');
  expect(await page.evaluate(()=>document.querySelectorAll('h1').length)).toBe(1);
 }
});

test('each rendered service image loads and changes with accurate labels and links',async({page})=>{
 await page.goto('/');
 const stage=page.locator('[data-amt-stage]'),tabs=page.locator('#immersive [role="tab"]');
 const image=page.locator('[data-amt-service-image]');
 const cases=[
  {key:'catering',file:'catering.webp',href:'/corporate-catering.html'},
  {key:'meals',file:'packed-meals.webp',href:'/catering-menu.html'},
  {key:'institutional',file:'institutional-supply.webp',href:'/office-institutional.html'},
  {key:'hygiene',file:'cleaning-hygiene.webp',href:'/cleaning-hygiene.html'},
  {key:'trading',file:'general-trading.webp',href:'/general-trading.html'}
 ];
 for(let i=0;i<cases.length;i++){
  await tabs.nth(i).click();
  await expect(stage).toHaveAttribute('data-scene',cases[i].key);
  await expect(image).toHaveAttribute('src','/assets/service-scenes/'+cases[i].file);
  await expect(page.locator('[data-amt-link]')).toHaveAttribute('href',cases[i].href);
  await expect.poll(()=>image.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
  expect(await image.getAttribute('alt')).toMatch(/Rendered/i);
 }
 await tabs.nth(1).click();
 await tabs.nth(1).press('ArrowRight');
 await expect(tabs.nth(2)).toBeFocused();
 await expect(stage).toHaveAttribute('data-scene','institutional');
 await tabs.nth(2).press('End');
 await expect(tabs.nth(4)).toBeFocused();
});

test('phone, tablet and desktop layouts fit without horizontal overflow',async({page})=>{
 for(const width of [320,375,430,768,1024,1440]){
  await page.setViewportSize({width,height:800});
  await page.goto('/');
  await page.locator('#immersive').scrollIntoViewIfNeeded();
  const result=await page.evaluate(()=>{
   const s=document.querySelector('#immersive');
   const frame=s.querySelector('.amt-photo-frame').getBoundingClientRect();
   return {viewport:innerWidth,doc:document.documentElement.scrollWidth,frameW:frame.width,frameH:frame.height,stageW:s.querySelector('.amt-showcase-stage').getBoundingClientRect().width};
  });
  expect(result.doc,'overflow at '+width).toBeLessThanOrEqual(width+2);
  expect(result.frameW,'photo visible width at '+width).toBeGreaterThan(120);
  expect(result.frameH,'photo visible height at '+width).toBeGreaterThan(170);
  expect(result.stageW).toBeGreaterThan(width<=430?200:350);
 }
});

test('optional WebGL samples real picture without masking it or breaking tabs',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 await page.locator('#immersive').scrollIntoViewIfNeeded();
 const stage=page.locator('[data-amt-stage]');
 await expect.poll(()=>stage.getAttribute('data-renderer'),{timeout:12000}).toMatch(/webgl|fallback/);
 const data=await page.evaluate(()=>{
  const el=document.querySelector('[data-amt-stage]'),canvas=el.querySelector('[data-amt-photo-webgl]'),image=el.querySelector('[data-amt-service-image]');
  return {mode:el.dataset.renderer,pointer:getComputedStyle(canvas).pointerEvents,w:canvas.width,h:canvas.height,imageNatural:image.naturalWidth,visible:getComputedStyle(image).display};
 });
 expect(data.pointer).toBe('none');
 expect(data.imageNatural).toBeGreaterThan(0);
 expect(data.visible).not.toBe('none');
 if(data.mode==='webgl'){expect(data.w).toBeGreaterThan(0);expect(data.h).toBeGreaterThan(0)}
 await page.locator('[data-amt-item="hygiene"]').click();
 await expect(page.locator('[data-amt-title]')).toContainText('Spaces, cared for.');
 expect(errors).toEqual([]);
});

test('reduced motion preserves real images, navigation and original quote form',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');
 await expect(page.locator('[data-amt-stage]')).toHaveAttribute('data-renderer','fallback');
 await page.locator('[data-amt-item="institutional"]').click();
 await expect(page.locator('[data-amt-service-image]')).toHaveAttribute('src','/assets/service-scenes/institutional-supply.webp');
 await expect.poll(()=>page.locator('[data-amt-service-image]').evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
 await expect(page.locator('#quote-form')).toBeVisible();
});
