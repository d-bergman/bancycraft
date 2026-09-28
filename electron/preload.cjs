const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('bancy', Object.freeze({
  accountConnect: () => ipcRenderer.invoke('account:connect'), accountDisconnect: () => ipcRenderer.invoke('account:disconnect'),
  sharedStatus: () => ipcRenderer.invoke('shared:status'), sharedWatch: id => ipcRenderer.invoke('shared:watch',id),
  sharedCreate: id => ipcRenderer.invoke('shared:create',id), sharedChange: (id,base,next) => ipcRenderer.invoke('shared:change',id,base,next),
  sharedSearch: text => ipcRenderer.invoke('shared:search',text), sharedAdd: (id,uid) => ipcRenderer.invoke('shared:add',id,uid),
  sharedRemoveMember: (id,uid) => ipcRenderer.invoke('shared:removeMember',id,uid), sharedRemove: id => ipcRenderer.invoke('shared:remove',id),
  onShared: callback => { const listener = (_event,data) => callback(data); ipcRenderer.on('shared:status',listener);return () => ipcRenderer.removeListener('shared:status',listener); },
  feedbackStatus: () => ipcRenderer.invoke('feedback:status'), sendFeedback: value => ipcRenderer.invoke('feedback:send',value),
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
