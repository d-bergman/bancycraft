const {test}=require('node:test'),assert=require('node:assert/strict'),{actionLock}=require('../electron/player-lockouts.cjs');
const server=(id,status='running',playersOnline=0,playerQueryStatus='ok')=>({id,label:id,status,playersOnline,playerQueryStatus});
test('manual player lockouts cover switching, stop, restart, multiple worlds and unknown counts',()=>{
 const snap=(...servers)=>({servers});
 assert.match(actionLock(snap(server('one','running',1),server('two','stopped')),'two','start'),/online/);
 for(const action of ['stop','restart'])assert.match(actionLock(snap(server('one','running',2)),'one',action),/online/);
 assert.match(actionLock(snap(server('one','running',0,'query_failed'),server('two','stopped')),'two','start'),/could not be verified/);
 assert.match(actionLock(snap(server('one'),server('two','running',1),server('three','stopped')),'three','start'),/two/);
 assert.match(actionLock(snap(server('one'),server('two','running',1)),'one','restart'),/two/);
 assert.equal(actionLock(snap(server('one'),server('two','stopped')),'two','start'),'');
 assert.equal(actionLock(snap(server('one')),'one','restart'),'');
 assert.match(actionLock(snap(server('one')),'one','start'),/already running/);
 assert.match(actionLock(snap(server('one','missing')),'one','restart'),/unavailable/);
 assert.match(actionLock(snap({...server('one'),playersOnline:undefined}),'one','stop'),/verified/);
});
test('native controller rechecks population before POST and refuses stale UI permissions',async()=>{
 const {createServers}=require('../electron/servers.cjs');let posts=0,players=1;
 const bridge=createServers({status:()=>({state:'connected',user:{uid:'test'}}),token:async()=>'fixture',config:{}},{status:()=>({unlocked:true})},{status:()=>({unlocked:true,uid:'test'}),token:()=> 'fixture'},{fetch:async(u,init)=>{if(init.method==='POST')posts++;return {ok:true,json:async()=>({servers:[server('one','running',players)]})};}});
 await assert.rejects(()=>bridge.action('one','restart'),/online/);assert.equal(posts,0);players=0;await bridge.action('one','restart');assert.equal(posts,1);
});
test('Dune recipes preserve refinery alternatives and water volumes without guessed yields',async()=>{
 const c=require('../src/catalog/data/duneawakening.json'),icons=require('../src/catalog/data/icons.json').duneawakening;
 assert(c.items.length>2000&&c.recipes.length>900&&Object.keys(icons).length>1800);
 const copper=c.recipes.filter(r=>r.outputs.some(o=>o.name==='Copper Ingot'));
 assert.deepEqual(copper.map(r=>[r.station,r.inputs.find(i=>i.name==='Copper Ore').quantity]).sort(),[['Large Ore Refinery',2],['Medium Ore Refinery',3],['Small Ore Refinery',4]]);
 const iron=c.recipes.find(r=>r.station==='Small Ore Refinery'&&r.outputs.some(i=>i.name==='Iron Ingot'));
 assert.equal(iron.inputs.find(i=>i.name==='Water (mL)').quantity,25);
 const {buildShoppingList}=await import('../src/planner/engine.mjs'),item=c.items.find(i=>i.name==='Iron Ingot');
 const list=buildShoppingList({game:c.game,targets:[{itemId:item.id,name:item.name,quantity:10}],recipes:{['i:'+item.id]:iron.id},progress:{},owned:{},useSupplies:false},c);
 assert.equal(list.rows.find(i=>i.name==='Water (mL)').required,250);assert.equal(list.warnings.length,0);
});
test('Dune parser excludes incomplete rows instead of silently dropping a required material',()=>{
 const {recipes}=require('../scripts/catalog/dune-parse.cjs'),items=['Ore','Ingot'].map(n=>({id:n,name:n})),by=new Map(items.map(i=>[i.id,i]));
 const raw='=== Crafted By ===\n{|\n|-\n! Station\n! Ingredients\n! Products\n|-\n|\n* [[Refinery]]\n|\n* [[Ore]] x3\n* [[Unknown]] x2\n|\n* [[Ingot]] x1\n|-\n|}\n';
 const r=recipes(raw,'Ingot',by,new Map(items.map(i=>[i.name.toLowerCase(),i])));assert.equal(r.result.length,0);assert.equal(r.rejected.length,1);
});
test('Valheim fish conversion uses one alternative, not every fish at once',()=>{
 const c=require('../src/catalog/data/valheim.json'),r=c.recipes.filter(r=>r.outputs.some(i=>i.itemId==='FishRaw'));assert(r.length>=10);assert(r.every(r=>r.inputs.length===1&&r.station==='Food Preparation Table'));
});
