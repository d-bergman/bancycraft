const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('bancy', Object.freeze({
  info: () => ipcRenderer.invoke('app:info'),
  unlockCommunity: key => ipcRenderer.invoke('community:unlock', key),
  lockCommunity: () => ipcRenderer.invoke('community:lock'),
  openBank: order => ipcRenderer.invoke('community:bank',order),
  load: () => ipcRenderer.invoke('workspace:read'),
  save: data => ipcRenderer.invoke('workspace:write', data),
  openSource: url => ipcRenderer.invoke('source:open', url),
  openWebsite: () => ipcRenderer.invoke('website:open'),
  openData: () => ipcRenderer.invoke('data:open'),
  exportWorkspace: () => ipcRenderer.invoke('workspace:export'),
  checkUpdate: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  onUpdate: callback => { const listener = (_event, data) => callback(data); ipcRenderer.on('update:status', listener); return () => ipcRenderer.removeListener('update:status', listener); }
}));
