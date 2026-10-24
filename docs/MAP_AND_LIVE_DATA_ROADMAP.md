# BancyCraft map and live-data roadmap

Planning document only. None of these integrations are part of Collections, and this document does not authorize reading live server data or installing a client tracker.

## Product boundary

BancyCraft stays useful offline. A player's local lists, supplies, Dune collection progress, and collection loadouts stay on that computer. Shared builds and lists remain the connected features. A future map can show static points of interest without a login; live positions, player inventories, and server storage need an explicit opt-in and an authenticated connection.

Do not copy another app's code, database, tiles, artwork, or bundled assets merely because its files are installed locally, its website is visible, or the app is shared only with family and friends. Inspect documented behavior and implement our own interface and adapters. Obtain permission or follow a compatible license before importing code or data. Keep source attribution beside imported material.

## What the research found

- [Valheim Map on Overwolf](https://www.overwolf.com/app/valheim_map-valheim_map) offers a save-derived world map, chest contents, player position through an installed tracking mod, optional inventory sharing, and crafting plans. Chest data from a world save is a snapshot and can lag the live world. A friend connecting to a dedicated server does not automatically grant BancyCraft access to that friend's inventory or position.
- [Overwolf's Valheim game-events documentation](https://dev.overwolf.com/ow-native/live-game-data-gep/supported-games/deprecated/valheim/) shows an inventory event example, but that page is marked deprecated. Recheck current API support before choosing it.
- [TH.GL says its web code and map tiles are private again](https://www.th.gl/blog/code-private-again). It permits attributed website embeds, but that is not permission to rehost the map or copy its implementation into a desktop app. For deeper access, ask for a partnership or an explicit license.
- [AlphaNine Dune Suite](https://github.com/AlphaNineGaming/AlphaNine-Dune-Suite) documents a live map with player, vehicle, and base markers **when coordinates are available**. It also warns that player identity without coordinates is possible. Its Windows server-manager implementation is not a drop-in NAS component. Review its current license and component notices before using any code.
- The [Dune self-host console documentation](https://github.com/Red-Blink/dune-awakening-selfhost-docker/blob/main/docs/console/API-REFERENCE.md) describes a position endpoint but says its actor-based coordinates can lag live movement. Confirm this against our exact Blackbox stack before designing a “live” marker.
- Enshrouded has third-party interactive maps, but we have no verified, permitted live-position feed for our server. Start with static map layers and manually placed pins until a supported feed is proven.

## Staged implementation

1. **Data proof, read-only.** For Valheim, copy three successive dedicated-world snapshots into a separate staging folder and compare the same chest, portal, and player marker across saves. Validate IDs against the installed BancyCraft catalog. For Dune, test whether the existing Blackbox stack actually returns current coordinates; record staleness and gaps. Do not expose server credentials or database access to the desktop app.
2. **Map shell.** Build BancyCraft-styled map controls, filters, saved pins, and a clear “last updated” indicator. Use original or properly licensed map data and assets. Static maps must remain usable offline.
3. **Authenticated Blackbox adapter.** If the proof succeeds, add a narrow read-only API for approved world snapshots and Dune coordinates. Authenticate users, scope data to the selected server, rate-limit requests, and omit unrelated or private player data. Keep the NAS database and shares off clients.
4. **Personal live tracker, optional.** Investigate a supported Valheim client-side plugin or game event route for the user's own position and inventory, with explicit enable/disable controls. Do not assume one player's tracker can see another player's inventory. Treat Dune and Enshrouded client tracking as separate feasibility projects.
5. **Shopping-list integration.** Reconcile item IDs and quantities from a selected source: manual supplies, local character inventory, local save snapshot, or authenticated server snapshot. Label the source and timestamp, and never silently overwrite manual entries. Test ownership and stale-data behavior with a small reversible dataset before broad import.
6. **Friends and release QA.** Test two accounts on different PCs, server permission boundaries, relog/save delays, missing map coordinates, offline fallbacks, and the public-source license inventory.

## Usage and effort planning

Earlier rough Codex usage estimates were 5–10% of a five-hour window for the proof, 10–20% for the map UI, 15–25% for the authenticated adapter, and 10–20% for list integration. These are planning estimates, not measured usage or delivery commitments. Re-scope each phase after the prior proof; stop before a low usage limit, leave a precise handoff, and never redeem a reset credit without permission.

## Deferred decisions

- Which games receive static maps first, and whether a permitted third-party embed is acceptable in the desktop app.
- Whether any live data should be shared with friends or only displayed to its owner.
- How long server snapshots are retained, and how to handle an offline or stale Blackbox connection.
- Whether map pins become guide attachments later. Guides are planned separately for a future 2.5.0 scope; do not fold them into the map integration by accident.
