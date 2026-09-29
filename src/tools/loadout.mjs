export const layout=['Main weapon','Off-hand','Head','Chest','Gloves','Boots / Legs','Ring 1','Ring 2','Belt','Accessory','Food 1','Food 2','Food 3','Potion 1','Potion 2','Cape'];
export function supported(game,slot){if(game==='valheim')return !['Gloves','Ring 1','Ring 2','Belt'].includes(slot);if(game==='dragonwilds')return !['Gloves','Ring 1','Ring 2','Belt'].includes(slot);if(game==='grounded2')return !['Gloves','Ring 1','Ring 2','Belt','Cape'].includes(slot);if(game==='vrising')return !/^Ring|^Food|^Belt/.test(slot);return slot!=='Belt'&&slot!=='Cape';}
export function fits(item,slot){const c=item.category.toLowerCase(),n=item.name.toLowerCase();
 if(/material|resource|component|pattern|basic|quest|arrow|ammo/.test(c))return false;
 const head=/helmet|head armor|head cosmetic/.test(c)||/\bhelm|\bhood|\bhat|\bheadgear|\bhelmet/.test(n);
 const chest=/chest|upper body|body armor/.test(c)||/\bchest|\btunic|\brobe|\bbody|\bcuirass|\bvest/.test(n);
 const gloves=/arm armor|arm cosmetic|glove/.test(c)||/gloves|gauntlets|handwraps/.test(n);
 const boots=/foot armor|foot cosmetic|boot/.test(c)||/boots|shoes|greaves/.test(n);
 const legs=/legs|lower body|leg armor/.test(c)||/leggings|trousers|legguards|\blegs\b/.test(n);
 const cape=/shoulder|cape|cloak/.test(c)||/\bcape|\bcloak/.test(n),belt=/belt/.test(c+' '+n),ring=/ring/.test(c),shield=/shield/.test(c),weapon=/weapon|sword|axe|mace|hammer|bow|wand|staff|spear|dagger|club|sickle|fist|reaper|slashers|pistols|whip|claws|twinblade/.test(c);
 const potion=/potion|smoothies/.test(c)||/potion|elixir|tonic|mead|smoothie/.test(n),food=/food|drink/.test(c)||(/consumable/.test(c)&&!potion&&!/scroll|tome|bomb|spell|seed/.test(n));
 if(slot==='Head')return head;if(slot==='Chest')return chest;if(slot==='Gloves')return gloves;if(slot==='Boots / Legs')return boots||legs;if(slot==='Boots')return boots;if(slot==='Legs')return legs;if(slot==='Cape')return cape;if(slot==='Belt')return belt;if(slot.startsWith('Ring'))return ring;if(slot==='Off-hand')return shield;if(slot==='Main weapon')return weapon&&!shield;if(slot.startsWith('Potion'))return potion;if(slot.startsWith('Food'))return food;
 return ![head,chest,gloves,boots,legs,cape,belt,ring,shield,weapon,potion,food].some(Boolean)&&/utility|trinket|jewel|accessor|equipment|glider|grappling/.test(c);
}
export function fitsGame(item,slot,game){return supported(game,slot)&&(fits(item,slot)||(slot==='Accessory'&&!supported(game,'Belt')&&fits(item,'Belt')));}
export function normalizeSlots(items){return items.map(i=>({...i,slot:['Boots','Legs','Lower body'].includes(i.slot)?'Boots / Legs':i.slot==='Body'||i.slot==='Upper body'?'Chest':i.slot==='Utility belt'?'Accessory':i.slot}));}
// Keep different equipment variants, but hide exact display duplicates in pickers.
export function uniqueEquipment(items,catalog){const crafted=new Set(catalog.recipes.flatMap(r=>r.outputs.map(o=>o.itemId)));const result=new Map();for(const i of items){const key=i.name.trim().toLowerCase()+'|'+i.category.toLowerCase();const old=result.get(key);if(!old||(!crafted.has(old.id)&&crafted.has(i.id)))result.set(key,i);}return [...result.values()];}
export function twoHanded(item){return !!item&&/two.?hand|staff|bow|crossbow|greatsword|battleaxe|atgeir|sledge|reaper/.test((item.category+' '+item.name).toLowerCase());}
