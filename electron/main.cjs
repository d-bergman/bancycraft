const { app, BrowserWindow, ipcMain, shell, dialog, Menu } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { createStore } = require('./store.cjs');
const { sourceUrl } = require('./source-links.cjs');
const release = require('./release-config.json');
app.setName('BancyCraft');
app.setAppUserModelId('gg.bancy.bancycraft');
// Stable across installer versions; deliberately outside the installation folder.
app.setPath('userData', process.env.BANCYCRAFT_TEST_DATA || path.join(app.getPath('appData'), 'BancyCraft'));
const locked = app.requestSingleInstanceLock();
let window;
let store;
let updater;
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
  if (!release.feedUrl || !app.isPackaged) return;
  const url = new URL(release.feedUrl);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Update feed must use HTTPS.');
  updater = require('electron-updater').autoUpdater;
  updater.autoDownload = false;
  updater.autoInstallOnAppQuit = false;
  updater.allowDowngrade = false;
  updater.setFeedURL({ provider: 'generic', url: url.href });
  updater.on('checking-for-update', () => status('checking', 'Checking for updates…'));
  updater.on('update-available', info => status('available', `BancyCraft ${info.version} is available.`, { version: info.version }));
  updater.on('update-not-available', () => status('current', 'You have the latest version.'));
  updater.on('download-progress', progress => status('downloading', `Downloading update · ${Math.round(progress.percent)}%`));
  updater.on('update-downloaded', () => status('ready', 'Your update is ready. Restart BancyCraft to install it.'));
  updater.on('error', () => status('error', 'The update service could not be reached. Your local workspace is still available.'));
  status('idle', 'Check for a newer BancyCraft version.');
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
    handle('app:info', () => ({ version: app.getVersion(), dataPath: app.getPath('userData'), packaged: app.isPackaged, update }));
    handle('workspace:read', () => store.read());
    handle('workspace:write', data => store.write(data));
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
    handle('update:check', async () => { if (updater) await updater.checkForUpdates().catch(() => {}); return update; });
    handle('update:download', async () => { if (updater && update.state === 'available') await updater.downloadUpdate().catch(() => {}); return update; });
    handle('update:install', () => { if (updater && update.state === 'ready') updater.quitAndInstall(); });
    setupUpdates();
    await createWindow();
  }).catch(error => { dialog.showErrorBox('BancyCraft could not start', error.message); app.quit(); });
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  app.on('window-all-closed', () => app.quit());
}
