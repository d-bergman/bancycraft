import {useEffect,useRef,useState} from 'react';
import {api} from '../bridge';
export function Ledger({unlocked}:{unlocked:boolean}) {
  const ref=useRef<HTMLIFrameElement>(null),[error,setError]=useState('');
  useEffect(()=>{
    const notify=()=>ref.current?.contentWindow?.postMessage({kind:'bancy-ledger-access',unlocked},'*');
    const listener=(event:MessageEvent)=>{
      if(event.source!==ref.current?.contentWindow)return;
      if(event.data?.kind==='bancy-ledger-ready')notify();
      if(event.data?.kind==='bancy-ledger-bank')api.openBank(event.data.order).catch(e=>setError(e.message));
    };
    window.addEventListener('message',listener);notify();return()=>window.removeEventListener('message',listener);
  },[unlocked]);
  return <><p className="small muted">Profit workshop, production planner, merchant orders and guide · available offline.</p>{error&&<p className="notice" role="alert">{error}</p>}<iframe ref={ref} title="Dragonwilds production tools" src="./ledger/index.html" sandbox="allow-scripts" className="ledger-frame"/></>;
}
