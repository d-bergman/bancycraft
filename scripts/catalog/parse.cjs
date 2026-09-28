const { load } = require('cheerio');

// Split only at the current template level; links and nested templates may contain pipes.
function splitFields(text) {
  const parts = []; let start = 0, braces = 0, links = 0;
  for (let i = 0; i < text.length; i++) {
    const pair = text.slice(i, i + 2);
    if (pair === '{{') { braces++; i++; }
    else if (pair === '}}') { braces--; i++; }
    else if (pair === '[[') { links++; i++; }
    else if (pair === ']]') { links--; i++; }
    else if (text[i] === '|' && !braces && !links) { parts.push(text.slice(start, i)); start = i + 1; }
  }
  parts.push(text.slice(start)); return parts;
}
function templates(text) {
  const found = [], stack = [];
  text = text.replace(/<!--[\s\S]*?-->/g, '');
  for (let i = 0; i < text.length - 1; i++) {
    const pair = text.slice(i, i + 2);
    if (pair === '{{') { stack.push(i); i++; }
    else if (pair === '}}' && stack.length) {
      const start = stack.pop(); const parts = splitFields(text.slice(start + 2, i));
      const name = parts.shift().trim().replaceAll('_', ' ').toLowerCase(); const fields = {};
      for (const part of parts) { const equals = part.indexOf('='); if (equals >= 0) fields[part.slice(0, equals).trim().toLowerCase()] = part.slice(equals + 1).trim(); }
      found.push({ name, fields, start, end: i + 2 }); i++;
    }
  }
  return found.sort((a, b) => a.start - b.start);
}
function plain(text = '', title = '') {
  text = text.replace(/<!--[\s\S]*?-->/g, '').replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/gi, '').replace(/<ref\b[^>]*\/>/gi, '')
    .replace(/\{\{(?:SUB)?PAGENAME\}\}/gi, title.split('/').pop());
  // Omit unsupported dynamic markup rather than expose raw templates as game facts.
  for (let i = 0; i < 10 && /\{\{[^{}]*\}\}/.test(text); i++) text = text.replace(/\{\{[^{}]*\}\}/g, '');
  text = text.replace(/\[\[(?:File|Image|Category):[^\]]*\]\]/gi, '').replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => label || target.replace(/^:c:/i, ''))
    .replace(/\[https?:\/\/\S+\s+([^\]]+)\]/g, '$1').replace(/'{2,5}/g, '').replace(/<br\s*\/?\s*>/gi, ' ');
  return load(`<div>${text}</div>`).text().replace(/\s+/g, ' ').trim();
}
function quantity(raw, fallback) { if (raw === undefined) return fallback; return /^\d+$/.test(raw.trim()) && Number(raw) > 0 ? Number(raw) : null; }
function dragonRecipes(text, title) {
  return templates(text).filter(t => t.name === 'recipe').flatMap(({ fields: f }, index) => {
    const inputs = [], outputs = [];
    for (const [prefix, list] of [['mat', inputs], ['output', outputs]]) {
      for (let i = 1; f[prefix + i]; i++) list.push({ name: plain(f[prefix + i]), quantity: quantity(f[`${prefix}${i}qty`], 1) });
    }
    if (!outputs.length) outputs.push({ name: title, quantity: quantity(f.output1qty, 1) });
    // The source Module:Recipe explicitly defaults omitted amounts to one.
    if (!inputs.length || [...inputs, ...outputs].some(x => !x.name || !x.quantity || /[{}]/.test(x.name))) return [];
    return [{ id: `${title}:${index}`, station: plain(f.facility), notes: plain(f.notes), inputs, outputs }];
  });
}
module.exports = { templates, plain, quantity, dragonRecipes };
