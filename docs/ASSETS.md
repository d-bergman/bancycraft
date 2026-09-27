# Visual assets

`approved-concept.png` preserves the user-approved BancyCraft home-screen concept.

`../public/assets/workshop.png` is original decorative artwork generated with the built-in imagegen tool for this project. No remote image request is made by the application. Dragonwilds and Valheim cards use this original fantasy landscape as decorative art and plain-text game names; the app does not ship copied game logos or imply official affiliation.

Final artwork prompt:

> Create a production background illustration for the BancyCraft Windows crafting companion app. Wide landscape 16:9 high quality atmospheric fantasy game environment painting, no text, no letters, no logos, no UI. A rustic open-front crafting workshop on the right third with a wooden workbench, rolled maps, iron tools, an axe resting against beams and a warm small lantern. Beyond it a beautiful Nordic lake, pine forest and snowy distant mountains under blue daylight. Left half dark shadowed forest and deep blue-green mist with sparse detail, deliberately suitable for overlaying white app heading. Palette almost black teal shadows, icy cyan atmospheric light, desaturated stone and timber, tiny warm amber lantern accent. Sophisticated detailed semi-realistic game concept art, cinematic but restrained, crisp objects, no people, no borders. Artwork must fill entire canvas. This is an original decorative setting, no branded game artwork.

The application icon is an original code-native SVG mark in `build/icon.svg`, converted to PNG and ICO by `scripts/create-icon.cjs` using sharp. Regenerate it with `node scripts/create-icon.cjs` before building if the vector changes.
