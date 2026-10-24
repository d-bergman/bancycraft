import {resolveLocation} from '../collections/location-info.mjs';

export function normalizePlace(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/imperial testing station no\.?\s*/g, 'testing station ')
    .replace(/testing station no\.?\s*/g, 'testing station ')
    .replace(/\bthe\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsPhrase(text, phrase) {
  return Boolean(phrase) && (` ${text} `).includes(` ${phrase} `);
}

export function pinsForItem(item, maps, fallbacks, overrides) {
  const info = resolveLocation(item, fallbacks, overrides);
  const location = normalizePlace(info.location);
  if (!location || /not verified|mapped site not named/.test(info.location.toLowerCase())) return {info, pins: []};
  const pins = [];
  for (const map of maps) for (const marker of map.markers) {
    const place = normalizePlace(marker.name);
    if (place.length < 8 && place !== location) continue;
    if (containsPhrase(location, place) || (location.length >= 7 && containsPhrase(place, location))) {
      pins.push({mapId: map.id, marker});
    }
  }
  return {info, pins};
}
