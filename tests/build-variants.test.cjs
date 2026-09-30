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
test('variant artwork and separate lower-body slots survive local validation and migration',async()=>{
 const {migrateBuild,fitsGame}=await import('../src/tools/loadout.mjs');
 const catalog=require('../src/catalog/data/enshrouded.json');
 const boot=catalog.items.find(i=>/foot armor/i.test(i.category)),legs=catalog.items.find(i=>/lower body armor/i.test(i.category));
 assert(boot&&legs);
 const base={id:'loadout',name:'Two sets',game:'enshrouded',tags:[],description:'',skills:'',items:[{slot:'Boots / Legs',itemId:boot.id,name:boot.name,quantity:1}],variants:[{id:'main',name:'Melee',items:[{slot:'Boots / Legs',itemId:boot.id,name:boot.name,quantity:1}],skills:'',extraSlotCount:0},{id:'ranged',name:'Ranged',items:[{slot:'Boots / Legs',itemId:legs.id,name:legs.name,quantity:1}],skills:'',extraSlotCount:0,imageType:'range'}],activeVariantId:'main',imageType:'warrior',updatedAt:new Date().toISOString()};
 const saved=cleanBuild(migrateBuild(base,catalog));
 assert.equal(saved.variants[0].imageType,'warrior');assert.equal(saved.variants[1].imageType,'range');
 assert.equal(saved.variants[0].items[0].slot,'Boots');assert.equal(saved.variants[1].items[0].slot,'Legs');
 assert(fitsGame(legs,'Legs','enshrouded'));
 assert(!fitsGame(legs,'Chest','enshrouded'),'lower-body armor must not appear in the Chest picker');
});
test('build shopping lists exclude food and potions even in extra slots',async()=>{
 const {buildShoppingEligible}=await import('../src/tools/loadout.mjs');
 for(const game of ['dragonwilds','valheim','enshrouded','grounded2','vrising','duneawakening']){
  const catalog=require('../src/catalog/data/'+game+'.json');
  const consumable=catalog.items.find(item=>/consum|food|potion|smoothie/i.test(item.category));
  assert(consumable,`${game} has a consumable to classify`);
  assert.equal(buildShoppingEligible({slot:'Extra 1',itemId:consumable.id,name:consumable.name,quantity:1},catalog),false,`${game}: ${consumable.name}`);
  assert.equal(buildShoppingEligible({slot:'Food 1',itemId:'unknown',name:'Uncatalogued meal',quantity:1},catalog),false);
  assert.equal(buildShoppingEligible({slot:'Potion 2',itemId:'unknown',name:'Uncatalogued flask',quantity:1},catalog),false);
 }
 const dragonwilds=require('../src/catalog/data/dragonwilds.json');
 const cape=dragonwilds.items.find(item=>item.name==='Bramblemead Cape');
 assert(cape);
 assert.equal(buildShoppingEligible({slot:'Cape',itemId:cape.id,name:cape.name,quantity:1},dragonwilds),true);
 assert.equal(buildShoppingEligible({slot:'Extra 1',itemId:cape.id,name:cape.name,quantity:1},dragonwilds),true);
 assert.equal(buildShoppingEligible({slot:'Extra 2',itemId:'unknown',name:'Boatman Fin Soup',quantity:1},dragonwilds),false);
 const material=dragonwilds.items.find(item=>/material|resource/i.test(item.category));
 assert(material);
 assert.equal(buildShoppingEligible({slot:'Extra 3',itemId:material.id,name:material.name,quantity:1},dragonwilds),false);
});
