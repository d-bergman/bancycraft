const {test}=require('node:test'),assert=require('node:assert/strict');
const sets=require('../src/catalog/data/gearsets.json');
test('every gearset uses unique real game IDs, with valid replacements and complete imported membership',()=>{
  for(const [game,list]of Object.entries(sets)){
    const items=new Map(require('../src/catalog/data/'+game+'.json').items.map(i=>[i.id,i]));
    assert.equal(new Set(list.map(s=>s.name)).size,list.length);
    for(const set of list){assert.ok(set.ids.length>=2,set.name);assert.equal(new Set(set.ids).size,set.ids.length);assert.ok(!set.missing?.length,set.name);for(const id of set.ids)assert.ok(items.has(id),set.name+':'+id);for(const [id,alts]of Object.entries(set.alternatives)){assert.ok(set.ids.includes(id));alts.forEach(alt=>{assert.ok(items.has(alt));assert.ok(!set.ids.includes(alt));});}}
  }
  assert.equal(sets.dragonwilds.length,37);assert.equal(sets.valheim.length,20);assert.equal(sets.enshrouded.length,82);
  for(const name of ['Golden Bulwark armor','Sunpiercer armor'])assert.equal(sets.enshrouded.find(s=>s.name===name).ids.length,5,'Use set-page membership instead of an incorrect item-page link');
});
