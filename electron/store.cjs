const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const GAMES = ['dragonwilds', 'valheim'];
const defaults = () => ({ schemaVersion: 1, game: 'dragonwilds', plans: [], supplies: [] });
function string(value, max, label) {
  if (typeof value !== 'string' || value.length > max) throw new Error(`Invalid ${label}.`);
  return value.trim();
}
function validate(data) {
  if (!data || data.schemaVersion !== 1) throw new Error('Unsupported workspace version. Please use a compatible BancyCraft version.');
  if (!GAMES.includes(data.game) || !Array.isArray(data.plans) || !Array.isArray(data.supplies) || data.plans.length > 2000 || data.supplies.length > 10000) throw new Error('Invalid workspace.');
  const ids = new Set();
  const rows = (items, type) => items.map(item => {
    const id = string(item.id, 80, 'ID');
    if (!id || ids.has(id)) throw new Error('Duplicate or empty ID.');
    ids.add(id);
    const name = string(item.name, 120, 'name');
    if (!name || !GAMES.includes(item.game) || !Number.isSafeInteger(item.quantity) || item.quantity < (type === 'plan' ? 1 : 0) || item.quantity > 999999) throw new Error('Invalid item details.');
    const result = { id, name, game: item.game, quantity: item.quantity };
    if (type === 'plan') {
      if (!['planned', 'in-progress', 'completed'].includes(item.status)) throw new Error('Invalid plan status.');
      return { ...result, notes: string(item.notes, 5000, 'notes'), status: item.status, updatedAt: string(item.updatedAt, 40, 'date') };
    }
    return result;
  });
  return { schemaVersion: 1, game: data.game, plans: rows(data.plans, 'plan'), supplies: rows(data.supplies, 'supply') };
}
function createStore(directory) {
  fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, 'workspace.json');
  function read() {
    if (!fs.existsSync(file)) return defaults();
    const text = fs.readFileSync(file, 'utf8');
    try { return validate(JSON.parse(text)); }
    catch (error) { throw new Error(`Your saved workspace could not be opened. The original file has been kept safe. ${error.message}`); }
  }
  function write(data) {
    const value = validate(data);
    // Never replace unreadable or future-version data with a fresh workspace.
    read();
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      fs.writeFileSync(temporary, JSON.stringify(value, null, 2), { encoding: 'utf8', flag: 'wx' });
      if (fs.existsSync(file)) fs.copyFileSync(file, `${file}.bak`);
      fs.renameSync(temporary, file);
    } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
    return value;
  }
  return { read, write, file };
}
module.exports = { createStore, defaults, validate };
