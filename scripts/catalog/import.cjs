// Run manually at release time. The installed app never scrapes the sources.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { load } = require('cheerio');
const { templates, plain, quantity, dragonRecipes } = require('./parse.cjs');
const root = path.resolve(__dirname, '../..');
const cache = path.join(root, '.catalog-cache');
const output = path.join(root, 'src/catalog/data');
const refresh = process.argv.includes('--refresh');
let requests = 0;
const provenance = new Map();
async function request(url) {
  const key = crypto.createHash('sha256').update(url).digest('hex');
  const file = path.join(cache, key + '.json');
  let record;
  if (!refresh) { try { record = JSON.parse(await fs.readFile(file, 'utf8')); } catch {} }
  if (!record) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const response = await fetch(url, { headers: { 'User-Agent': 'BancyCraft/0.2.0 (offline catalog importer; https://github.com/d-bergman/bancycraft)' }, signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    record = { url, fetchedAt: new Date().toISOString(), text: await response.text() };
    await fs.writeFile(file, JSON.stringify(record)); requests++;
  }
  provenance.set(url, { url, fetchedAt: record.fetchedAt, sha256: crypto.createHash('sha256').update(record.text).digest('hex') });
  return record.text;
}
async function api(base, params) {
  const data = JSON.parse(await request(`${base}/api.php?${new URLSearchParams({ ...params, format: 'json' })}`));
  if (data.error) throw new Error(JSON.stringify(data.error)); return data;
}
async function list(base, params, key) {
  let continuation = {}, result = [];
  do { const data = await api(base, { action: 'query', ...params, ...continuation }); result.push(...data.query[key]); continuation = data.continue; } while (continuation);
  return result;
}
async function pages(base, ids) {
  const result = [];
  for (let i = 0; i < ids.length; i += 50) {
    const data = await api(base, { action: 'query', pageids: ids.slice(i, i + 50).join('|'), prop: 'revisions', rvprop: 'ids|timestamp|content', rvslots: 'main' });
    result.push(...Object.values(data.query.pages));
    if (i % 500 === 0) console.log(`${base}: ${Math.min(i + 50, ids.length)}/${ids.length} pages`);
  }
  return result;
}
const article = (base, title, prefix = '/wiki/') => base + prefix + encodeURIComponent(title.replaceAll(' ', '_')).replaceAll('%2F', '/');
function wikiItem(page, kind) {
  const revision = page.revisions?.[0]; const text = revision?.slots.main['*'] ?? '';
  const box = templates(text).find(t => kind === 'dragonwilds' ? t.name === 'infobox item' : ['item infobox', 'armor infobox'].includes(t.name));
  if (!box) return null;
  const f = box.fields, base = kind === 'dragonwilds' ? 'https://dragonwilds.runescape.wiki' : 'https://enshrouded.wiki.gg';
  const name = page.title;
  const obtaining = kind === 'dragonwilds' ? text.slice(box.end).split(/\n==/)[0] : text.match(/==\s*Obtaining\s*==([\s\S]*?)(?=\n==|$)/i)?.[1] ?? '';
  // Only the wiki's explicit obtaining prose is imported; dynamic drop tables are not guessed.
  const acquisition = plain(obtaining, name).slice(0, 1800);
  return { id: String(page.pageid), name, category: plain(f.item_type || f.type || (box.name === 'armor infobox' ? 'Armor' : 'Item')) || 'Item', description: plain(f.description, name), acquisition, sourceUrl: article(base, name, kind === 'dragonwilds' ? '/w/' : '/wiki/'), revision: revision.revid, updatedAt: revision.timestamp };
}
async function write(game, data) {
  const catalog = { schemaVersion: 1, game, importedAt: new Date().toISOString(), ...data };
  catalog.items.sort((a, b) => a.name.localeCompare(b.name, 'en'));
  if (!catalog.items.length) throw new Error(`Empty ${game} catalog`);
  await fs.writeFile(path.join(output, game + '.json'), JSON.stringify(catalog, null, 2) + '\n');
  console.log(`${game}: ${catalog.items.length} items, ${catalog.recipes.length} recipes`);
}
async function dragonwilds() {
  const base = 'https://dragonwilds.runescape.wiki';
  const rights = (await api(base, { action: 'query', meta: 'siteinfo', siprop: 'rightsinfo' })).query.rightsinfo;
  const members = await list(base, { list: 'categorymembers', cmtitle: 'Category:Items', cmtype: 'page', cmlimit: 500 }, 'categorymembers');
  const source = await pages(base, members.map(p => p.pageid));
  const items = source.map(p => wikiItem(p, 'dragonwilds')).filter(Boolean);
  const recipes = source.flatMap(p => dragonRecipes(p.revisions?.[0]?.slots.main['*'] ?? '', p.title).map(r => ({ ...r, sourceUrl: article(base, p.title, '/w/') })));
  await write('dragonwilds', { source: { name: 'RuneScape: Dragonwilds Wiki contributors', url: base, license: rights.text, licenseUrl: rights.url }, coverage: 'Item pages in Category:Items. Explicit Recipe templates are included; dynamic drop tables and recipes on other page types are not yet imported.', items, recipes });
}
async function enshrouded() {
  const base = 'https://enshrouded.wiki.gg';
  const rights = (await api(base, { action: 'query', meta: 'siteinfo', siprop: 'rightsinfo' })).query.rightsinfo;
  const ids = new Set();
  for (const title of ['Template:Item Infobox', 'Template:Armor Infobox']) {
    const members = await list(base, { list: 'embeddedin', eititle: title, einamespace: 0, eilimit: 500 }, 'embeddedin');
    members.forEach(p => ids.add(p.pageid));
  }
  const source = await pages(base, [...ids].sort((a, b) => a - b));
  const items = source.map(p => wikiItem(p, 'enshrouded')).filter(Boolean);
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const data = await api(base, { action: 'cargoquery', tables: 'Ingredients', fields: 'Ingredients._ID=RowID,Ingredients._pageName=Page,CraftedItem,CraftedQuantity,SourceItem,SourceQuantity,Crafter,Workshop,Workshop2,CraftingTime,RecipeID', order_by: 'Ingredients._ID', limit: 500, offset });
    rows.push(...data.cargoquery.map(r => r.title)); if (data.cargoquery.length < 500) break;
  }
  const grouped = new Map();
  for (const row of rows) {
    const key = `${row.Page}:${row.RecipeID}`;
    if (!grouped.has(key)) grouped.set(key, []); grouped.get(key).push(row);
  }
  const recipes = [...grouped].flatMap(([id, rows]) => {
    const first = rows[0];
    const inputs = rows.map(r => ({ name: plain(r.SourceItem), quantity: quantity(r.SourceQuantity) }));
    const amount = quantity(first.CraftedQuantity);
    if (!amount || inputs.some(i => !i.name || !i.quantity) || rows.some(r => r.CraftedItem !== first.CraftedItem || r.CraftedQuantity !== first.CraftedQuantity)) return [];
    return [{ id, station: [first.Crafter, first.Workshop, first.Workshop2].filter(Boolean).map(s => plain(s)).join(' · '), notes: first.CraftingTime ? `Crafting time: ${plain(first.CraftingTime)}` : '', inputs, outputs: [{ name: plain(first.CraftedItem), quantity: amount }], sourceUrl: article(base, first.Page) }];
  });
  await write('enshrouded', { source: { name: 'Enshrouded Wiki contributors', url: base, license: rights.text, licenseUrl: rights.url }, coverage: 'Pages using Item Infobox or Armor Infobox, plus numeric recipes in the Ingredients table. Unlock conditions and dynamic drop tables are not fully imported.', items, recipes });
}
async function valheim() {
  const base = 'https://valheim-modding.github.io/Jotunn/data/objects/';
  const html = await request(base + 'item-list.html'); const $ = load(html); const items = [];
  $('tbody tr').each((_, tr) => {
    const cells = $(tr).find('td'); const text = cells.map((_, td) => $(td).text().trim()).get();
    // Jotunn also documents creature attacks; only localized inventory entries with icons belong in this browser.
    if (text.length !== 6 || (!text[2].startsWith('$item_') || text[3].startsWith('[')) || !cells.eq(0).find('img').length) return;
    items.push({ id: text[0], name: text[3], category: text[4], description: text[5] === 'NULL' ? '' : plain(text[5]), acquisition: '', sourceUrl: base + 'item-list.html' });
  });
  const byId = new Map(items.map(i => [i.id, i])); const recipes = [];
  const r$ = load(await request(base + 'recipe-list.html'));
  r$('tbody tr').each((_, tr) => {
    const cells = r$(tr).find('td'); const id = cells.eq(0).text().trim();
    const item = byId.get(id.replace(/^Recipe_/, '')); const amount = quantity(cells.eq(3).text().trim());
    if (!item || !amount || cells.eq(2).text().trim() !== item.name) return;
    const lists = cells.eq(4).find('ul'); const inputs = [];
    lists.first().find('li').each((_, li) => { const match = r$(li).text().trim().match(/^(\d+) (.+)$/); inputs.push(match ? { quantity: Number(match[1]), name: match[2] } : null); });
    if (!inputs.length || inputs.some(i => !i || !i.quantity)) return;
    recipes.push({ id, station: '', notes: lists.length > 1 ? 'Initial craft (level 1). Upgrade costs are not included.' : '', inputs, outputs: [{ name: item.name, itemId: item.id, quantity: amount }], sourceUrl: base + 'recipe-list.html' });
  });
  const version = ($.text().match(/generated from (Valheim [\d.]+)/)?.[1] || '');
  await write('valheim', { source: { name: 'Jötunn generated Valheim data', url: base + 'item-list.html', license: 'Jötunn documentation / MIT project; game text belongs to its respective owners', licenseUrl: 'https://github.com/Valheim-Modding/Jotunn/blob/master/LICENSE', version }, coverage: 'Localized inventory entries with icons in Jötunn. Initial recipes with matching prefab IDs; crafting stations, processing conversions, upgrade costs and acquisition sources are not provided by these tables.', items, recipes });
}
(async () => {
  await fs.mkdir(cache, { recursive: true }); await fs.mkdir(output, { recursive: true });
  // Sequential source imports keep public API load modest. Reuse cached responses unless --refresh is passed.
  const selected = process.argv.find(arg => ['dragonwilds', 'enshrouded', 'valheim'].includes(arg));
  for (const [name, run] of Object.entries({ dragonwilds, enshrouded, valheim })) if (!selected || selected === name) await run();
  await fs.writeFile(path.join(output, selected ? `${selected}-provenance.json` : 'provenance.json'), JSON.stringify([...provenance.values()], null, 2) + '\n');
  console.log(`Complete. ${requests} network requests; other responses reused from cache.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
