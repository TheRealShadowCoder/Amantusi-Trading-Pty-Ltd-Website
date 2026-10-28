import {test,expect} from '@playwright/test';

const routes=[
 '/','/catering-menu.html','/government-procurement.html','/fmcg-supply.html',
 '/company-profile.html','/procurement-guides.html','/procurement-faq.html',
 '/capability-statement.html','/supplier-onboarding.html','/admin.html'
];

test('mobile 320, 390, 768 and 1024 layouts keep content within viewport', async({page})=>{
 const cases=[
  {width:320,height:720,paths:routes},
  {width:390,height:844,paths:routes},
  {width:768,height:1024,paths:['/','/catering-menu.html','/government-procurement.html','/procurement-guides.html','/admin.html']},
  {width:1024,height:768,paths:['/','/catering-menu.html','/procurement-faq.html']}
 ];
 for(const item of cases){
  await page.setViewportSize({width:item.width,height:item.height});
  for(const path of item.paths){
   const response=await page.goto(path);
   expect(response?.ok(),path+' HTTP').toBeTruthy();
   const data=await page.evaluate(()=>{
    const e=document.documentElement;
    return {scroll:e.scrollWidth,viewport:innerWidth,css:Boolean(document.querySelector('link[href="/adaptive-layout.css"]'))};
   });
   expect(data.css,path+' CSS').toBe(true);
   expect(data.scroll,path+' at '+item.width+'px').toBeLessThanOrEqual(data.viewport+2);
  }
 }
});

test('WebGL is progressive and cannot hide navigation or RFQ actions',async({page})=>{
 await page.goto('/');
 await expect(page.locator('.hero [data-never-exists]')).toHaveCount(0);
 await expect(page.locator('.hero .hero-title')).toBeVisible();
 await expect(page.getByRole('link',{name:'Request a Quotation'})).toBeVisible();
 await expect.poll(()=>page.locator('.hero').getAttribute('data-webgl-state'),{timeout:12000}).toMatch(/active|ready|fallback|paused/);
 const data=await page.evaluate(()=>{
  const hero=document.querySelector('.hero'),canvas=hero.querySelector('.ambient-webgl-canvas');
  return {
   state:hero.dataset.webglState,
   pointerEvents:canvas?getComputedStyle(canvas).pointerEvents:null,
   aria:canvas?.getAttribute('aria-hidden')||null,
   dimensions:canvas?[canvas.width,canvas.height]:null
  };
 });
 if(data.state!=='fallback'){
  expect(data.pointerEvents).toBe('none');
  expect(data.aria).toBe('true');
  expect(data.dimensions?.[0]).toBeGreaterThan(0);
 }
});

test('WebGL gracefully degrades when GPU unavailable',async({page})=>{
 await page.addInitScript(()=>{
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){
   if(type==='webgl'||type==='experimental-webgl')return null;
   return original.call(this,type,...args);
  };
 });
 await page.goto('/');
 await expect.poll(()=>page.locator('.hero').getAttribute('data-webgl-state')).toBe('fallback');
 await expect(page.locator('.ambient-webgl-canvas')).toHaveCount(0);
 await expect(page.getByRole('link',{name:'Request a Quotation'})).toBeVisible();
});

test('reduced motion bypasses WebGL and leaves accessible content',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');
 await expect(page.locator('.hero')).toHaveAttribute('data-webgl-state','fallback');
 await expect(page.locator('.ambient-webgl-canvas')).toHaveCount(0);
 await expect(page.locator('.hero h1')).toBeVisible();
 await expect(page.locator('#quote-form')).toBeVisible();
});

test('mobile navigation opens and closes without trapping keyboard access',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 const menu=page.getByRole('button',{name:'Open menu'});
 await expect(menu).toBeVisible();
 await menu.click();
 await expect(page.locator('#main-nav')).toHaveClass(/open/);
 await expect(page.locator('#main-nav')).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.locator('#main-nav')).not.toHaveClass(/open/);
 await expect(menu).toBeFocused();
 await page.locator('#quote-form input[name="organisation"]').focus();
 await expect(page.locator('#quote-form input[name="organisation"]')).toBeFocused();
});
