// Link recipes whose wiki outputs are redirect pages rather than Category:Items
// pages. Never invent an item: require an exact wiki redirect to a gilded cape.
const fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),file=path.join(root,'src/catalog/data/dragonwilds.json');
(async()=>{
 const catalog=JSON.parse(await fs.readFile(file,'utf8'));
 const byName=new Map(catalog.items.map(i=>[i.name,i]));
 const unresolved=[...new Set(catalog.recipes.flatMap(r=>r.outputs.map(o=>o.name)).filter(name=>!byName.has(name)))];
 const golden=unresolved.filter(name=>name.startsWith('Golden '));
 if(golden.length){
  const request='https://dragonwilds.runescape.wiki/api.php?'+new URLSearchParams({action:'query',format:'json',titles:golden.join('|'),prop:'revisions',rvprop:'ids|timestamp|content',rvslots:'main'});
  const response=await fetch(request,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error('Wiki HTTP '+response.status);
  const pages=Object.values((await response.json()).query.pages);
  for(const page of pages){
   const revision=page.revisions?.[0],text=revision?.slots?.main?.['*']||'';
   const match=text.match(/^#REDIRECT\s*\[\[([^#\]]+)#Gilded\]\]/i);
   if(!match||!byName.has(match[1])||page.title!==`Golden ${match[1]}`)throw Error('Unverified golden cape: '+page.title);
   const item={id:String(page.pageid),name:page.title,category:'Cape',description:'Gilded cape variant.',acquisition:'',sourceUrl:'https://dragonwilds.runescape.wiki/w/'+encodeURIComponent(page.title.replaceAll(' ','_')),revision:revision.revid,updatedAt:revision.timestamp};
   catalog.items.push(item);byName.set(item.name,item);
  }
 }
 for(const recipe of catalog.recipes)for(const output of recipe.outputs){
  const name=output.name==='Naptha'?'Naphtha':output.name,item=byName.get(name);
  if(item&&(!output.itemId||output.itemId!==item.id)){output.itemId=item.id;output.name=item.name;}
 }
 const remaining=catalog.recipes.flatMap(r=>r.outputs.filter(o=>!byName.has(o.name)).map(o=>r.id+': '+o.name));
 if(remaining.length)throw Error('Unresolved outputs: '+remaining.join('; '));
 catalog.items.sort((a,b)=>a.name.localeCompare(b.name,'en'));
 await fs.writeFile(file,JSON.stringify(catalog,null,2)+'\n');
 console.log(`Linked ${golden.length} verified gilded capes and the Naphtha alias.`);
})().catch(e=>{console.error(e);process.exitCode=1});
