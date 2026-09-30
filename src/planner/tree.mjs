import { buildShoppingList } from './engine.mjs';

// The shopping list is a dependency DAG with shared materials counted once.
// The diagram shows every recipe input under its parent, including shared inputs.
export function buildCraftingTree(list, catalog, target, quantity) {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 999999) throw new Error('Choose a whole quantity from 1 to 999,999.');
  const calculation = buildShoppingList({ ...list, targets: [{...list.targets.find(t=>t.itemId===target.item?.id),itemId: target.item?.id ?? '', name: target.name, quantity}], progress: {}, owned: {}, useSupplies: false }, catalog);
  const rows = new Map(calculation.rows.map(row => [row.key, row]));
  const root = calculation.rows.find(row => row.isTarget);
  if (!root) throw new Error('This item is unavailable in the catalog.');
  let count = 0;
  function expand(source, amount, key, depth) {
    if (++count > 250 || depth > 32) throw new Error('This recipe tree is too large. View one of its pre-crafts instead.');
    const row = {...source, key, required:amount};
    const batches = Math.ceil(amount / source.output);
    const children = source.children.map((ingredient, index) => {
      const child = rows.get(ingredient.key);
      if (!child) throw new Error('A recipe ingredient is missing from the catalog. Check the source.');
      return expand(child, batches * ingredient.quantity, `${key}/${index}`, depth + 1);
    });
    return {row,children,width:Math.max(208,children.reduce((total,child)=>total+child.width,0))};
  }
  const expanded = expand(root, quantity, 'root', 0);
  const nodes = [], edges = [];
  let maxDepth = 0;
  function position(branch,left,depth,parent) {
    const x = left + branch.width / 2 - 90, y = 22 + depth * 160;
    const node = {row:branch.row,x,y};
    nodes.push(node); maxDepth = Math.max(maxDepth,depth);
    if (parent) edges.push({from:parent,to:node});
    let next = left;
    for (const child of branch.children) {position(child,next,depth+1,node);next+=child.width;}
  }
  position(expanded,14,0,null);
  return { nodes, edges, width:Math.max(440,expanded.width+28), height:(maxDepth+1)*160, warnings:calculation.warnings };
}
