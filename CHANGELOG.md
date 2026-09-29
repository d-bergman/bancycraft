# Changelog

## 0.8.1 — 2026-09-29

A more compact loadout workspace, feedback that matches the app, and a private administrator key panel.

### New Content
- Private administrator key panel with copy buttons for provisioned community, account-bound controller and website registration keys. Windows encryption keeps key values outside the installer, backups and public repository. Each copy verifies the exact owner account and live administrator grant.
- App-native bug and suggestion form submits to the existing Google Form and requires a confirmed receipt. No Google iframe or branding appears inside the app form.

### App Changes
- Fixed-size build slots and smaller artwork prevent images from stretching the loadout. Small inventory-icon fallbacks are capped to avoid excessive enlargement.
- Compact build and shopping-list overview cards. Shared build creator portraits sit at the top right with aligned creator text.
- Both access-key inputs sit under Bancy.gg authentication; website account connection remains separate.
- Builds uses a distinct loadout icon. Unavailable slots keep their titles and crossed-out symbols.
- Help guide and FAQ entries form one accordion: opening another closes the previous entry.

### Bug Fixes
- Server Refresh shows an animated busy state and prevents overlapping refresh requests.
- Feedback uses blue-gray app surfaces, readable light text and themed controls. Failed sends keep the draft and do not falsely report success.
- Private key-panel metadata never returns secret values to the renderer. Copy authorization is checked again before writing the clipboard; unchanged clipboard contents clear after one minute.


## 0.8.0 — 2026-09-28

A clearer build workspace, faster list editing, expanded recipe/source coverage and separately authorized server controls.

### New Content
- App-themed Servers page with the website registry, live controller status, player details and confirmed start/stop/restart controls. A separate account-bound controller key is verified by the Blackbox backend.
- Search, filter, select and add items directly inside the active private or shared shopping list.
- Complete Help guide, expanded FAQs and local metrics for completed lists, saved builds and supplies. Completion history starts with this release.
- Larger offline item artwork where the sources provide it, with inventory-icon fallbacks.

### App Changes
- Builds open in view mode, including for owners. Edit from the top toolbar or a card icon. Build actions now sit at the top; slot controls use icons with hover labels.
- Sharing moves the owner’s build into Shared builds. Unshare returns it to My builds; owner deletion removes the shared entry while friends’ independent copies remain.
- Combined Boots / Legs choices, glove/gauntlet matching, mirrored Cape and Accessory slots, centered foods/potions and crossed-out unavailable slots. Valheim belts are accessories.
- Changelog navigation aligns with Settings and Help. Release notes now include a summary and categorized New Content, App Changes and Bug Fixes.
- Settings checks for updates on entry. The corner notification stays hidden while the same update is shown on Settings.
- Import List sits next to Add Items. Removed the optional label from key-gated community navigation.

### Bug Fixes
- Hide duplicate equipment in builder pickers and use selected-game item data.
- Theme supply search suggestions to match the dark app.
- Recover missing acquisition relationships, exact ingredient links and additional source-defined recipes across the five catalogs.
- Valheim initial crafts distinguish upgrade-only recipes from cast processing. Martial casts use Black Forge; magic casts retain their verified Galdr Table stations. Added fish needed by recipe trees and restored Acorn, Amber and Amber Pearl acquisition details.
- Keep incomplete source data explicit; gathering origins never become estimated kill or harvest counts.

Free Windows 10/11 x64. Install once using BancyCraft-Installer.exe, then update through Settings or the corner notification. Local workspace and backups are preserved. Server actions require an account and privately issued controller key; bank permissions remain separate.


## 0.7.1 — 2026-09-28

- Adopt the numbered loadout layout with slot-specific equipment, capes, consumables and two-handed off-hand exclusion. Keep unsupported slots visible but inactive.
- Move Changelog to its own Settings sidebar page. Display the embedded Google Form with a dark background and light text.
- Add private-list card deletion and per-target quantity controls. Remove stale deletion recovery and target Already have fields.
- Link My Supplies to selected-game catalog items; new lists count stock and completing a private list deducts used stock once. Completion persists independently of remaining inventory.

## 0.7.0 — 2026-09-28

- Keep Shopping Lists as a compact library; open each list in its own workspace.
- Redesign the complete Dragonwilds Production Ledger for the desktop theme while preserving the website and offline calculations.
- Hide verified internal Valheim duplicates and preserve saved references, quantities and completion.
- Add private and community Builds for all five games: equipment slots, names, tags, descriptions, play notes, website avatars and creator attribution. Save independent private copies, create variants and full shopping lists. Check source updates and choose whether to save a new copy.
- Add owned-material deductions, station views, recipe comparisons, task assignments and conflict-safe undo. Owners can undo shared deletion for ten minutes during the current session, restoring a new shared copy.
- Add sourced Valheim upgrade planning for 265 verified item chains, distinguishing new gear from upgrading owned gear.
- Add favorites, recently viewed items, compact always-on-top gaming checklist, list/build import/export and full backup restoration. Backups include private builds and favorites, excluding credentials.
- Replace the unconfigured email-service form with the published BancyCraft Google Form inside Settings. Responses are stored in Google Forms with owner notifications enabled.

## 0.6.1 — 2026-09-28

- Fixed missing Valheim recipes caused by differing prefab IDs and duplicate equipment names. All 20 catalog gearsets now have initial recipes, including Frost Foundry casts for Deep North equipment.
- Added sourced processing conversions for Valheim metals, linen, grain, food, mead and Liquid Frost; fixed fuel is counted and time-dependent fuel is noted separately. Valheim now includes 562 recipes.
- Audited all five games; added 18 Enshrouded recipes missing from Cargo and imported acquisition text for loot gear. Five Efflorescent Hope cosmetics still have no acquisition instructions in the source.
- Added a Settings modal for bug reports and suggestions to bancywaypoint@gmail.com. Direct delivery awaits the owner’s configured endpoint; drafts remain available and the app does not claim unconfigured reports were sent.


## 0.6.0 — 2026-09-28

- Add V Rising as a supported offline game, with sourced items, explicit recipes, equipment bundles and local item icons. Use standard base crafting costs and identify missing acquisition data.
- Add a paginated Settings changelog covering every release from the first Windows foundation onward. Bundle the project changelog so history remains available offline.
- Add crafting-tree buttons beside active shopping-list rows, including pre-crafts and targets. Show selected recipe chains, exact aggregated materials, crafting stations, per-batch inputs, surplus and source links. Keep the view read-only for private and shared lists.

## 0.5.1 — 2026-09-28

- Remove the duplicate Gathering Lists sidebar entry.
- Bring shared lists into Shopping Lists, below private lists and a divider. Keep private and shared detail views separate within that page.
- Illustrate all six home game tiles. V Rising and Dune: Awakening remain visibly Planned and cannot open a catalog.
- Expand the BancyCraft website page with an app preview, features, illustrated games and a stable Windows installer download, linked from Projects, navbar and Nexus.

## 0.5.0 — 2026-09-28

- Add Grounded 2: 1,088 sourced items, 878 explicit recipes, 29 armor sets and 1,078 icons. Retain station variants and mark missing acquisition data.
- Mark V Rising and Dune: Awakening as Planned.
- Connect the existing website account with consent, an encrypted handoff, verified Firebase identity and Windows-encrypted storage.
- Share private list copies with friends using website accounts only. Stream progress and editor names; preserve independent concurrent edits and reject same-row conflicts. Only owners manage members or deletion.
- Check for updates immediately after opening, then every six hours. Use BancyCraft-Installer.exe and a legacy signature alias for existing clients.
- Add website download links in Projects, navbar and Nexus. Keep bank and Blackbox behind cipher keys and website permissions.

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
