const {test}=require('node:test');
const assert=require('node:assert/strict');
const {validateTools}=require('../electron/tools-store.cjs');

test('unique locations include their mapped region, with unresolved drops identified honestly',async()=>{
  const {resolveLocation}=await import('../src/collections/location-info.mjs');
  const catalog=require('../src/catalog/data/dune-collections.json').items.filter(item=>item.unique);
  const fallback=require('../src/collections/location-fallbacks.json');
  const overrides=require('../src/collections/location-overrides.json');
  const byName=new Map(catalog.map(item=>[item.name,resolveLocation(item,fallback,overrides)]));
  assert.match(byName.get('Thufir\'s Best').location,/Wreck of the Delphis/);
  assert.equal(byName.get('Thufir\'s Best').region,'Sheol');
  assert.match(byName.get('Jolt-sword').location,/Testing Station 186 and Testing Station 217/);
  assert.equal(byName.get('Jolt-sword').region,'Deep Desert');
  assert.equal(byName.get('Mendek\'s Rattle').region,'Deep Desert');
  assert.equal(byName.get('Acheronian Boots').region,'Sheol');
  assert.match(byName.get('Starburst').region,/Sheol/);
  assert.equal(byName.get('Bulwark Boots').region,'Overland; Deep Desert');
  assert.deepEqual([...byName].filter(([,value])=>value.region==='Region unverified').map(([name])=>name),['Purifier Power Pack']);
});

test('collection progress survives tools-store validation and old files migrate',()=>{
  const old=validateTools({schemaVersion:1,builds:[],favorites:{},recent:{}});
  assert.deepEqual(old.duneCollections,{found:[],favorites:[],loadouts:[]});
  const updated=validateTools({...old,duneCollections:{found:['a'],favorites:['b'],loadouts:[{id:'one',name:'Ranged',slots:[{id:'rifle',itemId:'tier4',targetId:'tier5'}]}]}});
  assert.equal(updated.duneCollections.loadouts[0].slots[0].targetId,'tier5');
  assert.throws(()=>validateTools({...old,duneCollections:{...old.duneCollections,loadouts:Array.from({length:6},(_,i)=>({id:String(i),name:'x',slots:[]}))}}),/Maximum five/);
});

test('acquiring a selected higher-tier unique equips it and reveals the next tier',async()=>{
  const {nextUpgrades,acquire}=await import('../src/collections/logic.mjs');
  const items=[4,5,6].map(tier=>({id:'rifle'+tier,name:'Rifle '+tier,tier,group:'Weapons',family:'Rifle',unique:tier>4}));
  const byId=new Map(items.map(item=>[item.id,item]));
  const loadouts=[{id:'one',name:'Ranged',slots:[{id:'rifle',itemId:'rifle4',targetId:'rifle5'}]}];
  assert.deepEqual(nextUpgrades(items,items[0]).map(item=>item.id),['rifle5']);
  const changed=acquire(loadouts,'rifle5',byId,items);
  assert.equal(changed[0].slots[0].itemId,'rifle5');
  assert.equal(changed[0].slots[0].targetId,undefined);
  assert.deepEqual(nextUpgrades(items,byId.get(changed[0].slots[0].itemId)).map(item=>item.id),['rifle6']);
  assert.equal(loadouts[0].slots[0].itemId,'rifle4');
});

test('suspensor upgrades stay in the suspensor line rather than ordinary chest armor',async()=>{
  const {nextUpgrades}=await import('../src/collections/logic.mjs');
  const items=[
    {id:'s3',name:'Rigged Suspensor Jacket',tier:3,group:'Armor',family:'Light Armor · Torso',unique:true},
    {id:'s4',name:'Improved Suspensor Jacket',tier:4,group:'Armor',family:'Light Armor · Torso',unique:true},
    {id:'chest4',name:'Other Chestplate',tier:4,group:'Armor',family:'Light Armor · Torso',unique:true}
  ];
  assert.deepEqual(nextUpgrades(items,items[0]).map(item=>item.id),['s4']);
});
