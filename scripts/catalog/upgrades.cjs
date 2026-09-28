// Release-time source import; installed clients use the bundled offline snapshot.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{load}=require('cheerio');
const root=path.resolve(__dirname,'../..'),url='https://valheim-modding.github.io/Jotunn/data/objects/recipe-list.html';
(async()=>{
 const cache=path.join(root,'.catalog-cache',crypto.createHash('sha256').update(url).digest('hex')+'.json');let record;
 if(!process.argv.includes('--refresh'))try{record=JSON.parse(fs.readFileSync(cache));}catch{}
 if(!record){const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error('Source unavailable: '+r.status);record={url,fetchedAt:new Date().toISOString(),text:await r.text()};fs.mkdirSync(path.dirname(cache),{recursive:true});fs.writeFileSync(cache,JSON.stringify(record));}
 const {canonicalItems}=await import('../../src/planner/engine.mjs'),items=canonicalItems(require('../../src/catalog/data/valheim.json')),byId=new Map(items.map(i=>[i.id,i])),byName=new Map();for(const i of items){const key=i.name.toLowerCase();byName.set(key,byName.has(key)?null:i);}
 const dom=load(record.text),result={};dom('tr').each((_,row)=>{const cells=dom(row).children('td');if(cells.length<5)return;const prefab=cells.eq(0).text().trim().replace(/^Recipe_/,''),item=byId.get(prefab)||byName.get(cells.eq(2).text().trim().toLowerCase());if(!item||cells.eq(4).find('ul').length<2)return;
 let unresolved=false;const levels=[];cells.eq(4).find('ul').each((n,ul)=>{const inputs=[];dom(ul).find('li').each((_,li)=>{const m=dom(li).text().trim().match(/^(\d+)\s+(.+)$/);if(!m)throw Error('Unrecognized upgrade cost');const material=byName.get(m[2].toLowerCase());if(!material){unresolved=true;return;}inputs.push({name:material.name,quantity:Number(m[1]),itemId:material.id});});if(inputs.length)levels.push({level:n+1,inputs});});if(!unresolved&&levels.length>1)result[item.id]={sourceUrl:url,verifiedAt:record.fetchedAt,levels};});
 if(Object.keys(result).length<200)throw Error('Unexpected upgrade coverage; existing snapshot preserved.');fs.writeFileSync(path.join(root,'src/catalog/data/valheim-upgrades.json'),JSON.stringify(result,null,2)+'\n');console.log(Object.keys(result).length+' verified upgrade chains.');
})().catch(e=>{console.error(e);process.exitCode=1;});
