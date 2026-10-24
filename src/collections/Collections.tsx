import {useId,useMemo,useState} from 'react';
import {Check, ChevronLeft, ChevronRight, ExternalLink, EyeOff, Heart, HelpCircle, Plus, Search, Target, Trash2} from 'lucide-react';
import {api} from '../bridge';
import {ItemIcon} from '../catalog/ItemIcon';
import {useTools} from '../tools/useTools';
import type {CollectionLoadout, DuneCollections} from '../types';
import data from '../catalog/data/dune-collections.json';
import locationOverrides from './location-overrides.json';
import locationFallbacks from './location-fallbacks.json';
import {acquire,nextUpgrades} from './logic.mjs';
import {resolveLocation} from './location-info.mjs';
import './Collections.css';

type Item=(typeof data.items)[number];
const all=data.items as Item[];
const uniques=all.filter(item=>item.unique);
const byId=new Map(all.map(item=>[item.id,item]));
const empty=():DuneCollections=>({found:[],favorites:[],loadouts:[]});
const groups=['All','Armor','Weapons','Vehicle','Utility','Other'];
const pageSize=24;
function sourceOverride(item:Item){return (locationOverrides as Record<string,{location:string;sourceUrl:string}>)[item.id];}
function locationInfo(item:Item){return resolveLocation(item,locationFallbacks,locationOverrides);}
function where(item:Item){const info=locationInfo(item);return `${info.location} · ${info.region}`;}
function mapUrl(item:Item){return `https://dune.gaming.tools/items/${encodeURIComponent(item.id.toLowerCase())}`;}

function LocationHint({item}:{item:Item}){
  const tooltipId=useId(),info=locationInfo(item);
  return <span className="collection-location-hint"><button type="button" className="collection-location-trigger" aria-label={`Where to find ${item.name}: ${info.location}. Region: ${info.region}`} aria-describedby={tooltipId}><HelpCircle size={15}/></button><span id={tooltipId} className="collection-location-tooltip" role="tooltip"><strong>Where to find {item.name}</strong><span><b>Location</b>{info.location}</span><span><b>Region</b>{info.region}</span><em>{info.provenance}</em></span></span>;
}
type LoadoutFilter='All'|'Weapons'|'Gear'|'Utility';
const loadoutFilters:LoadoutFilter[]=['All','Weapons','Gear','Utility'];
function loadoutCategory(item:Item):LoadoutFilter|'Other'{if(/suspensor|shield|power pack/i.test(item.name))return 'Utility';if(item.group==='Weapons')return 'Weapons';if(item.group==='Armor')return 'Gear';if(item.group==='Utility')return 'Utility';return 'Other';}

function LoadoutRow({item,targetId,foundIds,busy,onChange,onRemove,onTarget,onEquip,onSource,onMap}:{
  item:Item;targetId?:string;foundIds:string[];busy:boolean;
  onChange:()=>void;onRemove:()=>void;onTarget:(id:string)=>void;onEquip:(item:Item)=>void;onSource:(item:Item)=>void;onMap:(item:Item)=>void;
}){
  const choices=nextUpgrades(all,item),selected=choices.find(choice=>choice.id===targetId)||choices[0];
  return <article className="collections-slot">
    <div className="collections-slot-active">
      <span className="collections-slot-label">Equipped</span>
      <div className="collections-active-main"><ItemIcon game="duneawakening" id={item.id}/><div><span className="collections-item-title"><strong>{item.name}</strong>{item.unique&&<LocationHint item={item}/>}</span><small>{item.family} · {item.tier?'Tier '+item.tier:'Tier unknown'}</small></div></div>
      <div className="collections-active-actions"><button onClick={onChange}>Change</button><button className="collection-icon" aria-label={'Remove '+item.name} title="Remove slot" onClick={onRemove}><Trash2 size={15}/></button></div>
    </div>
    <div className="collections-slot-upgrade">
      <span className="collections-slot-label"><Target size={15}/> Next unique tier</span>
      {selected?<>
        <div className="collections-upgrade-main"><ItemIcon game="duneawakening" id={selected.id}/><div><span className="collections-item-title"><strong>{selected.name}</strong><LocationHint item={selected}/></span><small>Tier {selected.tier}</small></div></div>
        {choices.length>1&&<div className="collections-target-options">{choices.map(choice=><button key={choice.id} className={selected.id===choice.id?'selected':''} onClick={()=>onTarget(choice.id)}>{choice.name}</button>)}</div>}
        <div className="collections-upgrade-actions"><button onClick={()=>onEquip(selected)} disabled={busy}><Check size={15}/>{foundIds.includes(selected.id)?'Equip owned':'Mark found & equip'}</button><button onClick={()=>onSource(selected)}><ExternalLink size={15}/>Source</button><button onClick={()=>onMap(selected)}><ExternalLink size={15}/>Map</button></div>
      </>:<p className="collections-no-upgrade">No higher-tier unique is cataloged for this item type.</p>}
    </div>
  </article>;
}

export function Collections(){
  const tools=useTools(),state=tools.data.duneCollections||empty();
  const [view,setView]=useState<'collection'|'loadouts'>('collection'),[query,setQuery]=useState(''),[group,setGroup]=useState('All'),[hideFound,setHideFound]=useState(false),[favoritesOnly,setFavoritesOnly]=useState(false),[page,setPage]=useState(1),[active,setActive]=useState(''),[slotFilter,setSlotFilter]=useState<LoadoutFilter>('All'),[picker,setPicker]=useState<{loadoutId:string;slotId?:string}|null>(null),[pickerQuery,setPickerQuery]=useState(''),[pickerMode,setPickerMode]=useState<'single'|'multi'>('single'),[picked,setPicked]=useState<string[]>([]),[feedback,setFeedback]=useState('');
  const filtered=useMemo(()=>uniques.filter(item=>(group==='All'||item.group===group)&&(!hideFound||!state.found.includes(item.id))&&(!favoritesOnly||state.favorites.includes(item.id))&&`${item.name} ${item.family} ${where(item)} ${item.acquisition}`.toLowerCase().includes(query.toLowerCase())),[group,hideFound,favoritesOnly,query,state.found,state.favorites]);
  const pages=Math.max(1,Math.ceil(filtered.length/pageSize)),visible=filtered.slice((Math.min(page,pages)-1)*pageSize,Math.min(page,pages)*pageSize);
  const loadout=state.loadouts.find(item=>item.id===active)||state.loadouts[0];
  const pickerLoadout=state.loadouts.find(item=>item.id===picker?.loadoutId);
  const pickerCapacity=Math.max(0,12-(pickerLoadout?.slots.length||0));
  async function save(change:(current:DuneCollections)=>DuneCollections){setFeedback('');const okay=await tools.save(value=>({...value,duneCollections:change(value.duneCollections||empty())}));if(!okay)setFeedback('Could not save this collection.');}
  function toggleFound(item:Item){void save(current=>{const found=current.found.includes(item.id)?current.found.filter(id=>id!==item.id):[...current.found,item.id];return {...current,found,loadouts:found.includes(item.id)?acquire(current.loadouts,item.id,byId,all):current.loadouts};});}
  function toggleFavorite(item:Item){void save(current=>({...current,favorites:current.favorites.includes(item.id)?current.favorites.filter(id=>id!==item.id):[...current.favorites,item.id]}));}
  function updateLoadout(id:string,change:(loadout:CollectionLoadout)=>CollectionLoadout){void save(current=>({...current,loadouts:current.loadouts.map(loadout=>loadout.id===id?change(loadout):loadout)}));}
  function addLoadout(){if(state.loadouts.length>=5)return;const id=crypto.randomUUID();void save(current=>({...current,loadouts:[...current.loadouts,{id,name:`Loadout ${current.loadouts.length+1}`,slots:[]}]}));setActive(id);}
  function openPicker(loadoutId:string,slotId?:string){setPicker({loadoutId,slotId});setPickerQuery('');setPickerMode('single');setPicked([]);}
  function choose(item:Item){if(!picker)return;if(pickerMode==='multi'&&!picker.slotId){setPicked(current=>current.includes(item.id)?current.filter(id=>id!==item.id):current.length<pickerCapacity?[...current,item.id]:current);return;}const {loadoutId,slotId}=picker;updateLoadout(loadoutId,loadout=>({...loadout,slots:slotId?loadout.slots.map(slot=>slot.id===slotId?{...slot,itemId:item.id,targetId:undefined}:slot):[...loadout.slots,{id:crypto.randomUUID(),itemId:item.id}]}));setPicker(null);setPickerQuery('');}
  function addPicked(){if(!picker||!picked.length)return;const chosen=picked.slice(0,pickerCapacity);updateLoadout(picker.loadoutId,loadout=>({...loadout,slots:[...loadout.slots,...chosen.map(itemId=>({id:crypto.randomUUID(),itemId}))]}));setPicker(null);setPicked([]);setPickerQuery('');}
  const pickerItems=all.filter(item=>item.group!=='Other'&&!/\bSchematic$/i.test(item.name)&&`${item.name} ${item.family}`.toLowerCase().includes(pickerQuery.toLowerCase())).slice(0,80);
  const openSource=(item:Item)=>{const url=sourceOverride(item)?.sourceUrl||item.sourceUrl;if(url)void api.openSource(url).catch(()=>setFeedback('Could not open the source page.'));};
  const openMap=(item:Item)=>{void api.openSource(mapUrl(item)).catch(()=>setFeedback('Could not open the interactive map.'));};
  return <div className="collections-page">
    <header className="collections-heading"><div><p className="eyebrow">Dune: Awakening · Local only</p><h1>Collections</h1><p>Track rare gear and plan the next upgrade for each loadout. Your progress stays on this computer.</p></div><div className="collections-count"><strong>{state.found.filter(id=>uniques.some(item=>item.id===id)).length} / {uniques.length}</strong><span>unique items found</span></div></header>
    <div className="collections-tabs" role="tablist"><button role="tab" aria-selected={view==='collection'} className={view==='collection'?'selected':''} onClick={()=>setView('collection')}>Unique collection</button><button role="tab" aria-selected={view==='loadouts'} className={view==='loadouts'?'selected':''} onClick={()=>setView('loadouts')}>My loadouts <span>{state.loadouts.length}/5</span></button></div>
    {(feedback||tools.error)&&<p className="error-banner" role="alert">{feedback||tools.error}</p>}
    {view==='collection'?<>
      <section className="collections-filters panel"><label className="collections-search"><Search size={17}/><input value={query} onChange={event=>{setQuery(event.target.value);setPage(1);}} placeholder="Search names, types and locations" aria-label="Search unique items"/></label><div className="collections-group-tabs">{groups.map(value=><button key={value} className={group===value?'selected':''} onClick={()=>{setGroup(value);setPage(1);}}>{value}</button>)}</div><div className="collections-toggles"><label><input type="checkbox" checked={favoritesOnly} onChange={event=>{setFavoritesOnly(event.target.checked);setPage(1);}}/>Favorites only</label><label><input type="checkbox" checked={hideFound} onChange={event=>{setHideFound(event.target.checked);setPage(1);}}/><EyeOff size={15}/>Hide completed</label></div></section>
      <p className="collections-result-count">{filtered.length} matching uniques · Wiki catalog checked {new Date(data.generatedAt).toLocaleDateString()}</p>
      <div className="collections-grid">{visible.map(item=>{const found=state.found.includes(item.id),favorite=state.favorites.includes(item.id);return <article key={item.id} className={'collection-card panel '+(found?'is-found':'')}><div className="collection-card-top"><ItemIcon game="duneawakening" id={item.id}/><div><span className="collection-group">{item.group} · {item.family}</span><h2 className="collections-item-title">{item.name}<LocationHint item={item}/></h2><small>{item.tier?'Tier '+item.tier:'Tier unknown'}</small></div><button className={'collection-icon '+(favorite?'is-favorite':'')} aria-label={(favorite?'Remove favorite ':'Favorite ')+item.name} aria-pressed={favorite} disabled={tools.busy} onClick={()=>toggleFavorite(item)}><Heart size={18} fill={favorite?'currentColor':'none'}/></button></div><div className="collection-card-footer"><button className={'collection-found '+(found?'done':'')} onClick={()=>toggleFound(item)} disabled={tools.busy} aria-pressed={found}><Check size={16}/>{found?'Found':'Mark found'}</button><button className="collection-source" onClick={()=>openSource(item)} title={'Open source for '+item.name}><ExternalLink size={15}/>Source</button><button className="collection-map" onClick={()=>openMap(item)} title={'Open interactive map for '+item.name}><ExternalLink size={15}/>Map</button></div></article>;})}</div>
      {!visible.length&&<div className="panel collections-empty">No uniques match these filters.</div>}
      {pages>1&&<div className="collections-pages"><button disabled={page<=1} onClick={()=>setPage(page-1)} aria-label="Previous page"><ChevronLeft size={18}/></button><span>Page {Math.min(page,pages)} of {pages}</span><button disabled={page>=pages} onClick={()=>setPage(page+1)} aria-label="Next page"><ChevronRight size={18}/></button></div>}
    </>:<>
      <div className="collections-loadout-bar"><p>Personal equipment paths. Choose an equipped item; its next unique tier and location appear beside it.</p><button className="button primary" disabled={tools.busy||state.loadouts.length>=5} onClick={addLoadout}><Plus size={16}/>New loadout</button></div>
      {state.loadouts.length>0&&<div className="collections-loadout-tabs">{state.loadouts.map(item=><button className={loadout?.id===item.id?'selected':''} key={item.id} onClick={()=>setActive(item.id)}>{item.name}</button>)}</div>}
      {loadout&&<div className="collections-slot-tabs" role="tablist" aria-label="Loadout equipment categories">{loadoutFilters.map(value=><button key={value} role="tab" aria-selected={slotFilter===value} className={slotFilter===value?'selected':''} onClick={()=>setSlotFilter(value)}>{value}</button>)}</div>}
      {loadout?<section className="panel collections-loadout"><div className="collections-loadout-heading"><input key={loadout.id} aria-label="Loadout name" defaultValue={loadout.name} maxLength={100} onBlur={event=>{const name=event.target.value.trim();if(name&&name!==loadout.name)updateLoadout(loadout.id,item=>({...item,name}));else if(!name)event.target.value=loadout.name;}} onKeyDown={event=>{if(event.key==='Enter')event.currentTarget.blur();}}/><button className="collection-icon" title="Delete loadout" aria-label={'Delete '+loadout.name} onClick={()=>{if(window.confirm(`Delete ${loadout.name}?`))void save(current=>({...current,loadouts:current.loadouts.filter(item=>item.id!==loadout.id)}));}}><Trash2 size={17}/></button></div>
        <div className="collections-slot-list">
          {slotFilter!=='All'&&!loadout.slots.some(slot=>{const item=byId.get(slot.itemId);return item&&loadoutCategory(item)===slotFilter;})&&<p className="collections-filter-empty">No {slotFilter.toLowerCase()} in this loadout yet.</p>}
          {loadout.slots.filter(slot=>slotFilter==='All'||(byId.get(slot.itemId)&&loadoutCategory(byId.get(slot.itemId)!)===slotFilter)).map(slot=>{const item=byId.get(slot.itemId);return item?<LoadoutRow key={slot.id} item={item} targetId={slot.targetId} foundIds={state.found} busy={tools.busy} onChange={()=>openPicker(loadout.id,slot.id)} onRemove={()=>updateLoadout(loadout.id,value=>({...value,slots:value.slots.filter(row=>row.id!==slot.id)}))} onTarget={id=>updateLoadout(loadout.id,value=>({...value,slots:value.slots.map(row=>row.id===slot.id?{...row,targetId:id}:row)}))} onEquip={selected=>state.found.includes(selected.id)?updateLoadout(loadout.id,value=>({...value,slots:value.slots.map(row=>row.id===slot.id?{...row,itemId:selected.id,targetId:undefined}:row)})):toggleFound(selected)} onSource={openSource} onMap={openMap}/>:null;})}
        </div>
        <button className="button outline" disabled={loadout.slots.length>=12||tools.busy} onClick={()=>openPicker(loadout.id)}><Plus size={16}/>Add equipment slot</button><p className="collections-loadout-note">Up to 12 equipment slots per loadout. Marking your selected upgrade found equips it here and reveals the next tier.</p>
      </section>:<div className="panel collections-empty">Create a loadout to track your own equipment and next unique upgrades.</div>}
    </>}
    {picker&&<div className="collections-overlay" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setPicker(null);}}>
      <section className="collections-picker panel" role="dialog" aria-modal="true" aria-label="Choose equipment">
        <div className="collections-picker-head"><h2>Choose equipment</h2><button onClick={()=>setPicker(null)}>Close</button></div>
        {!picker.slotId&&<div className="collections-picker-modes" role="tablist" aria-label="Selection mode"><button role="tab" aria-selected={pickerMode==='single'} className={pickerMode==='single'?'selected':''} onClick={()=>{setPickerMode('single');setPicked([]);}}>Single select</button><button role="tab" aria-selected={pickerMode==='multi'} className={pickerMode==='multi'?'selected':''} onClick={()=>setPickerMode('multi')}>Multi select</button></div>}
        <label className="collections-search"><Search size={17}/><input autoFocus value={pickerQuery} onChange={event=>setPickerQuery(event.target.value)} placeholder="Search rifles, armor, tools…"/></label>
        {pickerMode==='multi'&&!picker.slotId&&<p className="collections-picker-help">Select up to {pickerCapacity} items. Search again to find more; your selections stay checked.</p>}
        <div className="collections-picker-results">{pickerItems.map(item=>{const selected=picked.includes(item.id);return <button key={item.id} className={selected?'selected':''} aria-pressed={pickerMode==='multi'?selected:undefined} onClick={()=>choose(item)}>{pickerMode==='multi'&&!picker.slotId&&<span className="collections-picker-check" aria-hidden="true">{selected&&<Check size={15}/>}</span>}<ItemIcon game="duneawakening" id={item.id}/><span><strong>{item.name}</strong><small>{item.group} · {item.family} · {item.tier?'Tier '+item.tier:'Tier unknown'}</small></span></button>;})}</div>
        {pickerMode==='multi'&&!picker.slotId&&<footer className="collections-picker-footer"><span>{picked.length} selected · {pickerCapacity} slots available</span><button className="button primary" disabled={!picked.length||tools.busy} onClick={addPicked}>Add {picked.length} {picked.length===1?'item':'items'}</button></footer>}
      </section>
    </div>}
    <p className="collections-attribution">Item data: <button onClick={()=>void api.openSource(data.source.url)}>{data.source.name}</button>. Missing wiki locations were cross-checked against gaming.tools item maps. Unverified locations are labeled in the item tooltip.</p>
  </div>;
}
