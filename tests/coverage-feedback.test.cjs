const { test } = require('node:test'), assert = require('node:assert/strict');
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
test('all catalogs have recipes or genuine acquisition information for gearsets', () => {
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
