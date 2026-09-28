// Live public-release verification. Uses a separate workspace and updater cache;
// simulates an older updater version without installing over a user's app.
const { _electron: electron } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const targetVersion=require('../package.json').version;
const profile = path.join(root, 'test-results', `updates-profile-${Date.now()}`);
const env = { ...process.env, BANCYCRAFT_TEST_DATA: profile }; delete env.ELECTRON_RUN_AS_NODE;
(async () => {
  fs.mkdirSync(profile, { recursive: true });
  const app = await electron.launch({ executablePath: process.argv[2] || path.join(root, 'release/win-unpacked/BancyCraft.exe'), args: [], env });
  const page = await app.firstWindow();
  try {
    await page.getByRole('heading', { name: 'Your next build starts here.' }).waitFor();
    await page.getByRole('button', { name: 'Settings & updates', exact: true }).click();
    await app.evaluate(({ app }) => {
      const load = process.mainModule.require.bind(process.mainModule);
      const fs = load('node:fs'), path = load('node:path');
      const updater = load('electron-updater').autoUpdater;
      const config = fs.readFileSync(path.join(process.resourcesPath, 'app-update.yml'), 'utf8');
      if (!config.includes('publisherName:')) throw new Error('Packaged signature verification is not configured.');
      const testConfig = path.join(app.getPath('userData'), 'test-update.yml');
      fs.writeFileSync(testConfig, config.replace(/updaterCacheDirName:.*/, 'updaterCacheDirName: bancycraft-test-' + Date.now()));
      updater.updateConfigPath = testConfig;
      updater.disableDifferentialDownload = true;
      global.bancySignatureChecks = 0;
      const verify = updater.verifyUpdateCodeSignature;
      updater.verifyUpdateCodeSignature = async (...args) => { global.bancySignatureChecks++; return verify(...args); };
    });
    console.log('Checking installed version against the public release…');
    await page.getByRole('button', { name: 'Check for updates', exact: true }).click();
    await page.getByLabel('Update status', { exact: true }).filter({ hasText: 'You have the latest BancyCraft release.' }).waitFor({ timeout: 60000 });
    assert.equal((await page.evaluate(() => window.bancy.info())).update.state, 'current');
    console.log('Current-version check passed; simulating version 0.3.0…');
    await app.evaluate(() => { const load = process.mainModule.require.bind(process.mainModule); load('electron-updater').autoUpdater.currentVersion = new (load('semver').SemVer)('0.3.0'); });
    await page.getByRole('button', { name: 'Check for updates', exact: true }).click();
    await page.getByRole('button', { name: 'Download update '+targetVersion, exact: true }).waitFor({ timeout: 60000 });
    console.log('Release found; downloading and verifying the real installer…');
    await page.getByRole('button', { name: 'Download update '+targetVersion, exact: true }).click();
    await page.getByRole('button', { name: 'Restart & install', exact: true }).waitFor({ timeout: 180000 });
    assert.equal(await app.evaluate(() => global.bancySignatureChecks), 1, 'Actual downloaded installer must pass the embedded-key verifier');
    await page.screenshot({ path: path.join(root, 'test-results/updates-ready.png') });
    console.log(JSON.stringify({ result: 'PASS', profile, checks: ['anonymous current-version check', 'older-version release discovery', 'public installer download', 'embedded-key signature verifier invoked', 'restart/install offered'], installationPerformed: false }, null, 2));
  } catch (error) {
    console.error(JSON.stringify(await page.evaluate(() => window.bancy.info())));
    await page.screenshot({ path: path.join(root, 'test-results/updates-failure.png') });
    throw error;
  } finally { await app.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
