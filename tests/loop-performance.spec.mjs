import {test,expect} from '@playwright/test';

test('fast landing retains all services but never hydrates old 3D cinematic libraries',async({page})=>{
 await page.goto('/');
 await expect(page.locator('.am-glass-tile')).toHaveCount(5);
 await expect(page.locator('#quote-form')).toBeAttached();
 await page.evaluate(()=>scrollTo({top:document.body.scrollHeight*.7,behavior:'instant'}));
 await page.waitForTimeout(1700);
 for(const name of ['experience.js','performance-v3.js','cinematic.js','motion-plus.js','animation-3d-overlay.js','click-advanced20.js','touch-60.js'])
  await expect(page.locator('script[src="/'+name+'"]')).toHaveCount(0);
 expect(await page.evaluate(()=>document.body.dataset.runtimeTier)).toMatch(/high|standard|lite/);
});

test('10-second service photo GPU loop is progressive and hidden offscreen',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/');
 const hero=page.locator('.am-landing-hero');
 await expect.poll(()=>hero.getAttribute('data-am-loop-state'),{timeout:12000}).toMatch(/playing|ready|fallback|paused/);
 const data=await page.evaluate(()=>{
  const h=document.querySelector('.am-landing-hero'),c=h.querySelector('.am-glass-webgl'),link=h.querySelector('.am-glass-tile--catering');
  return {state:h.dataset.amLoopState,visible:h.dataset.amLoopVisible,
   count:h.querySelectorAll('.am-glass-webgl').length,clickable:link.getAttribute('href'),
   pointer:c?getComputedStyle(c).pointerEvents:null,width:c?.width||0};
 });
 expect(data.clickable).toBe('/corporate-catering.html');
 expect(data.count).toBeLessThanOrEqual(1);
 if(data.state==='playing'){expect(data.pointer).toBe('none');expect(data.width).toBeGreaterThan(0)}
 await page.locator('#immersive').scrollIntoViewIfNeeded();
 await expect.poll(()=>hero.getAttribute('data-am-loop-visible')).toBe('false');
 await expect.poll(()=>hero.getAttribute('data-am-loop-state')).toMatch(/paused|fallback/);
 await expect(page.locator('[data-amt-photo-frame] img')).toBeVisible();
});

test('studio uses real images and waits until visible before allocating the 2nd GPU',async({page})=>{
 await page.goto('/');
 const stage=page.locator('[data-amt-stage]');
 await expect(stage).toHaveAttribute('data-renderer','fallback');
 await page.locator('#immersive').scrollIntoViewIfNeeded();
 await expect.poll(()=>page.locator('#immersive').getAttribute('data-am-loop-visible'),{timeout:12000}).toBe('true');
 await expect.poll(()=>stage.getAttribute('data-renderer'),{timeout:12000}).toMatch(/webgl|fallback/);
 await page.locator('[data-amt-item="trading"]').click();
 await expect(page.locator('[data-amt-service-image]')).toHaveAttribute('src','/assets/service-scenes/general-trading.webp');
});

test('phone, reduced-motion and data-saving visitors keep static photos',async({page})=>{
 await page.setViewportSize({width:375,height:812});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');
 await expect(page.locator('.am-glass-webgl')).toHaveCount(0);
 await expect(page.locator('.am-glass-tile--catering img')).toBeVisible();
 await expect(page.locator('.am-landing-hero')).toHaveAttribute('data-am-loop-state','fallback');
 await expect(page.getByRole('link',{name:'Request a Quotation'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(377);
});

test('10-second compositor loop timing is CSS-defined, not video/audio downloads',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(()=>{
  const css=[...document.styleSheets].find(s=>s.href?.endsWith('/loop-performance.css'));
  const orbit=document.querySelector('.am-glass-orbit--one');
  const light=document.querySelector('.am-glass-light');
  return {css:Boolean(css),orbitDuration:getComputedStyle(orbit).animationDuration,lightDuration:getComputedStyle(light).animationDuration,
   videoCount:document.querySelectorAll('.am-landing-hero video,.amt-showcase video').length};
 });
 expect(result.css).toBe(true);
 expect(result.orbitDuration).toBe('10s');
 expect(result.lightDuration).toBe('10s');
 expect(result.videoCount).toBe(0);
});
