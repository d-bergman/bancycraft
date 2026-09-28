# Foundation and next steps

## Current boundaries

React/TypeScript renders bundled local content. Electron runs with sandbox, context isolation and no renderer Node integration. A restricted preload bridge exposes individual methods. Main-process handlers validate the sender and workspace payload. New windows, navigation away from the local UI, webviews and permission requests are blocked. External browser links are limited to the fixed Bancy.gg URL and validated HTTPS source/license domains and paths.

The local JSON store owns manual plans and supplies. It has a schema version, write validation, previous-save backup and safe failure on unknown data. No game or website credentials are requested. There is no telemetry.

## Future Bancy connection

The user clicks Connect to Bancy.gg. Open an authorization request in the system browser with state and PKCE (or an equivalent reviewed native-app flow). Bancy.gg authenticates the user and asks to authorize the app. Return a short-lived, single-use code through a validated native callback. Exchange it for narrowly scoped tokens and store secrets in OS-protected storage. The backend independently checks membership and permissions for every resource. Handle expiry, logout, revocation and account switching; never infer app login from a browser session or trust client role flags.

Logging out removes credentials and private connected caches. Local plans remain. Blackbox loss must not stop the local app. Shared data displayed offline must be labeled with its last-confirmed time, and shared mutations must not pretend to succeed.

## Future indexer

Blackbox owns its local SQLite file behind an authenticated API. Clients do not open the database or game-save share. Game adapters parse stable copied snapshots and publish normalized inventories. Shared snapshot identity and recipe correctness must be proven before subtracting quantities from a plan. Opt-in player inventories are separate from shared storage.

## Updates

0.3.0 uses public GitHub Releases with electron-updater's GitHub provider. Check, download and installation remain explicit. Stable app ID and userData path preserve the workspace. Each installer is checked against both its manifest hash and the embedded Ed25519 update key. See [UPDATES.md](UPDATES.md) for release signing, publication and bootstrap instructions.

The shopping-list engine builds a dependency graph from the selected game's catalog, combines shared needs before batch rounding, and propagates completed outputs to ingredients. Acquisition sources are descriptive. See [SHOPPING-LISTS.md](SHOPPING-LISTS.md).

## Known foundation limits

- Recipe catalogs remain partial; supported recipes expand into shopping-list quantities, while unknown acquisition/processing data stays explicit.
- Website authentication and Blackbox indexing are not implemented.
- JSON export is implemented; UI restore is not.
- Only Windows x64 installer is built.
- Installer is unsigned; Windows security policies vary.
- Programmatic tests cover migration, restart persistence, signature checks and live update download; installation into the user's existing Windows profile is not performed by test scripts.
