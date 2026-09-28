import { buildShoppingList } from './engine.mjs';

// Calculate one selected output with the same batch aggregation and recipe choices as lists.
// Each material appears once; converging branches share its node instead of duplicating stock.
export function buildCraftingTree(list, catalog, target, quantity) {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 999999) throw new Error('Choose a whole quantity from 1 to 999,999.');
  const calculation = buildShoppingList({ ...list, targets: [{...list.targets.find(t=>t.itemId===target.item?.id),itemId: target.item?.id ?? '', name: target.name, quantity}], progress: {}, owned: {}, useSupplies: false }, catalog);
  const rows = new Map(calculation.rows.map(row => [row.key, row]));
  const root = calculation.rows.find(row => row.isTarget);
  if (!root) throw new Error('This item is unavailable in the catalog.');
  if (rows.size > 150) throw new Error('This tree has more than 150 materials. View one of its pre-crafts instead.');
  const levels = new Map([[root.key, 0]]), queue = [root.key];
  while (queue.length) {
    const key = queue.shift(), level = levels.get(key);
    if (level > 32) throw new Error('Recipe depth limit reached. Check the source.');
    for (const child of rows.get(key).children) {
      if ((levels.get(child.key) ?? -1) < level + 1) { levels.set(child.key, level + 1); queue.push(child.key); }
    }
  }
  const layers = [];
  for (const [key, level] of levels) { (layers[level] ??= []).push(rows.get(key)); }
  const width = Math.max(440, ...layers.map(layer => layer.length * 208 + 24));
  const nodes = layers.flatMap((layer, level) => layer.map((row, column) => ({ row, x: (width - layer.length * 208) / 2 + column * 208 + 14, y: 22 + level * 160 })));
  const positions = new Map(nodes.map(node => [node.row.key, node]));
  const edges = nodes.flatMap(parent => parent.row.children.map(child => ({ from: parent, to: positions.get(child.key) })));
  return { nodes, edges, width, height: layers.length * 160, warnings: calculation.warnings };
}
