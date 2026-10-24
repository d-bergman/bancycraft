import {useEffect,useMemo,useRef,useState} from 'react';
import type {PointerEvent} from 'react';
import {ExternalLink,LocateFixed,Minus,Plus,Search} from 'lucide-react';
import {api} from '../bridge';
import catalog from '../catalog/data/dune-collections.json';
import fallbacks from '../collections/location-fallbacks.json';
import overrides from '../collections/location-overrides.json';
import atlas from './dune-map-data.json';
import {normalizePlace,pinsForItem} from './lookup.mjs';
import type {AtlasLayer,AtlasMarker} from './lookup.mjs';
import './DuneMap.css';

type View={x:number;y:number;width:number;height:number};
type Pin={mapId:string;marker:AtlasMarker};
type Reference={location:string;region:string;items:string[]};
const maps=atlas.maps as AtlasLayer[];
const byItemId=new Map(catalog.items.map(item=>[item.id,item]));
const images:Record<string,string>={hagga:'./assets/dune-maps/hagga-basin.webp',desert:'./assets/dune-maps/deep-desert.webp',overland:'./assets/dune-maps/overland.webp'};
const references=(()=>{const byLocation=new Map<string,Reference>();for(const item of catalog.items.filter(row=>row.unique)){const result=pinsForItem(item,maps,fallbacks,overrides);if(result.pins.length)continue;const key=result.info.location+'|'+result.info.region;const existing=byLocation.get(key);if(existing)existing.items.push(item.name);else byLocation.set(key,{location:result.info.location,region:result.info.region,items:[item.name]});}return [...byLocation.values()];})();
const full=(map:AtlasLayer):View=>({x:0,y:0,width:map.width,height:map.height});
const focus=(map:AtlasLayer,marker:AtlasMarker):View=>{
  const width=map.width/5,height=map.height/5;
  return {x:Math.max(0,Math.min(map.width-width,marker.x-width/2)),y:Math.max(0,Math.min(map.height-height,marker.y-height/2)),width,height};
};
function color(group:string){
  if(/shipwreck|wreck/i.test(group))return '#f4b767';
  if(/station|lab|facility|dungeon/i.test(group))return '#8cddf1';
  if(/cave|sietch/i.test(group))return '#b9a7f3';
  if(/resource|agave|spice/i.test(group))return '#a8d59b';
  if(/camp|outpost|fortress/i.test(group))return '#e68c80';
  return '#f2d6a3';
}
function markerKey(pin:Pin){return `${pin.mapId}:${pin.marker.group}:${pin.marker.id}:${pin.marker.x}:${pin.marker.y}`;}

export function DuneMap({itemId}:{itemId?:string}){
  const item=itemId?byItemId.get(itemId):undefined;
  const target=useMemo(()=>item?pinsForItem(item,maps,fallbacks,overrides):null,[item]);
  const first=target?.pins[0];
  const initialMap=maps.find(map=>map.id===first?.mapId)||maps[0];
  const [mapId,setMapId]=useState(initialMap.id);
  const [view,setView]=useState<View>(()=>first?focus(initialMap,first.marker):full(initialMap));
  const [selectedKey,setSelectedKey]=useState(first?markerKey(first):'');
  const [reference,setReference]=useState<Reference>();
  const [query,setQuery]=useState('');
  const [group,setGroup]=useState('All locations');
  const svgRef=useRef<SVGSVGElement>(null);
  const drag=useRef<{clientX:number;clientY:number;unitX:number;unitY:number;view:View}|null>(null);
  const map=maps.find(value=>value.id===mapId)||maps[0];
  const categories=['All locations',...new Set(map.markers.map(marker=>marker.group))].sort((a,b)=>a==='All locations'?-1:b==='All locations'?1:a.localeCompare(b));
  const normalizedQuery=normalizePlace(query);
  const results=useMemo(()=>maps.flatMap(layer=>layer.markers.filter(marker=>!normalizedQuery||normalizePlace(marker.name).includes(normalizedQuery)).map(marker=>({mapId:layer.id,marker}))),[normalizedQuery]);
  const referenceResults=normalizedQuery?references.filter(entry=>normalizePlace(`${entry.location} ${entry.region} ${entry.items.join(' ')}`).includes(normalizedQuery)):[];
  const visible=map.markers.filter(marker=>(group==='All locations'||marker.group===group)&&(!normalizedQuery||normalizePlace(marker.name).includes(normalizedQuery)));
  const selected=maps.flatMap(layer=>layer.markers.map(marker=>({mapId:layer.id,marker}))).find(pin=>markerKey(pin)===selectedKey);
  const targetKeys=new Set(target?.pins.map(markerKey)||[]);

  function switchMap(next:string){const layer=maps.find(value=>value.id===next);if(!layer)return;setMapId(next);setGroup('All locations');setView(full(layer));setSelectedKey('');setReference(undefined);}
  function selectPin(pin:Pin){const layer=maps.find(value=>value.id===pin.mapId);if(!layer)return;setMapId(layer.id);setGroup('All locations');setSelectedKey(markerKey(pin));setReference(undefined);setView(focus(layer,pin.marker));}
  function selectReference(entry:Reference){setSelectedKey('');setReference(entry);const next=/Deep Desert/i.test(entry.region)?'desert':/Arrakeen|Harko|Overland/i.test(entry.region)?'overland':'hagga';const layer=maps.find(value=>value.id===next);if(layer){setMapId(next);setGroup('All locations');setView(full(layer));}}
  function setZoom(factor:number,anchor?:{x:number;y:number}){setView(current=>{const ratio=Math.max(0.025,Math.min(1,current.width*factor/map.width));const width=map.width*ratio,height=map.height*ratio;const at=anchor||{x:current.x+current.width/2,y:current.y+current.height/2};const x=at.x-(at.x-current.x)*width/current.width,y=at.y-(at.y-current.y)*height/current.height;return {x:Math.max(0,Math.min(map.width-width,x)),y:Math.max(0,Math.min(map.height-height,y)),width,height};});}
  useEffect(()=>{const svg=svgRef.current;if(!svg)return;const wheel=(event:globalThis.WheelEvent)=>{event.preventDefault();const transform=svg.getScreenCTM();if(!transform)return;const point=svg.createSVGPoint();point.x=event.clientX;point.y=event.clientY;const anchor=point.matrixTransform(transform.inverse());setZoom(event.deltaY>0?1.2:0.83,anchor);};svg.addEventListener('wheel',wheel,{passive:false});return()=>svg.removeEventListener('wheel',wheel);},[map.id]);
  function onPointerDown(event:PointerEvent<SVGSVGElement>){if((event.target as Element).closest('[data-atlas-pin]'))return;const transform=event.currentTarget.getScreenCTM();if(!transform)return;drag.current={clientX:event.clientX,clientY:event.clientY,unitX:1/transform.a,unitY:1/transform.d,view};event.currentTarget.setPointerCapture(event.pointerId);}
  function onPointerMove(event:PointerEvent<SVGSVGElement>){if(!drag.current)return;const start=drag.current;setView(current=>({ ...current,x:Math.max(0,Math.min(map.width-current.width,start.view.x-(event.clientX-start.clientX)*start.unitX)),y:Math.max(0,Math.min(map.height-current.height,start.view.y-(event.clientY-start.clientY)*start.unitY))}));}
  function onPointerUp(event:PointerEvent<SVGSVGElement>){drag.current=null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}
  function openWiki(marker:AtlasMarker){const title=marker.article||marker.name;void api.openSource(`https://awakening.wiki/${encodeURIComponent(title.replace(/ /g,'_'))}`);}
  const radius=Math.max(55,view.width/950*4);

  return <div className="dune-atlas">
    <header className="atlas-heading"><div><p className="eyebrow">Dune: Awakening · Offline atlas</p><h1>Map</h1><p>Pan, zoom and search mapped places or unique sources. Pins are positioned on local maps, so this view works offline.</p></div><span className="atlas-count">{atlas.maps.reduce((sum,layer)=>sum+layer.markers.length,0)} mapped places</span></header>
    {item&&<section className="atlas-target panel"><div><span className="atlas-kicker">WHERE TO FIND IT</span><strong>{item.name}</strong><small>{target?.info.location} · {target?.info.region}</small></div>{target?.pins.length?<div className="atlas-target-pins">{target.pins.map(pin=><button key={markerKey(pin)} onClick={()=>selectPin(pin)}>{pin.marker.name} <span>{maps.find(layer=>layer.id===pin.mapId)?.name}</span></button>)}</div>:<p>No verified map coordinate for this source yet. The written location is still shown above.</p>}</section>}
    <div className="atlas-layout">
      <aside className="atlas-sidebar panel">
        <label className="atlas-search"><Search size={17}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search places or uniques..." aria-label="Search mapped locations"/></label>
        <label className="atlas-filter">Type<select value={group} onChange={event=>setGroup(event.target.value)}>{categories.map(value=><option key={value}>{value}</option>)}</select></label>
        <p className="atlas-list-heading">{normalizedQuery?`${results.length} pins · ${referenceResults.length} references`:`${visible.length} locations on ${map.name}`}</p>
        <div className="atlas-results">
          {(normalizedQuery?results:visible.map(marker=>({mapId:map.id,marker}))).slice(0,150).map(pin=><button key={markerKey(pin)} className={selectedKey===markerKey(pin)?'selected':''} onClick={()=>selectPin(pin)}><i style={{background:color(pin.marker.group)}}/><span><strong>{pin.marker.name}</strong><small>{pin.marker.group} · {maps.find(layer=>layer.id===pin.mapId)?.name}</small></span></button>)}
          {referenceResults.map(entry=><button key={`${entry.location}|${entry.region}`} className={reference===entry?'selected':''} onClick={()=>selectReference(entry)}><i className="atlas-reference-dot"/><span><strong>{entry.location}</strong><small>{entry.region} · coordinate not mapped</small></span></button>)}
        </div>
        {(normalizedQuery?results.length:visible.length)>150&&<small className="atlas-list-limit">Showing first 150 pins. Narrow your search to find more.</small>}
      </aside>
      <section className="atlas-main panel"><div className="atlas-toolbar"><div className="atlas-map-tabs" role="tablist" aria-label="Dune map areas">{maps.map(layer=><button key={layer.id} role="tab" aria-selected={map.id===layer.id} className={map.id===layer.id?'selected':''} onClick={()=>switchMap(layer.id)}>{layer.name}</button>)}</div><div className="atlas-zoom"><button title="Zoom in" aria-label="Zoom in" onClick={()=>setZoom(0.7)}><Plus size={17}/></button><button title="Zoom out" aria-label="Zoom out" onClick={()=>setZoom(1.4)}><Minus size={17}/></button><button title="Show whole map" aria-label="Show whole map" onClick={()=>setView(full(map))}><LocateFixed size={17}/></button></div></div>
        <svg ref={svgRef} className="atlas-canvas" viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`} preserveAspectRatio="xMidYMid meet" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} role="img" aria-label={`${map.name} map with ${visible.length} visible locations`}><image href={images[map.id]} width={map.width} height={map.height}/>{visible.map(marker=>{const pin={mapId:map.id,marker},key=markerKey(pin),active=selectedKey===key,targeted=targetKeys.has(key);return <g key={key} data-atlas-pin onClick={()=>selectPin(pin)} className="atlas-pin"><circle cx={marker.x} cy={marker.y} r={radius*2.2} fill="transparent"/><circle cx={marker.x} cy={marker.y} r={radius*(active||targeted?1.55:1)} fill={color(marker.group)} stroke={active||targeted?'#fff':'#142631'} strokeWidth={radius*.32}/>{active&&<circle cx={marker.x} cy={marker.y} r={radius*2.3} fill="none" stroke="#fff" strokeWidth={radius*.25}/>}</g>;})}</svg>
        <div className="atlas-map-footer"><span>Drag to pan · Scroll to zoom · Select a pin for details</span><span>Wiki map revision {map.revision||'unknown'}</span></div>
        {selected?.mapId===map.id&&<aside className="atlas-detail panel"><button className="atlas-detail-close" onClick={()=>setSelectedKey('')} aria-label="Close location details">×</button><span className="atlas-kicker">{selected.marker.group} · {map.name}</span><h2>{selected.marker.name}</h2><p>Map coordinate {Math.round(selected.marker.x)}, {Math.round(selected.marker.y)}</p><button className="button outline" onClick={()=>openWiki(selected.marker)}><ExternalLink size={15}/>Wiki location</button></aside>}
        {reference&&<aside className="atlas-detail panel"><button className="atlas-detail-close" onClick={()=>setReference(undefined)} aria-label="Close location reference">×</button><span className="atlas-kicker">Known source · Coordinate unavailable</span><h2>{reference.location}</h2><p>Region: {reference.region}. This source is referenced by {reference.items.length} unique {reference.items.length===1?'item':'items'}, but the current atlas has no verified pin for it.</p><p>{reference.items.join(', ')}</p></aside>}
      </section>
    </div>
    <p className="atlas-credit">Map artwork and marker positions: <button onClick={()=>void api.openSource(map.source)}>Dune: Awakening Community Wiki</button>, CC BY-NC-SA 4.0. Dune: Awakening game artwork © <button onClick={()=>void api.openSource('https://www.funcom.com/')}>Funcom Oslo AS</button>. Map coverage reflects the wiki revisions shown above; missing or changing places may not be pinned.</p>
  </div>;
}
