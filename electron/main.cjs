const { app, BrowserWindow, ipcMain, shell, dialog, Menu, safeStorage, clipboard } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const {createToolsStore,validateTools,cleanBuild}=require('./tools-store.cjs');
const {createBuilds}=require('./builds.cjs');
const {validate}=require('./store.cjs');
const { createStore } = require('./store.cjs');
const { sourceUrl } = require('./source-links.cjs');
const { configureUpdater, startAutomaticChecks } = require('./updates.cjs');
const { createAccess } = require('./access.cjs');
const { createAccount } = require('./account.cjs');
const { createShared } = require('./shared.cjs');
const { createCommunity } = require('./community.cjs');
app.setName('BancyCraft');
app.setAppUserModelId('gg.bancy.bancycraft');
// Stable across installer versions; deliberately outside the installation folder.
app.setPath('userData', process.env.BANCYCRAFT_TEST_DATA || path.join(app.getPath('appData'), 'BancyCraft'));
const locked = app.requestSingleInstanceLock();
let window;
let store;
let updater;
let access,community,account,collaboration,controllerAccess,servers;
let update = { state: 'manual', message: 'Updates are installed using a newer BancyCraft installer. Your workspace stays in place.' };
// Only the explicit loopback preview may replace the bundled renderer in development.
const livePreview = !app.isPackaged && process.env.BANCYCRAFT_DEV_URL === 'http://127.0.0.1:5173/';
const rendererUrl = livePreview ? process.env.BANCYCRAFT_DEV_URL : pathToFileURL(path.join(__dirname, '../app-dist/index.html')).href;
function trusted(event) {
  if (!window || event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame || event.senderFrame.url !== rendererUrl) throw new Error('Untrusted request.');
}
function handle(name, callback) { ipcMain.handle(name, (event, ...args) => { trusted(event); return callback(...args); }); }
function status(state, message, extra = {}) {
  update = { state, message, ...extra };
  if (window && !window.isDestroyed()) window.webContents.send('update:status', update);
}
function setupUpdates() {
  if (!app.isPackaged) { status('idle', 'Check the published release. Download and installation require the installed Windows app.'); return; }
  updater = configureUpdater(require('electron-updater').autoUpdater, status);
}
async function checkUpdates() {
  if (updater) await updater.check();
  else {
    status('checking', 'Checking GitHub Releases…');
    try { const response = await fetch('https://api.github.com/repos/d-bergman/bancycraft/releases/latest', { signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'BancyCraft' } }); if (!response.ok) throw new Error(); const release = await response.json(); const latest = release.tag_name.replace(/^v/, ''); status('current', 'Latest published release: '+latest+'. Install the Windows app to download updates here.', { version: latest }); }
    catch { status('error', 'Unable to check for updates. Check your connection or try again later.'); }
  }
  return update;
}
async function createWindow() {
  window = new BrowserWindow({ width: 1480, height: 980, minWidth: 1050, minHeight: 740, backgroundColor: '#061016', title: 'BancyCraft', autoHideMenuBar: true,
    icon: path.join(__dirname, '../build/icon.ico'),
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true } });
  Menu.setApplicationMenu(null);
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, url) => { if (url !== rendererUrl) event.preventDefault(); });
  window.webContents.on('will-attach-webview', event => event.preventDefault());
  window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  await window.loadURL(rendererUrl);
}
if (!locked) app.quit();
else {
  app.on('second-instance', () => { if (window) { if (window.isMinimized()) window.restore(); window.focus(); } });
  app.whenReady().then(async () => {
    store = createStore(app.getPath('userData'));
    const toolsStore=createToolsStore(app.getPath('userData'));
    handle('tools:read',()=>toolsStore.read());handle('tools:write',v=>toolsStore.write(v));
    access=createAccess(app.getPath('userData'),safeStorage,fs.readFileSync(path.join(__dirname,'access-public.pem'),'utf8'));
    community=createCommunity(access);
    account=createAccount(app.getPath('userData'),safeStorage,url=>shell.openExternal(url));
    controllerAccess=createAccess(app.getPath('userData'),safeStorage,fs.readFileSync(path.join(__dirname,'access-public.pem'),'utf8'),{scope:'bancy-controller',file:'controller-key.bin'});
    servers=require('./servers.cjs').createServers(account,access,controllerAccess);
    const vault=require('./key-vault.cjs').createKeyVault(app.getPath('userData'),safeStorage,account,clipboard);
    const feedback=require('./feedback.cjs').createFeedback();
    handle('admin:keys',()=>vault.status());handle('admin:copy-key',id=>vault.copy(id));
    handle('feedback:send',v=>feedback.send({...v,version:app.getVersion()}));
    handle('controller:unlock',key=>servers.unlock(key));handle('controller:lock',()=>servers.lock());handle('servers:snapshot',()=>servers.snapshot());handle('servers:action',(id,action)=>servers.action(id,action));
    handle('clipboard:copy',value=>{if(typeof value!=='string'||value.length>500)throw Error('Invalid text to copy.');clipboard.writeText(value);return true;});
    const builds=createBuilds(account);
    handle('builds:browse',g=>builds.browse(g));handle('builds:get',id=>builds.get(id));handle('builds:publish',b=>builds.publish(b));handle('builds:remove',id=>builds.remove(id));handle('profile:avatar',uid=>builds.avatar(uid));
    const cleanList=v=>validate({schemaVersion:2,game:v?.game,plans:[],supplies:[],lists:[v]}).lists[0];
    async function exportJson(value,name){const r=await dialog.showSaveDialog(window,{defaultPath:name,filters:[{name:'BancyCraft JSON',extensions:['json']}]});if(r.canceled||!r.filePath)return false;fs.writeFileSync(r.filePath,JSON.stringify(value,null,2));return true;}
    async function importJson(){const r=await dialog.showOpenDialog(window,{properties:['openFile'],filters:[{name:'BancyCraft JSON',extensions:['json']}]});if(r.canceled)return null;const file=r.filePaths[0];if(fs.statSync(file).size>12000000)throw Error('This file is too large.');return JSON.parse(fs.readFileSync(file,'utf8'));}
    handle('list:export',v=>exportJson({kind:'BancyCraft-list',list:cleanList(v)},'BancyCraft-list.json'));
    handle('build:export',v=>{const build=cleanBuild(v),title=build.name.normalize('NFKD').replace(/[<>:"/\\|?*\x00-\x1f]/g,'').replace(/[. ]+$/,'').trim().slice(0,90)||'Build';return exportJson({kind:'BancyCraft-build',build},`BancyCraft-${title}.json`);});
    handle('list:import',async()=>{const v=await importJson();return v?{...cleanList(v.list),id:require('node:crypto').randomUUID(),quick:false}:null;});
    handle('build:import',async()=>{const v=await importJson();return v?{...cleanBuild(v.build),id:require('node:crypto').randomUUID(),owner:undefined,publishedAt:undefined}:null;});
    handle('workspace:import',async()=>{const v=await importJson();if(!v)return null;const w=validate(v.workspace||v),t=v.tools?validateTools(v.tools):null;
      const r=await dialog.showMessageBox(window,{type:'question',buttons:['Cancel','Restore backup'],defaultId:0,cancelId:0,message:'Replace your local workspace with this backup?',detail:'Your current workspace and builds will be backed up first. Shared online lists are unaffected.'});if(r.response!==1)return null;
      for(const file of [store.file,toolsStore.file])if(fs.existsSync(file))fs.copyFileSync(file,file+'.before-restore.bak');
      const old=store.read(),oldTools=toolsStore.read();try{if(t)toolsStore.write(t);return store.write(w);}catch(e){toolsStore.write(oldTools);store.write(old);throw e;}
    });
    let previousBounds;
    handle('gaming:mode',enable=>{if(typeof enable!=='boolean')throw Error('Invalid view.');window.setAlwaysOnTop(enable);if(enable){previousBounds=window.getBounds();window.setMinimumSize(440,480);window.setSize(500,760);}else{window.setMinimumSize(1050,740);if(previousBounds)window.setBounds(previousBounds);}});
    collaboration=createShared(account,data=>{if(window&&!window.isDestroyed())window.webContents.send('shared:status',data);});
    handle('account:connect',()=>account.connect()); handle('account:disconnect',()=>account.disconnect());
    handle('shared:status',()=>collaboration.status()); handle('shared:watch',id=>collaboration.watch(id));
    handle('shared:create',id=>{const list=store.read().lists.find(l=>l.id===id);if(!list)throw Error('Local list not found.');return collaboration.create(list);});
    handle('shared:change',(id,base,next)=>collaboration.change(id,base,next));
    handle('shared:search',text=>collaboration.search(text)); handle('shared:add',(id,uid)=>collaboration.add(id,uid));
    handle('shared:removeMember',(id,uid)=>collaboration.removeMember(id,uid)); handle('shared:remove',id=>collaboration.remove(id));handle('shared:restore',id=>collaboration.restoreRemoved(id));
    app.once('will-quit',()=>{collaboration.close();account.close();});
    const timer=setInterval(()=>{if(!access.status().unlocked)community.close();},15000);timer.unref();
    handle('app:info', () => ({ version: app.getVersion(), dataPath: app.getPath('userData'), packaged: app.isPackaged, devMode:!!process.env.BANCYCRAFT_DEV_URL, update, access:access.status(),controllerAccess:servers.status() }));
    handle('community:unlock', key=>access.unlock(key));
    handle('community:lock', async()=>{const result=access.lock();await community.lock();return result;});
    handle('community:bank', order=>{access.require();if(store.read().game!=='dragonwilds')throw new Error('Select Dragonwilds to open its shared bank.');if(order!==undefined&&(!order||!Number.isSafeInteger(order.amount)||order.amount<1||order.amount>1e12||typeof order.note!=='string'||!order.note.trim()||order.note.length>160))throw new Error('Invalid merchant requisition.');return community.bank(order);});
    handle('workspace:read', () => store.read());
    handle('workspace:write', data => {const saved=store.write(data);if(saved.game!=='dragonwilds')community.close();return saved;});
    handle('source:open', url => shell.openExternal(sourceUrl(url)));
    handle('website:open', () => shell.openExternal('https://bancy.gg/'));
    handle('donation:open', async () => {
      const value = require('./donation-link.json').url;
      if (!value) return false;
      const url = new URL(value);
      const paypalMe = url.hostname === 'paypal.me' && /^\/[A-Za-z0-9]{1,20}\/?$/.test(url.pathname);
      const paypalDonate = ['paypal.com', 'www.paypal.com'].includes(url.hostname) && (url.pathname === '/donate' || url.pathname.startsWith('/donate/'));
      if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash || (!paypalMe && !paypalDonate)) throw new Error('The PayPal donation link is invalid.');
      await shell.openExternal(url.href);
      return true;
    });
    handle('data:open', () => shell.openPath(app.getPath('userData')));
    handle('workspace:export', async () => {
      const data = {kind:"BancyCraft-backup",workspace:store.read(),tools:toolsStore.read()};
      const result = await dialog.showSaveDialog(window, { title: 'Back up your BancyCraft workspace', defaultPath: `BancyCraft-workspace-${new Date().toISOString().slice(0, 10)}.json`, filters: [{ name: 'JSON workspace', extensions: ['json'] }] });
      if (result.canceled || !result.filePath) return false;
      fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2));
      return true;
    });
    handle('update:check', checkUpdates);
    handle('update:download', async () => { if (updater) await updater.download(); return update; });
    handle('update:install', () => { if (updater && update.state === 'ready') { try { for(const file of [store.file,toolsStore.file])if(fs.existsSync(file))fs.copyFileSync(file,file+'.before-update.bak'); updater.install(); } catch { status('error', 'Your workspace backup could not be saved. The update has not been installed.'); } } });
    setupUpdates();
    await createWindow();
    void account.restore().then(()=>collaboration.reconnect()).catch(()=>{});
    if (updater) app.once('will-quit', startAutomaticChecks(updater));
  }).catch(error => {if(process.env.BANCYCRAFT_TEST_DATA){fs.writeFileSync(path.join(app.getPath('userData'),'startup-error.txt'),String(error.stack||error));console.error(error);app.exit(1);return;} dialog.showErrorBox('BancyCraft could not start', error.message); app.quit(); });
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  app.on('window-all-closed', () => app.quit());
}
