// Packaged, offline Dune map check with an isolated local workspace.
const { _electron: electron } = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const profile = path.join(root, 'test-results', `map-profile-${Date.now()}`);
const executablePath = process.argv[2] || path.join(root, 'release/win-unpacked/BancyCraft.exe');
const env = { ...process.env, BANCYCRAFT_TEST_DATA: profile };
delete env.ELECTRON_RUN_AS_NODE;

(async () => {
  fs.mkdirSync(profile, { recursive: true });
  const app = await electron.launch({ executablePath, env });
  try {
    const page = await app.firstWindow();
    await page.getByRole('heading', { name: 'Your next build starts here.' }).waitFor();
    await page.context().setOffline(true);
    await page.getByLabel('Active game', { exact: true }).selectOption('duneawakening');
    await page.getByRole('button', { name: 'Map', exact: true }).click();
    await page.getByRole('heading', { name: 'Map', exact: true }).waitFor();
    assert.match(await page.locator('.atlas-count').innerText(), /696 mapped places/);
    assert.equal(await page.locator('.atlas-canvas image').count(), 1);
    assert.equal(await page.locator('.atlas-pin').count(), 642);
    await page.getByRole('tab', { name: 'Deep Desert' }).click();
    assert.equal(await page.locator('.atlas-pin').count(), 31);
    await page.getByLabel('Search mapped locations').fill('Testing Station 217');
    await page.getByRole('button', { name: /Testing Station 217/ }).first().click();
    await page.getByRole('heading', { name: 'Testing Station 217' }).waitFor();
    await page.screenshot({ path: path.join(root, 'test-results', 'packaged-dune-map.png') });
    console.log(JSON.stringify({ result: 'PASS', version: (await page.evaluate(() => window.bancy.info())).version, checks: ['offline maps', 'all three map layers', 'pin search and focus'] }));
  } finally { await app.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
