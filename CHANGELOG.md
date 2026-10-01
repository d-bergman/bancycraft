# Changelog

## 1.2.1 — 2026-10-01

This hotfix tightens Blackbox shutdown feedback and polishes the Dune and Gearsets presentation.

### App Changes
- Make the BancyCraft icon larger and clearer at taskbar sizes while retaining the prior 1.2.0 assets.
- Align Gearsets action buttons along the bottom of each card.
- Show a 30-second estimated Stop progress bar that waits for Blackbox to confirm shutdown.
- Show verified online-player counts without an unknown-capacity question mark, and rename the Dune server to Bancyrakis.

### Bug Fixes
- Restore the Dune server password in the signed-in server registry.
- Stop the full Dune stack, including its support containers, when Stop is requested.

## 1.2.0 — 2026-10-01

This release adds the Blackbox Dune world to BancyCraft and streamlines Gearsets, with a refreshed app icon.

### New Content
- Show Banlonant Blackbox | Bancyrakis in the server registry and Dune: Awakening in the Blackbox controller.
- Add quick-list and source-link actions to Gearsets alongside Add to list.

### App Changes
- Use a five-minute estimated startup bar for Dune controller commands; other worlds retain three minutes.
- Refresh the BancyCraft app icon while preserving the previous icon assets for reference.

## 1.1.0 — 2026-09-30

This update makes crafting dependencies easier to verify and improves server controls and loadout variants. It remains local for review before packaging and publication.

### New Content
- Zoom controls for crafting trees, from 25% to 200%, plus Fit width.
- Click-and-drag panning and centered opening views for crafting trees in every game.
- Mouse-wheel zoom for crafting trees, keeping the point under the cursor in view.
- Preset build tags for play styles and activities across the six games.
- Separate leg and boot equipment slots in Enshrouded and Dune: Awakening.

### App Changes
- Show every ingredient directly under the recipe that consumes it, including materials shared across branches; shopping lists still combine those totals.
- Give each build variant its own character picture and themed variant/image menus.
- Choose any combination of build variants for a shopping list, or include them all, while counting shared gear once.
- Keep build shopping lists focused on equipment, excluding food, potions, other consumables, and non-gear extra items.
- Label the live local preview as Dev mode in the app toolbar.
- Show Switch on a stopped server when another world is running, with a clear confirmation and an estimated warmup display for controller commands.
- Mark the Dragonwilds Server Bank as coming in a future build.
- Align server addresses and revealed passwords; copy addresses through the desktop clipboard.

### Bug Fixes
- Lock every controller action, including restart, while anyone is online or the running server's player count cannot be verified.
- Keep existing lower-body equipment when migrating Enshrouded and Dune builds to separate leg and boot slots.
- Remove Enshrouded lower-body armor from the Chest picker.
- Restore the two Rune Platebody ingredients that were visually misplaced in the crafting tree. Verify Dragonwilds recipe inputs and stations against the current wiki revisions.

## 1.0.0 — 2026-09-29

This release corrects the version sequence so existing 0.10.0 and 0.2.0 installations can receive the current app through Settings & updates. BancyCraft remains in active development.

### App Changes
- Move the complete 0.2.0 feature set to version 1.0.0 without changing the installer identity or local workspace location.
- Restore the normal in-app update path for users on 0.10.0 and 0.2.0. Download and installation still require a click.

### Bug Fixes
- Prevent the lower 0.2.0 version number from leaving 0.10.0 users without an in-app update offer.

## 0.2.0 — 2026-09-29

The loadout builder now supports a full character layout, named variants and spare equipment, while keeping planning and feedback inside BancyCraft.

### New Content
- Five selectable character illustrations: Warrior, Mage, Ranged, Exploration and Gathering.
- Named variants within one build. Start a variant empty or copy the current loadout, then switch between them in the build toolbar.
- Add up to 24 extra item slots per variant for alternate weapons, consumables or other gear. Create a shopping list from one variant or all variants, counting shared gear once.
- A Donate link in Settings opens the owner's PayPal.me page in the default browser.

### App Changes
- Rework the builder around a centered character illustration, compact equipment rows, consumables and extra items. The toolbar now groups Save/Edit, Duplicate, Add variant, Export, Share, Delete, variant and image selection, shopping list and tags.
- Keep the variant selector hidden until a second variant exists. Show the image selector only while editing; move the description below the builder and hide empty play notes in view mode.
- Include the build name in exported files and keep extra-slot quantities available for shopping lists.

### Bug Fixes
- Restore missing Dragonwilds capes and armor choices, including Obsidian Cape, Fire Cape and Rune armor, in their correct build slots.
- Prevent character images and equipment rows from growing with a maximized window or clipping the artwork.
- Make Add slots create visible, editable spare slots and persist them with the chosen variant.

This release deliberately uses 0.2.0, which is lower than the previously published 0.10.0. Existing 0.10.0 users must run BancyCraft-Installer.exe once; the in-app updater will not offer a downgrade. Local workspace data is stored outside the installation directory.

## 0.10.0 — 2026-09-29

Dune: Awakening joins the offline crafting workspace, with player-safe controller actions and another catalog coverage pass.

### New Content
- Dune: Awakening item browser, exact crafting alternatives, recipe trees, shopping lists, supplies, loadouts and source-linked equipment bundles.
- Backend player lockouts protect game switching, stops and restarts. Unknown player counts also block disruptive manual actions.

### App Changes
- Potion slots show selected items without quantity inputs. Existing saved build quantities are preserved.
- Dune refinery alternatives remain separate; water requirements are labeled and calculated in milliliters.
- Dune community-wiki/API attribution and import exclusions are bundled with the catalog.

### Bug Fixes
- Recheck server population before submitting an action; the backend refreshes population inside its serialized mutation queue.
- Recover sequel-specific Grounded 2 acquisition fields from shared item pages.
- Import the missing V Rising Iron and Golden Castle Key recipes with their real stations and base costs.
- Correct Valheim Raw Fish conversion so each recipe uses one fish alternative rather than all fish species together.
- Audit every bundled recipe tree and station across all six games. Unverified sources and unsupported generic ingredients remain explicitly incomplete.

## 0.9.0 — 2026-09-29

A tighter loadout workspace and clearer server navigation, with Bancy.gg key controls revealed only after website authentication.

### New Content
- Separate Servers and Server controllers tabs on the Servers page. Controller controls remain restricted to account-bound controller-key holders.

### App Changes
- Weapon, off-hand and chest boxes now use the compact helmet-sized height. The equipment grid has three fixed rows instead of four.
- Build name sits directly above the action toolbar without a separate heading. Owners can click the name to enter editing; shared builds remain read-only for other members.
- Tags sit at the right of the action toolbar. Description is the only content above the equipment grid; attribution moves below it.
- Empty skills, mutations, spells and play notes are hidden. Owners can add play notes in edit mode.
- Food slots have no quantity field. Potion quantities remain available in compact controls. Existing saved item quantities are preserved.
- Bancy.gg authentication and keyed sidebar features appear only after a completed website connection and hide again on sign-out. Normal local settings and updates remain available without login.

### Bug Fixes
- Remove excess height from weapon and chest slots and prevent consumable controls from clipping their titles.
- Running servers appear before stopped servers in both tabs, preserving the existing order within each group.


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
