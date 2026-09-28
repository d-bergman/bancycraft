import { useState } from 'react';
import { Plus, Shield } from 'lucide-react';
import type { Game } from '../types';
import { catalogs, gameNames } from '../catalog/catalogs';
import { ItemIcon } from '../catalog/ItemIcon';
import type { AddRequest } from './ListPicker';
const sets: Record<Game, { name: string; ids: string[] }[]> = {
  dragonwilds: [{ name: 'Bronze armor', ids: ['872', '847', '875'] }, { name: 'Iron armor', ids: ['958', '552', '961'] }, { name: 'Rune armor', ids: ['19524', '19529', '19530'] }],
  valheim: [{ name: 'Bronze armor', ids: ['HelmetBronze', 'ArmorBronzeChest', 'ArmorBronzeLegs'] }, { name: 'Iron armor', ids: ['HelmetIron', 'ArmorIronChest', 'ArmorIronLegs'] }],
  enshrouded: [{ name: 'Adventurer armor', ids: ['2187', '2188', '2189', '2190', '2191'] }, { name: 'Rising Fighter armor', ids: ['2182', '2183', '2184', '2185', '2186'] }, { name: 'Guard of the North armor', ids: ['2232', '2233', '2234', '2235', '2236'] }]
};
export function Gearsets({ game, busy, onAdd }: { game: Game; busy: boolean; onAdd: (request: AddRequest) => void }) {
  const [query, setQuery] = useState('');
  return <><div className="page-heading"><div><p className="eyebrow">ONE SET · ONE PLAN</p><h1>Gearsets</h1><p>{gameNames[game]} · Starter bundles built from catalog items.</p></div><Shield size={35}/></div><label className="catalog-search list-search"><input aria-label="Search gearsets" placeholder="Search armor bundles…" value={query} onChange={e => setQuery(e.target.value)}/></label><div className="gearset-grid">{sets[game].filter(set => set.name.toLowerCase().includes(query.toLowerCase())).map(set => {
    const items = set.ids.map(id => catalogs[game].items.find(item => item.id === id)); if (items.some(i => !i)) return null;
    return <section key={set.name} className="panel gearset-card"><h2>{set.name}</h2>{items.map(item => item && <div key={item.id}><ItemIcon game={game} id={item.id}/><span>{item.name}</span><small>×1</small></div>)}<button className="button primary full" disabled={busy} onClick={() => onAdd({ game, targets: items.flatMap(item => item ? [{ itemId: item.id, name: item.name, quantity: 1 }] : []) })}><Plus size={16}/>Add gearset to list</button></section>;
  })}</div><p className="muted small">Each bundle lists its included pieces. Recipe availability and acquisition requirements come from the selected game's catalog.</p></>;
}
