function upgradeLine(item) {
  if (/suspensor/i.test(item.name)) return 'utility:suspensor';
  if (/shield/i.test(item.name)) return 'utility:shield';
  if (/power pack/i.test(item.name)) return 'utility:power-pack';
  return `${item.group}:${item.family}`;
}
export function nextUpgrades(items, current) {
  if (!current) return [];
  const line = upgradeLine(current);
  const higher = items.filter(item => item.unique && upgradeLine(item) === line && item.tier != null && (current.tier == null || item.tier > current.tier) && item.id !== current.id);
  if (!higher.length) return [];
  const tier = Math.min(...higher.map(item => item.tier));
  return higher.filter(item => item.tier === tier).sort((a, b) => a.name.localeCompare(b.name));
}
export function acquire(loadouts, itemId, byId, items) {
  return loadouts.map(loadout => ({...loadout, slots: loadout.slots.map(slot => {
    const current = byId.get(slot.itemId);
    if (!current) return slot;
    const choices = nextUpgrades(items, current);
    const target = slot.targetId || choices[0]?.id;
    return target === itemId && choices.some(item => item.id === itemId) ? {...slot, itemId, targetId: undefined} : slot;
  })}));
}
