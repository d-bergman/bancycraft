import { useState } from 'react';
import { ExternalLink, Hammer } from 'lucide-react';
import type { ShoppingList } from '../types';
import { catalogs } from '../catalog/catalogs';
import { ItemIcon } from '../catalog/ItemIcon';
import { Dialog } from '../ui/Dialog';
import { api } from '../bridge';
import type { ShoppingRow } from './engine.mjs';
import { buildCraftingTree } from './tree.mjs';
import './tree.css';

export function CraftingTree({ list, row, onClose }: { list: ShoppingList; row: ShoppingRow; onClose: () => void }) {
  const [quantity, setQuantity] = useState(row.required), [selected, setSelected] = useState(row.key), [linkError, setLinkError] = useState('');
  let tree: ReturnType<typeof buildCraftingTree> | undefined, error = '';
  try { tree = buildCraftingTree(list, catalogs[list.game], row, quantity); } catch (e) { error = e instanceof Error ? e.message : 'Unable to build this recipe tree.'; }
  const detail = tree?.nodes.find(node => node.row.key === selected)?.row ?? tree?.nodes[0]?.row;
  return <Dialog title={'Crafting tree · '+row.name} onClose={onClose}><div className="recipe-tree">
    <div className="tree-controls"><label>Quantity to make<input aria-label="Crafting tree quantity" type="number" min="1" max="999999" value={quantity} onChange={e => setQuantity(Number(e.target.value))}/></label><button className="button outline" onClick={() => setQuantity(row.recipe ? row.output : 1)}>One recipe batch</button></div>
    <p className="small muted">Uses your list's selected recipes. Shows the full ingredients for this quantity, before completed work or supplies. Shared ingredients appear once with their combined total. No creature or harvest counts are estimated.</p>
    {error && <p role="alert">{error}</p>}{tree && <><div className="tree-scroll" tabIndex={0} aria-label="Scrollable crafting tree"><div className="tree-canvas" style={{width:tree.width,height:tree.height}}>
      <svg width={tree.width} height={tree.height} aria-hidden="true">{tree.edges.map(({from,to}) => <path key={from.row.key+'>'+to.row.key} d={`M ${from.x+90} ${from.y+108} V ${from.y+133} H ${to.x+90} V ${to.y}`} />)}</svg>
      {tree.nodes.map(({row: node,x,y}) => <button key={node.key} className={'tree-node '+(node.key===detail?.key?'selected':'')} style={{left:x,top:y}} aria-label={`${node.name}: ${node.required} needed${node.recipe ? ', '+(node.recipe.station || 'Station unknown') : ', acquire material'}`} onClick={() => setSelected(node.key)}><span className="tree-node-title"><ItemIcon game={list.game} id={node.item?.id}/><strong>{node.name}</strong></span><span className="tree-node-quantity">× {node.required.toLocaleString()} needed</span><small>{node.recipe ? node.recipe.station || 'Station unknown' : 'Acquire material'}</small></button>)}
    </div></div>{tree.warnings.map(w => <p className="notice compact" key={w}>{w}</p>)}</>}
    {detail && <section className="tree-detail" aria-label="Selected tree item"><h3>{detail.name}</h3>{detail.recipe ? <><p><Hammer size={16}/> {detail.recipe.station || 'Station not recorded'} · {Math.ceil(detail.required / detail.output).toLocaleString()} recipe batches · {detail.output} per batch</p><p className="tree-inputs">Per batch: {detail.recipe.inputs.map(i => `${i.quantity} ${i.name}`).join(' + ')} → {detail.recipe.outputs.map(i => `${i.quantity} ${i.name}`).join(' + ')}</p>{detail.recipe.notes && <p className="small muted">{detail.recipe.notes}</p>}{Math.ceil(detail.required/detail.output)*detail.output>detail.required && <p className="small muted">Batch rounding produces {Math.ceil(detail.required/detail.output)*detail.output-detail.required} extra {detail.name}; extras are not counted as inventory.</p>}</> : <p>{detail.item?.acquisition || 'Acquisition details are not imported. Check the item source; creature and harvest yields are not estimated.'}</p>}<button className="text-button" onClick={async()=>{try{await api.openSource(detail.recipe?.sourceUrl || detail.item?.sourceUrl || catalogs[list.game].source.url);setLinkError('');}catch{setLinkError('Unable to open the source.');}}}>View recipe / item source <ExternalLink size={14}/></button>{linkError && <p role="alert">{linkError}</p>}</section>}
  </div></Dialog>;
}
