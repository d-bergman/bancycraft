const { app, BrowserWindow, ipcMain, shell, dialog, Menu, safeStorage } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
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
let access,community,account,collaboration;
let update = { state: 'manual', message: 'Updates are installed using a newer BancyCraft installer. Your workspace stays in place.' };
const rendererUrl = pathToFileURL(path.join(__dirname, '../dist/index.html')).href;
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
    icon: path.join(__dirname, '../dist/assets/app-icon.png'),
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
    access=createAccess(app.getPath('userData'),safeStorage,fs.readFileSync(path.join(__dirname,'access-public.pem'),'utf8'));
    community=createCommunity(access);
    account=createAccount(app.getPath('userData'),safeStorage,url=>shell.openExternal(url));
    collaboration=createShared(account,data=>{if(window&&!window.isDestroyed())window.webContents.send('shared:status',data);});
    handle('account:connect',()=>account.connect()); handle('account:disconnect',()=>account.disconnect());
    handle('shared:status',()=>collaboration.status()); handle('shared:watch',id=>collaboration.watch(id));
    handle('shared:create',id=>{const list=store.read().lists.find(l=>l.id===id);if(!list)throw Error('Local list not found.');return collaboration.create(list);});
    handle('shared:change',(id,base,next)=>collaboration.change(id,base,next));
    handle('shared:search',text=>collaboration.search(text)); handle('shared:add',(id,uid)=>collaboration.add(id,uid));
    handle('shared:removeMember',(id,uid)=>collaboration.removeMember(id,uid)); handle('shared:remove',id=>collaboration.remove(id));
    app.once('will-quit',()=>{collaboration.close();account.close();});
    const timer=setInterval(()=>{if(!access.status().unlocked)community.close();},15000);timer.unref();
    handle('app:info', () => ({ version: app.getVersion(), dataPath: app.getPath('userData'), packaged: app.isPackaged, update, access:access.status() }));
    handle('community:unlock', key=>access.unlock(key));
    handle('community:lock', async()=>{const result=access.lock();await community.lock();return result;});
    handle('community:bank', order=>{access.require();if(store.read().game!=='dragonwilds')throw new Error('Select Dragonwilds to open its shared bank.');if(order!==undefined&&(!order||!Number.isSafeInteger(order.amount)||order.amount<1||order.amount>1e12||typeof order.note!=='string'||!order.note.trim()||order.note.length>160))throw new Error('Invalid merchant requisition.');return community.bank(order);});
    handle('workspace:read', () => store.read());
    handle('workspace:write', data => {const saved=store.write(data);if(saved.game!=='dragonwilds')community.close();return saved;});
    handle('source:open', url => shell.openExternal(sourceUrl(url)));
    handle('website:open', () => shell.openExternal('https://bancy.gg/'));
    handle('data:open', () => shell.openPath(app.getPath('userData')));
    handle('workspace:export', async () => {
      const data = store.read();
      const result = await dialog.showSaveDialog(window, { title: 'Back up your BancyCraft workspace', defaultPath: `BancyCraft-workspace-${new Date().toISOString().slice(0, 10)}.json`, filters: [{ name: 'JSON workspace', extensions: ['json'] }] });
      if (result.canceled || !result.filePath) return false;
      fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2));
      return true;
    });
    handle('update:check', checkUpdates);
    handle('update:download', async () => { if (updater) await updater.download(); return update; });
    handle('update:install', () => { if (updater && update.state === 'ready') { try { if (fs.existsSync(store.file)) fs.copyFileSync(store.file, store.file + '.before-update.bak'); updater.install(); } catch { status('error', 'Your workspace backup could not be saved. The update has not been installed.'); } } });
    setupUpdates();
    await createWindow();
    void account.restore().then(()=>collaboration.reconnect()).catch(()=>{});
    if (updater) app.once('will-quit', startAutomaticChecks(updater));
  }).catch(error => { dialog.showErrorBox('BancyCraft could not start', error.message); app.quit(); });
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  app.on('window-all-closed', () => app.quit());
}
