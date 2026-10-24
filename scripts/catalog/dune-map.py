"""Build a small offline POI index from the Community Wiki's map pages.

The source pages are CC BY-NC-SA 4.0. Keep attribution with the output and
review image rights separately before distributing the bundled map artwork.
"""

import json
import pathlib
import re
from datetime import datetime, timezone

import requests


ROOT = pathlib.Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "src" / "map" / "dune-map-data.json"
PAGES = (("Hagga Basin", "hagga"), ("Deep Desert", "desert"), ("Overland", "overland"))


def plain(value):
    value = str(value or "")
    value = re.sub(r"\[\[(?:[^]|]+\|)?([^]]+)\]\]", r"\1", value)
    value = re.sub(r"<[^>]+>", "", value)
    return re.sub(r"\s+", " ", value).strip()


def read_map(title):
    response = requests.get(
        "https://awakening.wiki/api.php",
        params={"action": "parse", "page": "Map:" + title, "prop": "wikitext|revid", "format": "json"},
        timeout=25,
    )
    response.raise_for_status()
    parsed = response.json()["parse"]
    return json.loads(parsed["wikitext"]["*"]), parsed.get("revid")


if __name__ == "__main__":
    maps = []
    for title, key in PAGES:
        source, revision = read_map(title)
        groups = source.get("groups", {})
        markers = []
        seen = set()
        for group, entries in source["markers"].items():
            for entry in entries:
                name = plain(entry.get("name"))
                if not name or not isinstance(entry.get("x"), (int, float)) or not isinstance(entry.get("y"), (int, float)):
                    continue
                identity = (group, entry.get("id") or name, entry["x"], entry["y"])
                if identity in seen:
                    continue
                seen.add(identity)
                article = plain(entry.get("article"))
                markers.append({
                    "id": str(entry.get("id") or f"{group}-{len(markers)}"),
                    "name": name,
                    "group": plain(groups.get(group, {}).get("name") or group),
                    "x": entry["x"],
                    "y": entry["y"],
                    **({"article": article} if article else {}),
                })
        bounds = source["crs"]["bottomRight"]
        maps.append({
            "id": key,
            "name": title,
            "width": bounds[0],
            "height": bounds[1],
            "source": f"https://awakening.wiki/Map:{title.replace(' ', '_')}",
            "revision": revision,
            "markers": markers,
        })
        print(f"{title}: {len(markers)} pins (revision {revision})")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps({
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "license": "CC BY-NC-SA 4.0 (Community Wiki map content; artwork reviewed separately)",
        "maps": maps,
    }, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
