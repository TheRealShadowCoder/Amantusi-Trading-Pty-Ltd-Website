import assert from 'node:assert/strict';
import {validateRfqAttachment} from '../src/upload-validation.js';
const file=(name,type,data)=>new File([new Uint8Array(data)],name,{type});
const checks=[
 ['PDF',file('rfq.pdf','application/pdf',[37,80,68,70,45,49,46,55]) ,true],
 ['PNG',file('image.png','image/png',[137,80,78,71,13,10,26,10,0,0]),true],
 ['JPEG',file('photo.jpeg','image/jpeg',[255,216,255,224,1]),true],
 ['WEBP',file('photo.webp','image/webp',[82,73,70,70,10,0,0,0,87,69,66,80]),true],
 ['DOCX',file('requirements.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',[80,75,3,4,20]),true],
 ['TXT',file('items.txt','text/plain',[65,66,67,10]),true],
 ['Disguised EXE',file('rfq.pdf','application/pdf',[77,90,144,0]),false],
 ['Mismatched extension',file('rfq.exe','application/pdf',[37,80,68,70,45]),false],
 ['Binary text',file('items.txt','text/plain',[65,0,66]),false],
 ['Empty PDF',file('empty.pdf','application/pdf',[]),false]
];
for(const [name,blob,expected] of checks){
 const actual=await validateRfqAttachment(blob);
 assert.equal(actual.ok,expected,name+': '+JSON.stringify(actual));
 console.log('PASS '+name);
}
console.log(checks.length+' upload type checks passed');
