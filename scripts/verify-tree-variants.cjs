// Isolated desktop regression check. It never reads the user's app workspace.
const { _electron: electron } = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const profile = path.join(root, 'test-results', `tree-variants-${Date.now()}`);
const games = ['dragonwilds', 'valheim', 'enshrouded', 'grounded2', 'vrising', 'duneawakening'];

(async () => {
  fs.mkdirSync(path.dirname(profile), { recursive: true });
  const env = { ...process.env, BANCYCRAFT_TEST_DATA: profile };
  delete env.ELECTRON_RUN_AS_NODE;
  const application = await electron.launch({ executablePath: require('electron'), args: [root], env });
  try {
    const page = await application.firstWindow();
    await page.getByRole('heading', { name: 'Your next build starts here.' }).waitFor();
    if (env.BANCYCRAFT_DEV_URL) await page.getByText('Dev mode', { exact: true }).waitFor();
    const lists = games.map(game => {
      const catalog = require(path.join(root, 'src', 'catalog', 'data', `${game}.json`));
      const output = game === 'dragonwilds'
        ? catalog.items.find(item => item.name === 'Rune Platebody')
        : catalog.items.find(item => catalog.recipes.some(recipe => recipe.outputs.some(row => row.itemId === item.id) && recipe.inputs.length));
      assert(output, `${game} has a recipe target`);
      return { id: `tree-${game}`, name: `Tree ${game}`, game, quick: false, targets: [{ itemId: output.id, name: output.name, quantity: 1 }], recipes: {}, progress: {}, collapsed: {}, useSupplies: false, hideCompleted: false, updatedAt: new Date().toISOString() };
    });
    await page.evaluate(async lists => {
      const data = await window.bancy.load();
      await window.bancy.save({ ...data, lists });
    }, lists);
    await page.reload();
    await page.getByRole('heading', { name: 'Your next build starts here.' }).waitFor();
    for (const game of games) {
      await page.getByLabel('Active game', { exact: true }).selectOption(game);
      await page.getByRole('button', { name: 'Shopping Lists', exact: true }).click();
      await page.locator('.saved-list-open').filter({ hasText: `Tree ${game}` }).click();
      const target = lists.find(list => list.game === game).targets[0];
      await page.getByRole('button', { name: `Crafting tree for ${target.name}`, exact: true }).click();
      const view = page.locator('.tree-scroll');
      await view.waitFor();
      await page.waitForTimeout(100);
      const centered = await page.evaluate(() => {
        const view = document.querySelector('.tree-scroll').getBoundingClientRect();
        const root = document.querySelector('.tree-node').getBoundingClientRect();
        return Math.abs((root.left + root.right) / 2 - (view.left + view.right) / 2);
      });
      assert(centered < 12, `${game} tree root should be centered, offset ${centered}px`);
      if (game === 'dragonwilds') {
        const zoomBefore = await page.locator('.tree-zoom span').innerText();
        const zoomBounds = await view.boundingBox();
        await page.mouse.move(zoomBounds.x + zoomBounds.width / 2, zoomBounds.y + 35);
        await page.mouse.wheel(0, -120);
        await page.waitForFunction(before => document.querySelector('.tree-zoom span')?.textContent !== before, zoomBefore);
        assert.notEqual(await page.locator('.tree-zoom span').innerText(), zoomBefore, 'wheel zoom changes scale');
        const before = await view.evaluate(el => el.scrollLeft);
        const bounds = await view.boundingBox();
        await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + 25);
        await page.mouse.down();
        await page.mouse.move(bounds.x + bounds.width / 2 - 120, bounds.y + 25, { steps: 6 });
        await page.mouse.up();
        const after = await view.evaluate(el => el.scrollLeft);
        assert(after > before + 80, `drag should pan crafting tree (${before} -> ${after})`);
      }
      await page.getByRole('button', { name: /^Close Crafting tree/ }).click();
      await page.getByRole('button', { name: '← All lists' }).click();
    }
    const valheim = require(path.join(root, 'src', 'catalog', 'data', 'valheim.json'));
    const [shared, melee, ranged, magic] = valheim.items.filter(item => /weapon|armor|armour|shoulder|helmet|shield/i.test(item.category)).slice(0, 4);
    assert(shared && melee && ranged && magic);
    const food = valheim.items.find(item => item.name === 'Carrot Soup');
    const potion = valheim.items.find(item => item.name === 'Frost Resistance Mead');
    assert(food && potion);
    const makeItem = item => ({ slot: 'Extra 1', itemId: item.id, name: item.name, quantity: 1 });
    const variants = [
      { id: 'main', name: 'Melee', items: [makeItem(shared), makeItem(melee)], skills: '', extraSlotCount: 2, imageType: 'warrior' },
      { id: 'ranged', name: 'Ranged', items: [makeItem(shared), makeItem(ranged), { ...makeItem(food), slot: 'Food 1' }], skills: '', extraSlotCount: 2, imageType: 'range' },
      { id: 'magic', name: 'Magic', items: [makeItem(shared), makeItem(magic), { ...makeItem(potion), slot: 'Extra 2' }], skills: '', extraSlotCount: 2, imageType: 'mage' }
    ];
    await page.evaluate(async variants => {
      const tools = await window.bancy.toolsLoad();
      await window.bancy.toolsSave({ ...tools, builds: [{ id: 'variant-check', name: 'Loadouts', game: 'valheim', tags: [], description: '', skills: '', items: variants[0].items, variants, activeVariantId: 'main', imageType: 'warrior', updatedAt: new Date().toISOString() }] });
    }, variants);
    await page.getByLabel('Active game', { exact: true }).selectOption('valheim');
    await page.getByRole('button', { name: 'Builds', exact: true }).click();
    await page.reload();
    await page.getByRole('button', { name: 'Builds', exact: true }).click();
    await page.locator('.build-card-open').filter({ hasText: 'Loadouts' }).click();
    await page.getByRole('button', { name: 'Create equipment shopping list' }).click();
    assert(await page.getByRole('checkbox', { name: /Melee/ }).isChecked(), 'active variant is selected initially');
    await page.getByRole('checkbox', { name: /Melee/ }).uncheck();
    await page.getByRole('checkbox', { name: /Ranged/ }).check();
    await page.getByRole('checkbox', { name: /Magic/ }).check();
    await page.getByRole('button', { name: 'Create shopping list', exact: true }).click();
    await page.getByRole('button', { name: 'New list' }).click();
    await page.getByRole('textbox', { name: 'List name' }).fill('Ranged and magic supplies');
    await page.getByRole('button', { name: 'Create & add items' }).click();
    await page.waitForFunction(() => !document.querySelector('[aria-label="Pick a list"]'));
    const saved = await page.evaluate(() => window.bancy.load());
    const targets = saved.lists.find(list => list.name === 'Ranged and magic supplies')?.targets;
    assert.deepEqual(targets.map(item => item.itemId).sort(), [shared.id, ranged.id, magic.id].sort());
    console.log('Six crafting trees open centered; wheel zoom and drag panning work; selected variants exclude food and potions.');
  } finally {
    await application.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
