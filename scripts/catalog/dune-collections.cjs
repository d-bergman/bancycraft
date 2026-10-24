const fs = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'src/catalog/data/dune-collections.json');
const catalog = require('../../src/catalog/data/duneawakening.json');
const catalogById = new Map(catalog.items.map(item => [item.id, item]));
const base = 'https://api.awakening.wiki/items?limit=1000&offset=';

function tags(row) {
  try { return JSON.parse(row.item_tags || '[]'); } catch { return []; }
}
function group(row, item) {
  const name = item?.category || '';
  const tag = tags(row).join(' ');
  if (row.vehicle_module_type || /VehicleBase|Vehicles\./i.test(tag) || /Vehicle/i.test(name)) return 'Vehicle';
  if (row.equip_slot || /Armor|Boots|Gloves|Helmet|Stillsuit|Garment|Leggings/i.test(name) || /Items\.Clothes\./i.test(tag)) return 'Armor';
  if (row.weapon_type || /Weapon/i.test(name) || /MeleeWeapons|RangedWeapons/i.test(tag)) return 'Weapons';
  if (row.utility_type || /Utility|Tool|Shield|Belt|Power Pack/i.test(name) || /UtilityTools|HydrationTools/i.test(tag)) return 'Utility';
  return 'Other';
}
function family(row, bucket) {
  const tag = tags(row).find(value => /Items\.(?:Holsters|Clothes|Deployables)/.test(value)) || '';
  const bits = tag.split('.');
  if (bucket === 'Weapons') {
    const start = bits.indexOf('RangedWeapons') >= 0 ? bits.indexOf('RangedWeapons') : bits.indexOf('MeleeWeapons');
    const parts = start >= 0 ? bits.slice(start + 1).filter(v => !['Light', 'Heavy'].includes(v)) : [];
    return parts.length ? parts.join(' · ') : row.weapon_type || 'Weapon';
  }
  if (bucket === 'Armor') return [row.garment_type, row.equip_slot].filter(Boolean).join(' · ') || bits.at(-1) || 'Armor';
  if (bucket === 'Vehicle') return row.vehicle_module_type || bits.at(-1) || 'Vehicle';
  if (bucket === 'Utility') return row.utility_type || bits.at(-1) || 'Utility';
  return 'Other';
}
function location(acquisition) {
  const source = String(acquisition || '');
  const match = source.match(/(?:the )?schematic (?:is|can be|can only be) found\s+(?:in|at|from|on)?\s*(.+?)(?=\s+with a drop chance|,?\s+and can be found|,?\s+or on The Exchange|\.\s|$)/i);
  const raw = match?.[1]?.replace(/^[\s,]+|[\s,.]+$/g, '') || '';
  if (!raw || /\[(?:LOCATION|PLACE|CHANCE)\]|TBD|unknown/i.test(raw)) return '';
  return raw.slice(0, 180);
}
function unique(row) {
  if (/\bSchematic$/i.test(row.name || '')) return false;
  if (row.unique_schematic === 'Yes') return true;
  const t = tags(row);
  return /Unique/i.test(row.item_id || '') && t.includes('Rarity.Rare') && !t.some(x => /CraftedResources|Loot\.Component|RawResources/.test(x));
}

async function run() {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const response = await fetch(base + offset, {headers: {'User-Agent': 'BancyCraft catalog importer; https://github.com/d-bergman/bancycraft'}, signal: AbortSignal.timeout(45000)});
    if (!response.ok) throw Error('Wiki item API returned ' + response.status);
    const data = await response.json();
    rows.push(...data.list);
    if (data.pageInfo.isLastPage) break;
  }
  const seen = new Set();
  const items = rows.filter(row => row.item_id && row.name && catalogById.has(row.item_id)).map(row => {
    const item = catalogById.get(row.item_id);
    const bucket = group(row, item);
    return {id: item.id, name: item.name, group: bucket, family: family(row, bucket), tier: Number(tags(row).find(tag => /^LootTier\.\d+$/.test(tag))?.split('.')[1]) || null, unique: unique(row), location: location(item.acquisition), acquisition: item.acquisition || '', sourceUrl: item.sourceUrl, description: item.description || ''};
  }).filter(item => {if (seen.has(item.id)) return false; seen.add(item.id); return true;});
  const result = {schemaVersion: 1, generatedAt: new Date().toISOString(), source: {name: 'Dune: Awakening Community Wiki item API and BancyCraft catalog', url: 'https://awakening.wiki/', license: 'CC BY-NC-SA 4.0; game materials © Funcom Oslo AS'}, items};
  await fs.writeFile(output, JSON.stringify(result, null, 2) + '\n');
  const uniques = items.filter(item => item.unique);
  console.log(JSON.stringify({allItems: items.length, uniques: uniques.length, withTier: uniques.filter(item => item.tier).length, withLocation: uniques.filter(item => item.location).length, groups: Object.fromEntries([...new Set(uniques.map(x => x.group))].map(group => [group, uniques.filter(x => x.group === group).length]))}));
}
if (require.main === module) run().catch(error => {console.error(error); process.exitCode = 1;});
module.exports = {tags, group, family, location, unique};
