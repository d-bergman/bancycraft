import type { Bridge, Workspace } from './types';
const initial = (): Workspace => ({ schemaVersion: 2, game: 'dragonwilds', plans: [], supplies: [], lists: [] });
// Browser preview uses its own storage. Installed builds always use the protected Electron bridge.
export const api: Bridge = window.bancy ?? {
  accountConnect:async()=>{throw Error('Website sharing requires the installed Windows app.');},accountDisconnect:async()=>({state:'signed-out',message:'Disconnected.'}),
  sharedStatus:async()=>({account:{state:'signed-out',message:'Install the Windows app to connect your account.'},lists:[],active:null,online:false,message:''}),
  sharedWatch:async()=>{},sharedCreate:async()=>{throw Error('Install the app to share lists.');},sharedChange:async()=>{throw Error('Install the app to share lists.');},
  sharedSearch:async()=>[],sharedAdd:async()=>{},sharedRemoveMember:async()=>{},sharedRemove:async()=>{},onShared:()=>()=>{},
  info: async () => ({ version: __APP_VERSION__, dataPath: 'Browser preview storage', packaged: false, access:{unlocked:false}, update: { state: 'manual', message: 'Install a newer BancyCraft installer to update. Your local workspace is preserved.' } }),
  unlockCommunity: async()=>{throw new Error('Access keys require the native Windows app.');},lockCommunity:async()=>({unlocked:false}),openBank:async()=>{throw new Error('A valid key in the native app is required.');},
  load: async () => { const old = JSON.parse(localStorage.getItem('bancycraft-preview') || 'null'); return old ? { ...old, schemaVersion: 2, lists: old.lists ?? [] } : initial(); },
  save: async data => { localStorage.setItem('bancycraft-preview', JSON.stringify(data)); return data; },
  openWebsite: async () => { window.open('https://bancy.gg/', '_blank', 'noopener,noreferrer'); },
  openSource: async url => { window.open(url, '_blank', 'noopener,noreferrer'); },
  openData: async () => {}, exportWorkspace: async () => false,
  checkUpdate: async () => ({ state: 'idle', message: 'Open the installed app to check GitHub Releases and download updates.' }),
  downloadUpdate: async () => ({ state: 'manual', message: 'Hosted updates are not configured yet.' }),
  installUpdate: async () => {}, onUpdate: () => () => {}
};
