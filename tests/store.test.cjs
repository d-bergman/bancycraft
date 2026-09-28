const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createStore } = require('../electron/store.cjs');
function fixture(t) { const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bancycraft-test-')); t.after(() => fs.rmSync(directory, { recursive: true, force: true })); return { directory, store: createStore(directory) }; }
test('workspace persists across new app instances and keeps a previous-save backup', t => {
  const { directory, store } = fixture(t);
  const data = store.read();
  data.plans.push({ id: 'one', name: 'Forge upgrade', game: 'valheim', quantity: 3, notes: 'Gather supplies', status: 'planned', updatedAt: new Date().toISOString() });
  store.write(data);
  assert.deepEqual(createStore(directory).read(), data);
  const updated = { ...data, game: 'valheim' };
  store.write(updated);
  assert.deepEqual(createStore(directory).read(), updated);
  assert.deepEqual(JSON.parse(fs.readFileSync(`${store.file}.bak`, 'utf8')), data);
});
test('corrupt and future-version data is preserved, never silently reset', t => {
  const { store } = fixture(t);
  for (const content of ['broken-json', '{"schemaVersion":99}']) {
    fs.writeFileSync(store.file, content);
    assert.throws(() => store.read(), /kept safe/);
    assert.throws(() => store.write({ schemaVersion: 1, game: 'valheim', plans: [], supplies: [] }));
    assert.equal(fs.readFileSync(store.file, 'utf8'), content);
  }
});
test('invalid writes cannot replace valid data', t => {
  const { store } = fixture(t); const data = store.read(); store.write(data);
  const bad = { ...data, supplies: [{ id: 'one', name: 'Wood', game: 'valheim', quantity: -5 }] };
  assert.throws(() => store.write(bad));
  assert.deepEqual(store.read(), data);
  assert.throws(() => store.write({ ...data, game: 'unknown' }));
});
test('plans and supplies survive changing the active game', t => {
  const { store } = fixture(t); const data = store.read();
  data.supplies.push({ id: 'wood', name: 'Wood', game: 'dragonwilds', quantity: 100 });
  store.write(data); store.write({ ...store.read(), game: 'valheim' });
  store.write({ ...store.read(), game: 'enshrouded' });
  assert.equal(store.read().game, 'enshrouded');
  assert.equal(store.read().supplies[0].quantity, 100);
});

test('version one workspace migrates with an immutable original backup; shopping lists persist', t => {
  const { store, directory } = fixture(t);
  const old = { schemaVersion: 1, game: 'dragonwilds', plans: [{id:'legacy',name:'Old plan',game:'dragonwilds',quantity:2,notes:'Keep',status:'planned',updatedAt:'2026-09-27'}], supplies: [] };
  fs.writeFileSync(store.file,JSON.stringify(old));
  const data=store.read();assert.equal(data.schemaVersion,2);assert.deepEqual(data.lists,[]);
  data.lists.push({id:'list',name:'Thread',game:'dragonwilds',quick:false,targets:[{itemId:'176',name:'Coarse Thread',quantity:4}],recipes:{'i:176':'Coarse Thread:1'},progress:{'i:176':1},collapsed:{Gathering:true},hideCompleted:false,useSupplies:false,updatedAt:'2026-09-28'});
  store.write(data);store.write({...data,game:'valheim'});
  assert.deepEqual(JSON.parse(fs.readFileSync(`${store.file}.v1.bak`)),old);
  const read=createStore(directory).read();assert.equal(read.plans[0].notes,'Keep');assert.deepEqual(read.lists,data.lists);
  assert.throws(()=>store.write({...read,lists:[{...data.lists[0],progress:{'i:176':-1}}]}));
});
