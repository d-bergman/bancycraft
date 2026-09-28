# Changelog

## 0.4.1 — 2026-09-28

- Automatically check for stable releases ten seconds after startup and every six hours while the installed app is open, unless an update is already pending or downloading.
- Show a persistent top-right update notification on every page. Click to download and verify, follow progress, then explicitly restart and install.
- Dismiss the notification for that version during the current session; Settings remains available. A different version can show a new notification.
- Keep automatic checks from downloading, restarting, interrupting an active download, or overwriting an update ready to install.

## 0.4.0 — 2026-09-28

- Complete the bundled gearset catalog: 37 Dragonwilds, 20 Valheim, 82 Enshrouded armor/cosmetic sets, with selectable alternate Dragonwilds helmets.
- Copy the website's Dragonwilds production tools, merchant catalog/orders and full guide into an offline sandboxed app screen. Show its navigation only for Dragonwilds.
- Open the existing shared bank inside a secure app browser window, retaining the same website sign-in, records, requests, administrator approvals and capacity controls. Local merchant orders transfer for review without automatic submission.
- Hide the Bancy.gg sidebar and home area unless Settings validates a privately issued, signed access key. Encrypt accepted keys with Windows storage, exclude them from workspace backups, and close/clear the community session when locked.
- Keep manual project notes and recipe shopping lists available without keys or a network connection. Leave the website available and unchanged.

## 0.3.0 — 2026-09-28

- Add item-first shopping lists inspired by the supplied TeamCraft references: Type/item-type filters, icons, quantities, multi-selection, numbered pages and a list-picker drawer.
- Add saved lists and auto-deleting quick lists, recursive pre-crafts, alternative recipes, exact batch quantities, shared materials, partial progress and reset propagation.
- Add collapsible source/pre-craft/target sections, section completion/reset, hide completed and optional supply counting.
- Add verified starter armor bundles for all three games.
- Import 4,804 locally bundled item icons with source attribution and fallbacks for unavailable images.
- Migrate existing workspaces to schema 2 with an original schema-1 backup.
- Connect Settings to public GitHub Releases for check, download and restart-to-install, with detached Ed25519 update verification.
- Publish the repository publicly by the user's explicit choice; no publishing credentials or signing private key are bundled.


## 0.2.0 — 2026-09-27

- Add offline, game-scoped item browsing for Dragonwilds (1,347 items), Enshrouded (2,607) and Valheim (958 localized inventory entries).
- Connect reproducible importers to the Dragonwilds Wiki API, Enshrouded Wiki API/Cargo recipes, and Jötunn generated item/recipe tables.
- Show imported recipe inputs/outputs, alternatives, station filters, material links, recorded uses and available acquisition prose. Missing data stays explicitly unknown; no kill/harvest estimates.
- Add Enshrouded to home, plans, supplies and persistent game selection. Keep existing workspace data and installer identity.
- Add source attribution, licenses, provenance hashes and narrowly allowlisted source links.
- Manual installer updates remain available; online update delivery and Blackbox integration are still separate milestones.


## 0.1.1 — 2026-09-27

- Replace the sidebar lettermark and text with the user's supplied BancyCraft artwork, preserving its aspect ratio.
- Document candidate recipe sources for Valheim, Dragonwilds and Enshrouded. Research only; no catalog connections or new game features enabled.

## 0.1.0 — 2026-09-27

First installable Windows foundation.

- BancyCraft identity and home screen based on the approved dark/cyan concept.
- Game workspaces for RuneScape: Dragonwilds and Valheim.
- Persistent manual crafting plans, notes, statuses and supplies.
- Local search, workspace backup and settings.
- Windows x64 installer with a stable upgrade identity.
- Manual update instructions and groundwork for a future optional HTTPS release feed.
- Explicit placeholders for recipes, gathering calculations, secure Bancy login and shared server features.

No Blackbox or website deployment. No automatic update feed in this release.
