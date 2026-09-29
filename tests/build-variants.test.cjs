const {test}=require('node:test'),assert=require('node:assert/strict');
const {cleanBuild}=require('../electron/tools-store.cjs');
const sets=require('../src/catalog/data/gearsets.json');

test('legacy builds migrate to one named variant and keep their equipped items',()=>{
 const old={id:'legacy',name:'Rune Expedition',game:'dragonwilds',tags:[],description:'',skills:'Runes',items:[{slot:'Chest',itemId:'19529',name:'Rune Platebody',quantity:1}],updatedAt:new Date().toISOString()};
 const migrated=cleanBuild(old);assert.equal(migrated.activeVariantId,'main');assert.equal(migrated.variants.length,1);assert.deepEqual(migrated.variants[0].items,migrated.items);assert.equal(migrated.variants[0].skills,'Runes');assert.equal(migrated.imageType,'exploration');
 const blank={...migrated,activeVariantId:'empty',variants:[migrated.variants[0],{id:'empty',name:'Mage',items:[],skills:'',extraSlotCount:4}]};
 const saved=cleanBuild(blank);assert.equal(saved.items.length,0);assert.equal(saved.variants[0].items[0].name,'Rune Platebody');assert.equal(saved.variants[1].extraSlotCount,4);
 const remoteShape=structuredClone(blank);delete remoteShape.variants[1].items;
 assert.deepEqual(cleanBuild(remoteShape).variants[1].items,[],'Firebase omits empty arrays in shared builds');
 assert.throws(()=>cleanBuild({...blank,variants:[...blank.variants,blank.variants[1]]}),/variants/);
});

test('every gearset piece in every game matches a supported builder slot',async()=>{
 const {layout,fitsGame}=await import('../src/tools/loadout.mjs');
 for(const [game,bundles]of Object.entries(sets)){
  const catalog=require('../src/catalog/data/'+game+'.json'),items=new Map(catalog.items.map(i=>[i.id,i]));
  for(const bundle of bundles)for(const id of [...bundle.ids,...Object.values(bundle.alternatives||{}).flat()]){
   const item=items.get(id);assert(item,`${game}: ${bundle.name} missing ${id}`);
   assert(layout.some(slot=>fitsGame(item,slot,game)),`${game}: ${bundle.name}: ${item.name} has no supported builder slot`);
  }
 }
 const catalog=require('../src/catalog/data/dragonwilds.json');for(const name of ['Obsidian Cape','Fire Cape']){
  const item=catalog.items.find(i=>i.name===name);assert(item);assert(fitsGame(item,'Cape','dragonwilds'),name);
 }
 assert(fitsGame(catalog.items.find(i=>i.name==='Rune Platebody'),'Chest','dragonwilds'));
});
