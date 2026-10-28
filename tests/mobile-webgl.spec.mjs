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
   if(path==='/catering-menu.html'&&item.width<=390){
    const title=page.locator('#catering-main-title');
    await expect(title).toBeVisible();
    const box=await title.boundingBox();
    expect(box?.width,'Catering heading width at '+item.width).toBeGreaterThan(180);
    expect(box?.y,'Catering heading position at '+item.width).toBeLessThan(520);
    const canvas=page.locator('.menu-hero .ambient-webgl-canvas');
    if(await canvas.count())await expect(canvas).toHaveCSS('position','absolute');
   }
  }
 }
});

test('photo-WebGL enhancement never blocks the quote form or glass service links',async({page})=>{
 await page.goto('/');
 await expect(page.locator('.am-landing-hero .hero-title')).toBeVisible();
 await expect(page.getByRole('link',{name:'Request a Quotation'})).toBeVisible();
 await expect(page.locator('.am-glass-tile')).toHaveCount(5);
 await expect(page.locator('.hero .ambient-webgl-canvas')).toHaveCount(0);
 await expect.poll(()=>page.locator('.am-landing-hero').getAttribute('data-am-loop-state'),{timeout:12000}).toMatch(/playing|ready|fallback|paused/);
 const data=await page.evaluate(()=>{
  const canvas=document.querySelector('.am-glass-webgl');
  return {pointer:canvas?getComputedStyle(canvas).pointerEvents:null,aria:canvas?.getAttribute('aria-hidden')||null};
 });
 if(data.pointer!==null){expect(data.pointer).toBe('none');expect(data.aria).toBe('true')}
});

test('WebGL gracefully falls back when no context can be allocated',async({page})=>{
 await page.addInitScript(()=>{
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){
   if(type==='webgl'||type==='experimental-webgl')return null;
   return original.call(this,type,...args);
  };
 });
 await page.goto('/');
 await expect.poll(()=>page.locator('.am-landing-hero').getAttribute('data-am-loop-state'),{timeout:12000}).toBe('fallback');
 await expect(page.locator('.am-glass-tile--catering img')).toBeVisible();
 await expect(page.getByRole('link',{name:'Request a Quotation'})).toBeVisible();
});

test('reduced motion bypasses photo WebGL while preserving content',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');
 await expect(page.locator('.am-landing-hero')).toHaveAttribute('data-am-loop-state','fallback');
 await expect(page.locator('.am-glass-webgl')).toHaveCount(0);
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
