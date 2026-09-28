const fs = require('fs/promises'), path = require('path'), crypto = require('crypto');
const root = path.resolve(__dirname, '../..'), base = 'https://wiki.v-ris.ing', provenance = new Map();
async function api(params) { await fs.mkdir(path.join(root, '.catalog-cache'), { recursive: true }); const url = base + '/api.php?' + new URLSearchParams({ ...params, format: 'json' }), file = path.join(root, '.catalog-cache', crypto.createHash('sha256').update(url).digest('hex') + '.json'); let record; try {
    record = JSON.parse(await fs.readFile(file, 'utf8'));
}
catch { } if (!record) {
    await new Promise(r => setTimeout(r, 150));
    const response = await fetch(url, { headers: { 'User-Agent': 'BancyCraft/0.6.0 offline catalog importer (https://github.com/d-bergman/bancycraft)' }, signal: AbortSignal.timeout(60000) });
    if (!response.ok)
        throw Error(response.status + ' ' + url);
    record = { url, fetchedAt: new Date().toISOString(), text: await response.text() };
    await fs.writeFile(file, JSON.stringify(record));
} provenance.set(url, { url, fetchedAt: record.fetchedAt, sha256: crypto.createHash('sha256').update(record.text).digest('hex') }); const j = JSON.parse(record.text); if (j.error)
    throw Error(j.error.info); return j; }
async function rawPages() { let rows = [], next = {}; do {
    let j = await api({ action: 'query', list: 'allpages', apnamespace: 0, aplimit: 500, ...next });
    rows.push(...j.query.allpages);
    next = j.continue;
} while (next); if (rows.length > 4000)
    throw Error('Unexpected wiki expansion; review scope.'); const pages = []; for (let i = 0; i < rows.length; i += 50) {
    let j = await api({ action: 'query', pageids: rows.slice(i, i + 50).map(p => p.pageid).join('|'), prop: 'revisions|pageimages', rvprop: 'ids|timestamp|content', rvslots: 'main', piprop: 'thumbnail|name', pithumbsize: 64 });
    pages.push(...Object.values(j.query.pages));
    if (i % 300 === 0)
        console.log('V Rising pages', i + 50, '/', rows.length);
} await fs.writeFile(path.join(root, '.catalog-cache/vrising-pages.json'), JSON.stringify(pages)); await fs.writeFile(path.join(root, '.catalog-cache/vrising-provenance.json'), JSON.stringify({ sources: [...provenance.values()] }, null, 2)); return pages; }
module.exports = { api, rawPages, base, root, provenance };
if (require.main === module)
    rawPages().catch(e => { console.error(e); process.exitCode = 1; });
