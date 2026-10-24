"""Audit unique schematic map markers against the public gaming.tools item feed.

This extracts only place/map names for editorial verification. It does not
redistribute their item database, images, descriptions, or map assets.
"""

import concurrent.futures
import json
import pathlib
import sys
import time
import urllib.parse

import requests


ROOT = pathlib.Path(__file__).resolve().parents[2]
ITEMS = json.loads((ROOT / "src/catalog/data/dune-collections.json").read_text(encoding='utf-8'))['items']
URL = "https://cdn-hosted.gaming.tools/dune/data/en/items/{}.d.json"


def deref(data, index):
    return data[index] if isinstance(index, int) and 0 <= index < len(data) else None


def inspect(item):
    url = URL.format(urllib.parse.quote(item['id'].lower(), safe=''))
    for attempt in range(3):
        try:
            response = requests.get(url, timeout=25, headers={'User-Agent': 'BancyCraft location audit (personal desktop app)'})
            if response.status_code == 404:
                return {'id': item['id'], 'missing': True}
            response.raise_for_status()
            data = response.json()
            root = data[0]
            schematic = deref(data, root.get('schematic')) if isinstance(root, dict) else None
            if not isinstance(schematic, dict):
                return {'id': item['id'], 'maps': []}
            locations = deref(data, schematic.get('dropLocations')) or []
            maps = []
            for location_index in locations:
                location = deref(data, location_index)
                if not isinstance(location, dict):
                    continue
                map_object = deref(data, location.get('map')) or {}
                map_name = deref(data, map_object.get('name')) if isinstance(map_object, dict) else None
                for marker_index in deref(data, location.get('locations')) or []:
                    marker_location = deref(data, marker_index) or {}
                    markers = []
                    for marker_id in deref(data, marker_location.get('markers')) or []:
                        marker = deref(data, marker_id) or {}
                        if isinstance(marker, dict):
                            name = deref(data, marker.get('name'))
                            if isinstance(name, str):
                                markers.append(name)
                    if isinstance(marker_location, dict):
                        location_name = deref(data, marker_location.get('name'))
                        maps.append({'map': map_name, 'location': location_name, 'markers': markers})
            return {'id': item['id'], 'maps': maps}
        except (requests.RequestException, ValueError, TypeError, KeyError) as error:
            if attempt == 2:
                return {'id': item['id'], 'error': str(error)}
            time.sleep(attempt + 1)


if __name__ == '__main__':
    uniques = [item for item in ITEMS if item['unique']]
    out = ROOT / 'dune-location-audit.json'
    if '--from-audit' in sys.argv:
        results = json.loads(out.read_text(encoding='utf-8'))
    else:
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
            results = list(pool.map(inspect, uniques))
        out.write_text(json.dumps(results, indent=2) + '\n', encoding='utf-8')
    compact = {}
    wiki_by_id = {item['id']: item for item in uniques}
    for result in results:
        wiki_location = wiki_by_id[result['id']].get('location', '')
        if wiki_location and wiki_location not in ('Deep Desert', 'Crashed Ships'):
            continue
        places = []
        for map_entry in result.get('maps', []):
            map_name = map_entry.get('map') or ''
            markers = map_entry.get('markers') or []
            if not markers and map_name.startswith('Imperial Testing Station'):
                markers = [map_name]
                map_name = 'Overland'
            elif not markers and map_name in ('The Deep Desert', 'Hagga Basin'):
                label = (map_entry.get('location') or '').strip()
                markers = [label if label not in ('Small Ultra Rare', 'Ultra Rare Container', 'Small Rare Container') else 'Unspecified site']
            for marker in markers:
                site = marker.strip().removeprefix('Imperial ').removeprefix('The Wreck of the ')
                if marker.strip().startswith('The Wreck of the '):
                    site = 'Wreck of the ' + site
                candidate = {'site': site, 'map': map_name}
                if site and candidate not in places:
                    places.append(candidate)
        if places:
            compact[result['id']] = places
    compact_out = ROOT / 'src/collections/location-fallbacks.json'
    compact_out.write_text(json.dumps(compact, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'items': len(results), 'withMaps': sum(bool(x.get('maps')) for x in results), 'errors': sum('error' in x for x in results), 'missing': sum(x.get('missing', False) for x in results), 'output': str(out)}))
