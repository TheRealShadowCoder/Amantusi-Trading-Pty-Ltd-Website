import fs from 'node:fs';

function patchFile(path, transforms) {
  let source = fs.readFileSync(path, 'utf8');
  const original = source;
  for (const [pattern, replacement, label] of transforms) {
    if (pattern.test(source)) {
      source = source.replace(pattern, replacement);
      console.log(`runtime optimizer: ${label}`);
    }
  }
  if (source !== original) fs.writeFileSync(path, source);
}

patchFile('public/experience.js', [
  [
    /function qualityProfile\(\) \{[\s\S]*?\n\}\n\nsetLoader\(8, 'Preparing spatial interface'\);/,
    `function qualityProfile() {
  if (mobile) {
    if (saveData || memory <= 2 || cores <= 2) return { name:'mobile-lite', dpr:.64, particles:105, nodes:12, routes:2, target:28, idle:8, torus:36, ribbon:false, haze:false };
    if (memory <= 4 || cores <= 4) return { name:'mobile-standard', dpr:.76, particles:165, nodes:16, routes:2, target:34, idle:10, torus:46, ribbon:false, haze:false };
    return { name:'mobile-high', dpr:.9, particles:250, nodes:20, routes:3, target:42, idle:12, torus:56, ribbon:false, haze:false };
  }
  if (memory <= 4 || cores <= 4) return { name:'desktop-low', dpr:.9, particles:430, nodes:22, routes:3, target:45, idle:12, torus:72, ribbon:false, haze:true };
  if (memory <= 8 || cores <= 8) return { name:'desktop-medium', dpr:1.15, particles:760, nodes:29, routes:4, target:55, idle:16, torus:100, ribbon:true, haze:true };
  return { name:'desktop-high', dpr:1.4, particles:1180, nodes:38, routes:5, target:60, idle:20, torus:128, ribbon:true, haze:true };
}

setLoader(8, 'Preparing spatial interface');`,
    'adaptive WebGL profiles'
  ],
  [
    /const markActivity=\(\)=>\{state\.idle=0;\};/,
    `let loopRunning=true;
  const markActivity=()=>{
    state.idle=0;
    if (!loopRunning && state.visible) {
      loopRunning=true;
      lastFrame=performance.now();
      lastRender=0;
      renderer.setAnimationLoop(animate);
    }
  };`,
    'wake-on-demand WebGL loop'
  ],
  [
    /document\.addEventListener\('visibilitychange',\(\)=>\{state\.visible=!document\.hidden;\}\);/,
    `document.addEventListener('visibilitychange',()=>{
    state.visible=!document.hidden;
    if (state.visible) markActivity();
    else if (loopRunning) { renderer.setAnimationLoop(null); loopRunning=false; }
  });`,
    'visibility-controlled WebGL loop'
  ],
  [
    /addEventListener\('resize',\(\)=>\{\n    if \(resizeQueued\) return;/,
    `addEventListener('resize',()=>{
    markActivity();
    if (resizeQueued) return;`,
    'resize wake-up'
  ],
  [
    /const desiredFps=state\.idle>5\?profile\.idle:profile\.target;/,
    `const lowFocus=state.activeSection!==0&&state.activeSection!==3&&state.activeSection!==6;
    const pressure=body.dataset.runtimePressure==='high';
    const scrolling=body.classList.contains('perf-scrolling');
    const idleRuntime=body.classList.contains('perf-idle');
    const desiredFps=pressure?(mobile?22:34):scrolling?(mobile?26:42):idleRuntime?(mobile?8:12):lowFocus?(mobile?18:28):profile.target;`,
    'scene-aware FPS budget'
  ],
  [
    /renderer\.render\(scene,camera\);\n\n    sampleFrames\+\+;/,
    `renderer.render(scene,camera);

    if (body.classList.contains('perf-idle') && state.idle > 4.5 && ripples.length === 0) {
      renderer.setAnimationLoop(null);
      loopRunning=false;
      return;
    }

    sampleFrames++;`,
    'full WebGL idle sleep'
  ]
]);

patchFile('public/cinematic.js', [
  [/markDirty\(650\);/g, 'markDirty(320);', 'shorter scroll cinematic wake'],
  [/markDirty\(500\);/g, 'markDirty(260);', 'shorter pointer cinematic wake'],
  [/markDirty\(1800\);/g, 'markDirty(900);', 'shorter initial cinematic wake'],
  [
    /document\.querySelectorAll\('main section'\)\.forEach\(section => \{\n    if \(coarse\) return;\n    section\.addEventListener\('pointermove', event => \{\n      const rect = section\.getBoundingClientRect\(\);\n      section\.style\.setProperty\('--section-light-x', `\$\{clamp\(\(event\.clientX - rect\.left\) \/ Math\.max\(1, rect\.width\) \* 100, 0, 100\)\.toFixed\(1\)\}%`\);\n      section\.style\.setProperty\('--section-light-y', `\$\{clamp\(\(event\.clientY - rect\.top\) \/ Math\.max\(1, rect\.height\) \* 100, 0, 100\)\.toFixed\(1\)\}%`\);\n    \}, \{ passive: true \}\);\n  \}\);/,
    `document.querySelectorAll('main section').forEach(section => {
    if (coarse) return;
    let sectionRect=null,sectionPointer=null,sectionRaf=0;
    section.addEventListener('pointerenter',()=>{sectionRect=section.getBoundingClientRect()},{passive:true});
    section.addEventListener('pointermove', event => {
      if (!sectionRect || body.classList.contains('perf-scrolling')) return;
      sectionPointer={x:event.clientX,y:event.clientY};
      if(sectionRaf)return;
      sectionRaf=requestAnimationFrame(()=>{
        sectionRaf=0;
        if(!sectionRect||!sectionPointer)return;
        section.style.setProperty('--section-light-x', \`${'${'}clamp((sectionPointer.x-sectionRect.left)/Math.max(1,sectionRect.width)*100,0,100).toFixed(1)}%\`);
        section.style.setProperty('--section-light-y', \`${'${'}clamp((sectionPointer.y-sectionRect.top)/Math.max(1,sectionRect.height)*100,0,100).toFixed(1)}%\`);
      });
    }, { passive: true });
    section.addEventListener('pointerleave',()=>{sectionRect=null;sectionPointer=null},{passive:true});
  });`,
    'cached section pointer geometry'
  ]
]);

patchFile('src/worker.js', [
  [
    /<script src="\/performance-v3\.js" defer><\/script>(?!<script src="\/wheel-fast\.js")/,
    '<script src="/performance-v3.js" defer></script><script src="/wheel-fast.js" defer></script>',
    'fast desktop mouse-wheel runtime'
  ]
]);
