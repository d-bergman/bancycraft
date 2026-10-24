// Region names are checked against the Community Wiki's location/zone pages.
// The fallback data stores only place names from the gaming.tools item maps.
const regions = {
  'Hagga Basin South': ['Wreck of the Alcyon', 'Old Griffin Hideaway', 'Dewgap Gateway', 'Eastern Safeway', 'Keyhole Rock', 'Wali Hole', 'Vents of Eifrit', 'Testing Station 2'],
  'Eastern Vermillius Gap': ['Suk Alusus', "Mirzabah's Head", "Mizarbah's Head", 'Mirzabah', 'Drugrunner\'s Rise', 'Ghanima Cavern', 'Testing Station 10'],
  'Western Vermillius Gap': ["Miner's Watch", 'Wreck of the Pallas', 'Hidden Eyrie', "Acky's Recess", 'Coils of the Wyrm', 'The Tip', 'The Anomaly', 'Testing Station 197'],
  'Mysa Tarill': ['Mysa Tarill', 'Khala Cavern'],
  "The O'odham": ['Rockwarren Village', 'Batigh Grotto', 'Deep Whisper', 'Testing Station 71', 'Testing Station 163'],
  'Jabal Eifrit Al-gharb': ["Piter's Net", 'Whispering Cavern', 'Beneath the Jumble'],
  'Jabal Eifrit Al-janub': ["Khidr's Shadow", "Khdir's Shadow", "Kel's Fallback", 'Testing Station 76', 'Testing Station 117'],
  'Jabal Eifrit Al-sharq': ['Farhold Storage'],
  'Eastern Shield Wall': ['Southern Comms', 'Sentinel City', 'Testing Station 142', 'Testing Station 17'],
  'Western Shield Wall': ['Wreck of the Alecto', 'Testing Station 60'],
  'Hagga Rift': ["Callie's Breakthrough", 'Wreck of the Kytheria', 'Wreck of the Tisiphone', 'Arctus Cavern'],
  Sheol: ["Shaitan's Grotto", 'Edge of Acheron', 'Wreck of the Delphis', 'Wreck of the Euporia', 'Wreck of the Ourea', 'Wreck of Ourea'],
  'Deep Desert': ['Testing Station 37', 'Testing Station 93', 'Testing Station 148', 'Testing Station 185', 'Testing Station 186', 'Testing Station 217', 'Wreck of the Archidamas III', 'Wreck of the Proxenus', 'Wreck of the Stasanor', 'Wreck of the Eumenes', 'Wreck of the Hyperbatas', 'Wreck of the Cycliadas', 'Wreck of the Dioedas', 'Wreck of the Orsippus', 'Wreck of the Hicetus', 'Wreck of the Xenophon', 'Forgotten Cave', 'Buried Testing Station', 'Unrecovered Shipwreck'],
};

const manuallyChecked = {
  // These item pages still contain [LOCATION] placeholders or no map markers.
  'Stillsuit_Unique_Armored_02_Boots': {location: 'Ghanima Cavern', region: 'Eastern Vermillius Gap', provenance: 'Community Wiki set page; regional cross-check'},
  'Stillsuit_Unique_Armored_02_Top': {location: 'Ghanima Cavern', region: 'Eastern Vermillius Gap', provenance: 'Community Wiki set page; regional cross-check'},
  'Stillsuit_Unique_Armored_02_Gloves': {location: 'Ghanima Cavern', region: 'Eastern Vermillius Gap', provenance: 'Community Wiki set page; regional cross-check'},
  'Stillsuit_Unique_Armored_02_Mask': {location: 'Ghanima Cavern', region: 'Eastern Vermillius Gap', provenance: 'Community Wiki set page; regional cross-check'},
  'Combat_Neut_SmugglerDeserterUnique01_Boots': {location: 'Crashed Ornithopter near Wreck of the Alcyon', region: 'Hagga Basin South'},
  'Combat_Neut_SmugglerDeserterUnique01_Top': {location: 'Crashed Ornithopter near Wreck of the Alcyon', region: 'Hagga Basin South'},
  'Combat_Neut_SmugglerDeserterUnique01_Gloves': {location: 'Crashed Ornithopter near Wreck of the Alcyon', region: 'Hagga Basin South'},
  'Combat_Neut_SmugglerDeserterUnique01_Helmet': {location: 'Crashed Ornithopter near Wreck of the Alcyon', region: 'Hagga Basin South'},
  'Combat_Neut_SmugglerDeserterUnique01_Bottom': {location: 'Crashed Ornithopter near Wreck of the Alcyon', region: 'Hagga Basin South'},
  'Kindjal_Unique_Stamina_03': {location: 'Shock-Knife Corpses near CHOAM Facilities 5 and 6', region: 'Hagga Rift'},
  'BuggyMining_Unique_YieldIncrease_03': {location: 'CHOAM Mineral Extraction Facility 6', region: 'Hagga Rift', provenance: 'Schematic listing; regional cross-check'},
  'DewReaper_Unique_05': {location: 'Landsraad Tier 4 contribution reward', region: 'Landsraad reward (no fixed map region)', provenance: 'gaming.tools Landsraad reward table'},
  'HighCapacityLiterjon_06': {location: 'Landsraad Tier 4 contribution reward', region: 'Landsraad reward (no fixed map region)', provenance: 'gaming.tools Landsraad reward table'},
  'SandbikeEngine_Unique_Speed_5': {location: 'Landsraad personal contribution reward', region: 'Landsraad reward (no fixed map region)', provenance: 'Landsraad reward guide'},
  'SandbikeBoost_Unique_LessHeat_2': {location: 'Beatriz Luna (schematic vendor), Arrakeen', region: 'Arrakeen'},
  'FullStabilizationBelt_Unique_DmgReduction': {location: 'Landsraad Tools Vendor (when offered)', region: 'Arrakeen or Harko Village'},
  'SandcrawlerLocomotion_Unique_WormThreat_06': {location: 'Landsraad Vehicle Vendor (when offered)', region: 'Arrakeen or Harko Village'},
  'SandcrawlerSpiceContainer_Unique_Capacity_6': {location: 'Landsraad Vehicle Vendor (when offered)', region: 'Arrakeen or Harko Village'},
  'ContractSeronVarlinDamasteelSword': {location: 'Forged in Dishonor contract', region: 'Helius Gate / contract reward', provenance: 'gaming.tools contract page'},
};

function normalized(text) {
  return String(text || '').replace(/Imperial Testing Station No\.?\s*/gi, 'Testing Station ').replace(/Imperial Station Station\s*/gi, 'Testing Station ').replace(/Testing Station No\.?\s*/gi, 'Testing Station ').replace(/\s+/g, ' ').trim();
}

function regionsIn(text) {
  const value = normalized(text).toLowerCase();
  const found = [];
  for (const [region, sites] of Object.entries(regions)) {
    if (value.includes(region.toLowerCase()) || sites.some(site => {
      const needle = normalized(site).toLowerCase();
      const index = value.indexOf(needle);
      return index >= 0 && (!/\d$/.test(needle) || !/\d/.test(value[index + needle.length] || ''));
    })) found.push(region);
  }
  for (const city of ['Arrakeen', 'Harko Village']) if (value.includes(city.toLowerCase())) found.push(city);
  return [...new Set(found)];
}

function fallback(item, mapFallbacks) {
  const places = mapFallbacks[item.id] || [];
  if (!places.length) return null;
  const sites = [];
  const areaNames = [];
  for (const place of places) {
    const site = normalized(place.site);
    const map = place.map === 'The Deep Desert' ? 'Deep Desert' : place.map;
    if (site && site !== 'Unspecified site' && !sites.includes(site)) sites.push(site);
    const area = regionsIn(site);
    if (!area.length && map) area.push(map);
    for (const name of area) if (!areaNames.includes(name)) areaNames.push(name);
  }
  const selectedSites = sites.slice(0, 8);
  const remainder = sites.length - selectedSites.length;
  return {
    location: selectedSites.length ? selectedSites.join('; ') + (remainder ? `; +${remainder} more mapped sites` : '') : 'Mapped site not named',
    region: areaNames.join('; ') || 'Region unverified',
    provenance: 'gaming.tools map',
  };
}

export function resolveLocation(item, mapFallbacks, overrides) {
  const override = overrides[item.id];
  if (override) {
    const location = normalized(override.location);
    return {location, region: regionsIn(location).join('; ') || 'Region unverified', provenance: 'Cross-checked location'};
  }
  const checked = manuallyChecked[item.id];
  if (checked) return {provenance: 'Community Wiki cross-check', ...checked};
  const wikiLocation = normalized(item.location);
  if (wikiLocation && !/\[LOCATION\]|\bTBD\b|with at drop chance/i.test(wikiLocation)) {
    const mapped = fallback(item, mapFallbacks);
    if ((wikiLocation === 'Deep Desert' || wikiLocation === 'Crashed Ships') && mapped) return mapped;
    const found = regionsIn(wikiLocation);
    return {location: wikiLocation, region: found.join('; ') || (mapped?.region || 'Region unverified'), provenance: 'Community Wiki'};
  }
  return fallback(item, mapFallbacks) || {location: 'Drop or vendor not verified', region: 'Region unverified', provenance: 'No verified source yet'};
}

export {regionsIn};
