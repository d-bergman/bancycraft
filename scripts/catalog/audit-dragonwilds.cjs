// Compare every imported Dragonwilds item revision with the live wiki, then
// inspect changed pages for recipe differences. This script does not mutate data.
const fs=require('node:fs/promises'),path=require('node:path');
const {dragonRecipes}=require('./parse.cjs');
const root=path.resolve(__dirname,'../..');
const url='https://dragonwilds.runescape.wiki/api.php';
async function query(params){const r=await fetch(url+'?'+new URLSearchParams({action:'query',format:'json',...params}),{headers:{'User-Agent':'BancyCraft recipe audit (https://github.com/d-bergman/bancycraft)'},signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('Wiki HTTP '+r.status);return (await r.json()).query;}
const signature=r=>JSON.stringify({station:r.station||'',inputs:r.inputs.map(i=>[i.name,i.quantity]),outputs:r.outputs.map(i=>[i.name,i.quantity])});
(async()=>{
 const catalog=JSON.parse(await fs.readFile(path.join(root,'src/catalog/data/dragonwilds.json'),'utf8'));
 const byId=new Map(catalog.items.map(i=>[i.id,i])),changed=[];
 const wikiPages=[];let continuation={};
 do{const r=await fetch(url+'?'+new URLSearchParams({action:'query',format:'json',list:'categorymembers',cmtitle:'Category:Items',cmtype:'page',cmlimit:'500',...continuation}),{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('Wiki category HTTP '+r.status);const data=await r.json();wikiPages.push(...data.query.categorymembers);continuation=data.continue||null;}while(continuation);
 const newPages=wikiPages.filter(p=>!byId.has(String(p.pageid))).map(p=>p.title);
 for(let offset=0;offset<catalog.items.length;offset+=50){const result=await query({pageids:catalog.items.slice(offset,offset+50).map(i=>i.id).join('|'),prop:'revisions',rvprop:'ids|timestamp'});for(const page of Object.values(result.pages)){const item=byId.get(String(page.pageid));if(item&&item.revision!==page.revisions?.[0]?.revid)changed.push(item);}}
 const differences=[];
 for(let offset=0;offset<changed.length;offset+=50){const result=await query({pageids:changed.slice(offset,offset+50).map(i=>i.id).join('|'),prop:'revisions',rvprop:'ids|timestamp|content',rvslots:'main'});for(const page of Object.values(result.pages)){
  const source=page.revisions?.[0]?.slots?.main?.['*']||'',current=dragonRecipes(source,page.title),old=catalog.recipes.filter(r=>r.id.startsWith(page.title+':'));
  if(current.length!==old.length||current.some((r,i)=>signature(r)!==signature(old[i])))differences.push({page:page.title,old:old.map(signature),current:current.map(signature),revision:page.revisions?.[0]?.revid});
 }}
 console.log(JSON.stringify({catalogItems:catalog.items.length,catalogRecipes:catalog.recipes.length,wikiCategoryPages:wikiPages.length,newPages,changedPages:changed.length,recipeDifferences:differences.length,differences},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
