# BancyCraft

A Windows crafting companion with an independent local workspace and optional future Bancy.gg community features.

## Install and open

Run `release/BancyCraft-Setup-0.1.1-x64.exe`. Install for your Windows user, then launch BancyCraft from the Start menu or desktop shortcut. Node.js and Python are not required on the user's PC.

This early build is unsigned. Windows may show an unknown-publisher warning, and managed security policies may block it. Publisher signing has not been purchased or configured.

## Updating this installation

1. Download the next version's `BancyCraft-Setup-<version>-x64.exe`.
2. Close BancyCraft and run that installer. Keep the same installation location.
3. Open BancyCraft again. The application files have changed; your workspace remains.

Do not uninstall before updating. The stable application ID is `gg.bancy.bancycraft`, and data lives at `%APPDATA%/BancyCraft`, outside the installation folder. Never change either identity casually. Settings & updates includes these instructions and a workspace backup button.

Automatic online update delivery is not active in 0.1.0. There is no deployed update server, GitHub release repository or website change. Future hosted updates have a main-process electron-updater integration, with explicit check/download/restart actions, and a disabled `electron/release-config.json` feed. It must remain disabled until a trusted HTTPS feed and its upgrade path are tested. Manual installer updates work independently of Bancy.gg login or Blackbox.

## Working in 0.1.0

- Bancy-themed home screen, keyboard search (Ctrl+K), game selection and navigation.
- Manual local crafting plans: create, edit, quantity, notes, status and deletion confirmation.
- Manually entered supplies scoped to each game.
- Search within the selected game's plans and supplies.
- Persistent local data and a previous-save backup.
- Export a JSON workspace backup and open the data directory.
- Clear upcoming-feature screens for the recipe catalog, calculations, gathering lists and shared services.
- Browser link to Bancy.gg. This is not an authenticated app connection yet.

There are no fake recipes, invented server totals, save watchers, game plugins, game-save access, credential collection or Blackbox services in this build.

## Data

The foundation stores a validated, schema-versioned `workspace.json` under `%APPDATA%/BancyCraft`. A successful edit preserves the prior version as `workspace.json.bak` and replaces the current file using a temporary file and rename. Corrupt or newer-version data produces an error rather than silently resetting it. Exported backups are saved wherever the user chooses; restoring through the UI is not implemented yet.

SQLite remains the intended database for the later Blackbox service. The small local skeleton does not need a shared database. Introduce future storage migrations with a backup and tests preserving this schema. Never put a database on a mapped share for direct multi-client writes.

## Development

Requires Node.js 22.12 or newer on the development machine only.

```powershell
npm.cmd ci
npm.cmd start
```

`npm.cmd start` builds and launches the native app. `npm.cmd run dev` opens a browser-preview server at http://127.0.0.1:5173; it uses separate browser storage and does not provide desktop folder/backup actions. Changes to native app source require restarting `npm.cmd start`. Installed copies change only when a new installer is installed.

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
4. Test it and give the user the new versioned installer.
5. Check real over-install data preservation before widening distribution.

See `docs/ARCHITECTURE.md` for the boundaries and future connection flow. The original approved screen concept is in `docs/approved-concept.png`.
