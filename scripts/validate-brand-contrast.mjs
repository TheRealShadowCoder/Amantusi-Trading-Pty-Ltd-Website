import assert from 'node:assert/strict';
const rgb=color=>color.match(/[a-f\d]{2}/gi).map(n=>parseInt(n,16)/255);
const lightness=hex=>rgb(hex).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
const ratio=(a,b)=>{const [x,y]=[lightness(a),lightness(b)].sort((a,b)=>b-a);return (x+.05)/(y+.05);};
const pairs=[
 ['White / navy','#ffffff','#071923'],
 ['Cream / navy','#f7f2e8','#071923'],
 ['Gold / navy','#b89e56','#071923'],
 ['Ink / cream','#183141','#f7f2e8'],
 ['Muted ink / white','#526676','#ffffff'],
 ['White / deep teal','#ffffff','#143942']
];
for(const [label,fg,bg] of pairs){
 const value=ratio(fg,bg);
 assert.ok(value>=4.5,label+' contrast '+value.toFixed(2)+' below WCAG AA normal text threshold');
 console.log('PASS '+label+' '+value.toFixed(2)+':1');
}
console.log('Six documented brand color pairs meet normal text contrast minimum. Full UI still requires a separate audit.');
