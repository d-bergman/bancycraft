const { test } = require('node:test');
const assert = require('node:assert/strict');
const ready = import('../src/planner/engine.mjs');
const item = (id, category = 'Resource') => ({ id, name: id, category, description: '', acquisition: '', sourceUrl: 'https://dragonwilds.runescape.wiki/w/' + id });
const recipe = (name, output, inputs, amount = 1) => ({ id: name, station: 'Forge', notes: '', outputs: [{ name: output, quantity: amount }], inputs: Object.entries(inputs).map(([name, quantity]) => ({ name, quantity })), sourceUrl: 'https://dragonwilds.runescape.wiki/w/' + output });
const catalog = { items: [item('Sword','Weapon'),item('Shield','Armor'),item('Ingot','Processed Material'),item('Ore'),item('Logs')], recipes: [recipe('sword','Sword',{Ingot:2,Logs:1}),recipe('shield','Shield',{Ingot:1,Logs:2}),recipe('ingot','Ingot',{Ore:2})] };
const list = (targets = [{ itemId:'Sword',name:'Sword',quantity:1 }]) => ({ id:'test',name:'test',game:'dragonwilds',quick:false,targets,recipes:{},progress:{},collapsed:{},hideCompleted:false,useSupplies:false,updatedAt:'2026-09-28' });
const row = (calculation, name) => calculation.rows.find(r => r.name === name);
test('completing pre-crafts satisfies their materials; resetting reopens only affected branches', async () => {
  const {buildShoppingList,resetProgress}=await ready;
  let current=list([{itemId:'Sword',name:'Sword',quantity:1},{itemId:'Shield',name:'Shield',quantity:1}]);
  let result=buildShoppingList(current,catalog); assert.equal(row(result,'Ore').required,6);
  current.progress={'i:Ingot':2}; result=buildShoppingList(current,catalog);
  assert.equal(row(result,'Ore').inherited,4); assert.equal(row(result,'Ore').remaining,2); assert.equal(row(result,'Sword').remaining,1);
  current.progress['i:Sword']=1; result=buildShoppingList(current,catalog); assert.equal(row(result,'Logs').remaining,2);
  current.progress['i:Logs']=2;
  current=resetProgress(current,['i:Ore'],catalog);
  assert.equal(current.progress['i:Sword'],undefined); assert.equal(current.progress['i:Ingot'],undefined); assert.equal(current.progress['i:Logs'],2);
  assert.equal(row(buildShoppingList(current,catalog),'Ore').remaining,6);
});
test('batch rounding happens after shared pre-craft demand is aggregated',async()=>{
  const {buildShoppingList}=await ready;
  const batch={...catalog,recipes:[...catalog.recipes.slice(0,2),recipe('batch','Ingot',{Ore:2},5)]};
  const current=list([{itemId:'Sword',name:'Sword',quantity:1},{itemId:'Shield',name:'Shield',quantity:1}]);
  assert.equal(row(buildShoppingList(current,batch),'Ore').required,2);
});
test('partial targets, alternate recipes and direct acquisition retain exact quantities',async()=>{
  const {buildShoppingList}=await ready;
  const current=list([{itemId:'Sword',name:'Sword',quantity:3}]);current.progress['i:Sword']=1;
  let result=buildShoppingList(current,catalog);assert.equal(row(result,'Ingot').remaining,4);assert.equal(row(result,'Ore').inherited,4);
  current.recipes['i:Ingot']='gather';result=buildShoppingList(current,catalog);assert.ok(!row(result,'Ore'));
  const alternatives={...catalog,recipes:[...catalog.recipes,recipe('logs-to-ingot','Ingot',{Logs:3})]};
  current.recipes['i:Ingot']='logs-to-ingot';result=buildShoppingList(current,alternatives);assert.equal(row(result,'Logs').required,21);assert.equal(row(result,'Logs').remaining,14);
});
test('supplies count once in a list, exclude other games and do not imply crafting is finished',async()=>{
  const {buildShoppingList}=await ready;const current=list([{itemId:'Sword',name:'Sword',quantity:1},{itemId:'Shield',name:'Shield',quantity:1}]);current.useSupplies=true;
  const result=buildShoppingList(current,catalog,[{game:'dragonwilds',name:'Ingot',quantity:1},{game:'valheim',name:'Ingot',quantity:100}]);
  assert.equal(row(result,'Ingot').owned,1);assert.equal(row(result,'Ore').remaining,4);assert.equal(result.complete,false);
  current.progress['i:Sword']=1;current.progress['i:Shield']=1;assert.equal(buildShoppingList(current,catalog).complete,true);
});
test('missing data and recipe cycles terminate safely without guessed sources',async()=>{
  const {buildShoppingList}=await ready;
  const cycle={...catalog,recipes:[recipe('a','Sword',{Ingot:1}),recipe('b','Ingot',{Sword:1})]};
  const result=buildShoppingList(list(),cycle);assert.ok(result.warnings.some(w=>/cycle/.test(w)));assert.ok(result.rows.length<4);
  const absent=buildShoppingList(list([{itemId:'lost',name:'Old Item',quantity:2}]),catalog);assert.equal(absent.rows[0].remaining,2);assert.ok(absent.warnings.length);
});
test('real Dragonwilds and Enshrouded recipe alternatives are selectable',async()=>{
  const {buildShoppingList}=await ready;
  const dragon=require('../src/catalog/data/dragonwilds.json');const thread=dragon.items.find(i=>i.name==='Coarse Thread');const current=list([{itemId:thread.id,name:thread.name,quantity:4}]);
  current.recipes['i:'+thread.id]='Coarse Thread:1';const result=buildShoppingList(current,dragon);assert.equal(row(result,'Coarse Animal Fur').required,12);assert.ok(!row(result,'Flax'));
});
