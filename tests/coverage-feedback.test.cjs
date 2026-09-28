const { test } = require('node:test'), assert = require('node:assert/strict');
const { createFeedback, endpoint } = require('../electron/feedback.cjs');
const report = { kind: 'Bug report', subject: 'Missing recipe', message: 'The recipe is missing in my shopping list.', email: 'tester@example.com', game: 'Valheim' };
test('feedback delivery requires configuration and validates the destination and report', async () => {
  const unconfigured = createFeedback('0.6.1', () => { throw Error('Must not send'); }, { endpoint: '' });
  assert.equal(unconfigured.status().configured, false);
  await assert.rejects(unconfigured.send(report), /not configured/);
  for (const url of ['http://formspree.io/f/test', 'https://evil.test/f/test', 'https://formspree.io/f/test?other=1', 'https://user@formspree.io/f/test']) assert.throws(() => endpoint(url));
  const configured = createFeedback('0.6.1', () => { throw Error('Must not send'); }, { endpoint: 'https://formspree.io/f/example' });
  await assert.rejects(configured.send({ ...report, message: '' }), /10 characters/);
  await assert.rejects(configured.send({ ...report, kind: 'Other' }), /report type/);
});
test('feedback confirms service acceptance, contains only explicit fields and preserves failure state', async () => {
  let body;
  const service = createFeedback('0.6.1', async (url, options) => { body = JSON.parse(options.body); assert.equal(options.redirect, 'error'); return { ok: true, json: async () => ({ ok: true }) }; }, { endpoint: 'https://formspree.io/f/example' });
  assert.deepEqual(await service.send({ ...report, token: 'secret', workspace: 'private' }), { accepted: true });
  assert.equal(body.appVersion, '0.6.1'); assert.equal(body.token, undefined); assert.equal(body.workspace, undefined);
  await assert.rejects(service.send(report), /wait/);
  const failed = createFeedback('0.6.1', async () => ({ ok: false, json: async () => ({ ok: false }) }), { endpoint: 'https://formspree.io/f/example' });
  await assert.rejects(failed.send(report), /did not accept/);
});
test('every Valheim gearset member resolves to an actual recipe and complete precursor chain', async () => {
  const c = require('../src/catalog/data/valheim.json'), sets = require('../src/catalog/data/gearsets.json').valheim;
  const { buildShoppingList } = await import('../src/planner/engine.mjs');
  for (const set of sets) for (const id of set.ids) {
    const item = c.items.find(i => i.id === id); assert.ok(c.recipes.some(r => r.outputs.some(o => o.itemId === id)), item.name);
    const list = { game: 'valheim', targets: [{ itemId: id, name: item.name, quantity: 1 }], recipes: {}, progress: {}, useSupplies: false };
    const built = buildShoppingList(list, c, []); assert.ok(built.rows.some(r => r.item?.id === id && r.recipe), item.name);
  }
  const byName = n => c.items.find(i => i.name === n && !/^(?:FW|SP)_/.test(i.id));
  const armor = byName('Breastplate of the Protector');
  const built = buildShoppingList({ game: 'valheim', targets: [{ itemId: armor.id, name: armor.name, quantity: 1 }], recipes: {}, progress: {}, useSupplies: false }, c, []);
  assert.ok(built.rows.some(r => r.name === 'Bloodgold' && r.recipe?.station === 'Blast Furnace'));
  assert.ok(built.rows.some(r => r.name === 'Petrified Tissue'));
});
test('all five catalogs have recipes or genuine acquisition information for gearsets', () => {
  const sets = require('../src/catalog/data/gearsets.json');
  for (const game of Object.keys(sets)) {
    const c = require('../src/catalog/data/' + game + '.json');
    for (const set of sets[game]) for (const id of set.ids) {
      const item = c.items.find(i => i.id === id); assert.ok(item);
      const recipe = c.recipes.some(r => r.outputs.some(o => o.itemId ? o.itemId === id : o.name === item.name));
      // Five new cosmetic pieces have an empty Obtaining section in the source. Do not fabricate a source.
      assert.ok(recipe || item.acquisition || (game === 'enshrouded' && set.name.startsWith('Efflorescent Hope')), game + ': ' + item.name);
    }
  }
  const en = require('../src/catalog/data/enshrouded.json');
  assert.ok(en.recipes.some(r => r.outputs.some(o => o.name === 'Bamboo Plant Pot' && o.quantity === 4)));
  assert.match(en.items.find(i => i.name === 'Archer Helmet').acquisition, /Revelwood/);
});
