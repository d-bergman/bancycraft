import { useState } from 'react';
import { Plus, Shield } from 'lucide-react';
import type { Game } from '../types';
import { catalogs, gameNames } from '../catalog/catalogs';
import { ItemIcon } from '../catalog/ItemIcon';
import type { AddRequest } from './ListPicker';
import sourceSets from '../catalog/data/gearsets.json';
import { api } from '../bridge';
type Set = { name:string; ids:string[]; alternatives:Record<string,string[]>; kind:string; sourceUrl:string; missing?:string[] };
const sets = sourceSets as unknown as Record<Game,Set[]>;
export function Gearsets({ game, busy, onAdd }: { game: Game; busy: boolean; onAdd: (request: AddRequest) => void }) {
  const [query,setQuery] = useState(''), [kind,setKind] = useState('All'), [choices,setChoices] = useState<Record<string,string>>({});
  const filtered = sets[game].filter(set => set.name.toLowerCase().includes(query.toLowerCase()) && (kind==='All'||set.kind===kind));
  return <><div className="page-heading"><div><p className="eyebrow">ONE SET · ONE PLAN</p><h1>Gearsets</h1><p>{gameNames[game]} · {sets[game].length} catalog sets and equipment bundles.</p></div><Shield size={35}/></div><div className="actions"><label className="catalog-search list-search"><input aria-label="Search gearsets" placeholder="Search armor bundles…" value={query} onChange={e=>setQuery(e.target.value)}/></label>{game==='enshrouded' && <select aria-label="Gearset type" value={kind} onChange={e=>setKind(e.target.value)}><option>All</option><option>Armor</option><option>Cosmetic</option></select>}</div><p className="muted small">{filtered.length} results · Each card shows the exact pieces included. Alternate helmets replace the helmet in that bundle.</p><div className="gearset-grid">{filtered.map(set=>{
    const items = set.ids.map(id=>catalogs[game].items.find(item=>item.id===(choices[set.name+':'+id]||id)));
    return <section key={set.name} className="panel gearset-card"><h2>{set.name}</h2><span className="coming-tag">{set.kind}</span>{items.map((item,index)=>item&&<div key={set.ids[index]}><ItemIcon game={game} id={item.id}/><span>{set.alternatives[set.ids[index]] ? <select aria-label={`Helmet for ${set.name}`} value={item.id} onChange={e=>setChoices({...choices,[set.name+':'+set.ids[index]]:e.target.value})}>{[set.ids[index],...set.alternatives[set.ids[index]]].map(id=><option key={id} value={id}>{catalogs[game].items.find(i=>i.id===id)?.name}</option>)}</select> : item.name}</span><small>×1</small></div>)}{set.missing?.length ? <p className="notice compact">Missing catalog pieces: {set.missing.join(', ')}</p> : null}<button className="text-button" onClick={()=>api.openSource(set.sourceUrl)}>View source</button><button className="button primary full" disabled={busy||!!set.missing?.length||items.some(i=>!i)} onClick={()=>onAdd({game,targets:items.flatMap(item=>item?[{itemId:item.id,name:item.name,quantity:1}]:[])})}><Plus size={16}/>Add gearset to list</button></section>;
  })}</div>{!filtered.length&&<p className="notice">No sets match this search.</p>}<p className="muted small">Enshrouded includes armor and cosmetic sets from their source set pages. Dragonwilds and Valheim bundles use the catalog's named equipment families. Individual accessories and set bonuses are not invented.</p></>;
}
