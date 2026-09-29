import {useEffect,useState} from 'react';
import {Copy,LockKeyhole} from 'lucide-react';
import {api} from '../bridge';
import type {Account,KeyVault} from '../types';
export function AdminKeys({account}:{account:Account}){
 const [vault,setVault]=useState<KeyVault>({available:false,keys:[]}),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{let active=true;setVault({available:false,keys:[]});setNotice('');if(account.state==='connected')void api.adminKeys().then(v=>{if(active)setVault(v);}).catch(()=>{});return()=>{active=false;};},[account.state,account.user?.uid]);
 if(!vault.available)return null;
 return <section className="panel content-panel"><h2><LockKeyhole size={21}/>Private administrator keys</h2><p>Available only to your verified administrator account on this computer. Keys stay encrypted outside the installation and repository.</p><div className="admin-key-list">{vault.keys.map(k=><div key={k.id}><span><strong>{k.label}</strong>{k.subject&&<small>{k.subject}{k.expiresAt?' · expires '+new Date(k.expiresAt).toLocaleDateString():''}</small>}</span><button className="icon-button" disabled={busy} title={'Copy '+k.label} aria-label={'Copy '+k.label} onClick={async()=>{setBusy(true);try{await api.copyAdminKey(k.id);setNotice(k.label+' copied. Clipboard clears after one minute if unchanged.');}catch(e){setNotice(e instanceof Error?e.message:'Unable to copy key.');setVault(await api.adminKeys());}finally{setBusy(false);}}}><Copy size={17}/></button></div>)}</div>{notice&&<p role="status">{notice}</p>}</section>;
}
