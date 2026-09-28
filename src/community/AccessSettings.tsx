import {useState} from 'react';
import {api} from '../bridge';
import type {Access} from '../types';
export function AccessSettings({access,onChange}:{access?:Access;onChange:(access:Access)=>void}) {
  const [key,setKey]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function action(unlock:boolean){setBusy(true);setError('');try{onChange(unlock?await api.unlockCommunity(key):await api.lockCommunity());setKey('');}catch(e){setError(e instanceof Error?e.message:'Unable to validate this key.');}finally{setBusy(false);}}
  return <section className="panel content-panel"><h2>Bancy.gg access</h2><p>{access?.unlocked?`Unlocked for ${access.subject} · expires ${new Date(access.expiresAt!).toLocaleDateString()}`:'Locked · Bancy community features are hidden.'}</p>{access?.unlocked?<button className="button outline" disabled={busy} onClick={()=>action(false)}>Lock & remove key</button>:<form onSubmit={e=>{e.preventDefault();action(true);}}><label className="key-label">Cipher key<input aria-label="BancyCraft cipher key" type="password" autoComplete="off" spellCheck={false} value={key} maxLength={3000} onChange={e=>setKey(e.target.value)}/></label><button className="button primary" disabled={busy||!key.trim()}>Validate & unlock</button></form>}{error&&<p className="notice compact" role="alert">{error}</p>}<p className="small muted">Keys are issued privately by BancyCraft and stored with Windows encryption. A key reveals the community area; shared bank actions still require your Bancy account's existing permissions.</p></section>;
}
