# Verification

## 0.4.1 automatic checks and corner update notification

Checked on Windows x64, September 28, 2026. All 22 unit tests passed. TypeScript, production renderer and NSIS x64 installer builds passed. Existing packaged startup/persistence/search smoke checks and the new packaged update-notification test passed against 0.4.1.

- Timer tests cover the ten-second startup delay, six-hour repeat, cleanup on shutdown and rejected checks. Updater tests prevent concurrent background checks, automatic downloads/restarts and overwriting pending/ready updates.
- The packaged notification test waits for the actual startup scheduler without opening Settings or invoking Check. Controlled updater transport verifies the corner popup, explicit download, progress, ready state, explicit install IPC, and a byte-equivalent workspace backup before the mocked installer call. It also checks dismissal for the session/version, a new notification for a different version, and Settings fallback. The fixture version 9.9.9 is deliberately not a real published update.
- Notification screenshots were visually reviewed at desktop and minimum 1050 × 740 window sizes. Native installer invocation is intercepted in this test; no user installation is overwritten. Real release download/signature verification is checked separately after publication.

After publishing 0.4.1, the packaged live-release test passed an anonymous current-version check, simulated 0.4.0 discovery, real installer download from the Home-page corner notification, embedded-key signature verification and the corner Restart & install update control. Uploaded assets matched local file sizes and SHA-256 digests. No actual user installation was replaced during these isolated tests.

## 0.4.0 gearsets, production ledger and access keys

Checked on Windows x64, September 28, 2026. TypeScript, production renderer and NSIS installer builds passed. All 20 unit tests and all three packaged Electron tests passed against the final 0.4.0 executable.

- Gearset checks validate every bundled item ID, unique pieces, all seven Dragonwilds helmet alternatives, and authoritative Enshrouded set-page membership. Packaged checks exercise Dragonwilds alternatives, 20 Valheim bundles and 82 Enshrouded bundles including 23 cosmetic sets.
- The offline ledger reproduces the website regression: 3,384 hides (34 stacks plus 18 loose), four purchases (999 + 999 + 999 + 387), 152,280 Chit cost, 203,040 revenue and 50,760 profit. Station timing, merchant filtering and order totals also pass. Owned website assets and calculation code are copied with recorded provenance; the website repository remains unchanged.
- Access tests reject altered, expired, future-issued, wrong-scope and untrusted keys. Packaged checks confirm actual Windows encrypted persistence across restart, hidden navigation while locked, direct native request rejection without a key, and key removal/session closure when locking.
- The native community window has no Node access or app preload and is restricted to Bancy.gg. Packaged checks load the real signed-out website bank, prefill a reviewed merchant request, and verify closing the bank when changing games or locking. No request was submitted and no production bank record was written. An anonymous live Firebase bank read returned HTTP 401.
- Desktop ledger, gearsets and signed-out bank screenshots were visually reviewed. Existing search, shopping-list progress, migration and persistence smoke tests also pass. The packaged archive contains the access public key and ledger, with no private issuer key or issued access key.

Actual installer-over-installer replacement has not been performed against the user's installed copy. Shared-bank member/admin mutations retain the website's existing implementation and were not exercised against production data.

After publishing 0.4.0, the packaged live-update test passed: anonymous current-version check, simulated 0.3.0 discovery of 0.4.0, actual public installer download, embedded-key signature verification, and the Restart & install control. The four uploaded release assets matched the local tested files by SHA-256 and size. The test used an isolated profile and did not install over the user's copy.

## 0.3.0 shopping lists and updates

Checked on Windows x64, September 28, 2026. Production build, 17 unit tests, and both packaged Electron integration tests passed. NSIS x64 installer built successfully.

- Offline, game-scoped search; icons; filters; quantity input; multi-selection appearing only for multiple items; new/existing list drawer; gearset bundle; and numbered pagination are implemented. Packaged tests exercise searching across all three games and actual Dragonwilds recipes.
- Packaged shopping-list test verifies version-one migration with an immutable original backup, pre-craft completion propagating to material requirements, reset, regular-list retention, hiding completed rows, quick-list deletion, adding a selection to an existing list, gearset addition and restart persistence.
- Engine tests verify combined shared demand before batch rounding, partial completion, recipe alternatives, direct acquisition, opt-in supplies, missing data and recipe-cycle handling. Material origins never become invented kill/node counts.
- Desktop search/selection and shopping-list screenshots, plus minimum 1050 × 740 layout, visually checked. Help and Settings remain reachable.
- 4,804 item icons are bundled locally. Packaged attribution notices and the pinned public GitHub update feed were checked. The updater config includes the publisher field required to invoke the custom Ed25519 verifier; the private key is outside the repository.
- Unit tests reject altered installers and unrelated keys, and require explicit download and ready state before invoking installation. Workspace data stays outside the installation folder, with an additional backup before update installation.

After publication, `scripts/updates-smoke.cjs` passed against the real packaged app and public release. It confirms an anonymous current-version check, discovery with the updater's version simulated as 0.2.0, an actual installer download, invocation of the embedded-key signature verifier, and the Restart & install control. The test uses an isolated workspace and separate updater cache. Its initial harness mistakenly treated an async polling predicate as completed; it now waits for the actual rendered current-version message before simulating the older version. No application change was required.

Actual installer-over-installer replacement has not been performed against the user's installed copy. Installation invocation is unit-tested; live download and verification are integration-tested. Earlier coverage limitations in the imported catalogs still apply; missing recipes remain explicit.

## 0.2.0 catalogs

Checked on Windows x64, September 27, 2026. TypeScript/production build, eight unit tests and packaged Electron integration test passed. The NSIS x64 installer was built successfully.

- Offline item search verified across all three games with the network disabled. Searching Coarse Thread in Valheim and Bloodgold in Enshrouded returned no cross-game results.
- Verified Dragonwilds Coarse Thread alternatives, Loom/Tannery filters and Enshrouded Linen processing alternatives. Bloodgold correctly labels its missing processing recipe.
- Audited source enumeration; fixed underscore template names so all 2,607 Enshrouded item/armor transclusions are imported. Valheim excludes unresolved localization placeholders and preserves prefab variants.
- Verified catalog IDs, positive exact recipe quantities, provenance links, unsafe source-link rejection, renderer sandboxing, Enshrouded selection persistence, and existing plan/supply CRUD and restart persistence.
- Desktop/compact catalog and home screenshots visually checked. Final preview: app-catalog-0.2.0.png.
- Source notices confirmed inside packaged app.asar. No source requests are made while browsing. Public API calls occur only in the developer importer.
- Vite reports the expected large bundled-data chunk warning; the app opens and searches correctly offline. Catalog splitting can be considered if future data significantly increases startup cost.

The installer was built and the packaged app tested with an isolated profile. Actual installer-over-installer migration and hosted automatic updates remain untested; the user's existing installed copy was not changed. Stable app ID, separate userData location and tested data preservation remain in place.


## 0.1.1 logo update

Production build and packaged Electron smoke test passed with the supplied sidebar artwork. Home screen visually inspected at desktop size; the existing compact-layout test passed. A prior smoke attempt lost its expected test supply after restart; an immediate-store assertion was added for diagnostics and the subsequent packaged run passed. No persistence implementation was changed in this release. Recipe work is documentation-only. Installer-over-installer upgrade remains untested.

Checked on Windows x64, September 27, 2026.

- TypeScript check and production renderer build passed.
- Windows NSIS installer built successfully with BancyCraft icon, product name and version metadata.
- Four persistence/validation unit tests passed.
- Real packaged Electron application integration test passed: startup, isolated renderer, manual plan create/edit/delete, supply saving, data retained across restart, connection placeholder, update instructions, normal and minimum window sizes.
- Home and Settings screenshots visually inspected. Short-window sidebar refined so Help and Settings remain visible.
- Production dependency audit: zero known vulnerabilities at build time.

An earlier development-mode test timed out on deletion; the packaged run passed before and after adding dialog-visible save errors and failure diagnostics. No test data was written to the user's normal profile.

The installer has been built, not installed into the user's Windows profile as part of this task. Actual installer-over-installer migration and online update delivery are not claimed as tested. Update preservation is supported by stable NSIS app identity, an invariant separate userData directory, and verified restart persistence. Test an actual N-to-N+1 upgrade for the next release.

Screenshots are generated under `test-results/`. Tests use isolated profiles there. No Blackbox access, website deployment or remote publishing was performed.
