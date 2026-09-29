// Packaged startup scheduling and real native/renderer update flow, with an isolated
// profile and controlled updater transport. Never installs over the user's app.
const { _electron: electron } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const profile = path.join(root, 'test-results', `notification-profile-${Date.now()}`);
const env = { ...process.env, BANCYCRAFT_TEST_DATA: profile }; delete env.ELECTRON_RUN_AS_NODE;
(async () => {
  fs.mkdirSync(profile, { recursive: true });
  const app = await electron.launch({ executablePath: process.argv[2] || path.join(root, 'release/win-unpacked/BancyCraft.exe'), args: [], env });
  const page = await app.firstWindow();
  const errors=[]; page.on('pageerror', error=>errors.push(error.message));
  try {
    await app.evaluate(() => {
      const updater = process.mainModule.require('electron-updater').autoUpdater;
      global.notificationChecks=0;global.notificationDownloads=0;global.notificationInstalls=0;
      updater.checkForUpdates=async()=>{global.notificationChecks++;updater.emit('checking-for-update');updater.emit('update-available',{version:'9.9.9'});};
      updater.downloadUpdate=async()=>{global.notificationDownloads++;updater.emit('download-progress',{percent:37});await new Promise(resolve=>global.finishNotificationDownload=resolve);};
      updater.quitAndInstall=(silent,restart)=>{if(!silent||!restart)throw Error('Incorrect installation arguments');global.notificationInstalls++;};
    });
    const workspace = await page.evaluate(async()=>{const data=await window.bancy.load();data.plans.push({id:'update-preservation',name:'Preserve this plan',game:'dragonwilds',quantity:7,notes:'Update test',status:'planned',updatedAt:new Date().toISOString()});return window.bancy.save(data);});
    // Trigger the already-scheduled startup check through its configured controller in the native process.
    // Electron startup may complete before Playwright attaches, so install the test transport first.
    const startupChecks=await app.evaluate(()=>global.notificationChecks);
    if(!startupChecks) await page.evaluate(()=>window.bancy.checkUpdate());
    const popup=page.getByLabel('BancyCraft update notification',{exact:true});
    await popup.getByText('New version available',{exact:true}).waitFor({timeout:30000});
    assert.equal(await app.evaluate(()=>global.notificationChecks),1,'Configured updater reaches the renderer');
    assert.equal(await app.evaluate(()=>global.notificationDownloads),0,'Automatic checks do not download');
    assert.equal(await app.evaluate(()=>global.notificationInstalls),0);
    await page.screenshot({path:path.join(root,'test-results/update-notification-desktop.png')});
    await page.getByRole('button',{name:'Settings & updates',exact:true}).click();await page.getByRole('button',{name:'Download update 9.9.9',exact:true}).waitFor();assert.equal(await popup.count(),0,'Settings hides redundant corner notice');assert.equal(await app.evaluate(()=>global.notificationChecks),2,'Settings entry checks automatically');await page.getByRole('button',{name:'Home',exact:true}).click();await popup.waitFor();
    await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1050,740));
    const bounds=await popup.boundingBox();const dimensions=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));
    assert(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=dimensions.width&&bounds.y+bounds.height<=dimensions.height);
    await page.screenshot({path:path.join(root,'test-results/update-notification-compact.png')});
    await popup.getByRole('button',{name:'Download & prepare update',exact:true}).click();
    await popup.getByRole('progressbar',{name:'Notification download progress'}).waitFor();
    assert.equal(await popup.getByRole('progressbar').getAttribute('value'),'37');
    assert.equal(await popup.getByRole('button',{name:'Downloading · 37%',exact:true}).isDisabled(),true);
    await page.evaluate(()=>window.bancy.checkUpdate());
    assert.equal(await app.evaluate(()=>global.notificationChecks),2,'Checks cannot interrupt a download');
    await app.evaluate(()=>{process.mainModule.require('electron-updater').autoUpdater.emit('update-downloaded');global.finishNotificationDownload();});
    await popup.getByText('Update ready to install',{exact:true}).waitFor();
    assert.equal(await app.evaluate(()=>global.notificationInstalls),0,'Verification does not restart automatically');
    await page.screenshot({path:path.join(root,'test-results/update-notification-ready.png')});
    await popup.getByRole('button',{name:'Restart & install update',exact:true}).click();
    assert.equal(await app.evaluate(()=>global.notificationInstalls),1);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(profile,'workspace.json.before-update.bak'),'utf8')),workspace);
    await popup.getByRole('button',{name:'Dismiss update notification',exact:true}).click();
    await popup.waitFor({state:'hidden'});
    await app.evaluate(()=>process.mainModule.require('electron-updater').autoUpdater.emit('update-available',{version:'9.9.9'}));
    assert.equal(await popup.count(),0,'Dismissed version stays hidden for the session');
    await app.evaluate(()=>process.mainModule.require('electron-updater').autoUpdater.emit('update-available',{version:'9.9.10'}));
    await popup.getByText('BancyCraft 9.9.10',{exact:true}).waitFor();
    await popup.getByRole('button',{name:'Dismiss update notification',exact:true}).click();
    await page.getByRole('button',{name:'Settings & updates',exact:true}).click();
    await page.getByRole('button',{name:'Download update 9.9.10',exact:true}).waitFor();assert.equal(await popup.count(),0,'Settings suppresses a redundant corner notification');assert.equal(await app.evaluate(()=>global.notificationChecks),2,'Settings entry checks automatically');
    assert.deepEqual(await page.evaluate(()=>window.bancy.load()),workspace);
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({result:'PASS',checks:['native update detection and notification','no automatic download or restart','corner popup at desktop and minimum size','download progress','ready notification','explicit install IPC with workspace backup','dismissal per version','Settings fallback'],installationPerformed:false},null,2));
  } catch(error) {await page.screenshot({path:path.join(root,'test-results/update-notification-failure.png')}).catch(()=>{});throw error;}
  finally {await app.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
