export const normalize = value => value.trim().toLocaleLowerCase('en');
export const itemKey = item => `i:${item.id}`;
export function indexCatalog(catalog) {
  const byId = new Map(catalog.items.map(item => [item.id, item]));
  const byName = new Map();
  for (const item of catalog.items) { const name = normalize(item.name); if (!byName.has(name)) byName.set(name, []); byName.get(name).push(item); }
  const resolve = ingredient => ingredient.itemId ? byId.get(ingredient.itemId) : byName.get(normalize(ingredient.name))?.length === 1 ? byName.get(normalize(ingredient.name))[0] : undefined;
  const recipes = new Map();
  for (const recipe of catalog.recipes) for (const output of recipe.outputs) {
    const item = resolve(output); if (!item) continue;
    const key = itemKey(item); if (!recipes.has(key)) recipes.set(key, []);
    recipes.get(key).push({ recipe, output });
  }
  return { byId, byName, recipes, resolve };
}
export function broadType(item, crafted = false) {
  const category = item.category.toLowerCase();
  if (/quest/.test(category)) return 'Quest items';
  if (/sword|weapon|wand|staff|axe|bow|mace|spear|dagger|twohand|onehand/.test(category)) return 'Weapons';
  if (/armou?r|helmet|chest|legs|cape|shield|head|body|boots|gloves/.test(category)) return 'Armor';
  if (/consum|food|potion|drink/.test(category)) return 'Consumables';
  if (/material|resource|seed/.test(category)) return 'Materials';
  return crafted ? 'Crafted items' : 'Other items';
}
export function itemSubtype(item) {
  if (broadType(item) !== 'Weapons') return item.category;
  const name = item.name.toLowerCase(), text = `${item.category} ${item.description} ${item.acquisition}`.toLowerCase();
  const weapon = /greatsword|sword/.test(name) ? 'Sword' : /wand/.test(name) ? 'Wand' : /staff/.test(name) ? 'Staff' : /crossbow|arbalest/.test(name) ? 'Crossbow' : /bow/.test(name) ? 'Bow' : /axe/.test(name) ? 'Axe' : /mace|hammer/.test(name) ? 'Mace / Hammer' : /spear|polearm|pike/.test(name) ? 'Spear / Polearm' : /dagger|knife/.test(name) ? 'Dagger / Knife' : '';
  if (!weapon) return item.category;
  const hands = /two.?handed|2h\b/.test(text) ? 'Two-handed ' : /one.?handed|1h\b/.test(text) ? 'One-handed ' : '';
  return hands + weapon;
}
const MAX_AMOUNT = 1e12;
const checked = value => { if (!Number.isSafeInteger(value) || value < 0 || value > MAX_AMOUNT) throw new Error('This list is too large to calculate safely. Reduce the target quantities.'); return value; };
const sections = ['Vendors', 'Gathering', 'Other sources', 'Pre-crafts', 'Target items'];
export { sections };

// Build a dependency DAG, then combine demand before rounding recipe batches.
// Completed outputs satisfy their own input branches. They never create inventory.
export function buildShoppingList(list, catalog, supplies = []) {
  const index = indexCatalog(catalog), nodes = new Map(), visiting = new Set(), warnings = new Set();
  function visit(item, fallback, depth = 0) {
    const key = item ? itemKey(item) : `n:${normalize(fallback)}`;
    if (nodes.has(key)) return nodes.get(key);
    if (nodes.size >= 2500 || depth > 32) throw new Error('Dependency limit reached. Split this project into smaller lists or choose direct acquisition for some items.');
    const choices = index.recipes.get(key) ?? [];
    const selected = list.recipes[key];
    const chosen = selected === 'gather' ? undefined : choices.find(c => c.recipe.id === selected) ?? choices[0];
    const node = { key, item, name: item?.name ?? fallback, choices, recipe: chosen?.recipe, output: chosen?.output.quantity ?? 1, children: [], required: 0, inherited: 0, completed: 0, owned: 0, marked: 0, remaining: 0, isTarget: false, tier: 0 };
    nodes.set(key, node); visiting.add(key);
    if (chosen) {
      let cyclic = false;
      for (const input of chosen.recipe.inputs) {
        const childItem = index.resolve(input);
        const childKey = childItem ? itemKey(childItem) : `n:${normalize(input.name)}`;
        if (visiting.has(childKey)) { cyclic = true; warnings.add(`Recipe cycle at ${node.name}; acquisition must be checked manually.`); break; }
        const child = visit(childItem, input.name, depth + 1);
        if (child) node.children.push({ key: child.key, quantity: input.quantity });
        else { cyclic = true; break; }
      }
      if (cyclic) { node.children = []; node.recipe = undefined; }
      if (chosen.recipe.outputs.length > 1) warnings.add('Byproducts are shown in the recipe source but are not credited toward other targets.');
    }
    visiting.delete(key); return node;
  }
  for (const target of list.targets) {
    const item = index.byId.get(target.itemId);
    const node = visit(item, target.name);
    if (node) { node.required = checked(node.required + target.quantity); node.isTarget = true; }
    if (!item) warnings.add(`${target.name} is no longer in the catalog; its quantity remains listed for manual checking.`);
  }
  const indegree = new Map([...nodes.keys()].map(key => [key, 0]));
  for (const node of nodes.values()) for (const child of node.children) indegree.set(child.key, indegree.get(child.key) + 1);
  const queue = [...nodes.keys()].filter(key => !indegree.get(key)), order = [];
  while (queue.length) {
    const key = queue.shift(); order.push(key);
    for (const child of nodes.get(key).children) { indegree.set(child.key, indegree.get(child.key) - 1); if (!indegree.get(child.key)) queue.push(child.key); }
  }
  const inventory = new Map();
  if (list.useSupplies) for (const supply of supplies.filter(s => s.game === list.game)) {
    const item = index.resolve(supply); if (!item) continue;
    const key = itemKey(item); inventory.set(key, checked((inventory.get(key) ?? 0) + supply.quantity));
  }
  for (const key of order) {
    const node = nodes.get(key);
    node.inherited = Math.min(node.required, node.inherited);
    const demand = node.required - node.inherited;
    node.owned = Math.min(demand, inventory.get(key) ?? 0);
    node.marked = Math.min(demand - node.owned, list.progress[key] ?? 0);
    node.completed = node.inherited + node.owned + node.marked;
    node.remaining = node.required - node.completed;
    const fullBatches = Math.ceil(node.required / node.output), remainingBatches = Math.ceil(node.remaining / node.output);
    for (const child of node.children) {
      const next = nodes.get(child.key);
      next.required = checked(next.required + fullBatches * child.quantity);
      next.inherited = checked(next.inherited + (fullBatches - remainingBatches) * child.quantity);
    }
  }
  function tier(node, path = new Set()) {
    if (!node.recipe || path.has(node.key)) return 0;
    return 1 + Math.max(0, ...node.children.map(child => tier(nodes.get(child.key), new Set([...path, node.key]))));
  }
  const rows = order.map(key => nodes.get(key)).filter(n => n.required > 0);
  for (const node of rows) {
    node.tier = tier(node);
    const source = `${node.item?.acquisition ?? ''}`;
    node.section = node.isTarget ? 'Target items' : node.recipe ? 'Pre-crafts' : /(?:purchas|bought|sold|buy|vendor|shop)/i.test(source) ? 'Vendors' : node.item && broadType(node.item) === 'Materials' ? 'Gathering' : 'Other sources';
  }
  rows.sort((a, b) => sections.indexOf(a.section) - sections.indexOf(b.section) || a.tier - b.tier || a.name.localeCompare(b.name));
  return { rows, warnings: [...warnings], complete: list.targets.length > 0 && rows.filter(r => r.isTarget).every(r => r.remaining === 0) };
}

export function resetProgress(list, keys, catalog) {
  const { rows } = buildShoppingList(list, catalog);
  const affected = new Set(keys); let changed = true;
  while (changed) {
    changed = false;
    for (const row of rows) if (!affected.has(row.key) && row.children.some(child => affected.has(child.key))) { affected.add(row.key); changed = true; }
  }
  const progress = { ...list.progress }; affected.forEach(key => delete progress[key]);
  return { ...list, progress };
}
