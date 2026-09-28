import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Home, BookOpen, Hammer, Leaf, Box, LockKeyhole, Settings, CircleHelp, Search, Plus, ArrowRight, ArrowUpRight, Monitor, ScrollText, Database, Download, FolderOpen, Check, X, Trash2, Pencil, ChevronRight, Trees, Mountain, ShieldCheck, ExternalLink } from 'lucide-react';
import { api } from './bridge';
import type { Game, Info, Plan, Supply, Workspace, ShoppingList } from './types';
import './styles.css';
import { ItemBrowser } from './catalog/Browser';
import { ShoppingLists } from './planner/ShoppingLists';
import { ListPicker, type AddRequest } from './planner/ListPicker';
import { Gearsets } from './planner/Gearsets';
import { catalogs } from './catalog/catalogs';
import { buildShoppingList } from './planner/engine.mjs';
import {Builds} from './tools/Builds';
import './tools/tools.css';
import { Feedback } from './feedback/Feedback';
import { Changelog } from './updates/Changelog';
import { UpdateSettings } from './updates/UpdateSettings';
import { UpdateNotification } from './updates/UpdateNotification';
import { Ledger } from './ledger/Ledger';
import { AccountSettings, SharedLists, useSharing } from './community/SharedLists';
import { AccessSettings } from './community/AccessSettings';
import './ledger/ledger.css';

type Page = 'Home' | 'Builds' | 'Shopping Lists' | 'Gearsets' | 'Item Browser' | 'Crafting Planner' | 'My Supplies' | 'Production Ledger' | 'Shared Storage' | 'Group Plans' | 'Server Bank' | 'Settings' | 'Help';
const games: Record<Game, string> = { dragonwilds: 'RuneScape: Dragonwilds', valheim: 'Valheim', enshrouded: 'Enshrouded', grounded2: 'Grounded 2', vrising: 'V Rising' };
const navigation = [{ label: 'Home', icon: Home }, { label: 'Item Browser', icon: BookOpen }, { label: 'Shopping Lists', icon: ScrollText }, { label: 'Gearsets', icon: ShieldCheck }, {label:'Builds',icon:ShieldCheck}, { label: 'Crafting Planner', icon: Hammer }, { label: 'My Supplies', icon: Box }] as const;
const gameTiles: { id: string; name: string; game?: Game }[] = [
  { id: 'dragonwilds', name: 'RuneScape: Dragonwilds', game: 'dragonwilds' },
  { id: 'valheim', name: 'Valheim', game: 'valheim' },
  { id: 'enshrouded', name: 'Enshrouded', game: 'enshrouded' },
  { id: 'grounded2', name: 'Grounded 2', game: 'grounded2' },
  { id: 'vrising', name: 'V Rising', game: 'vrising' },
  { id: 'duneawakening', name: 'Dune: Awakening' },
];
const shared = ['Shared Storage', 'Group Plans', 'Server Bank'] as const;
const empty: Workspace = { schemaVersion: 2, game: 'dragonwilds', plans: [], supplies: [], lists: [] };
const SaveError = createContext('');
function App() {
  const sharing=useSharing();
  const [page, setPage] = useState<Page>('Home');
  const [data, setData] = useState<Workspace>(empty);
  const [info, setInfo] = useState<Info>();
  const unlocked=!!info?.access?.unlocked;
  useEffect(()=>{const timer=setInterval(()=>api.info().then(fresh=>setInfo(previous=>previous?{...previous,access:fresh.access}:fresh)).catch(()=>{}),15000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{if((shared.includes(page as typeof shared[number])&&!unlocked)||((page==='Production Ledger'||page==='Server Bank')&&data.game!=='dragonwilds'))setPage('Home');},[unlocked,page,data.game]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [toastListId, setToastListId] = useState<string>();
  const [addRequest, setAddRequest] = useState<AddRequest>();
  const [activeListId, setActiveListId] = useState<string>();
  const [gaming,setGaming]=useState(false),[removedList,setRemovedList]=useState<ShoppingList>();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Plan | 'new' | null>(null);
  const [supplyEdit, setSupplyEdit] = useState<Supply | 'new' | null>(null);
  const [deleting, setDeleting] = useState<{ type: 'plan' | 'supply'; id: string; name: string } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const dataRef = useRef(data);
  const saveLock = useRef(false);
  useEffect(() => {
    Promise.allSettled([api.load(), api.info()]).then(([workspace, application]) => {
      if (application.status === 'fulfilled') setInfo(application.value);
      if (workspace.status === 'fulfilled') { dataRef.current = workspace.value; setData(workspace.value); }
      else { setLoadFailed(true); setError(String(workspace.reason?.message || workspace.reason)); }
    }).finally(() => setLoading(false));
    return api.onUpdate(update => setInfo(previous => previous ? { ...previous, update } : previous));
  }, []);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [page, activeListId, data.game]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 4500); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { const listener = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); searchRef.current?.focus(); } }; window.addEventListener('keydown', listener); return () => window.removeEventListener('keydown', listener); }, []);
  async function save(change: (current: Workspace) => Workspace) {
    if (saveLock.current || loadFailed) return false;
    saveLock.current = true; setBusy(true); setError('');
    try { const saved = await api.save(change(dataRef.current)); dataRef.current = saved; setData(saved); return true; }
    catch (err) { setError(err instanceof Error ? err.message : 'Your changes could not be saved.'); return false; }
    finally { saveLock.current = false; setBusy(false); }
  }
  function go(next: Page) {if(gaming){setGaming(false);void api.gamingMode(false);} setPage(next); setSearch(''); if (next === 'Shopping Lists') { setActiveListId(undefined); void api.sharedWatch(null).catch(() => {}); } }
  async function selectGame(game: Game, open = false) { if (await save(current => ({ ...current, game }))) { if (open) go('Item Browser'); } }
  function notify(message: string, listId?: string) { setToast(message); setToastListId(listId); }
  function openList(id: string) { go('Shopping Lists'); setActiveListId(id); }
  async function createList(request: AddRequest, name: string, quick = false) {
    const list: ShoppingList = { id: crypto.randomUUID(), name: name.slice(0,140), game: request.game, quick, targets: request.targets, recipes: {}, progress: {}, collapsed: {}, useSupplies: false, hideCompleted: false, updatedAt: new Date().toISOString() };
    try { buildShoppingList(list, catalogs[list.game], dataRef.current.supplies); } catch (error) { setError(error instanceof Error ? error.message : 'Unable to calculate this list.'); return; }
    if (await save(current => ({ ...current, lists: [...current.lists, list] }))) { setAddRequest(undefined); notify(quick ? 'Quick list created.' : 'Added items to '+list.name+'.', list.id); if (quick) openList(list.id); }
  }
  async function addToList(id: string) {
    if (!addRequest) return;
    const list = dataRef.current.lists.find(list => list.id === id && list.game === addRequest.game);
    if (!list) return;
    const targets = [...list.targets.map(t => ({ ...t }))];
    for (const target of addRequest.targets) { const existing = targets.find(t => t.itemId === target.itemId); if (existing) existing.quantity += target.quantity; else targets.push(target); }
    if (targets.length > 500 || targets.some(t => t.quantity > 999999)) { setError('This addition exceeds the list limit of 500 items or 999,999 per item. Create another list.'); return; }
    try { buildShoppingList({ ...list, targets }, catalogs[list.game], dataRef.current.supplies); } catch (error) { setError(error instanceof Error ? error.message : 'Unable to calculate this list.'); return; }
    if (await save(current => ({ ...current, lists: current.lists.map(item => item.id === id ? { ...item, targets, updatedAt: new Date().toISOString() } : item) }))) { setAddRequest(undefined); notify('Added items to '+list.name+'.', id); }
  }
  async function changeList(list: ShoppingList, finish = false) {
    let result;
    try { result = buildShoppingList(list, catalogs[list.game], dataRef.current.supplies); } catch (error) { setError(error instanceof Error ? error.message : 'Unable to calculate this list.'); return; }
    const previous=dataRef.current.lists.find(x=>x.id===list.id);
    const complete = finish && list.quick && result.complete;
    if (await save(current => ({ ...current, lists: complete ? current.lists.filter(item => item.id !== list.id) : current.lists.map(item => item.id === list.id ? list : item) }))) {
      if (complete) {setRemovedList(previous||list); setActiveListId(undefined); notify('Quick list finished and removed.'); }
    }
  }
  const plans = data.plans.filter(plan => plan.game === data.game && `${plan.name} ${plan.notes}`.toLowerCase().includes(search.toLowerCase()));
  const supplies = data.supplies.filter(item => item.game === data.game && item.name.toLowerCase().includes(search.toLowerCase()));
  const canWrite = !busy && !loading && !loadFailed;
  const newPlan = () => setEditing('new');

  if (loading) return <div className="boot"><span className="brand-letter">B</span><h1>BancyCraft</h1><p>Opening your workspace…</p></div>;
  return <SaveError.Provider value={error}><div className={"app-shell "+(gaming?"gaming-mode":"")}>
    <aside className="sidebar">
      <button className="brand" onClick={() => go('Home')} aria-label="BancyCraft home"><img className="brand-wordmark" src="./assets/bancycraft-wordmark.png" alt="BancyCraft"/><span className="eyebrow">Plan · Craft · Progress</span></button>
      <nav aria-label="Main navigation">{navigation.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${page === label ? 'active' : ''}`} onClick={() => go(label)} aria-current={page === label ? 'page' : undefined}><Icon size={20}/><span>{label}</span></button>)}{data.game==='dragonwilds'&&<button className={`nav-item ${page==='Production Ledger'?'active':''}`} onClick={()=>go('Production Ledger')}><Hammer size={20}/><span>Production Ledger</span></button>}</nav>
      {unlocked&&<div className="community-navigation"><div className="nav-divider"><span>Bancy.gg</span><span className="tiny-badge">Optional</span></div>
      <nav aria-label="Connected features">{shared.filter(label=>label!=='Server Bank'||data.game==='dragonwilds').map(label => <button key={label} className={`nav-item shared ${page === label ? 'active' : ''}`} onClick={() => go(label)}><LockKeyhole size={17}/><span>{label}</span></button>)}</nav></div>}
      <div className="sidebar-bottom"><button className={`nav-item ${page === 'Settings' ? 'active' : ''}`} onClick={() => go('Settings')}><Settings size={19}/>Settings & updates</button><button className={`nav-item ${page === 'Help' ? 'active' : ''}`} onClick={() => go('Help')}><CircleHelp size={19}/>Help</button><div className="sidebar-motto">Good games.<br/>Better builds.</div></div>
    </aside>
    <div className="main-shell">
      <header className="toolbar"><div className="breadcrumb"><Home size={17}/><span>/</span>{page}</div><label className="toolbar-game">Game<select aria-label="Active game" disabled={!canWrite} value={data.game} onChange={event => selectGame(event.target.value as Game)}>{Object.entries(games).map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label><label className="search"><Search size={17}/><input ref={searchRef} aria-label="Search items" placeholder={`Search ${games[data.game]} items…`} value={search} onChange={event => { setSearch(event.target.value); setPage('Item Browser'); }}/><kbd>Ctrl K</kbd></label><span className="local-status"><i/>{page==='Shopping Lists'&&!!sharing.active&&sharing.active.game===data.game&&sharing.account.state==='connected'?(sharing.online?'Live sharing':'Reconnecting'):sharing.account.state==='connected'?'Website connected':'Local mode'}</span></header>
      <main>{gaming&&<div className="gaming-exit"><button className="button outline" onClick={()=>{setGaming(false);void api.gamingMode(false);}}>Exit gaming checklist</button></div>}
        {error && <div className="error-banner" role="alert"><div><strong>{loadFailed ? 'Your workspace needs attention' : 'Unable to complete that action'}</strong><p>{error}</p>{loadFailed && <button className="text-button" onClick={() => api.openData()}>Open data folder</button>}</div>{!loadFailed && <button aria-label="Dismiss error" onClick={() => setError('')}><X size={18}/></button>}</div>}
        <>
        {page === 'Home' && <>
          <section className="hero panel"><div className="hero-content"><p className="eyebrow">Crafting builds stronger stories</p><h1>Your next build<br/>starts here.</h1><p className="hero-description">Plan your crafts. Know your materials.</p><div className="actions"><button className="button primary" disabled={!canWrite} onClick={newPlan}><Plus size={19}/>New crafting plan</button><button className="button outline" onClick={() => go('Item Browser')}>Browse items <ArrowRight size={16}/></button></div></div><div className="hero-caption">Same materials.<br/>Brighter adventures.</div></section>
          <div className="home-grid"><section className="panel games-panel"><SectionTitle number="01" title="Choose your game" aside="Different worlds. More to craft."/><div className="game-grid">{gameTiles.map(tile => {
            const artwork = <><div className="game-art"><img className="game-tile-image" src={'./assets/games/'+tile.id+'.webp'} alt=""/>{!tile.game && <span className="planned-badge">Planned</span>}<span className="game-name">{tile.name}</span></div><div className="game-card-footer"><Monitor size={15}/><span>{tile.game ? 'Local planning' : 'Future game'}</span><strong>{tile.game ? <>Browse items <ArrowRight size={15}/></> : 'Planned'}</strong></div></>;
            return tile.game ? <button className="game-card illustrated" key={tile.id} disabled={!canWrite} onClick={() => selectGame(tile.game!, true)}>{artwork}</button> : <article className="game-card illustrated planned" key={tile.id} aria-label={tile.name+' · Planned'}>{artwork}</article>;
          })}</div></section>
          {unlocked&&<section className="panel connect-panel"><h2>Bancy community</h2><p>Your key unlocks the community area. The Dragonwilds shared bank uses your existing Bancy account.</p><button className="button outline full" onClick={()=>go(data.game==='dragonwilds'?'Server Bank':'Shared Storage')}>{data.game==='dragonwilds'?'Open shared bank':'Community features'}<ArrowRight size={17}/></button><small>Shared storage and group crafting are upcoming.</small><div className="connection-note">Your local tools work without an account.</div></section>}
          <section className="panel workspace-panel"><SectionTitle number="02" title="Your workspace" aside={`${data.plans.length} saved ${data.plans.length === 1 ? 'plan' : 'plans'}`}/>{data.plans.length ? <div className="recent-plans">{[...data.plans].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3).map(plan => <button key={plan.id} className="recent-plan" onClick={() => setEditing(plan)}><ScrollText size={23}/><span><strong>{plan.name}</strong><small>{games[plan.game]} · Quantity {plan.quantity}</small></span><span className={`status ${plan.status}`}>{plan.status.replace('-', ' ')}</span><ChevronRight size={18}/></button>)}<button className="text-button" onClick={() => go('Crafting Planner')}>View all plans <ArrowRight size={15}/></button></div> : <div className="empty-state home-empty"><ScrollText size={43} strokeWidth={1}/><h2>Start your first crafting plan</h2><p>Give your next project a name. Build out the details as you go.</p><button className="text-button" disabled={!canWrite} onClick={newPlan}>Create a plan <ArrowRight size={16}/></button></div>}</section>
          <section className="panel how-panel"><SectionTitle number="03" title="Start here"/>{[{ icon: ScrollText, title: 'Make a plan', description: 'Name your project and choose a game.' }, { icon: Box, title: 'Note your supplies', description: 'Keep a local record of what you own.' }, { icon: Download, title: 'Grow your workspace', description: 'Keep your plans as new features arrive.' }].map(({ icon: Icon, title, description }, index) => <div className="how-step" key={title}><span className="step-number">0{index + 1}</span><Icon size={25} strokeWidth={1.3}/><div><strong>{title}</strong><p>{description}</p></div></div>)}</section></div>
        </>}
        {page === 'Crafting Planner' && <><PageHeading eyebrow="PLAN · CRAFT · PROGRESS" title="Crafting planner" description="Your next builds, saved on this computer." action={<button className="button primary" disabled={!canWrite} onClick={newPlan}><Plus size={17}/>New plan</button>}/><GameSelect value={data.game} disabled={!canWrite} onChange={selectGame}/><div className="notice"><Hammer size={18}/><p>Manual plans keep your project notes. Use Shopping lists for recipe calculations, material requirements and completion tracking.</p></div><section className="panel content-panel"><PlanList plans={plans} onEdit={setEditing} onDelete={plan => setDeleting({ type: 'plan', ...plan })}/>{!plans.length && <button className="button outline" disabled={!canWrite} onClick={newPlan}><Plus size={17}/>Create your first plan</button>}</section></>}
        {page === 'My Supplies' && <><PageHeading eyebrow="YOUR LOCAL INVENTORY" title="My supplies" description="Manually record the materials you have. Only stored on this computer." action={<button className="button primary" disabled={!canWrite} onClick={() => setSupplyEdit('new')}><Plus size={17}/>Add supply</button>}/><GameSelect value={data.game} disabled={!canWrite} onChange={selectGame}/><section className="panel content-panel">{supplies.length ? <><div className="table-heading"><span>Material</span><span>Quantity</span></div>{supplies.map(item => <div className="supply-row" key={item.id}><Box size={19}/><span>{item.name}</span><strong>{item.quantity.toLocaleString()}</strong><button className="icon-button" aria-label={`Edit ${item.name}`} disabled={!canWrite} onClick={() => setSupplyEdit(item)}><Pencil size={16}/></button><button className="icon-button" aria-label={`Delete ${item.name}`} disabled={!canWrite} onClick={() => setDeleting({ type: 'supply', ...item })}><Trash2 size={16}/></button></div>)}</> : <div className="empty-state"><Box size={43} strokeWidth={1}/><h2>A place for your materials</h2><p>Add your first supply to start a local inventory.</p><button className="text-button" disabled={!canWrite} onClick={() => setSupplyEdit('new')}>Add a supply <Plus size={16}/></button></div>}</section></>}
        {page === 'Item Browser' && <ItemBrowser key={data.game} game={data.game} query={search} onQuery={setSearch} busy={!canWrite} onAdd={setAddRequest} onQuick={request => createList(request, 'Quick: '+request.targets[0].name+(request.targets.length > 1 ? ' + '+(request.targets.length - 1)+' more' : ''), true)}/>}
        {page==='Builds'&&<Builds game={data.game} account={sharing.account} onList={setAddRequest}/>}
        {page === 'Shopping Lists' && <ShoppingLists onGaming={()=>{setGaming(true);void api.gamingMode(true);}} onImport={async()=>{try{const list=await api.importList();if(list&&await save(c=>({...c,game:list.game,lists:[...c.lists,list]})))openList(list.id);}catch(e){setError(e instanceof Error?e.message:"Unable to import list.");}}} sharedActive={sharing.active?.game===data.game} sharedSection={<SharedLists onGaming={()=>{setGaming(true);void api.gamingMode(true);}} game={data.game} local={data.lists} state={sharing}/>} game={data.game} lists={data.lists} activeId={activeListId} onSelect={setActiveListId} supplies={data.supplies} busy={!canWrite} onBrowse={() => go('Item Browser')} onChange={changeList} onDelete={async id => {const previous=dataRef.current.lists.find(l=>l.id===id); if (await save(current => ({ ...current, lists: current.lists.filter(list => list.id !== id) }))) { setRemovedList(previous);setActiveListId(undefined); notify('Shopping list removed.'); } }}/>}
        {page==='Production Ledger'&&data.game==='dragonwilds'&&<Ledger unlocked={unlocked}/>}
        {page==='Server Bank'&&unlocked&&data.game==='dragonwilds'&&<section className="panel content-panel"><h1>Shared Dragonwilds bank</h1><p>The same website ledger, requests, approvals and chest capacity, inside BancyCraft. Sign in with your Bancy account in the bank window.</p><button className="button primary" onClick={()=>api.openBank().catch(e=>setError(e.message))}>Open shared bank</button></section>}
        {page === 'Gearsets' && <Gearsets key={data.game} game={data.game} busy={!canWrite} onAdd={setAddRequest}/>}
        {unlocked && (page==='Shared Storage'||page==='Group Plans') && <><PageHeading eyebrow="BANCY.GG · CONNECTED FEATURES" title={page} description="A shared workspace for your Bancy community."/><section className="panel connected-placeholder"><LockKeyhole size={44} strokeWidth={1}/><h2>Your worlds, connected.</h2><p>{page === 'Shared Storage' ? 'Find materials across your community’s server chests.' : 'Coordinate builds, material reservations and contributions together.'}</p><span className="coming-tag">Coming in a future build</span><p className="muted">Your key reveals this area. Blackbox services and shared crafting plans are not connected yet.</p></section></>}
        {page === 'Settings' && <><PageHeading eyebrow="MAKE YOURSELF AT HOME" title="Settings & updates" description="Your installation, your workspace, your next version." action={<button className="button outline" onClick={() => document.getElementById('app-changelog')?.scrollIntoView({behavior:'smooth',block:'start'})}><ScrollText size={17}/>Changelog</button>}/><div className="settings-grid"><UpdateSettings info={info} onUpdate={update => setInfo(previous => previous ? { ...previous, update } : previous)} busy={busy || loading}/><section className="panel content-panel"><h2><Database size={22}/>Local workspace</h2><p>Plans, supplies and your game selection are saved outside the app’s installation folder.</p><code className="data-path">{info?.dataPath}</code><div className="actions"><button className="button outline" disabled={!window.bancy} onClick={() => api.openData()}><FolderOpen size={17}/>Open folder</button><button className="button outline" disabled={!canWrite || !window.bancy} onClick={async () => { try { if (await api.exportWorkspace()) setToast('Workspace backup saved.'); } catch { setError('The workspace backup could not be saved.'); } }}><Download size={17}/>Back up</button><button className="button outline" disabled={!canWrite||!window.bancy} onClick={async()=>{try{const w=await api.importWorkspace();if(w){dataRef.current=w;setData(w);notify("Backup restored.");}}catch(e){setError(e instanceof Error?e.message:"Unable to restore backup.");}}}>Restore backup</button></div><p className="muted">A previous-save backup is kept automatically. Your local workspace is not uploaded. Shared copies save online only when you share them.</p></section><section className="panel content-panel"><h2><Monitor size={22}/>Default game</h2><p>Choose which local workspace opens in the planner.</p><GameSelect value={data.game} disabled={!canWrite} onChange={selectGame}/></section><Feedback game={data.game} version={info?.version}/><Changelog/><AccountSettings state={sharing}/><AccessSettings access={info?.access} onChange={access=>setInfo(previous=>previous?{...previous,access}:previous)}/></div></>}
        {page === 'Help' && <><PageHeading eyebrow="A GOOD PLACE TO START" title="Welcome to BancyCraft" description="An independent crafting workspace, with optional Bancy community features."/><div className="panel content-panel help-content"><h2>What works in this version?</h2><p>Create project notes and recipe shopping lists, browse gearsets for all five games, track supplies, use the Dragonwilds production ledger offline, and back up your workspace. Your work remains after restarting or updating the app.</p><h2>What is coming next?</h2><p>Shared lists now use your website account and live progress. Additional recipe/source coverage and optional shared Blackbox inventory. These screens are intentionally labeled until their integrations are ready.</p><h2>How do I update?</h2><p>Open Settings & updates, check for updates, download an available release, then restart to install. Your workspace lives in a separate BancyCraft data folder.</p><h2>Do I need an account?</h2><p>No. Local planning works without a website account or Blackbox. Shared lists live below your private lists in Shopping Lists and require only your website account. A privately issued cipher key reveals the bank and Blackbox area. The shared Dragonwilds bank then requires your existing website member/admin permissions; local tools remain independent.</p><button className="text-button" onClick={() => api.openWebsite()}>Visit Bancy.gg <ExternalLink size={16}/></button></div></>}
        </>
        <footer><span><Database size={14}/>{busy ? 'Saving…' : loadFailed ? 'Workspace unavailable' : page==='Shopping Lists'&&!!sharing.active&&sharing.active.game===data.game&&sharing.account.state==='connected'?'Shared workspace · '+(sharing.online?'live':'reconnecting'):'Workspace saved on this computer'}</span><span>BancyCraft {info?.version ?? __APP_VERSION__} <i/> Local workspace</span></footer>
      </main>
    </div>
    <UpdateNotification update={info?.update} onUpdate={update => setInfo(previous => previous ? { ...previous, update } : previous)} onOpenSettings={() => go('Settings')}/>
    {toast && <div className="toast" role="status"><Check size={17}/><div className="toast-content"><p>{toast}</p>{removedList&&<button onClick={async()=>{const l=removedList;if(await save(c=>({...c,lists:[...c.lists.filter(x=>x.id!==l.id),l]}))){setRemovedList(undefined);openList(l.id);notify("List restored.");}}}>Undo removal</button>}{toastListId && <button onClick={() => { openList(toastListId); setToast(''); }}>Open list</button>}</div><button className="icon-button" aria-label="Dismiss notification" onClick={() => setToast('')}><X size={15}/></button></div>}
    {addRequest && <ListPicker request={addRequest} lists={data.lists} busy={!canWrite} error={error} onClose={() => setAddRequest(undefined)} onAdd={addToList} onNew={name => createList(addRequest,name)}/>}
    {editing && <PlanDialog plan={editing === 'new' ? undefined : editing} game={data.game} busy={!canWrite} onClose={() => setEditing(null)} onSave={async plan => { if (await save(current => ({ ...current, plans: current.plans.some(item => item.id === plan.id) ? current.plans.map(item => item.id === plan.id ? plan : item) : [...current.plans, plan] }))) { setEditing(null); setToast('Plan saved on this computer.'); } }}/>}
    {supplyEdit && <SupplyDialog supply={supplyEdit === 'new' ? undefined : supplyEdit} game={data.game} busy={!canWrite} onClose={() => setSupplyEdit(null)} onSave={async item => { if (await save(current => ({ ...current, supplies: current.supplies.some(row => row.id === item.id) ? current.supplies.map(row => row.id === item.id ? item : row) : [...current.supplies, item] }))) { setSupplyEdit(null); setToast('Supply saved.'); } }}/>}
    {deleting && <Modal title={`Delete ${deleting.type}?`} onClose={() => setDeleting(null)}><p>Remove “{deleting.name}” from your local workspace?</p><div className="modal-actions"><button className="button outline" onClick={() => setDeleting(null)}>Keep it</button><button className="button danger" disabled={!canWrite} onClick={async () => { if (await save(current => ({ ...current, plans: deleting.type === 'plan' ? current.plans.filter(plan => plan.id !== deleting.id) : current.plans, supplies: deleting.type === 'supply' ? current.supplies.filter(item => item.id !== deleting.id) : current.supplies }))) { setDeleting(null); setToast('Removed from your workspace.'); } }}>Delete</button></div></Modal>}
  </div></SaveError.Provider>;
}
function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) { return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{action}</div>; }
function SectionTitle({ number, title, aside }: { number: string; title: string; aside?: string }) { return <div className="section-title"><span><em>// {number}</em>{title}</span>{aside && <small>{aside}</small>}</div>; }
function GameSelect({ value, onChange, disabled }: { value: Game; onChange: (game: Game) => void; disabled: boolean }) { return <label className="game-select">Game<select value={value} disabled={disabled} onChange={event => onChange(event.target.value as Game)}>{Object.entries(games).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>; }
function PlanList({ plans, onEdit, onDelete }: { plans: Plan[]; onEdit: (plan: Plan) => void; onDelete: (plan: Plan) => void }) { return plans.length ? <div className="plan-list">{[...plans].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(plan => <article className="plan-row" key={plan.id}><ScrollText size={27}/><div className="plan-summary"><h3>{plan.name}</h3><p>Quantity {plan.quantity.toLocaleString()} · {games[plan.game]}</p>{plan.notes && <p className="plan-notes">{plan.notes}</p>}</div><span className={`status ${plan.status}`}>{plan.status.replace('-', ' ')}</span><button className="icon-button" aria-label={`Edit ${plan.name}`} onClick={() => onEdit(plan)}><Pencil size={17}/></button><button className="icon-button" aria-label={`Delete ${plan.name}`} onClick={() => onDelete(plan)}><Trash2 size={17}/></button></article>)}</div> : <div className="empty-state"><ScrollText size={39} strokeWidth={1}/><h2>No plans here yet</h2><p>Your next project starts with a name.</p></div>; }
function ComingSoon({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) { return <section className="panel coming-soon"><span className="coming-tag">Coming next</span>{icon}<h2>{title}</h2><p>{description}</p></section>; }
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const saveError = useContext(SaveError);
  useEffect(() => { const dialog = ref.current!; const previous = document.activeElement as HTMLElement | null; dialog.showModal(); return () => { dialog.close(); previous?.focus(); }; }, []);
  return <dialog ref={ref} className="modal" aria-labelledby="modal-title" onCancel={event => { event.preventDefault(); onClose(); }}><div className="modal-header"><h2 id="modal-title">{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={21}/></button></div>{saveError && <div className="error-banner" role="alert">{saveError}</div>}{children}</dialog>;
}
function PlanDialog({ plan, game, busy, onClose, onSave }: { plan?: Plan; game: Game; busy: boolean; onClose: () => void; onSave: (plan: Plan) => void }) {
  const [name, setName] = useState(plan?.name ?? ''); const [selected, setSelected] = useState(plan?.game ?? game); const [quantity, setQuantity] = useState(String(plan?.quantity ?? 1)); const [notes, setNotes] = useState(plan?.notes ?? ''); const [status, setStatus] = useState<Plan['status']>(plan?.status ?? 'planned');
  return <Modal title={plan ? 'Edit crafting plan' : 'New crafting plan'} onClose={onClose}><form onSubmit={event => { event.preventDefault(); if (name.trim()) onSave({ id: plan?.id ?? crypto.randomUUID(), name: name.trim(), game: selected, quantity: Number(quantity), notes, status, updatedAt: new Date().toISOString() }); }}><label>Plan name<input autoFocus required maxLength={120} value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Upgrade the workshop"/></label><div className="form-row"><label>Game<select value={selected} onChange={event => setSelected(event.target.value as Game)}>{Object.entries(games).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Target quantity<input type="number" min="1" max="999999" step="1" required value={quantity} onChange={event => setQuantity(event.target.value)}/></label></div><label>Status<select value={status} onChange={event => setStatus(event.target.value as Plan['status'])}><option value="planned">Planned</option><option value="in-progress">In progress</option><option value="completed">Completed</option></select></label><label>Notes & material reminders<textarea rows={4} maxLength={5000} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Materials to gather, stations to build, ideas to remember…"/></label><p className="muted small">Manual project notes · Use Shopping lists for recipe calculations.</p><div className="modal-actions"><button type="button" className="button outline" onClick={onClose}>Cancel</button><button className="button primary" disabled={busy || !name.trim()} type="submit"><Check size={16}/>{busy ? 'Saving…' : 'Save plan'}</button></div></form></Modal>;
}
function SupplyDialog({ supply, game, busy, onClose, onSave }: { supply?: Supply; game: Game; busy: boolean; onClose: () => void; onSave: (supply: Supply) => void }) {
  const [name, setName] = useState(supply?.name ?? ''); const [selected, setSelected] = useState(supply?.game ?? game); const [quantity, setQuantity] = useState(String(supply?.quantity ?? 0));
  return <Modal title={supply ? 'Edit supply' : 'Add supply'} onClose={onClose}><form onSubmit={event => { event.preventDefault(); if (name.trim()) onSave({ id: supply?.id ?? crypto.randomUUID(), name: name.trim(), game: selected, quantity: Number(quantity) }); }}><label>Material name<input autoFocus required maxLength={120} value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Wood"/></label><div className="form-row"><label>Game<select value={selected} onChange={event => setSelected(event.target.value as Game)}>{Object.entries(games).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Quantity owned<input type="number" min="0" max="999999" step="1" required value={quantity} onChange={event => setQuantity(event.target.value)}/></label></div><div className="modal-actions"><button type="button" className="button outline" onClick={onClose}>Cancel</button><button type="submit" className="button primary" disabled={busy || !name.trim()}><Check size={16}/>Save supply</button></div></form></Modal>;
}
createRoot(document.getElementById('root')!).render(<App/>);
