const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const GAMES = ['dragonwilds', 'valheim', 'enshrouded', 'grounded2', 'vrising'];
const defaults = () => ({ schemaVersion: 2, game: 'dragonwilds', plans: [], supplies: [], lists: [] });
function string(value, max, label) {
  if (typeof value !== 'string' || value.length > max) throw new Error(`Invalid ${label}.`);
  return value.trim();
}
function validate(data) {
  if (!data || ![1, 2].includes(data.schemaVersion)) throw new Error('Unsupported workspace version. Please use a compatible BancyCraft version.');
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
  const map = (value, type) => {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length > 5000) throw new Error('Invalid list details.');
    const result = {};
    for (const [key, entry] of Object.entries(value)) {
      if (!key || key.length > 240 || ['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('Invalid list key.');
      if (type === 'number' && (!Number.isSafeInteger(entry) || entry < 0 || entry > 1e12)) throw new Error('Invalid list progress.');
      if (type === 'boolean' && typeof entry !== 'boolean') throw new Error('Invalid list setting.');
      result[key] = type === 'string' ? string(entry, 300, 'recipe') : entry;
    }
    return result;
  };
  const sourceLists = data.schemaVersion === 1 ? [] : data.lists;
  if (!Array.isArray(sourceLists) || sourceLists.length > 500) throw new Error('Invalid shopping lists.');
  const lists = sourceLists.map(list => {
    const id = string(list.id, 80, 'list ID'), name = string(list.name, 140, 'list name');
    if (!id || !name || ids.has(id) || !GAMES.includes(list.game) || !Array.isArray(list.targets) || !list.targets.length || list.targets.length > 500) throw new Error('Invalid shopping list.');
    ids.add(id);
    if (['quick', 'useSupplies', 'hideCompleted'].some(key => typeof list[key] !== 'boolean')) throw new Error('Invalid list settings.');
    const targetIds = new Set();
    const targets = list.targets.map(target => {
      const itemId = string(target.itemId, 160, 'item ID'), name = string(target.name, 200, 'item name');
      if (!itemId || !name || targetIds.has(itemId) || !Number.isSafeInteger(target.quantity) || target.quantity < 1 || target.quantity > 999999) throw new Error('Invalid target.');
      if(target.fromLevel!==undefined||target.toLevel!==undefined){if(list.game!=='valheim'||!Number.isInteger(target.fromLevel)||!Number.isInteger(target.toLevel)||target.fromLevel<0||target.toLevel<=target.fromLevel||target.toLevel>10)throw Error('Invalid upgrade levels.');}
      targetIds.add(itemId); return { itemId, name, quantity: target.quantity, ...(target.toLevel!==undefined?{fromLevel:target.fromLevel,toLevel:target.toLevel}:{}) };
    });
    return { id, name, game: list.game, owned:map(list.owned||{},'number'),assignments:map(list.assignments||{},'string'),quick: list.quick, targets, recipes: map(list.recipes, 'string'), progress: map(list.progress, 'number'), collapsed: map(list.collapsed, 'boolean'), useSupplies: list.useSupplies, hideCompleted: list.hideCompleted, updatedAt: string(list.updatedAt, 40, 'date') };
  });
  return { schemaVersion: 2, game: data.game, plans: rows(data.plans, 'plan'), supplies: rows(data.supplies, 'supply'), lists };
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
      if (fs.existsSync(file)) {
        const old = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (old.schemaVersion === 1 && !fs.existsSync(`${file}.v1.bak`)) fs.copyFileSync(file, `${file}.v1.bak`);
        fs.copyFileSync(file, `${file}.bak`);
      }
      fs.renameSync(temporary, file);
    } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
    return value;
  }
  return { read, write, file };
}
module.exports = { createStore, defaults, validate };
