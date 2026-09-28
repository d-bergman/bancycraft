import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Box, ChevronLeft, ChevronRight, ExternalLink, Hammer, Leaf, Search } from 'lucide-react';
import dragonwilds from './data/dragonwilds.json';
import valheim from './data/valheim.json';
import enshrouded from './data/enshrouded.json';
import type { Game } from '../types';
import type { Catalog, Item, Recipe } from './types';
import { api } from '../bridge';
import './catalog.css';

const catalogs: Record<Game, Catalog> = { dragonwilds, valheim, enshrouded };
const names: Record<Game, string> = { dragonwilds: 'RuneScape: Dragonwilds', valheim: 'Valheim', enshrouded: 'Enshrouded' };
const normalize = (text: string) => text.toLocaleLowerCase('en').trim();
export function ItemBrowser({ game, query, onQuery }: { game: Game; query: string; onQuery: (value: string) => void }) {
  const catalog = catalogs[game];
  const [category, setCategory] = useState('');
  const [station, setStation] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Item>();
  const [linkError, setLinkError] = useState('');
  useEffect(() => { setPage(0); setSelected(undefined); }, [query]);
  const categories = useMemo(() => [...new Set(catalog.items.map(i => i.category))].sort(), [catalog]);
  const stations = useMemo(() => [...new Set(catalog.recipes.map(r => r.station).filter(Boolean))].sort(), [catalog]);
  const stationOutputs = useMemo(() => new Set(catalog.recipes.filter(r => r.station === station).flatMap(r => r.outputs.map(i => normalize(i.name)))), [catalog, station]);
  const results = useMemo(() => catalog.items.filter(item => (!category || category === item.category) && (!station || stationOutputs.has(normalize(item.name))) && normalize(`${item.name} ${item.id}`).includes(normalize(query))), [catalog, category, station, stationOutputs, query]);
  const currentPage = Math.min(page, Math.max(0, Math.ceil(results.length / 50) - 1));
  const visible = results.slice(currentPage * 50, currentPage * 50 + 50);
  const madeBy = selected ? catalog.recipes.filter(r => r.outputs.some(i => (i.itemId ? i.itemId === selected.id : normalize(i.name) === normalize(selected.name)))) : [];
  const usedBy = selected && catalog.items.filter(i => normalize(i.name) === normalize(selected.name)).length === 1 ? catalog.recipes.filter(r => r.inputs.some(i => normalize(i.name) === normalize(selected.name))) : [];
  async function source(url: string) { try { await api.openSource(url); setLinkError(''); } catch { setLinkError('The source link could not be opened.'); } }
  function follow(name: string) {
    const matches = catalog.items.filter(i => normalize(i.name) === normalize(name));
    if (matches.length === 1) setSelected(matches[0]);
    else { onQuery(name); setSelected(undefined); setCategory(''); setStation(''); setPage(0); }
  }
  function ingredient(name: string, amount: number, key: string) {
    const known = catalog.items.some(i => normalize(i.name) === normalize(name));
    return <li key={key}><strong>{amount.toLocaleString()} ×</strong>{known ? <button onClick={() => follow(name)}>{name}</button> : <span>{name}</span>}</li>;
  }
  function recipeCard(recipe: Recipe, index: number) { return <article className="recipe-card" key={recipe.id}><div className="recipe-title"><Hammer size={16}/><strong>{recipe.station || 'Station not provided by this source'}</strong><span>Recipe {index + 1}</span></div><div className="recipe-flow"><div><small>INPUTS · PER CRAFT</small><ul>{recipe.inputs.map((i, n) => ingredient(i.name, i.quantity, `input-${n}`))}</ul></div><ChevronRight size={18}/><div><small>OUTPUTS</small><ul>{recipe.outputs.map((i, n) => ingredient(i.name, i.quantity, `output-${n}`))}</ul></div></div>{recipe.notes && <p className="muted small">{recipe.notes}</p>}<button className="text-button" onClick={() => source(recipe.sourceUrl)}>Recipe source <ExternalLink size={12}/></button></article>; }
  return <section className="catalog" aria-label={`${names[game]} item browser`}>
    <div className="page-heading"><div><p className="eyebrow">EXPLORE · CHOOSE · CRAFT</p><h1>Item browser</h1><p>{names[game]} <span className="catalog-dot">/</span> {catalog.items.length.toLocaleString()} imported items · Available offline</p></div><BookOpen size={34} strokeWidth={1}/></div>
    <div className="catalog-filters"><label>Item type<select aria-label="Item type" value={category} onChange={e => { setCategory(e.target.value); setPage(0); }}><option value="">All item types</option>{categories.map(c => <option key={c}>{c}</option>)}</select></label><label>Crafting station<select aria-label="Crafting station" value={station} onChange={e => { setStation(e.target.value); setPage(0); }}><option value="">All stations</option>{stations.map(s => <option key={s}>{s}</option>)}</select></label><button className="text-button" onClick={() => { onQuery(''); setCategory(''); setStation(''); setPage(0); setSelected(undefined); }}>Clear filters</button><span role="status">{results.length.toLocaleString()} results{query.trim() && ` for “${query.trim()}”`}</span></div>
    {linkError && <p role="alert">{linkError}</p>}
    <div className="catalog-layout"><div className="panel catalog-list"><div className="catalog-list-heading"><span>ITEM</span><span>TYPE</span></div>{visible.length ? visible.map(item => <button key={item.id} aria-label={`View ${item.name}`} aria-pressed={selected?.id === item.id} className={`catalog-row ${selected?.id === item.id ? 'selected' : ''}`} onClick={() => setSelected(item)}><span className="item-symbol"><Box size={18}/></span><span className="item-name">{item.name}{game === 'valheim' && <small className="prefab-id">{item.id}</small>}</span><small>{item.category}</small><ChevronRight size={14}/></button>) : <div className="empty-state"><Search size={32}/><h2>No matching items</h2><p>Try another name or clear the filters. Searches only include {names[game]}.</p></div>}<div className="catalog-pagination"><button aria-label="Previous results" className="icon-button" disabled={!currentPage} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16}/></button><span>Page {currentPage + 1} of {Math.max(1, Math.ceil(results.length / 50))}</span><button aria-label="Next results" className="icon-button" disabled={(currentPage + 1) * 50 >= results.length} onClick={() => setPage(currentPage + 1)}><ChevronRight size={16}/></button></div></div>
    <aside className="panel item-detail" aria-label="Item details">{selected ? <><p className="eyebrow">{names[game]} / {selected.category}</p><h2>{selected.name}</h2>{game === 'valheim' && <code className="prefab-id">{selected.id}</code>}{selected.description && <p>{selected.description}</p>}<button className="text-button" onClick={() => source(selected.sourceUrl)}>Open item source <ExternalLink size={13}/></button><section><h3><Hammer size={18}/>How to craft</h3>{madeBy.length ? madeBy.map(recipeCard) : <p className="catalog-empty-note">No crafting recipe imported for this item. It may be gathered, dropped, purchased, or not yet covered by this catalog.</p>}</section><section><h3><Leaf size={18}/>Where to find it</h3><p className="catalog-empty-note">{selected.acquisition || 'Acquisition details are not yet imported for this item. Check its source page.'}</p><p className="small muted">Gathering and drops are descriptive. BancyCraft does not convert material needs into creature or harvest counts.</p></section><section><h3><Box size={18}/>Used in ({usedBy.length})</h3>{usedBy.length ? usedBy.map(recipeCard) : <p className="catalog-empty-note">No uses recorded in the imported recipes.</p>}</section></> : <div className="empty-state detail-empty"><BookOpen size={40} strokeWidth={1}/><h2>Find your next craft</h2><p>Search the selected game, then choose an item to see its materials, station and recorded uses.</p><small>Exact recipe amounts stay separate from gathering sources.</small></div>}</aside></div>
    <details className="catalog-provenance"><summary>Catalog sources & coverage · Imported {new Date(catalog.importedAt).toLocaleDateString()}</summary><p>{catalog.coverage}</p><p>Adapted from {catalog.source.name}. {catalog.source.license}. {catalog.source.version}</p><div className="actions"><button className="text-button" onClick={() => source(catalog.source.url)}>Source <ExternalLink size={12}/></button><button className="text-button" onClick={() => source(catalog.source.licenseUrl)}>License <ExternalLink size={12}/></button></div><p>Catalog updates ship with BancyCraft releases. Community data may lag the game. See the source page for full conditions and edit history.</p></details>
  </section>;
}
