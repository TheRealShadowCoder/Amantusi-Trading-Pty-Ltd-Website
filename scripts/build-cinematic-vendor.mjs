import {copyFileSync,existsSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
const src='node_modules/three/build',dest='public/vendor';
for (const file of ['three.module.js','three.core.js']) {
 const source=join(src,file);
 if(!existsSync(source))throw new Error('Three.js dependency missing: run npm install first ('+source+')');
 mkdirSync(dest,{recursive:true});
 copyFileSync(source,join(dest,file));
}
console.log('PASS locally hosted Three.js ES modules for cinematic experiences');
