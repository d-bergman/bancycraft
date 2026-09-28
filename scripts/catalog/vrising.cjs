const fs = require('fs/promises'), path = require('path'), crypto = require('crypto'), sharp = require('sharp');
const { templates, plain } = require('./parse.cjs');
const { id, frames, recipes } = require('./vrising-parse.cjs');
const { api, rawPages, base, root, provenance } = require('./vrising-api.cjs');
const source = t => base + '/w/' + encodeURIComponent(t.replaceAll(' ', '_'));
async function run() {
    const pages = await rawPages(), rights = (await api({ action: 'query', meta: 'siteinfo', siprop: 'rightsinfo' })).query.rightsinfo;
    const items = new Map(), rows = new Map(), sets = [], imageNames = new Map();
    let missingInputs = 0;
    function add(name, data = {}) { if (!name)
        return; const existing = items.get(name) || { id: id(name), name, category: 'Item', description: '', acquisition: 'Acquisition details are not imported; check the source. No creature or harvest counts are estimated.', sourceUrl: source(name) }; Object.assign(existing, data); items.set(name, existing); }
    for (const p of pages) {
        const text = p.revisions?.[0]?.slots?.main['*'] || '', box = templates(text).find(t => ['iteminfobox', 'weaponinfobox', 'equipmentinfobox'].includes(t.name));
        if (!box || plain(box.fields.category) === 'Removed' || /\[\[Category:Removed\]\]/i.test(text))
            continue;
        const isSet = /Armou?r Set$/i.test(p.title), data = { category: box.name === 'weaponinfobox' ? 'Weapon · ' + plain(box.fields.weapon_type) : box.name === 'equipmentinfobox' ? 'Armor · ' + (plain(box.fields.type) || 'Equipment') : (/^(Tailoring|Alchemy|Herb|Flower|Fish|Gem|Blood Essence)$/i.test(plain(box.fields.category)) ? 'Materials · ' : '') + (plain(box.fields.category) || 'Material'), description: plain(box.fields.description, p.title), acquisition: plain(text.slice(box.end).split(/^==/m)[0], p.title).slice(0, 1200), sourceUrl: source(p.title), revision: p.revisions[0].revid, updatedAt: p.revisions[0].timestamp };
        if (!isSet)
            add(p.title, data);
        const crafting = text.match(/^==\s*Crafting\s*==\s*\n([\s\S]*?)(?=^==[^=]|$(?![\s\S]))/gm)?.[0] || '';
        const parsed = recipes(crafting, p.title).filter(r => isSet || r.outputs.some(o => o.name === p.title));
        for (const recipe of parsed) {
            for (const f of [...recipe.frameOutputs, ...recipe.frameInputs]) {
                if (/structure/i.test(f.type))
                    continue;
                add(f.name, items.has(f.name) ? {} : { sourceUrl: source(p.title), revision: p.revisions[0].revid, updatedAt: p.revisions[0].timestamp, acquisition: isSet ? data.acquisition : 'Acquisition details are not imported; check the source. No creature or harvest counts are estimated.' });
                if (f.type !== 'Item' && items.get(f.name).category === 'Item')
                    items.get(f.name).category = f.type === 'Armour' ? 'Armor' : f.type;
                imageNames.set(f.name, f.type + ' ' + f.name.replaceAll(' ', ''));
            }
            const { sourceTitle, frameOutputs, frameInputs, ...clean } = recipe;
            clean.sourceUrl = source(sourceTitle);
            rows.set(clean.id, clean);
        }
        if (isSet) {
            const names = [...new Set(parsed.flatMap(r => r.frameOutputs.filter(f => /armour|cloak|head/i.test(f.type)).map(f => f.name)))];
            if (names.length >= 2)
                sets.push({ name: p.title, kind: /cosmetic/i.test(text) ? 'Cosmetic' : 'Armor', ids: names.map(id), alternatives: {}, sourceUrl: source(p.title) });
        }
        if (box.name !== 'equipmentinfobox')
            imageNames.set(p.title, (box.name === 'weaponinfobox' ? 'Weapon' : 'Item') + ' ' + p.title.replaceAll(' ', ''));
    }
    // Ensure all referenced inventory materials exist, with explicit source attribution.
    for (const recipe of rows.values())
        for (const f of [...recipe.inputs, ...recipe.outputs])
            if (!items.has(f.name))
                add(f.name, { sourceUrl: recipe.sourceUrl });
    const catalog = { schemaVersion: 1, game: 'vrising', importedAt: new Date().toISOString(), source: { name: 'V Rising Wiki', url: base + '/', license: 'CC BY-SA 4.0 (wiki text/data); game images belong to Stunlock Studios', licenseUrl: rights.url }, coverage: 'Item, weapon and equipment infoboxes and explicit crafting tables, including named armor-set pieces; removed pages and potentially stale ingredient-use tables are excluded. Standard base costs; floor, room and server crafting modifiers are not applied. Alternatives and multi-output byproducts are preserved. Missing acquisition and unlock information is not inferred. Not every wiki item has a recipe.', items: [...items.values()].sort((a, b) => a.name.localeCompare(b.name)), recipes: [...rows.values()] };
    await fs.writeFile(path.join(root, 'src/catalog/data/vrising.json'), JSON.stringify(catalog, null, 2) + '\n');
    const gearsets = JSON.parse(await fs.readFile(path.join(root, 'src/catalog/data/gearsets.json'), 'utf8'));
    gearsets.vrising = sets;
    await fs.writeFile(path.join(root, 'src/catalog/data/gearsets.json'), JSON.stringify(gearsets, null, 2) + '\n');
    console.log('V Rising imported', catalog.items.length, 'items', catalog.recipes.length, 'recipes', sets.length, 'sets');
    const files = [];
    let next = {};
    do {
        const j = await api({ action: 'query', list: 'allimages', ailimit: 500, aiprop: 'url', ...next });
        files.push(...j.query.allimages);
        next = j.continue;
    } while (next);
    const normalized = n => n.toLowerCase().replace(/[^a-z0-9]/g, ''), imageMap = new Map(files.map(f => [normalized(f.name.replace(/\.\w+$/, '')), f.url])), icons = JSON.parse(await fs.readFile(path.join(root, 'src/catalog/data/icons.json'), 'utf8'));
    icons.vrising = {};
    const failures = [], sources = [];
    let cursor = 0;
    async function worker() { while (cursor < catalog.items.length) {
        const item = catalog.items[cursor++], n = imageNames.get(item.name);
        const url = [n, ...['Item', 'Weapon', 'Armour', 'Cloak', 'Head', 'Jewelry', 'Jewel', 'Gem'].map(t => t + ' ' + item.name)].filter(Boolean).map(n => imageMap.get(normalized(n))).find(Boolean);
        if (!url)
            continue;
        const name = crypto.createHash('sha256').update('vrising:' + item.id).digest('hex').slice(0, 20) + '.webp', file = path.join(root, 'public/assets/items', name);
        try {
            try {
                await fs.access(file);
            }
            catch {
                const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
                if (!r.ok)
                    throw Error(r.status);
                await sharp(Buffer.from(await r.arrayBuffer())).resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, withoutEnlargement: true }).webp({ quality: 85 }).toFile(file);
                await new Promise(r => setTimeout(r, 120));
            }
            icons.vrising[item.id] = './assets/items/' + name;
            sources.push({ item: item.id, url });
        }
        catch (e) {
            failures.push({ item: item.id, url, error: e.message });
        }
    } }
    await Promise.all([worker(), worker(), worker()]);
    await fs.writeFile(path.join(root, 'src/catalog/data/icons.json'), JSON.stringify(icons, null, 2) + '\n');
    await fs.writeFile(path.join(root, '.catalog-cache/vrising-provenance.json'), JSON.stringify({ sources: [...provenance.values()], images: sources, failures }, null, 2));
    console.log('V Rising local icons', Object.keys(icons.vrising).length, 'download failures', failures.length);
}
if (require.main === module)
    run().catch(e => { console.error(e); process.exitCode = 1; });
module.exports = { run };
