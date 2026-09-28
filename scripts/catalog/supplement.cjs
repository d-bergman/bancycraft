// Release-time audit: fill only explicit, numeric source recipes. Never guess drop yields.
const fs = require('node:fs/promises'), path = require('node:path'), crypto = require('node:crypto');
const { load } = require('cheerio');
const { templates, plain, quantity } = require('./parse.cjs');
const root = path.resolve(__dirname, '../..'), cache = path.join(root, '.catalog-cache');
function document(html) {
  const $ = load(html);
  // React's streamed HTML contains inert placeholders. Move content without executing scripts.
  for (const m of html.matchAll(/\$RS\("([^"]+)","([^"]+)"\)/g)) {
    const content = $('[id="' + m[1] + '"]'); $('[id="' + m[2] + '"]').replaceWith(content.contents()); content.remove();
  }
  return $;
}
async function request(url) {
  const file = path.join(cache, crypto.createHash('sha256').update(url).digest('hex') + '.json');
  try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch {}
  await new Promise(r => setTimeout(r, 250));
  const response = await fetch(url, { headers: { 'User-Agent': 'BancyCraft catalog audit; https://github.com/d-bergman/bancycraft' }, signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw Error(`${response.status}: ${url}`);
  const record = { url, fetchedAt: new Date().toISOString(), text: await response.text() };
  await fs.writeFile(file, JSON.stringify(record)); return record;
}
function production(html, catalog, sourceUrl) {
  const $ = document(html), station = $('h1').first().text().trim();
  const byName = new Map(catalog.items.filter(i => !/^(?:FW|SP)_/.test(i.id)).map(i => [i.name.toLowerCase(), i]));
  const fuel = $('h2').filter((_, h) => $(h).text() === 'Fuel').parent().find('a').first().text().trim();
  const fuelAmount = quantity($('dt').filter((_, d) => $(d).text() === 'Fuel per product').next('dd').text().trim());
  const recipes = [];
  $('table').filter((_, t) => $(t).find('thead').text().includes('Input quantity')).find('tbody > tr').each((_, tr) => {
    const cells = $(tr).children('td').map((_, td) => $(td).text().trim()).get();
    if (cells.length !== 5) return;
    const input = byName.get(cells[0].toLowerCase()), output = byName.get(cells[2].toLowerCase());
    const count = quantity(cells[1]), amount = quantity(cells[3]), fuelItem = byName.get(fuel.toLowerCase());
    if (!output || !amount) return;
    const inputs = input && count ? [{ name: input.name, itemId: input.id, quantity: count }] : [];
    if (fuelAmount && fuelItem) inputs.push({ name: fuelItem.name, itemId: fuelItem.id, quantity: fuelAmount });
    if (!inputs.length || (!input && cells[0] !== 'No input item')) return;
    recipes.push({ id: `Processing:${station}:${output.id}:${input?.id || 'fuel'}`, station,
      notes: `Versioned processing data: Valheim 1.0.12. ${fuel && !fuelAmount ? `Requires ${fuel}; operating fuel depends on occupied slots and time and is additional to these ingredients. ` : ''}Nominal processing time: ${cells[4]} seconds.`,
      inputs, outputs: [{ name: output.name, itemId: output.id, quantity: amount }], sourceUrl });
  });
  return recipes;
}
async function run() {
  const valheim = JSON.parse(await fs.readFile(path.join(root, 'src/catalog/data/valheim.json'), 'utf8'));
  valheim.recipes = valheim.recipes.filter(r => !r.id.startsWith('Processing:'));
  const provenance = [];
  for (const slug of ['frost-foundry', 'blast-furnace', 'smelter', 'spinning-wheel', 'windmill', 'eitr-refinery', 'charcoal-kiln', 'frigid-kiln', 'fermenter', 'stone-oven', 'cooking-station', 'iron-cooking-station']) {
    const url = 'https://corpus.gg/games/valheim/building/' + slug, record = await request(url);
    const recipes = production(record.text, valheim, url);
    if (!recipes.length) throw Error('Missing explicit production table: ' + slug);
    valheim.recipes.push(...recipes);
    provenance.push({ url, fetchedAt: record.fetchedAt, sha256: crypto.createHash('sha256').update(record.text).digest('hex'), recipes: recipes.length });
    console.log(slug, recipes.length);
  }
  valheim.coverage = 'Jötunn 1.0.7 inventory and initial crafting recipes, matched by prefab ID or unique localized name. Corpus 1.0.12 versioned game-extraction processing tables connect casts, metals, cloth, food and mead. Fixed fuel amounts are included; time-dependent fuel is noted separately. Upgrade costs and acquisition coverage remain incomplete.';
  valheim.importedAt = new Date().toISOString();
  await fs.writeFile(path.join(root, 'src/catalog/data/valheim.json'), JSON.stringify(valheim, null, 2) + '\n');
  const enshrouded = JSON.parse(await fs.readFile(path.join(root, 'src/catalog/data/enshrouded.json'), 'utf8'));
  const outputs = new Set(enshrouded.recipes.flatMap(r => r.outputs.map(o => o.name)));
  let added = 0;
  for (const file of await fs.readdir(cache)) {
    const record = JSON.parse(await fs.readFile(path.join(cache, file), 'utf8'));
    if (!record.url?.includes('enshrouded') || !record.url.includes('rvprop')) continue;
    for (const page of Object.values(JSON.parse(record.text).query.pages || {})) {
      if (outputs.has(page.title) || !enshrouded.items.some(i => i.name === page.title)) continue;
      for (const [index, t] of templates(page.revisions?.[0]?.slots.main['*'] || '').filter(t => t.name === 'crafting').entries()) {
        const f = t.fields, amount = quantity(f['crafted quantity'], 1);
        const inputs = (f.ingredients || '').split(',').map(part => {
          const m = part.trim().match(/^(.+):\s*(\d+)$/); return m ? { name: plain(m[1], page.title), quantity: Number(m[2]) } : null;
        });
        if (!amount || !inputs.length || inputs.some(i => !i?.name || !i.quantity)) continue;
        enshrouded.recipes.push({ id: `Explicit:${page.title}:${index}`, station: plain(f.crafter || f.workshop), notes: 'Explicit item-page recipe; crafting time: ' + plain(f['crafting time'] || 'not specified'), inputs, outputs: [{ name: page.title, quantity: amount }], sourceUrl: 'https://enshrouded.wiki.gg/wiki/' + encodeURIComponent(page.title.replaceAll(' ', '_')) });
        outputs.add(page.title); added++;
      }
    }
  }
  enshrouded.coverage += ' Supplemental explicit item-page Crafting templates fill outputs missing from Cargo. Obtaining and Source sections provide acquisition prose.';
  await fs.writeFile(path.join(root, 'src/catalog/data/enshrouded.json'), JSON.stringify(enshrouded, null, 2) + '\n');
  await fs.writeFile(path.join(root, 'src/catalog/data/processing-provenance.json'), JSON.stringify(provenance, null, 2) + '\n');
  console.log('Valheim recipes', valheim.recipes.length, 'Enshrouded added', added);
}
module.exports = { document, production };
if (require.main === module) run().catch(e => { console.error(e); process.exitCode = 1; });
