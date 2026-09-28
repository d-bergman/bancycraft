const { _electron: electron } = require('@playwright/test'), fs = require('fs'), path = require('path'), assert = require('assert/strict'), { randomUUID } = require('crypto');
const root = path.resolve(__dirname, '..'), profile = path.join(root, 'test-results', 'features-060-' + Date.now()), dev = process.argv.includes('--dev'), exe = dev ? require('electron') : path.join(root, 'release/win-unpacked/BancyCraft.exe');
(async () => { fs.mkdirSync(profile, { recursive: true }); const catalog = require('../src/catalog/data/dragonwilds.json'), vis = catalog.items.find(i => i.name === 'Vis Cloth'), mace = catalog.items.find(i => i.name === 'Mithril Mace'); const list = { id: randomUUID(), name: 'Recipe tree test', game: 'dragonwilds', quick: false, targets: [{ itemId: vis.id, name: vis.name, quantity: 5 }, { itemId: mace.id, name: mace.name, quantity: 1 }], recipes: {}, progress: {}, collapsed: {}, useSupplies: false, hideCompleted: false, updatedAt: new Date().toISOString() }; fs.writeFileSync(path.join(profile, 'workspace.json'), JSON.stringify({ schemaVersion: 2, game: 'dragonwilds', plans: [], supplies: [], lists: [list] })); const env = { ...process.env, BANCYCRAFT_TEST_DATA: profile }; delete env.ELECTRON_RUN_AS_NODE; const app = await electron.launch({ executablePath: exe, args: dev ? [root] : [], env }); try {
    const page = await app.firstWindow();
    await page.getByRole('button', { name: 'Shopping Lists', exact: true }).waitFor();
    await page.context().setOffline(true);
    await page.getByRole('button', { name: 'Shopping Lists', exact: true }).click();
    await page.getByRole('button', { name: /Recipe tree test/ }).click();
    const before = await page.evaluate(() => window.bancy.load());
    await page.getByRole('button', { name: 'Crafting tree for Vis Cloth', exact: true }).click();
    let tree = page.getByRole('dialog', { name: 'Crafting tree · Vis Cloth', exact: true });
    await tree.waitFor();
    await tree.getByRole('region', { name: 'Selected tree item', exact: true }).getByText(/Loom/).first().waitFor();
    assert(await tree.locator('.tree-node').count() > 1);
    await tree.getByLabel('Crafting tree quantity').fill('2');
    await tree.getByRole('button', { name: /Vis Cloth: 2 needed/ }).waitFor();
    await page.screenshot({ path: path.join(root, 'test-results/tree-vis-cloth.png') });
    await page.keyboard.press('Escape');
    assert.deepEqual(await page.evaluate(() => window.bancy.load()), before, 'Viewing or changing tree quantity must not save list progress');
    await page.getByRole('button', { name: 'Crafting tree for Mithril Mace', exact: true }).click();
    tree = page.getByRole('dialog', { name: 'Crafting tree · Mithril Mace', exact: true });
    await tree.waitFor();
    await page.screenshot({ path: path.join(root, 'test-results/tree-mithril-mace.png') });
    await page.setViewportSize({ width: 1050, height: 820 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: path.join(root, 'test-results/tree-compact.png') });
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Settings & updates', exact: true }).click();
    await page.getByRole('region', { name: 'Changelog', exact: true }).waitFor();
    await page.getByRole('heading', { name: 'Version 0.6.0', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Changelog page 3', exact: true }).click();
    await page.getByRole('heading', { name: 'Version 0.1.0', exact: true }).waitFor();
    assert.equal(await page.getByRole('heading', { name: 'Version 0.6.0', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Changelog page 1', exact: true }).click();
    await page.getByRole('region', { name: 'Changelog', exact: true }).screenshot({ path: path.join(root, 'test-results/changelog-settings.png') });
    await page.getByLabel('Active game', { exact: true }).selectOption('vrising');
    await page.getByRole('button', { name: 'Item Browser', exact: true }).click();
    await page.getByLabel('Search items', { exact: true }).fill('Iron Ingot');
    await page.getByRole('button', { name: 'View Iron Ingot', exact: true }).click();
    await page.getByLabel('Item details', { exact: true }).getByText(/Furnace/).first().waitFor();
    await page.getByRole('button', { name: 'Close Iron Ingot', exact: true }).click();
    await page.getByRole('button', { name: 'Gearsets', exact: true }).click();
    await page.getByRole('heading', { name: 'Dread Plate Armour Set', exact: true }).waitFor();
    assert(await page.locator('.gearset-card').count() >= 25);
    await page.getByRole('button', { name: 'Home', exact: true }).click();
    assert.equal(await page.locator('.game-card.planned').count(), 1);
    assert.equal((await page.evaluate(() => window.bancy.load())).game, 'vrising');
    console.log('FEATURES_060_OK: offline read-only crafting trees, stations and quantity changes, compact layout, all changelog pages including first release, V Rising catalog/sets and persisted selection.');
}
catch (e) {
    const page = await app.firstWindow();
    await page.screenshot({ path: path.join(root, 'test-results/features-060-failure.png') }).catch(() => { });
    throw e;
}
finally {
    await app.close();
} })().catch(e => { console.error(e); process.exitCode = 1; });
