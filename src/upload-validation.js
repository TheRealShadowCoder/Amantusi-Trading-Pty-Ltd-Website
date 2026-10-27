/* Light-weight content signature checks for allowed RFQ uploads.
 * This is file-type screening, not antivirus or full format parsing. */
const MIME={
 'application/pdf':['pdf'],
 'application/msword':['doc'],
 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':['docx'],
 'application/vnd.ms-excel':['xls'],
 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':['xlsx'],
 'text/csv':['csv'],
 'text/plain':['txt'],
 'image/jpeg':['jpg','jpeg'],
 'image/png':['png'],
 'image/webp':['webp']
};
const eq=(b,v,o=0)=>v.every((n,i)=>b[o+i]===n);
function matchFormat(mime,bytes){
 if(mime==='application/pdf')return eq(bytes,[37,80,68,70,45]);
 if(mime==='image/png')return eq(bytes,[137,80,78,71,13,10,26,10]);
 if(mime==='image/jpeg')return eq(bytes,[255,216,255]);
 if(mime==='image/webp')return eq(bytes,[82,73,70,70])&&eq(bytes,[87,69,66,80],8);
 if(mime==='application/msword'||mime==='application/vnd.ms-excel')return eq(bytes,[208,207,17,224,161,177,26,225]);
 if(mime==='application/vnd.openxmlformats-officedocument.wordprocessingml.document'||mime==='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  return eq(bytes,[80,75,3,4])||eq(bytes,[80,75,5,6])||eq(bytes,[80,75,7,8]);
 if(mime==='text/csv'||mime==='text/plain')return !bytes.includes(0);
 return false;
}
export async function validateRfqAttachment(file){
 const mime=String(file?.type||'').toLowerCase();
 const allowed=MIME[mime];
 if(!allowed)return {ok:false,reason:'unsupported MIME type'};
 const name=String(file?.name||'');
 const ext=name.includes('.')?name.split('.').pop().toLowerCase():'';
 if(!allowed.includes(ext))return {ok:false,reason:'file extension does not match declared type'};
 if(!file.size)return {ok:false,reason:'file is empty'};
 const bytes=new Uint8Array(await file.slice(0,512).arrayBuffer());
 if(!matchFormat(mime,bytes))return {ok:false,reason:'file contents do not match the declared type'};
 return {ok:true};
}
