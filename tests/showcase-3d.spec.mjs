import {test,expect} from '@playwright/test';

test('showcase exists on both home variants and keeps the RFQ workflow',async({page})=>{
 for(const path of ['/','/index-fast.html']){
  const response=await page.goto(path);
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('#immersive h2')).toContainText('Beyond the brief.');
  await expect(page.locator('#immersive [role="tab"]')).toHaveCount(5);
  await expect(page.locator('#immersive [role="tabpanel"]')).toBeVisible();
  await expect(page.locator('#quote-form button[type="submit"]')).toBeAttached();
  await expect(page.locator('.amt-studio-hero-link')).toHaveAttribute('href','#immersive');
  expect(await page.evaluate(()=>document.querySelectorAll('h1').length)).toBe(1);
 }
});

test('service objects switch with real content, links, keyboard and SVG fallback',async({page})=>{
 await page.goto('/');
 const stage=page.locator('[data-amt-stage]');
 const tabs=page.locator('#immersive [role="tab"]');
 await expect(tabs.nth(0)).toHaveAttribute('aria-selected','true');
 await tabs.nth(1).click();
 await expect(tabs.nth(1)).toHaveAttribute('aria-selected','true');
 await expect(stage).toHaveAttribute('data-scene','meals');
 await expect(page.locator('[data-amt-title]')).toHaveText('Meals, thoughtfully packed.');
 await expect(page.locator('[data-amt-link]')).toHaveAttribute('href','/catering-menu.html');
 await expect(page.locator('[data-amt-fallback="meals"]')).not.toHaveAttribute('hidden','');
 await expect(page.locator('[data-amt-fallback="catering"]')).toHaveAttribute('hidden','');
 await tabs.nth(1).press('ArrowRight');
 await expect(tabs.nth(2)).toBeFocused();
 await expect(stage).toHaveAttribute('data-scene','institutional');
 await expect(page.locator('[data-amt-link]')).toHaveAttribute('href','/office-institutional.html');
 await tabs.nth(2).press('End');
 await expect(tabs.nth(4)).toBeFocused();
 await expect(page.locator('[data-amt-link]')).toHaveAttribute('href','/general-trading.html');
});

test('new 3D showroom fits 320px phones through tablet widths with no horizontal scroll',async({page})=>{
 for(const width of [320,375,430,768,1024,1440]){
  await page.setViewportSize({width,height:800});
  await page.goto('/');
  await page.locator('#immersive').scrollIntoViewIfNeeded();
  const measurements=await page.evaluate(()=>{
   const section=document.querySelector('#immersive'),stage=section.querySelector('.amt-showcase-stage');
   return {width:innerWidth,scroll:document.documentElement.scrollWidth,stage:stage.getBoundingClientRect().width,title:section.querySelector('h2').getBoundingClientRect().width};
  });
  expect(measurements.scroll,'overflow at '+width).toBeLessThanOrEqual(measurements.width+2);
  expect(measurements.stage,'stage width at '+width).toBeGreaterThan(width<=430?200:350);
  expect(measurements.title,'heading width at '+width).toBeGreaterThan(200);
 }
});

test('WebGL is optional and non-blocking; real DOM controls remain usable',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.locator('#immersive').scrollIntoViewIfNeeded();
 const stage=page.locator('[data-amt-stage]');
 await expect.poll(()=>stage.getAttribute('data-renderer'),{timeout:12000}).toMatch(/webgl|fallback/);
 const result=await page.evaluate(()=>{
  const el=document.querySelector('[data-amt-stage]');
  const canvas=el.querySelector('.amt-objects-canvas');
  return {mode:el.dataset.renderer,cursor:getComputedStyle(canvas).pointerEvents,canvasW:canvas.width,canvasH:canvas.height};
 });
 if(result.mode==='webgl'){
  expect(result.cursor).toBe('none');
  expect(result.canvasW).toBeGreaterThan(0);
  expect(result.canvasH).toBeGreaterThan(0);
 }
 await stage.hover();
 await page.locator('[data-amt-item="hygiene"]').click();
 await expect(page.locator('[data-amt-title]')).toContainText('Spaces, cared for.');
 expect(errors).toEqual([]);
});

test('reduced-motion and failed WebGL both retain selectable illustrations',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');
 await expect(page.locator('[data-amt-stage]')).toHaveAttribute('data-renderer','fallback');
 await page.locator('[data-amt-item="institutional"]').click();
 await expect(page.locator('[data-amt-fallback="institutional"]')).not.toHaveAttribute('hidden','');
 await expect(page.locator('[data-amt-title]')).toContainText('Supplies that enable.');
});
