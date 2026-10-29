import {test,expect} from '@playwright/test';
test('photo story and quotation form exist with no videos',async({page})=>{
 await page.goto('/index-fast.html');
 await expect(page.locator('#supply-journey')).toHaveCount(1);
 await expect(page.locator('[data-route-step]')).toHaveCount(3);
 await expect(page.locator('[data-route-shot] img')).toHaveCount(3);
 await expect(page.locator('video')).toHaveCount(0);
 await expect(page.locator('#quote-form')).toBeAttached();
});
test('scroll timeline can be reversed by scrolling back',async({page})=>{
 await page.goto('/index-fast.html');
 const beat=page.locator('[data-route-step="1"]');
 await beat.evaluate(el=>{const r=el.getBoundingClientRect();scrollTo({top:scrollY+r.top+r.height/2-innerHeight*.55,behavior:'instant'});});
 await expect(page.locator('[data-route-index]')).toHaveText('02');
 await page.locator('[data-route-step="0"]').evaluate(el=>{const r=el.getBoundingClientRect();scrollTo({top:scrollY+r.top+r.height/2-innerHeight*.55,behavior:'instant'});});
 await expect(page.locator('[data-route-index]')).toHaveText('01');
});
test('detail view offers next previous and arrow-key navigation',async({page})=>{
 await page.goto('/index-fast.html');
 await page.locator('[data-offer="catering"]').click();
 const dialog=page.locator('#am-offer-dialog');
 await expect(dialog).toBeVisible();
 await expect(dialog.locator('[data-offer-position]')).toHaveText('01 / 10');
 await dialog.locator('[data-offer-next]').click();
 await expect(dialog.locator('#am-offer-title')).toHaveText('Event buffet service');
 await dialog.locator('[data-offer-prev]').click();
 await expect(dialog.locator('#am-offer-title')).toHaveText('Corporate catering');
 await page.keyboard.press('ArrowRight');
 await expect(dialog.locator('#am-offer-title')).toHaveText('Event buffet service');
 await page.keyboard.press('Escape');
 await expect(dialog).not.toBeVisible();
});
test('phone and reduced motion preserve collection and native scrolling',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/index-fast.html');
 await page.locator('#supply-journey').scrollIntoViewIfNeeded();
 await expect(page.locator('[data-route-shot] img')).toHaveCount(3);
 await page.locator('[data-offer="stationery"]').click();
 await page.locator('[data-offer-next]').click();
 await expect(page.locator('#am-offer-title')).toHaveText('General procurement');
 await page.keyboard.press('Escape');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBeTruthy();
 await expect(page.locator('video')).toHaveCount(0);
});