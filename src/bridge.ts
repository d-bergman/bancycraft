import type { Bridge, Workspace } from './types';
const initial = (): Workspace => ({ schemaVersion: 2, game: 'dragonwilds', plans: [], supplies: [], lists: [] });
// Browser preview uses its own storage. Installed builds always use the protected Electron bridge.
export const api: Bridge = window.bancy ?? {
  info: async () => ({ version: __APP_VERSION__, dataPath: 'Browser preview storage', packaged: false, update: { state: 'manual', message: 'Install a newer BancyCraft installer to update. Your local workspace is preserved.' } }),
  load: async () => { const old = JSON.parse(localStorage.getItem('bancycraft-preview') || 'null'); return old ? { ...old, schemaVersion: 2, lists: old.lists ?? [] } : initial(); },
  save: async data => { localStorage.setItem('bancycraft-preview', JSON.stringify(data)); return data; },
  openWebsite: async () => { window.open('https://bancy.gg/', '_blank', 'noopener,noreferrer'); },
  openSource: async url => { window.open(url, '_blank', 'noopener,noreferrer'); },
  openData: async () => {}, exportWorkspace: async () => false,
  checkUpdate: async () => ({ state: 'idle', message: 'Open the installed app to check GitHub Releases and download updates.' }),
  downloadUpdate: async () => ({ state: 'manual', message: 'Hosted updates are not configured yet.' }),
  installUpdate: async () => {}, onUpdate: () => () => {}
};
