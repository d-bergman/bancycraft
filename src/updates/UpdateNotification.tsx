import { useRef, useState } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';
import { api } from '../bridge';
import type { Update } from '../types';
import './updates.css';

export function UpdateNotification({ update, onUpdate, onOpenSettings, hidden=false }: {hidden?:boolean; update?: Update; onUpdate: (value: Update) => void; onOpenSettings: () => void }) {
  const [dismissed, setDismissed] = useState('');
  const [acting, setActing] = useState(false);
  const [started, setStarted] = useState(false);
  const lastVersion = useRef('');
  if (update?.version) lastVersion.current = update.version;
  const version = update?.version || lastVersion.current;
  const state = update?.state;
  if (hidden || !version || dismissed === version || !(['available', 'downloading', 'ready'].includes(state || '') || (state === 'error' && started))) return null;
  async function action() {
    if (acting) return;
    setActing(true); setStarted(true);
    try {
      if (state === 'available') onUpdate(await api.downloadUpdate());
      else if (state === 'ready') await api.installUpdate();
      else if (state === 'error') onOpenSettings();
    } catch { onUpdate({ state: 'error', version, message: 'Unable to complete the update. Open Settings & updates to retry.' }); }
    finally { setActing(false); }
  }
  const title = state === 'available' ? 'New version available' : state === 'ready' ? 'Update ready to install' : state === 'error' ? 'Update needs attention' : 'Downloading update';
  return <aside className="update-notification" aria-label="BancyCraft update notification" role="status">
    <div className="update-notification-heading"><Download size={20}/><strong>{title}</strong><button className="icon-button" aria-label="Dismiss update notification" onClick={() => setDismissed(version)}><X size={16}/></button></div>
    <p>BancyCraft {version}</p>
    <p className="update-notification-detail">{state === 'available' ? 'Click below to download and verify. Restart when you’re ready.' : update?.message}</p>
    {state === 'downloading' && <progress className="update-progress" max={100} value={update?.percent ?? 0} aria-label="Notification download progress"/>}
    <button className="button primary update-notification-action" disabled={acting || state === 'downloading'} onClick={action}>
      {state === 'ready' ? <RefreshCw size={16}/> : <Download size={16}/>}
      {state === 'available' ? 'Download & prepare update' : state === 'ready' ? 'Restart & install update' : state === 'error' ? 'Open update settings' : `Downloading · ${Math.round(update?.percent ?? 0)}%`}
    </button>
  </aside>;
}
