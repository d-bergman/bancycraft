# BancyCraft 0.10.0

Dune: Awakening joins the offline crafting tools, and server controls now protect occupied worlds at the backend as well as in the app.

### New Content
- Dune: Awakening: 2,267 items, 953 explicit recipe alternatives, 1,868 local icons and 39 equipment bundles. Includes game-scoped search, shopping lists, crafting trees, supplies, builds and shared lists/builds.
- Player lockouts for stopping, restarting and switching servers. Disruptive actions are blocked when affected players are online or their count cannot be verified; fresh backend checks run inside the action queue.

### App Changes
- Remove quantity fields from both potion slots. Existing saved quantities remain intact.
- Preserve Dune refinery alternatives and water costs in milliliters.
- Record source snapshots, rejected incomplete recipes and remaining unknowns in the catalog audit.

### Bug Fixes
- Fix Valheim Raw Fish conversion: choose one fish type rather than requiring every fish type together.
- Restore Grounded 2 acquisition fields from shared infoboxes and sequel-specific sources; add explicit smoothie source notes without inventing ingredient counts.
- Add V Rising Iron and Golden Castle Key recipes with verified crafting stations.
- Fill additional Valheim and Enshrouded acquisition details from their source pages.
- Recheck server population before sending a controller request; enforce the same lockout on website and app requests.

Community sources remain incomplete. Unknown acquisition, station, generic ingredient and byproduct details are surfaced instead of guessed. Dune excludes 25 incomplete recipe rows; API-only item entries link to their public API provenance.

Free Windows 10/11 x64. Update through Settings & updates. The stable BancyCraft-Installer.exe download remains available for new users.
