const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const { templates } = require('./parse.cjs');
const root = path.resolve(__dirname, '../..');
const ua = 'BancyCraft/0.3.0 (offline item icons; https://github.com/d-bergman/bancycraft)';
const output = path.join(root, 'public/assets/items');
const filename = text => text.replace(/^File:/i, '').replace(/\{\{(?:SUB)?PAGENAME\}\}/gi, '').trim();
async function fetchJson(url) { const response = await fetch(url, { headers: { 'User-Agent': ua }, signal: AbortSignal.timeout(60000) }); if (!response.ok) throw new Error(`${response.status} ${url}`); const data = await response.json(); if (data.error) throw new Error(data.error.info); return data; }
(async () => {
  await fs.mkdir(output, { recursive: true });
  const previous=JSON.parse(await fs.readFile(path.join(root,'src/catalog/data/icons.json'),'utf8')); const images = { dragonwilds: {}, enshrouded: {}, valheim: {}, grounded2:previous.grounded2||{} };
  const cachedPages = { dragonwilds: new Map(), enshrouded: new Map() };
  for (const file of await fs.readdir(path.join(root, '.catalog-cache'))) {
    const record = JSON.parse(await fs.readFile(path.join(root, '.catalog-cache', file), 'utf8'));
    if (!record.url?.includes('rvprop')) continue;
    const game = record.url.includes('enshrouded') ? 'enshrouded' : 'dragonwilds';
    for (const page of Object.values(JSON.parse(record.text).query.pages)) {
      const box = templates(page.revisions?.[0]?.slots.main['*'] || '').find(t => ['infobox item', 'item infobox', 'armor infobox'].includes(t.name));
      if (!box) continue;
      const raw = box.fields.image || box.fields.images || `${page.title}.png`;
      const value = raw.replace(/\{\{(?:SUB)?PAGENAME\}\}/gi, page.title.split('/').pop()).split(',')[0].split(':')[0].trim();
      if (value && !/[{}|]/.test(value)) cachedPages[game].set(String(page.pageid), filename(value));
    }
  }
  for (const game of ['dragonwilds', 'enshrouded', 'valheim']) {
    const catalog = JSON.parse(await fs.readFile(path.join(root, `src/catalog/data/${game}.json`), 'utf8'));
    const urls = new Map();
    if (game === 'valheim') catalog.items.forEach(item => urls.set(item.id, `https://valheim-modding.github.io/Jotunn/Documentation/images/items/${encodeURIComponent(item.id)}.png`));
    else {
      const base = game === 'dragonwilds' ? 'https://dragonwilds.runescape.wiki' : 'https://enshrouded.wiki.gg';
      const names = [...new Set(catalog.items.map(i => cachedPages[game].get(i.id)).filter(Boolean))];
      const imageUrls = new Map();
      for (let i = 0; i < names.length; i += 50) {
        const data = await fetchJson(base + '/api.php?' + new URLSearchParams({ action: 'query', titles: names.slice(i, i + 50).map(n => `File:${n}`).join('|'), prop: 'imageinfo', iiprop: 'url', iiurlwidth: 96, format: 'json', redirects: '1' }));
        for (const page of Object.values(data.query.pages)) { const info = page.imageinfo?.[0]; if (info) imageUrls.set(page.title.replace(/^File:/, '').replaceAll('_', ' '), info.thumburl || info.url); }
        for (const redirect of data.query.redirects ?? []) { const target = imageUrls.get(redirect.to.replace(/^File:/, '').replaceAll('_', ' ')); if (target) imageUrls.set(redirect.from.replace(/^File:/, '').replaceAll('_', ' '), target); }
        await new Promise(r => setTimeout(r, 200));
      }
      catalog.items.forEach(item => { const url = imageUrls.get((cachedPages[game].get(item.id) || '').replaceAll('_', ' ')); if (url) urls.set(item.id, url); });
    }
    const entries = [...urls], failures = []; let cursor = 0, count = 0;
    async function worker() {
      while (cursor < entries.length) {
        const [id, url] = entries[cursor++];
        const key = crypto.createHash('sha256').update(`${game}:${id}`).digest('hex').slice(0, 20) + '.webp';
        const target = path.join(output, key);
        try {
          try { await fs.access(target); } catch {
            const response = await fetch(url, { headers: { 'User-Agent': ua }, signal: AbortSignal.timeout(45000) });
            if (!response.ok) throw new Error(String(response.status));
            const data = Buffer.from(await response.arrayBuffer());
            await sharp(data).resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, withoutEnlargement: true }).webp({ quality: 85 }).toFile(target);
            await new Promise(r => setTimeout(r, 150));
          }
          images[game][id] = `./assets/items/${key}`;
        } catch (error) { failures.push({ id, url, reason: error.message }); }
        if (++count % 200 === 0) console.log(`${game}: ${count}/${entries.length} icons checked`);
      }
    }
    await Promise.all([worker(), worker(), worker()]);
    console.log(`${game}: ${Object.keys(images[game]).length} icons; ${failures.length} unavailable`);
    await fs.writeFile(path.join(root, `.catalog-cache/icon-failures-${game}.json`), JSON.stringify(failures, null, 2));
    await fs.writeFile(path.join(root, 'src/catalog/data/icons.json'), JSON.stringify(images, null, 2) + '\n');
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
