/* Amantusi cinematic films. Five 10-second procedural 3D vignettes, loaded only on interaction.
   Self-hosted Three.js. No fake service-fulfilment claims, no analytics, no auto-start GPU. */
const catalog={
 intro:{label:'COMPANY INTRODUCTION',kicker:'THE AMANTUSI STORY',title:'More than a supplier.',description:'Procurement, catering and supplies brought together with a focus on clear requirements and reliable coordination.',image:'/assets/amantusi-logo.svg',alt:'Amantusi Trading corporate identity',url:'/company-profile.html'},
 product:{label:'PRODUCT SHOWCASE',kicker:'PRODUCTS & PROCUREMENT',title:'Every detail matters.',description:'A curated look at the everyday essentials and institutional goods we can source to specification.',image:'/assets/service-scenes/institutional-supply.webp',alt:'Stationery and institutional supply products',url:'/office-institutional.html'},
 architecture:{label:'ARCHITECTURAL FLYTHROUGH',kicker:'A VISION IN MOTION',title:'Built for what comes next.',description:'Explore a conceptual corporate interior inspired by clarity, ambition and progress.',image:'/assets/amantusi-logo.svg',alt:'Amantusi Trading emblem representing the conceptual architecture experience',url:'/company-profile.html'},
 marquee:{label:'MARQUEE TRANSFORMATION',kicker:'EVENT CONCEPT VISUALISATION',title:'Space becomes occasion.',description:'See an illustrative marquee venue transform from an empty floor into an event-ready setting.',image:'/assets/catering/garden-buffet.webp',alt:'Garden buffet event catering inspiration',url:'/corporate-catering.html'},
 food:{label:'CINEMATIC FOOD COMMERCIAL',kicker:'CATERING & PRESENTATION',title:'Crafted for the occasion.',description:'Food photography, warm light and a culinary-inspired 3D presentation bring our catering offer to life.',image:'/assets/service-scenes/catering.webp',alt:'Buffet catering arranged for an event',url:'/corporate-catering.html'}
};
const order=Object.keys(catalog),viewer=document.getElementById('cin-viewer'),host=document.getElementById('cin-canvas');
const playButton=document.getElementById('cin-play'),pauseButton=document.getElementById('cin-pause');
const poster=document.getElementById('cin-poster-image'),status=document.getElementById('cin-status'),progress=document.getElementById('cin-progress');
const timer=document.getElementById('cin-time'),sceneLabel=document.getElementById('cin-current-label');
const displayTitle=document.getElementById('cin-scene-title'),displayDesc=document.getElementById('cin-scene-description');
const kicker=document.getElementById('cin-scene-kicker'),counter=document.getElementById('cin-counter'),detail=document.getElementById('cin-detail-link');
if(!viewer||!host||!playButton||!pauseButton)throw new Error('Cinematic viewer controls missing');
document.getElementById('cin-year').textContent=String(new Date().getFullYear());
const reduce=matchMedia('(prefers-reduced-motion: reduce)'),saveData=Boolean(navigator.connection?.saveData);
let T,renderer,scene,camera,groups={},selected='intro',playing=false,visible=true,raf=0,startAt=0,elapsed=0,lastFrame=0,loadPromise=null;
let logoSpin,products,architectureElements=[],marqueeParts=[],marqueeTables=[],foodPlate,foodSteam,particles;
const palette={navy:0x061721,gold:0xd7b371,bright:0xffe5ab,ink:0x0a2733,ivory:0xf2ecdc};
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function ease(v){const u=clamp(v,0,1);return u*u*(3-2*u)}
function message(s){status.textContent=s}
function material(color,metalness=.3,roughness=.42){return new T.MeshStandardMaterial({color,metalness,roughness})}
function shape(geo,mat,parent,x=0,y=0,z=0){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m}
function box(parent,w,h,d,x,y,z,mat){return shape(new T.BoxGeometry(w,h,d),mat,parent,x,y,z)}
function cylinder(parent,r1,r2,h,x,y,z,mat,segments=24){return shape(new T.CylinderGeometry(r1,r2,h,segments),mat,parent,x,y,z)}
function sphere(parent,r,x,y,z,mat){return shape(new T.SphereGeometry(r,14,10),mat,parent,x,y,z)}
function beam(parent,a,b,r,mat){
 const A=new T.Vector3(...a),B=new T.Vector3(...b),axis=new T.Vector3().subVectors(B,A);
 const m=shape(new T.CylinderGeometry(r,r,axis.length(),10),mat,parent);
 m.position.copy(A).add(B).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),axis.normalize());return m;
}
function podium(parent,r=2.0){
 const dark=material(0x132c38,.65,.24),gold=material(palette.gold,.91,.18);
 cylinder(parent,r,r,.23,0,-1.65,0,dark,64);cylinder(parent,r*1.03,r*1.03,.07,0,-1.49,0,gold,64);
 cylinder(parent,r*.78,r*.78,.09,0,-1.39,0,dark,64);shape(new T.TorusGeometry(r*1.02,.015,8,80),gold,parent,0,-1.47,0).rotation.x=Math.PI/2;
}
function photo(parent,src,x,y,z,w=2.3,h=2.7){
 const frame=box(parent,w+.14,h+.14,.11,x,y,z,material(palette.gold,.83,.19));
 const picture=shape(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:0xffffff,side:T.DoubleSide}),parent,x,y,z+.066);
 const loader=new T.TextureLoader();
 loader.load(src,texture=>{texture.colorSpace=T.SRGBColorSpace;picture.material.map=texture;picture.material.needsUpdate=true;},undefined,()=>{picture.material.color.set(0x244251)});
 return frame;
}
function buildIntro(root){
 const gold=material(palette.gold,.96,.16),dark=material(0x213a45,.75,.24);
 podium(root,2.55);cylinder(root,1.65,1.65,.07,0,.14,0,dark,80).rotation.x=Math.PI/2;
 shape(new T.TorusGeometry(1.6,.045,12,92),gold,root,0,.14,.05);
 const emblem=new T.Group();root.add(emblem);emblem.position.y=.12;
 beam(emblem,[-.91,-.11,.18],[0,1.48,.18],.065,gold);beam(emblem,[0,1.48,.18],[.91,-.11,.18],.065,gold);
 beam(emblem,[-.45,.55,.22],[.45,.55,.22],.055,gold);beam(emblem,[0,1.5,.22],[0,-.38,.22],.05,gold);
 beam(emblem,[-.37,-.37,.22],[.37,-.37,.22],.05,gold);
 logoSpin=emblem;
 for(let i=0;i<12;i++){const a=i*Math.PI/6;const x=Math.cos(a)*2.9,z=Math.sin(a)*2.9;const pillar=box(root,.045,1.65,.045,x,-.65,z,gold);pillar.rotation.y=-a;}
}
function buildProduct(root){
 const gold=material(palette.gold,.87,.22),white=material(0xe9e5d9,.16,.36),dark=material(0x153542,.53,.29);
 podium(root,2.65);
 const spin=new T.Group();spin.position.set(-.45,-.5,.12);root.add(spin);products=spin;
 box(spin,1.15,1.4,.75,-.25,.18,.15,white);
 box(spin,.9,.85,.75,1,-.1,.55,dark);
 cylinder(spin,.44,.44,1.22,.55,.35,-.46,white);cylinder(spin,.22,.22,.17,.55,1.06,-.46,gold);
 cylinder(spin,.32,.32,.98,-1.22,-.1,.3,material(0x9cc6bd,.21,.27));
 cylinder(spin,.34,.34,.10,-1.22,.42,.3,gold);
 box(spin,1.16,.07,.79,-.25,.93,.15,gold);
 photo(root,'/assets/service-scenes/institutional-supply.webp',2.65,.15,-2.3,2.65,3.25);
}
function buildArchitecture(root){
 const gold=material(palette.gold,.86,.23),wall=material(0x1d3543,.52,.34),glass=new T.MeshPhysicalMaterial({color:0x467989,metalness:.25,roughness:.14,transparent:true,opacity:.29,side:T.DoubleSide,depthWrite:false}),floor=material(0x102632,.72,.17);
 box(root,15,.18,45,0,-1.92,-4,floor);
 box(root,15,.1,45,0,6.6,-4,wall);
 for(let k=0;k<9;k++){
  const z=7.4-k*3.4;
  for(let side of [-1,1]){
   box(root,.18,7.8,.18,side*4.5,2.05,z,gold);
   box(root,1.4,5.2,.045,side*5.2,2.2,z-1.3,glass);
  }
  box(root,9.2,.16,.16,0,5.9,z,gold);
  box(root,6,.025,.06,0,-1.8,z,material(0x577786,.5,.32));
  const globe=sphere(root,.12,0,5.3,z,material(0xffe0ab,.35,.12));architectureElements.push(globe);
 }
 for(let s of [-1,1]){box(root,.12,7.6,38,s*6.3,2,-4,wall);box(root,.06,7.2,38,s*6.1,2,-4,glass)}
}
function makeRoof(root,mat){
 const coordinates=[
 -4,2.3,-3, 0,4.15,-3, 0,4.15,3, -4,2.3,-3, 0,4.15,3,-4,2.3,3,
 0,4.15,-3,4,2.3,-3,4,2.3,3,0,4.15,-3,4,2.3,3,0,4.15,3
 ];
 const geom=new T.BufferGeometry();geom.setAttribute('position',new T.Float32BufferAttribute(coordinates,3));geom.computeVertexNormals();
 return shape(geom,mat,root);
}
function buildMarquee(root){
 const gold=material(palette.gold,.72,.28),linen=new T.MeshStandardMaterial({color:0xe6ded0,metalness:0,roughness:.78,side:T.DoubleSide}),floor=material(0x2c3c3b,.22,.8);
 box(root,11,.12,10,0,-1.85,0,floor);
 const tent=new T.Group();root.add(tent);tent.position.y=0;marqueeParts=[tent];
 makeRoof(tent,linen);
 for(const x of [-4,4])for(const z of [-3,3]){box(tent,.12,4.13,.12,x,.22,z,gold);box(tent,.13,.13,6,x,2.26,0,gold)}
 for(const z of [-3,3]){beam(tent,[0,4.15,z],[-4,2.3,z],.08,gold);beam(tent,[0,4.15,z],[4,2.3,z],.08,gold)}
 for(const x of [-3.3,-1.1,1.1,3.3]){sphere(tent,.10,x,2.22,-2.91,material(0xffe1aa,.15,.26));}
 const white=material(0xf8eee0,.1,.74),wood=material(0x785d42,.3,.65);
 for(const x of [-2.15,2.15])for(const z of [-.8,1.5]){
  const setting=new T.Group();root.add(setting);setting.position.set(x,-1.58,z);marqueeTables.push(setting);
  cylinder(setting,.72,.72,.12,0,.84,0,white,28);
  cylinder(setting,.08,.12,.82,0,.4,0,wood);
  for(let k=0;k<4;k++){const a=k*Math.PI/2;const cx=Math.cos(a)*1.02,cz=Math.sin(a)*1.02;
   box(setting,.45,.09,.42,cx,.45,cz,wood);box(setting,.46,.63,.09,cx,.82,cz+Math.sin(a)*.22,wood);
  }
  sphere(setting,.12,0,1.05,0,material(palette.gold,.65,.24));
 }
}
function buildFood(root){
 const gold=material(palette.gold,.78,.21),ivory=material(0xeae7db,.14,.23),meal=material(0xb57340,.07,.75),leaf=material(0x51704d,.05,.8),dark=material(0x0f2831,.58,.25);
 podium(root,2.65);
 const plate=new T.Group();root.add(plate);plate.position.set(-.9,-.55,.35);foodPlate=plate;
 cylinder(plate,1.12,1.12,.14,0,0,0,ivory,64);const rim=shape(new T.TorusGeometry(.98,.082,12,68),gold,plate,0,.09,0);rim.rotation.x=Math.PI/2;
 cylinder(plate,.65,.65,.06,0,.15,0,ivory,50);
 for(let i=0;i<5;i++){const angle=i*1.256;const food=sphere(plate,.26,Math.sin(angle)*.55,.33,Math.cos(angle)*.50,i%2?leaf:meal);food.scale.set(1,.55,.85);}
 photo(root,'/assets/service-scenes/catering.webp',2.6,.25,-2.0,2.75,3.2);
 const positions=[];for(let i=0;i<80;i++){const a=(i*2.39996),r=Math.sqrt((i%17)/17)*.7;positions.push(Math.cos(a)*r-.9,.4+(i%29)/29*1.45,Math.sin(a)*r+.35)}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 const smoke=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0}},vertexShader:'uniform float uTime; varying float vAlpha; void main(){ vec3 p=position; p.y=0.3+mod(p.y+uTime*0.3,2.0);p.x+=sin(uTime*1.4+p.y*5.0)*0.12;vAlpha=1.0-p.y/2.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);gl_PointSize=clamp(27.0/-gl_Position.z,2.0,10.0);}',fragmentShader:'varying float vAlpha; void main(){ vec2 uv=gl_PointCoord-0.5;float a=smoothstep(.5,0.0,length(uv));gl_FragColor=vec4(.96,.9,.75,a*vAlpha*.34);}'});
 foodSteam=smoke;root.add(new T.Points(geo,smoke));
}
function buildParticles(){
 const count=170,pts=new Float32Array(count*3);
 for(let i=0;i<count;i++){const a=i*2.3999632,r=1.6+(i%29)/29*5;pts[i*3]=Math.sin(a)*r;pts[i*3+1]=((i*43)%117)/117*7-2.6;pts[i*3+2]=-3+Math.cos(a)*r}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pts,3));
 const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{uTime:{value:0}},vertexShader:'uniform float uTime;varying float vOpacity;void main(){vec3 p=position;p.y+=sin(uTime*.33+position.x*1.3)*.25;p.x+=sin(uTime*.21+position.z)*.14;vOpacity=.38+.25*sin(uTime+position.x*1.8);vec4 q=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*q;gl_PointSize=clamp(15.0/-q.z,1.0,3.5);}',fragmentShader:'varying float vOpacity;void main(){float d=length(gl_PointCoord-vec2(.5));float alpha=smoothstep(.5,.0,d)*vOpacity;gl_FragColor=vec4(.92,.72,.41,alpha);}'});
 particles=mat;return new T.Points(geo,mat);
}
function initialize(){
 scene=new T.Scene();scene.background=new T.Color(palette.navy);scene.fog=new T.FogExp2(palette.navy,.022);
 camera=new T.PerspectiveCamera(41,1,.1,95);camera.position.set(0,1.25,9);
 renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'default'});
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.35));renderer.shadowMap.enabled=false;
 host.appendChild(renderer.domElement);
 scene.add(new T.HemisphereLight(0xd9e8f7,0x192635,2.3));
 const key=new T.SpotLight(0xffdfaf,48,27,Math.PI/5,.6);key.position.set(-5,9,8);scene.add(key);
 const fill=new T.PointLight(0x82afcf,28,20);fill.position.set(6,3,-1);scene.add(fill);
 const gold=material(palette.gold,.66,.32);
 shape(new T.TorusGeometry(7,.027,8,96),gold,scene,0,-2.05,-4).rotation.x=Math.PI/2;
 scene.add(buildParticles());
 for(const name of order){const group=new T.Group();scene.add(group);groups[name]=group;
  if(name==='intro')buildIntro(group);
  if(name==='product')buildProduct(group);
  if(name==='architecture')buildArchitecture(group);
  if(name==='marquee')buildMarquee(group);
  if(name==='food')buildFood(group);
 }
 for(const name of order)groups[name].visible=name===selected;
 resize();
 const ob=new ResizeObserver(resize);ob.observe(host);window.addEventListener('pagehide',dispose,{once:true});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();host.classList.remove('is-ready');message('The 3D graphics context was interrupted. The service images remain available.');});
}
function resize(){
 if(!renderer||!camera)return;
 const bounds=host.getBoundingClientRect(),w=Math.max(1,bounds.width),h=Math.max(1,bounds.height);
 camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
}
function dispose(){pause();renderer?.dispose();}
function update(t){
 const phase=t/10,a=phase*Math.PI*2;
 if(logoSpin){logoSpin.rotation.y=selected==='intro'?.2*Math.sin(a):0;logoSpin.position.y=.12+Math.sin(a)*.08}
 if(products){products.rotation.y=selected==='product'?a*.7:-.2;products.position.y=-.48+Math.sin(a)*.07}
 if(architectureElements.length)architectureElements.forEach((p,i)=>{p.scale.setScalar(.85+Math.sin(a+i)*.3)});
 if(marqueeParts.length){const reveal=ease(t/3.7);marqueeParts[0].scale.y=.05+reveal*.95;marqueeParts[0].position.y=-1.6*(1-reveal);}
 marqueeTables.forEach((item,i)=>{const f=ease((t-2-i*.3)/3.2);item.scale.setScalar(.001+f*.999)});
 if(foodPlate)foodPlate.rotation.y=.15*Math.sin(a);
 if(foodSteam)foodSteam.uniforms.uTime.value=t;
 if(particles)particles.uniforms.uTime.value=t;
 if(selected==='architecture'){
  const z=9-ease(phase)*19;camera.position.set(Math.sin(phase*Math.PI*2)*.32,1.35,z);camera.lookAt(0,1.7,z-5);
 }else if(selected==='marquee'){
  const theta=.3+phase*1.1;camera.position.set(9.1*Math.sin(theta),4.0,9.1*Math.cos(theta));
  camera.lookAt(0,.68,0);
 }else if(selected==='product'){
  const theta=phase*.65-.18;camera.position.set(8.4*Math.sin(theta),2.1,8.4*Math.cos(theta));
  camera.lookAt(.25,.0,-.1);
 }else if(selected==='food'){
  camera.position.set(1.2+Math.sin(a)*.85,2.8-Math.sin(a)*.22,8.0-Math.sin(a)*.9);
  camera.lookAt(.15,.0,-.2);
 }else{
  camera.position.set(Math.sin(a)*.65,1.0+Math.sin(a)*.12,8.9-Math.sin(a)*.45);
  camera.lookAt(0,.1,0);
 }
}
function draw(t){if(!renderer)return;update(t);renderer.render(scene,camera);
 timer.textContent='00:'+String(Math.floor(t)).padStart(2,'0')+' / 00:10';progress.style.width=(t/10*100).toFixed(2)+'%';
}
function tick(now){
 if(!playing)return;
 raf=requestAnimationFrame(tick);
 if(document.hidden||!visible)return;
 if(now-lastFrame<1000/30)return;
 lastFrame=now;
 elapsed=((now-startAt)/1000)%10;
 draw(elapsed);
}
function pause(){
 if(playing)elapsed=((performance.now()-startAt)/1000)%10;
 playing=false;if(raf)cancelAnimationFrame(raf);raf=0;
 pauseButton.disabled=true;playButton.textContent=renderer?'Resume film ▶':'Play 3D film ▶';
}
async function ensure(){
 if(renderer)return;
 if(!loadPromise)loadPromise=(async()=>{T=await import('/vendor/three.module.js');initialize();})();
 try{await loadPromise;}catch(err){loadPromise=null;throw err}
}
async function play(){
 if(playing)return;
 if(reduce.matches){message('Reduced-motion preference detected. Choose a scene to view its static presentation.');return}
 if(saveData){message('Data-saving mode is active. Static service images are shown to reduce usage.');return}
 playButton.disabled=true;playButton.textContent='Loading 3D…';
 try{await ensure();host.classList.add('is-ready');
  startAt=performance.now()-elapsed*1000;playing=true;pauseButton.disabled=false;playButton.disabled=false;playButton.textContent='Playing…';
  message('Playing '+catalog[selected].label.toLowerCase()+' — 10-second cinematic loop. Use Pause to stop.');
  raf=requestAnimationFrame(tick);
 }catch(e){playButton.disabled=false;playButton.textContent='Try 3D again ▶';message('The 3D scene could not load. Your service images and enquiry links remain available.');}
}
function select(key){
 if(!catalog[key])return;
 const wasPlaying=playing;pause();selected=key;elapsed=0;lastFrame=0;
 const item=catalog[key];poster.src=item.image;poster.alt=item.alt;sceneLabel.textContent=item.label;
 displayTitle.textContent=item.title;displayDesc.textContent=item.description;kicker.textContent=item.kicker;counter.textContent=String(order.indexOf(key)+1).padStart(2,'0')+' / 05';
 detail.href=item.url;
 document.querySelectorAll('[data-experience]').forEach(btn=>{const active=btn.dataset.experience===key;btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',String(active));});
 if(renderer){for(const name of order)groups[name].visible=name===key;draw(0);}
 else{timer.textContent='00:00 / 00:10';progress.style.width='0%';}
 message(item.label.toLowerCase()+' selected. '+(renderer?'Use Play to view the 3D animation.':'Select Play to load the 3D film.'));
 if(wasPlaying)void play();
}
playButton.addEventListener('click',()=>{if(!playing)void play()});
pauseButton.addEventListener('click',pause);
for(const btn of document.querySelectorAll('[data-experience]'))btn.addEventListener('click',()=>select(btn.dataset.experience));
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()},{passive:true});
const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(!visible&&playing)pause();},{threshold:0,rootMargin:'0px'});
observer.observe(viewer);
reduce.addEventListener?.('change',()=>{if(reduce.matches)pause()});
select(new URLSearchParams(location.search).get('scene')||'intro');
