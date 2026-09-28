const { templates, plain } = require('./parse.cjs');
const { createHash } = require('crypto');
const id = name => 'vr-' + createHash('sha256').update(name).digest('hex').slice(0, 20);
function fields(text, separator = '|') { const result = []; let start = 0, braces = 0, links = 0; for (let i = 0; i < text.length; i++) {
    const p = text.slice(i, i + 2);
    if (p === '{{') {
        braces++;
        i++;
    }
    else if (p === '}}') {
        braces--;
        i++;
    }
    else if (p === '[[') {
        links++;
        i++;
    }
    else if (p === ']]') {
        links--;
        i++;
    }
    else if (!braces && !links && text.slice(i, i + separator.length) === separator) {
        result.push(text.slice(start, i));
        start = i + separator.length;
        i += separator.length - 1;
    }
} result.push(text.slice(start)); return result; }
function frames(text, title) { text = text.replace(/\{\{PAGENAME\}\}/gi, title); return templates(text).filter(t => t.name === 'itemframe').map(t => { const values = fields(text.slice(t.start + 2, t.end - 2)).slice(1), pos = values.filter(v => !v.includes('=')); const name = plain(pos[0] || ''); return { name, quantity: pos[1] === undefined ? undefined : /^\d+$/.test(pos[1].trim()) ? Number(pos[1]) : null, type: t.fields.type || 'Item', itemId: id(name) }; }).filter(f => f.name); }
function recipes(text, title) {
    const result = [];
    for (const match of text.matchAll(/\{\|[\s\S]*?\|\}/g)) {
        const parts = match[0].split(/^\|-[^\n]*\n/gm), header = parts.shift(), headers = header.split('\n').filter(l => l.startsWith('!')).flatMap(l => l.slice(1).split('!!')).map(h => plain(h.replace(/^[^|]*\|/, '')).toLowerCase());
        const output = headers.findIndex(h => /^(item|resulting item|result)$/.test(h)), input = headers.findIndex(h => /^(recipe|materials)$/.test(h)), station = headers.findIndex(h => /^(structure|crafting station)$/.test(h));
        if (output < 0 || input < 0 || station < 0)
            continue;
        const spans = new Map();
        for (const part of parts) {
            const lines = part.replace(/\|\}\s*$/, '').split('\n'), raw = [];
            for (const line of lines) {
                if (line.startsWith('|') && !line.startsWith('|}'))
                    raw.push(...fields(line.slice(1), '||'));
                else if (raw.length)
                    raw[raw.length - 1] += '\n' + line;
            }
            const cells = [];
            let cursor = 0;
            for (let col = 0; col < headers.length; col++) {
                let previous = spans.get(col);
                if (previous?.left > 0) {
                    cells.push(previous.value);
                    previous.left--;
                    continue;
                }
                let value = raw[cursor++] || '', attributes = '';
                const cut = fields(value);
                if (cut.length > 1 && /^\s*(?:rowspan|colspan|style|class|align)/.test(cut[0])) {
                    attributes = cut.shift();
                    value = cut.join('|');
                }
                cells.push(value);
                let span = Number(attributes.match(/rowspan\s*=\s*['"]?(\d+)/i)?.[1] || 1);
                if (span > 1)
                    spans.set(col, { value, left: span - 1 });
            }
            const outs = frames(cells[output], title).map(f => ({ ...f, quantity: f.quantity ?? 1 })), ins = frames(cells[input], title).map(f => ({ ...f, quantity: f.quantity === undefined && /^(weapon|armour|armor|cloak|head|jewelry)$/i.test(f.type) ? 1 : f.quantity })), stations = frames(cells[station], title).map(f => f.name);
            if (!stations.length) {
                const name = plain(cells[station]);
                if (name && name.length < 100)
                    stations.push(name);
            }
            if (!outs.length || !ins.length || !stations.length || [...outs, ...ins].some(f => !Number.isSafeInteger(f.quantity) || f.quantity <= 0))
                continue;
            const recipe = { station: [...new Set(stations)].join(' / '), notes: 'Standard base costs. Matching floor, room and server crafting modifiers are not applied. Byproducts are not credited to other targets.', inputs: ins.map(({ name, quantity, itemId }) => ({ name, quantity, itemId })), outputs: outs.map(({ name, quantity, itemId }) => ({ name, quantity, itemId })) };
            result.push({ id: 'vr-recipe-' + createHash('sha256').update(JSON.stringify(recipe)).digest('hex').slice(0, 20), ...recipe, sourceTitle: title, frameOutputs: outs, frameInputs: ins });
        }
    }
    return result;
}
module.exports = { id, frames, recipes, fields };
