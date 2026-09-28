const { test } = require('node:test');
const assert = require('node:assert/strict');
const { templates, dragonRecipes, quantity } = require('../scripts/catalog/parse.cjs');
const { sourceUrl } = require('../electron/source-links.cjs');
const catalogs = ['dragonwilds', 'valheim', 'enshrouded', 'grounded2'].map(game => require(`../src/catalog/data/${game}.json`));
test('catalogs contain unique stable IDs, positive exact recipe quantities and allowlisted provenance', () => {
  for (const catalog of catalogs) {
    assert.ok(catalog.items.length > 900);
    assert.equal(new Set(catalog.items.map(i => i.id)).size, catalog.items.length);
    assert.equal(new Set(catalog.recipes.map(i => i.id)).size, catalog.recipes.length);
    sourceUrl(catalog.source.url); sourceUrl(catalog.source.licenseUrl);
    for (const item of catalog.items) { assert.ok(item.name && item.category); sourceUrl(item.sourceUrl); }
    for (const recipe of catalog.recipes) {
      sourceUrl(recipe.sourceUrl);
      assert.ok(recipe.inputs.length && recipe.outputs.length);
      for (const row of [...recipe.inputs, ...recipe.outputs]) { assert.ok(row.name); assert.ok(Number.isSafeInteger(row.quantity) && row.quantity > 0); }
      if (catalog.game === 'valheim') for (const row of recipe.outputs) assert.ok(catalog.items.some(i => i.id === row.itemId && i.name === row.name));
    }
  }
});
test('nested wiki markup does not split template parameters or convert uncertain quantities', () => {
  const text = '{{Recipe|facility=Spinning Wheel|notes=[[Flax|plant]] {{note|a=b}}|mat1=Flax|mat1qty=2–5|output1=Thread}}';
  assert.equal(templates(text).find(t => t.name === 'recipe').fields.notes, '[[Flax|plant]] {{note|a=b}}');
  assert.deepEqual(dragonRecipes(text, 'Thread'), []);
  assert.equal(quantity('Unknown'), null);
  assert.equal(quantity(''), null);
  assert.equal(quantity(undefined, 1), 1);
  assert.equal(templates('{{Item_Infobox|Type=Materials}}')[0].name, 'item infobox');
  assert.ok(catalogs[2].items.some(i => i.name === 'Fireball III'), 'Underscore template spellings must not drop real items');
});
test('alternative recipes remain separate and do not invent acquisition quantities', () => {
  const dragon = catalogs[0];
  const thread = dragon.recipes.filter(r => r.outputs.some(i => i.name === 'Coarse Thread'));
  assert.deepEqual(thread.map(r => r.inputs), [[{ name: 'Flax', quantity: 1 }], [{ name: 'Coarse Animal Fur', quantity: 3 }]]);
  assert.ok(thread.every(r => r.station === 'Spinning Wheel' && r.outputs[0].quantity === 1));
  const en = catalogs[2].recipes.filter(r => r.outputs.some(i => i.name === 'Linen'));
  assert.deepEqual(en.map(r => [r.station, r.inputs[0].quantity, r.outputs[0].quantity]), [['Hand Spindle', 2, 1], ['Spinning Wheel', 1, 1], ['Spinning Machine', 10, 15]]);
  const gold = catalogs[1].items.find(i => i.name === 'Bloodgold');
  assert.ok(gold);
  assert.equal(gold.acquisition, '');
  assert.ok(!catalogs[1].recipes.some(r => r.outputs.some(i => i.itemId === gold.id)), 'Missing processing conversion is not fabricated from the user example');
});
test('source links reject local schemes, lookalike hosts and credentials', () => {
  for (const url of ['file:///C:/Windows', 'javascript:alert(1)', 'https://enshrouded.wiki.gg.evil.com/wiki/Flax', 'https://user@enshrouded.wiki.gg/wiki/Flax', 'https://github.com/other/project', 'https://enshrouded.wiki.gg:8443/wiki/Flax']) assert.throws(() => sourceUrl(url));
});
