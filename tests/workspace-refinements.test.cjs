const {test}=require('node:test'),assert=require('node:assert/strict'),{validate,defaults}=require('../electron/store.cjs');
test('completion metrics survive saves and reject duplicate IDs or invalid games',()=>{
 const w={...defaults(),completionLog:[{id:'completed-list',game:'valheim',at:'2026-09-28T00:00:00Z'}]};assert.deepEqual(validate(w).completionLog,w.completionLog);assert.throws(()=>validate({...w,completionLog:[...w.completionLog,...w.completionLog]}),/Duplicate/);assert.throws(()=>validate({...w,completionLog:[{...w.completionLog[0],game:'unknown'}]}),/game/);assert.deepEqual(validate(defaults()),defaults());
});
test('loadout rules combine legs and boots, isolate gloves and capes, and deduplicate equipment',async()=>{
 const {layout,fitsGame,supported,normalizeSlots,uniqueEquipment}=await import('../src/tools/loadout.mjs');
 assert(!layout.includes('Legs'));assert(layout.includes('Boots / Legs'));assert(!supported('valheim','Belt'));assert(supported('valheim','Boots / Legs'));
 assert(fitsGame({name:'Iron Greaves',category:'Legs'},'Boots / Legs','valheim'));assert(fitsGame({name:'Mage Gloves',category:'Arm armor'},'Gloves','enshrouded'));assert(!fitsGame({name:'Ashen Cape',category:'Shoulder'},'Head','valheim'));assert(fitsGame({name:'Megingjord',category:'Utility Belt'},'Accessory','valheim'));
 assert.equal(normalizeSlots([{slot:'Legs'}])[0].slot,'Boots / Legs');
 const items=[{id:'one',name:'Sword',category:'Sword'},{id:'two',name:'Sword',category:'Sword'},{id:'three',name:'Sword',category:'Two-handed Sword'}];assert.deepEqual(uniqueEquipment(items,{recipes:[{outputs:[{itemId:'two'}]}]}).map(i=>i.id),['two','three']);
});
test('changelog headings remain structured and render independently of bullets',async()=>{
 const {parseChangelog}=await import('../src/updates/release-history.mjs');const releases=parseChangelog('## 0.8.0 — 2026-09-28\nSummary.\n### New Content\n- Added thing\n### Bug Fixes\n- Fixed thing\n');assert.deepEqual(releases[0].blocks.map(b=>b.kind),['paragraph','heading','list','heading','list']);
});

test('Valheim initial crafts use casts, with verified stations and nonnumeric resource origins',async()=>{
 const {indexCatalog,buildShoppingList}=await import('../src/planner/engine.mjs'),c=require('../src/catalog/data/valheim.json'),upgrades=require('../src/catalog/data/valheim-upgrades.json'),idx=indexCatalog(c),nord=c.items.find(i=>i.id==='AxeGold');
 const initial=idx.recipes.get('i:'+nord.id);assert(initial.every(v=>v.recipe.id!=='Recipe_AxeGold'));assert(initial.some(v=>v.recipe.station==='Frost Foundry'&&v.recipe.inputs.some(i=>i.name==='Cast: Nord Axe')));
 const cast=c.items.find(i=>i.name==='Cast: Nord Axe');assert(idx.recipes.get('i:'+cast.id).some(v=>v.recipe.station==='Black Forge'));assert(upgrades[nord.id].levels[0].inputs.some(i=>i.name==='Cast: Nord Axe'));
 for(const id of ['Acorn','Amber','AmberPearl'])assert(c.items.find(i=>i.id===id).acquisition.length>10);assert(!c.items.find(i=>i.id==='Acorn').acquisition.includes('×'));
 const r=buildShoppingList({id:'nord',game:'valheim',targets:[{itemId:nord.id,name:nord.name,quantity:1,fromLevel:0,toLevel:2}],recipes:{},progress:{},owned:{},useSupplies:false,collapsed:{},hideCompleted:false},{...c,upgrades});assert(r.rows.some(i=>i.name==='Cast: Nord Axe'));
});
