const {templates}=require('./parse.cjs');
const clean=s=>String(s||'').replace(/<!--[^]*?-->/g,'').replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g,'$1').replace(/\{\{[^{}]*\}\}/g,'').replace(/\{\{[^]*?\}\}/g,'').replace(/^=+\s*|\s*=+$/gm,'').replace(/<[^>]*>/g,'').replace(/'''?/g,'').replace(/\s+/g,' ').trim();
function ingredients(cell,byId,byName){
 const rows=[],unknown=[];
 for(const line of cell.split('\n').filter(l=>/^\s*\*/.test(l))){
  if(/Icon\|time\b|IconTemp|\d+(?:\.\d+)?s\s*$/.test(line))continue;
  const icons=templates(line).filter(t=>t.name==='icon');
  if(icons.length){for(const t of icons){const key=line.slice(t.start,t.end).match(/^\{\{Icon\|([^|}]+)/i)?.[1]?.trim(),n=Number(t.fields.amount),item=byId.get(key)||byName.get(key?.trim().toLowerCase());if(!item||!Number.isSafeInteger(n)||n<=0)unknown.push(line);else rows.push({itemId:item.id,name:item.name,quantity:n});}continue;}
  const water=line.match(/(?:^|\]\])\s*(\d+)mL Water\s*$/);if(water){rows.push({itemId:'water-ml',name:'Water (mL)',quantity:Number(water[1])});continue;}
  const m=line.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]\s*x(\d+)\s*$/),item=m&&byName.get(m[1].replace(/_/g,' ').trim().toLowerCase());
  if(!item||!m||Number(m[2])<=0)unknown.push(line);else rows.push({itemId:item.id,name:item.name,quantity:Number(m[2])});
 }
 return {rows,unknown};
}
function recipes(text,title,byId,byName){
 const result=[],rejected=[];
 const sections=[...text.matchAll(/^(={2,3})\s*(.*?)\s*\1\s*$\n([^]*?)(?=^={2,3}[^=]|$(?![^]))/gm)];
 for(const s of sections.filter(s=>/^(Crafted By|Recipes)$/i.test(s[2]))){
  for(const table of s[3].matchAll(/\{\|([^]*?)\|\}/g))for(const row of table[1].split(/^\|-.*$/m)){
   if(/^\s*!/m.test(row))continue;
   const cells=row.split(/^\|(?![|-])[^\S\n]*\n/m).slice(1);if(cells.length<2)continue;
   const hasStation=cells.length===3,stationCell=hasStation?cells[0]:'',input=cells[hasStation?1:0],output=cells[hasStation?2:1];
   const stations=hasStation?[...stationCell.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)].map(m=>m[1].replace(/_/g,' ')):[title];
   const a=ingredients(input,byId,byName),b=ingredients(output,byId,byName);
   if(!stations.length||!a.rows.length||!b.rows.length||a.unknown.length||b.unknown.length){rejected.push({page:title,row:clean(row).slice(0,700),unknown:[...a.unknown,...b.unknown]});continue;}
   for(const station of stations)result.push({station,inputs:a.rows,outputs:b.rows});
  }
 }
 return {result,rejected};
}
module.exports={clean,ingredients,recipes};
