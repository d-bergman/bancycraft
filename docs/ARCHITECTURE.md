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

0.2.0 uses versioned NSIS installers. Data is outside the install directory. Installer identity and userData path are invariant. No network request is made for updates while `feedUrl` is null.

The optional electron-updater integration is main-process-only, HTTPS-only, disallows downgrades and waits for user actions to download and restart. Hosting is deliberately unconfigured. Before enabling, choose the distribution location, configure release metadata, decide update-artifact authenticity controls for unsigned Windows builds, and test actual N-to-N+1 installation, interrupted downloads and migration rollback. Do not add arbitrary update URL input to the renderer or ship publisher credentials in the app.

## Known foundation limits

- Partial recipe catalogs are bundled; quantity calculators and automatic gathering lists are not implemented.
- Website authentication and Blackbox indexing are not implemented.
- JSON export is implemented; UI restore is not.
- Only Windows x64 installer is built.
- Installer is unsigned; Windows security policies vary.
- Programmatic tests cover restart persistence; real installer upgrade testing is a separate release check.
