# BancyCraft

A Windows crafting companion with an independent local workspace and optional website-account sharing and key-gated community features.

## Install and open

Run `release/BancyCraft-Installer.exe`. Install for your Windows user, then launch BancyCraft from the Start menu or desktop shortcut. Node.js and Python are not required on the user's PC.

This early build is unsigned. Windows may show an unknown-publisher warning, and managed security policies may block it. Publisher signing has not been purchased or configured.

## Updating this installation

Versions 0.3.0 and later update through Settings. If upgrading from 0.2.0 or earlier, install the current version once. Then open **Settings & updates**, choose **Check for updates**, download an available release, and choose **Restart & install**. Future updates are delivered by GitHub Releases, without separate manual installer downloads.

From 0.5.0 onward, the installed app checks immediately after startup and every six hours while open. A top-right **New version available** notification lets you download and verify an update from any page. It then offers **Restart & install update**. Downloads and restarts require clicks. Dismissing the notification hides that version for the current session; Settings still provides the update controls. Checks pause while an update is pending or downloading. Settings entry also checks; corner notices are hidden while Settings displays the update.

The stable application ID is gg.bancy.bancycraft. Lists, progress, plans and supplies remain under %APPDATA%/BancyCraft, outside the installation folder. Updates require a trusted BancyCraft release signature; private publishing credentials are never included in the app. See [UPDATES.md](docs/UPDATES.md).

## Working in 0.8.0

Shopping Lists brings private lists and shared copies into one page, with shared lists below a divider. All six home tiles have original artwork; all six games are available. A separate paginated Changelog includes every release. Shopping-list row buttons open read-only crafting trees with selected recipes, stations and exact aggregated quantities.

- Bancy-themed home screen, keyboard search (Ctrl+K), game selection and navigation.
- Manual local crafting plans: create, edit, quantity, notes, status and deletion confirmation.
- Manually entered supplies scoped to each game.
- Item-first search within the selected game, with item-type/station filters, imported recipes and source details.
- Six offline catalogs: Dragonwilds, Valheim, Enshrouded, Grounded 2, V Rising and Dune: Awakening.
- Persistent local data and a previous-save backup.
- Export a JSON workspace backup and open the data directory.
- TeamCraft-inspired shopping lists, pre-craft calculation, partial completion, dependency propagation and reset controls.
- Saved lists, auto-deleting quick lists, multi-select drawer and 168 armor/cosmetic sets and equipment bundles.
- Real offline item icons and numbered results.
- Browser-approved website login and private shared shopping lists with live progress and editor names. See [SHARED-LISTS.md](docs/SHARED-LISTS.md).
- In-app update checks, downloads and restart-to-install.
- Offline Dragonwilds production ledger, merchant orders and full guide copied from the existing website.
- Private signed cipher keys, Windows-encrypted storage, and community navigation hidden when locked.
- Existing website bank inside an isolated app browser window, with the same sign-in, records and permissions.

Server registry and start/stop/restart controls use the existing Blackbox backend with a separately issued, account-bound controller key. There are no invented save totals, save watchers, game plugins or game-save access. Website credentials are entered only on the real Bancy.gg website or bank window; native keys grant no website role. See [LEDGER.md](docs/LEDGER.md), [ACCESS-KEYS.md](docs/ACCESS-KEYS.md) and [GEARSETS.md](docs/GEARSETS.md).

## Data

The app stores a validated, schema-versioned `workspace.json` under `%APPDATA%/BancyCraft`. A successful edit preserves the prior version as `workspace.json.bak` and replaces the current file using a temporary file and rename. Schema 1 migrates to schema 2 and keeps an original workspace.json.v1.bak on the first write. Corrupt or newer-version data produces an error rather than silently resetting it. Exported backups are saved wherever the user chooses; Settings restores validated full backups including builds, favorites and recents, with confirmation and before-restore backups. Credentials and keys are excluded.

SQLite remains the intended database for the later Blackbox service. Local workspace files remain independent; shared list copies use the existing website Firebase project. Introduce future storage migrations with a backup and tests preserving this schema. Never put a database on a mapped share for direct multi-client writes.

## Catalogs

Run `npm.cmd run catalog:import` to rebuild the bundled catalogs from cached source responses, fetching missing responses. Use `npm.cmd run catalog:import -- --refresh` for a fresh source snapshot. This is a development/release operation; installed applications make no catalog network requests. Run `npm.cmd run catalog:grounded2` for the separate Grounded 2 importer. Details, source coverage and attribution: [CATALOGS.md](docs/CATALOGS.md).

## Development

Requires Node.js 22.12 or newer on the development machine only.

```powershell
npm.cmd ci
npm.cmd start
```

`npm.cmd start` builds and launches the native app. `npm.cmd run dev` opens a browser-preview server at http://127.0.0.1:5173; it uses separate browser storage and does not provide desktop folder/backup actions. Changes to native app source require restarting `npm.cmd start`. Installed copies receive new versions through Settings & updates.

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run test:smoke
npm.cmd run dist
node scripts/smoke.cjs 'release\win-unpacked\BancyCraft.exe'
```

Integration tests launch the real Electron app with an isolated profile under `test-results/`. They cover native bridge security settings, local plan create/edit/delete, supply persistence, restart persistence, the connection placeholder, settings and desktop/compact layouts. They never access the normal workspace or Blackbox.

## Next release

1. Make and verify the change.
2. Update `CHANGELOG.md` and bump the version: `npm.cmd version patch --no-git-tag-version`.
3. Build the installer with `npm.cmd run dist`.
4. Follow [UPDATES.md](docs/UPDATES.md) to sign, draft and publish the authorized release.
5. Check real over-install data preservation before widening distribution.

See `docs/ARCHITECTURE.md` for the boundaries and future connection flow. The original approved screen concept is in `docs/approved-concept.png`.
