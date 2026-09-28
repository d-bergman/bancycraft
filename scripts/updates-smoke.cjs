// Live public-release verification. Uses a separate workspace and updater cache;
// simulates an older updater version without installing over a user's app.
const { _electron: electron } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const profile = path.join(root, 'test-results', `updates-profile-${Date.now()}`);
const env = { ...process.env, BANCYCRAFT_TEST_DATA: profile }; delete env.ELECTRON_RUN_AS_NODE;
(async () => {
  fs.mkdirSync(profile, { recursive: true });
  const app = await electron.launch({ executablePath: process.argv[2] || path.join(root, 'release/win-unpacked/BancyCraft.exe'), args: [], env });
  try {
    const page = await app.firstWindow();
    await page.getByRole('button', { name: 'Settings & updates', exact: true }).click();
    await app.evaluate(({ app }) => {
      const fs = require('node:fs'), path = require('node:path');
      const updater = require('electron-updater').autoUpdater;
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
    await page.getByRole('button', { name: 'Check for updates', exact: true }).click();
    await page.waitForFunction(async () => (await window.bancy.info()).update.state === 'current', null, { timeout: 60000 });
    await app.evaluate(() => { require('electron-updater').autoUpdater.currentVersion = new (require('semver').SemVer)('0.2.0'); });
    await page.getByRole('button', { name: 'Check for updates', exact: true }).click();
    await page.getByRole('button', { name: 'Download update 0.3.0', exact: true }).waitFor({ timeout: 60000 });
    await page.getByRole('button', { name: 'Download update 0.3.0', exact: true }).click();
    await page.getByRole('button', { name: 'Restart & install', exact: true }).waitFor({ timeout: 180000 });
    assert.equal(await app.evaluate(() => global.bancySignatureChecks), 1, 'Actual downloaded installer must pass the embedded-key verifier');
    await page.screenshot({ path: path.join(root, 'test-results/updates-ready.png') });
    console.log(JSON.stringify({ result: 'PASS', profile, checks: ['anonymous current-version check', 'older-version release discovery', 'public installer download', 'embedded-key signature verifier invoked', 'restart/install offered'], installationPerformed: false }, null, 2));
  } finally { await app.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
