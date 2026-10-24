const {test}=require('node:test');
const assert=require('node:assert/strict');
const atlas=require('../src/map/dune-map-data.json');
const catalog=require('../src/catalog/data/dune-collections.json');
const fallbacks=require('../src/collections/location-fallbacks.json');
const overrides=require('../src/collections/location-overrides.json');

test('the offline Dune atlas retains all three wiki map layers and source revisions',()=>{
  assert.deepEqual(atlas.maps.map(map=>[map.name,map.markers.length]),[
    ['Hagga Basin',642],['Deep Desert',31],['Overland',23],
  ]);
  for(const map of atlas.maps){
    assert.ok(map.revision>0);
    for(const marker of map.markers){
      assert.ok(marker.x>=0&&marker.x<=map.width);
      assert.ok(marker.y>=0&&marker.y<=map.height);
    }
  }
});

test('unique source locations focus the matching pins without confusing station numbers',async()=>{
  const {pinsForItem}=await import('../src/map/lookup.mjs');
  const item=name=>catalog.items.find(row=>row.name===name&&!/ Schematic$/.test(row.name));
  const names=name=>pinsForItem(item(name),atlas.maps,fallbacks,overrides).pins.map(pin=>pin.marker.name);
  assert.ok(names("Thufir's Best").includes('Wreck of the Delphis (Fore)'));
  assert.ok(names("Mendek's Rattle").includes('Testing Station 37'));
  assert.deepEqual(names('Jolt-sword').filter(name=>/Testing Station/.test(name)).sort(),['Testing Station 186','Testing Station 217']);
  assert.deepEqual(names('Purifier Power Pack'),[]);
});
