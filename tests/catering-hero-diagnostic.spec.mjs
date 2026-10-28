import {test,expect} from '@playwright/test';
test('diagnose catering heading after responsive route navigation',async({page})=>{
 await page.setViewportSize({width:320,height:720});
 for(const path of ['/','/government-procurement.html','/procurement-guides.html','/procurement-faq.html','/capability-statement.html','/catering-menu.html']){
  await page.goto(path);
  await page.waitForTimeout(650);
  const data=await page.evaluate(()=>{
   const h=document.querySelector('h1');
   const chain=[];
   let e=h;
   while(e&&chain.length<9){
    const s=getComputedStyle(e),r=e.getBoundingClientRect();
    chain.push({element:e.tagName.toLowerCase(),cls:e.className||'',id:e.id||'',display:s.display,visibility:s.visibility,opacity:s.opacity,position:s.position,contain:s.contain,contentVisibility:s.contentVisibility,transform:s.transform,box:{x:r.x,y:r.y,w:r.width,h:r.height},offsetParent:Boolean(e.offsetParent),hidden:e.hidden});
    e=e.parentElement;
   }
   const hero=document.querySelector('.menu-hero');
   const children=hero?[...hero.children].map(el=>{
     const cs=getComputedStyle(el),rect=el.getBoundingClientRect();
     return {className:el.className,tag:el.tagName,pos:cs.position,display:cs.display,
       width:rect.width,height:rect.height,top:rect.top,marginTop:cs.marginTop};
   }):[];
   const heroStyle=hero?getComputedStyle(hero):null;
   return {path:location.pathname,chain,children,heroPadding:heroStyle?.paddingTop,
     heroDisplay:heroStyle?.display};

  });
  console.log('AMANTUSI-H1-DIAG '+JSON.stringify(data));
  if(path==='/catering-menu.html')expect(data.chain[0].box.h).toBeGreaterThan(0);
 }
});