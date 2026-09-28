import { useState } from 'react';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';
import history from '../../CHANGELOG.md?raw';
import { parseChangelog } from './release-history.mjs';
const releases = parseChangelog(history), pageSize = 3;
export function Changelog() {
  const [page,setPage] = useState(1), pages = Math.max(1,Math.ceil(releases.length/pageSize));
  return <section id="app-changelog" className="panel content-panel changelog-panel" aria-label="Changelog"><h2><History size={22}/>Changelog</h2><p>Every BancyCraft release, newest first. Available offline.</p><div className="changelog-entries" tabIndex={0} aria-label="Release entries">{releases.slice((page-1)*pageSize,page*pageSize).map(release => <article key={release.version} className="changelog-entry"><header><h3>Version {release.version}</h3><time dateTime={release.date}>{release.date}</time></header>{release.blocks.map((block,index) => block.kind==='list' ? <ul key={index}>{block.lines.map((line,n) => <li key={n}>{line}</li>)}</ul> : <p key={index}>{block.lines.join(' ')}</p>)}</article>)}</div><nav className="changelog-pagination" aria-label="Changelog pages"><button className="icon-button" aria-label="Previous changelog page" disabled={page===1} onClick={()=>setPage(page-1)}><ChevronLeft size={18}/></button><span role="status">Page {page} of {pages}</span>{Array.from({length:pages},(_,i)=>i+1).filter(n=>n===1||n===pages||Math.abs(n-page)<=1).map(n=><button key={n} className={'icon-button '+(n===page?'current':'')} aria-label={'Changelog page '+n} aria-current={n===page?'page':undefined} onClick={()=>setPage(n)}>{n}</button>)}<button className="icon-button" aria-label="Next changelog page" disabled={page===pages} onClick={()=>setPage(page+1)}><ChevronRight size={18}/></button></nav></section>;
}

