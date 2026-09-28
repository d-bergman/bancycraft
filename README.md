# BancyCraft

A Windows crafting companion with an independent local workspace and optional future Bancy.gg community features.

## Install and open

Run `release/BancyCraft-Setup-0.3.0-x64.exe`. Install for your Windows user, then launch BancyCraft from the Start menu or desktop shortcut. Node.js and Python are not required on the user's PC.

This early build is unsigned. Windows may show an unknown-publisher warning, and managed security policies may block it. Publisher signing has not been purchased or configured.

## Updating this installation

Install 0.3.0 once if upgrading from an earlier build. Then open **Settings & updates**, choose **Check for updates**, download an available release, and choose **Restart & install**. Future updates are delivered by GitHub Releases, without separate manual installer downloads.

The stable application ID is gg.bancy.bancycraft. Lists, progress, plans and supplies remain under %APPDATA%/BancyCraft, outside the installation folder. Updates require a trusted BancyCraft release signature; private publishing credentials are never included in the app. See [UPDATES.md](docs/UPDATES.md).

## Working in 0.3.0

- Bancy-themed home screen, keyboard search (Ctrl+K), game selection and navigation.
- Manual local crafting plans: create, edit, quantity, notes, status and deletion confirmation.
- Manually entered supplies scoped to each game.
- Item-first search within the selected game, with item-type/station filters, imported recipes and source details.
- Three offline catalogs: Dragonwilds, Valheim and Enshrouded.
- Persistent local data and a previous-save backup.
- Export a JSON workspace backup and open the data directory.
- TeamCraft-inspired shopping lists, pre-craft calculation, partial completion, dependency propagation and reset controls.
- Saved lists, auto-deleting quick lists, multi-select drawer and starter armor bundles.
- Real offline item icons and numbered results.
- In-app update checks, downloads and restart-to-install.
- Browser link to Bancy.gg. This is not an authenticated app connection yet.

There are no invented server totals, save watchers, game plugins, game-save access, credential collection or Blackbox services in this build.

## Data

The app stores a validated, schema-versioned `workspace.json` under `%APPDATA%/BancyCraft`. A successful edit preserves the prior version as `workspace.json.bak` and replaces the current file using a temporary file and rename. Schema 1 migrates to schema 2 and keeps an original workspace.json.v1.bak on the first write. Corrupt or newer-version data produces an error rather than silently resetting it. Exported backups are saved wherever the user chooses; restoring through the UI is not implemented yet.

SQLite remains the intended database for the later Blackbox service. The small local skeleton does not need a shared database. Introduce future storage migrations with a backup and tests preserving this schema. Never put a database on a mapped share for direct multi-client writes.

## Catalogs

Run `npm.cmd run catalog:import` to rebuild the bundled catalogs from cached source responses, fetching missing responses. Use `npm.cmd run catalog:import -- --refresh` for a fresh source snapshot. This is a development/release operation; installed applications make no catalog network requests. Details, source coverage and attribution: [CATALOGS.md](docs/CATALOGS.md).

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
