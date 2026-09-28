# Visual assets

`../public/assets/bancycraft-wordmark.png` is the user's supplied BancyCraft logo, copied unchanged from `ChatGPT Image Sep 27, 2026, 10_19_26 PM.png`. It replaces the sidebar lettermark and wordmark in 0.1.1. CSS preserves its aspect ratio and blends its black background into the sidebar. The Windows icon remains the existing compact mark.

`approved-concept.png` preserves the user-approved BancyCraft home-screen concept.

`../public/assets/workshop.png` is original decorative artwork generated with the built-in imagegen tool for this project. No remote image request is made by the application. Dragonwilds and Valheim cards use this original fantasy landscape as decorative art and plain-text game names; the app does not ship copied game logos or imply official affiliation.

Final artwork prompt:

> Create a production background illustration for the BancyCraft Windows crafting companion app. Wide landscape 16:9 high quality atmospheric fantasy game environment painting, no text, no letters, no logos, no UI. A rustic open-front crafting workshop on the right third with a wooden workbench, rolled maps, iron tools, an axe resting against beams and a warm small lantern. Beyond it a beautiful Nordic lake, pine forest and snowy distant mountains under blue daylight. Left half dark shadowed forest and deep blue-green mist with sparse detail, deliberately suitable for overlaying white app heading. Palette almost black teal shadows, icy cyan atmospheric light, desaturated stone and timber, tiny warm amber lantern accent. Sophisticated detailed semi-realistic game concept art, cinematic but restrained, crisp objects, no people, no borders. Artwork must fill entire canvas. This is an original decorative setting, no branded game artwork.

The application icon is an original code-native SVG mark in `build/icon.svg`, converted to PNG and ICO by `scripts/create-icon.cjs` using sharp. Regenerate it with `node scripts/create-icon.cjs` before building if the vector changes.

## Item icons in 0.3.0

The public source APIs supply item icon URLs. scripts/catalog/icons.cjs reads the pinned item pages, requests image metadata in batches, and prepares 64px WebP icons locally. 1,253 Dragonwilds, 2,593 Enshrouded and 958 Valheim icons are bundled. Unavailable icons use a neutral box fallback. Catalog contributors and game-rights holders retain their rights; wiki adaptations retain the source catalog licenses documented in CATALOGS.md. No item-icon requests occur at normal runtime.

## Production ledger copy in 0.4.0

The existing owned Bancy website's `assets/img/hero/banri-hero-02.webp` is copied into the local ledger. Its existing ledger CSS/HTML/calculation code and guide are reused by authorization; LEDGER-SOURCE.json records the originating commit and files. Lucide icons are rendered from the existing MIT-licensed lucide-react dependency into inline SVGs in the isolated local page. The ledger has no remote font, icon, CSS or image dependency.

## Grounded 2 icons in 0.5.0

1,078 local 64px WebP icons come from Grounded Wiki image metadata. Ten items lack usable source images and use a neutral fallback. Game assets retain rights-holder copyrights; contributor adaptations retain the source catalog licensing documented in CATALOGS.md. Normal runtime makes no icon requests.
