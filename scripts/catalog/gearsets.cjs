// Explicit set membership from wiki set pages and source prefab families.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { templates, plain } = require('./parse.cjs');
const root = path.resolve(__dirname, '../..');
const output = { dragonwilds: [], valheim: [], enshrouded: [] };
async function api(params) {
  const url = 'https://enshrouded.wiki.gg/api.php?' + new URLSearchParams({ ...params, format: 'json' });
  const file = path.join(root, '.catalog-cache', crypto.createHash('sha256').update(url).digest('hex') + '.json');
  let record; try { record = JSON.parse(await fs.readFile(file, 'utf8')); } catch {}
  if (!record) {
    await new Promise(r => setTimeout(r, 250));
    const response = await fetch(url, { headers: { 'User-Agent': 'BancyCraft/0.4.0 (gearset catalog; https://github.com/d-bergman/bancycraft)' }, signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error(`Set source returned ${response.status}`);
    record = { url, fetchedAt: new Date().toISOString(), text: await response.text() };
    await fs.writeFile(file, JSON.stringify(record));
  }
  const data = JSON.parse(record.text); if (data.error) throw new Error(data.error.info); return data;
}
(async () => {
  const catalogs = {};
  for (const game of Object.keys(output)) catalogs[game] = JSON.parse(await fs.readFile(path.join(root, `src/catalog/data/${game}.json`), 'utf8'));
  const add = (game, name, ids, alternatives = {}) => {
    const items = ids.map(id => catalogs[game].items.find(i => i.id === id));
    if (items.some(i => !i)) throw new Error(`Missing ${game} set member in ${name}`);
    output[game].push({ name, ids, alternatives, kind: 'Armor', sourceUrl: items[0].sourceUrl });
  };
  const dw = {
    Bronze:['872','847','875'], Iron:['958','552','961'], Steel:['8806','8815','8817'], Mithril:['10743','10888','10889'], Adamant:['14171','14172','14173'], Rune:['19524','19529','19530'], Dragon:['19528','19531','19532'],
    Reinforced:['758','988','997'], 'Black Knight':['10742','10898','10899'], White:['9372','9375','9190'], Paladin:['1205','982','984'], 'Gilded Paladin':['19629','19631','19633'], Obsidian:['14438','14439','14440'], "Fallen Hoplite's":['8998','8999','9000'],
    Leather:['837','838','839'], 'Hard Leather':['957','949','956'], 'Studded Leather':['1017','1000','1002'], 'Wild Archer':['1026','1019','1025'], Ranger:['9361','9362','9363'], 'Green Dragonhide':['8968','8971','8974'], 'Blue Dragonhide':['10939','10936','10940'], 'Red Dragonhide':['14398','14392','14399'], 'Black Dragonhide':['19619','19543','19621'], Shadow:['11008','11129','11130'], 'Kalphite Carapace':['14650','14512','14651'],
    Apprentice:['833','835','836'], Wizard:['1031','1041','1037'], 'Dark Mage':['861','867','865'], 'Dragonkin Mage':['1252','850','948'], Mystic:['10973','10975','10977'], Necromancer:['9318','9323','9294'], Splitbark:['9325','9376','9377'], Zamorak:['11082','11171','11173'], Desert:['14519','13952','14482'], 'Lunar Garou':['14250','14251','14252'], Infinity:['14262','14264','14265'], Ancestral:['19614','15060','19616']
  };
  const med = { Bronze:'20035', Iron:'20037', Steel:'20039', Mithril:'20043', Adamant:'20044', Rune:'20045', Dragon:'19661' };
  for (const [name, ids] of Object.entries(dw)) add('dragonwilds', name + ' armor', ids, med[name] ? { [ids[0]]: [med[name]] } : {});
  const vh = {
    Rag:['ArmorRagsChest','ArmorRagsLegs'], Leather:['HelmetLeather','ArmorLeatherChest','ArmorLeatherLegs'], Troll:['HelmetTrollLeather','ArmorTrollLeatherChest','ArmorTrollLeatherLegs','CapeTrollHide'], Bronze:['HelmetBronze','ArmorBronzeChest','ArmorBronzeLegs'], Iron:['HelmetIron','ArmorIronChest','ArmorIronLegs'], Root:['HelmetRoot','ArmorRootChest','ArmorRootLegs'], Wolf:['HelmetDrake','ArmorWolfChest','ArmorWolfLegs','CapeWolf'], Fenris:['HelmetFenring','ArmorFenringChest','ArmorFenringLegs'], Padded:['HelmetPadded','ArmorPaddedCuirass','ArmorPaddedGreaves'], Carapace:['HelmetCarapace','ArmorCarapaceChest','ArmorCarapaceLegs'], 'Eitr-weave':['HelmetMage','ArmorMageChest','ArmorMageLegs'], Flametal:['HelmetFlametal','ArmorFlametalChest','ArmorFlametalLegs'], Ask:['HelmetAshlandsMediumHood','ArmorAshlandsMediumChest','ArmorAshlandsMediumlegs'], Embla:['HelmetMage_Ashlands','ArmorMageChest_Ashlands','ArmorMageLegs_Ashlands'], Bear:['HelmetBerserkerHood','ArmorBerserkerChest','ArmorBerserkerLegs'], Vilebone:['HelmetBerserkerUndead','ArmorBerserkerUndeadChest','ArmorBerserkerUndeadLegs'], 'Lox fur':['HelmetLox','ArmorLoxChest','ArmorLoxLegs'], Protector:['HelmetDNHeavy','ArmorDeepNorthHeavyChest','ArmorDeepNorthHeavylegs'], Vanguard:['HelmetDNMediumHood','ArmorDeepNorthMediumChest','ArmorDeepNorthMediumlegs'], Caller:['HelmetDNMage','ArmorDeepNorthMageChest','ArmorDeepNorthMagelegs','CapeDeepNorthMage']
  };
  for (const [name, ids] of Object.entries(vh)) add('valheim', name + ' armor', ids);
  const pages = new Map();
  for (const category of ['Armor Set', 'Cosmetic Armor Set']) {
    let continuation = {};
    do {
      const d = await api({ action:'query', list:'categorymembers', cmtitle:'Category:' + category, cmnamespace:'0', cmlimit:'500', ...continuation });
      d.query.categorymembers.forEach(p => pages.set(p.pageid, { ...p, kind: category.startsWith('Cosmetic') ? 'Cosmetic' : 'Armor' })); continuation = d.continue;
    } while (continuation);
  }
  const entries = [...pages.values()], byName = new Map(catalogs.enshrouded.items.map(i => [i.name.toLowerCase(), i]));
  for (let i = 0; i < entries.length; i += 50) {
    const d = await api({ action:'query', pageids:entries.slice(i,i+50).map(p=>p.pageid).join('|'), prop:'revisions', rvprop:'ids|timestamp|content', rvslots:'main' });
    for (const p of Object.values(d.query.pages)) {
      const text = p.revisions?.[0]?.slots.main['*'] || '';
      const section = text.match(/==\s*Set pieces\s*==([\s\S]*?)(?=\n==|$)/i)?.[1] || '';
      const template = templates(section).find(t => t.name === 'armor set');
      const names = template ? section.slice(template.start+2,template.end-2).split('|').slice(1).map(n=>plain(n.trim())) : section.split('\n').filter(line=>/^\|\s*\[\[/.test(line)).flatMap(line=>[...line.split('||')[0].matchAll(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g)].map(m=>m[1])).filter(n=>!n.includes(':'));
      const unique = [...new Set(names.map(n=>n.split('#')[0].replaceAll('_',' ').trim()))];
      if (!unique.length) throw new Error('No explicit membership for ' + p.title);
      const ids = unique.map(name=>byName.get(name.toLowerCase())?.id).filter(Boolean);
      const missing = unique.filter(name=>!byName.has(name.toLowerCase()));
      output.enshrouded.push({ name:p.title.replace(/ Set$/, ' armor'), ids, alternatives:{}, kind:pages.get(p.pageid).kind, sourceUrl:'https://enshrouded.wiki.gg/wiki/'+encodeURIComponent(p.title.replaceAll(' ','_')), revision:p.revisions[0].revid, missing });
    }
  }
  for (const game of Object.keys(output)) { output[game].sort((a,b)=>a.name.localeCompare(b.name)); console.log(game,output[game].length,'sets',output[game].filter(s=>s.missing?.length).map(s=>({name:s.name,missing:s.missing}))); }
  output.grounded2=JSON.parse(await fs.readFile(path.join(root,'src/catalog/data/gearsets.json'),'utf8')).grounded2||[];
  await fs.writeFile(path.join(root,'src/catalog/data/gearsets.json'),JSON.stringify(output,null,2)+'\n');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
