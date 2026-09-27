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
  assert.equal(store.read().supplies[0].quantity, 100);
});
