const fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto');
const games=['dragonwilds','valheim','enshrouded','grounded2','vrising', 'duneawakening'];
function text(v,max){if(typeof v!=='string'||v.length>max)throw Error('Invalid build text.');return v.trim();}
function cleanBuild(v){
 if(v)v={...v,items:v.items||[],tags:v.tags||[]};
 if(!v||!games.includes(v.game)||!Array.isArray(v.items)||v.items.length>80||!Array.isArray(v.tags)||v.tags.length>12)throw Error('Invalid build.');
 const id=text(v.id,80),name=text(v.name,140);if(!id||!name)throw Error('Name your build.');
 const cleanItems=rows=>rows.map(i=>{const quantity=i.quantity;if(!Number.isSafeInteger(quantity)||quantity<1||quantity>999999)throw Error('Invalid build quantity.');return {slot:text(i.slot,60),itemId:text(i.itemId,160),name:text(i.name,200),quantity};});
 const items=cleanItems(v.items);
 const incoming=v.variants??[{id:'main',name:'Original',items,skills:v.skills||'',extraSlotCount:0}];
 if(!Array.isArray(incoming)||incoming.length<1||incoming.length>20)throw Error('Invalid build variants.');
 const variants=incoming.map(variant=>{const variantItems=variant?.items??[];if(!variant||!Array.isArray(variantItems)||variantItems.length>80||!Number.isSafeInteger(variant.extraSlotCount)||variant.extraSlotCount<0||variant.extraSlotCount>24)throw Error('Invalid build variant.');return {id:text(variant.id,80),name:text(variant.name,80),items:cleanItems(variantItems),skills:text(variant.skills||'',6000),extraSlotCount:variant.extraSlotCount};});
 if(new Set(variants.map(variant=>variant.id)).size!==variants.length||variants.some(variant=>!variant.id||!variant.name)||variants.reduce((n,variant)=>n+variant.items.length,0)>240)throw Error('Invalid build variants.');
 const activeVariantId=v.activeVariantId||variants[0].id,active=variants.find(variant=>variant.id===activeVariantId);if(!active)throw Error('Invalid active build variant.');
 const imageType=v.imageType||'exploration';if(!['warrior','mage','range','exploration','gathering'].includes(imageType))throw Error('Invalid build image.');
 const member=m=>m?{uid:text(m.uid,128),displayName:text(m.displayName,32)}:undefined;
 return {id,name,game:v.game,tags:v.tags.map(t=>text(t,40)),description:text(v.description||'',6000),skills:active.skills,items:active.items,variants,activeVariantId,imageType,updatedAt:text(v.updatedAt,40),...(v.owner?{owner:member(v.owner)}:{}),...(v.creator?{creator:member(v.creator)}:{}),...(v.publishedAt?{publishedAt:text(v.publishedAt,40)}:{}),...(v.sourceId?{sourceId:text(v.sourceId,80),sourceUpdatedAt:text(v.sourceUpdatedAt,40)}:{})};
}
const defaults=()=>({schemaVersion:1,builds:[],favorites:{},recent:{}});
function validateTools(v){if(!v||v.schemaVersion!==1||!Array.isArray(v.builds)||v.builds.length>500)throw Error('Invalid tools workspace.');const builds=v.builds.map(cleanBuild);if(new Set(builds.map(b=>b.id)).size!==builds.length)throw Error('Duplicate build ID.');const out={schemaVersion:1,builds,favorites:{},recent:{}};for(const field of ['favorites','recent'])for(const game of games){const a=v[field]?.[game]||[];if(!Array.isArray(a)||a.length>1000)throw Error('Invalid saved items.');out[field][game]=[...new Set(a.map(id=>text(id,160)))];}return out;}
function createToolsStore(dir){const file=path.join(dir,'tools-workspace.json');const read=()=>fs.existsSync(file)?validateTools(JSON.parse(fs.readFileSync(file,'utf8'))):defaults();const write=v=>{v=validateTools(v);read();fs.mkdirSync(dir,{recursive:true});const temp=file+'.'+randomUUID()+'.tmp';try{fs.writeFileSync(temp,JSON.stringify(v,null,2),{flag:'wx'});if(fs.existsSync(file))fs.copyFileSync(file,file+'.bak');fs.renameSync(temp,file);}finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}return v;};return {file,read,write};}
module.exports={cleanBuild,validateTools,createToolsStore};
