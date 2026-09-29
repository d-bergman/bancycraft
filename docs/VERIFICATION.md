# Verification

## 0.8.0 builds, lists, catalog audit and server access

Checked on Windows x64, September 28, 2026. All 46 unit tests pass. Source Electron UI checks passed for share/unshare/delete ownership, default view mode, explicit editing, independent variants, linked supplies, once-only consumption and completion counts, no list recovery after deletion, capes, slot filtering and two-handed off-hand locking. Backend emulator checks passed for sharing permissions, stale writes and member removal.

The NSIS x64 installer and final renderer built successfully. Final packaged startup/search/persistence, list migration/quantity/completion/reset, two-user shared-list direct insertion and live progress, owner build actions, server-key controls and backup checks all passed. The packaged archive contains no private credential files; the installer signature validates against the bundled public key. Packaged checks passed for the server-key UI and in-place list insertion, build sharing, supplies, changelog, dark feedback, workspace backups and controlled update entry/notification/install behavior. Real install invocation is intercepted in QA; the user’s installed copy is not replaced.

After publishing 0.8.0, a fresh packaged startup confirmed the public current-version check. The live updater test simulated 0.4.1, discovered 0.8.0, downloaded the real public installer, invoked and passed the bundled signature verifier, and offered Restart & install from Home. Settings correctly suppressed the corner popup. No actual installation was invoked. The uploaded draft notes and all five asset sizes/digests matched the tested local release before publication.

The server UI test uses an isolated profile and mocked registry/controller transport. It verifies hidden navigation without a key, account-bound activation, separate bank access, confirmation before mutation, key removal and direct private-list insertion. No production game server actions are invoked by this test. The live read-only controller check verifies a valid key and rejects wrong-account, wrong-scope, expired, forged and anonymous requests, then removes its temporary account. Only the game-server-controller service was restarted for deployment; the running game server was left up.

The source pass pins 900 Valheim item pages and checks default and alternate trees across all five snapshots. Valheim's active recipes have no unresolved ingredient IDs; two internal-prefab recipes lack a verified station. Remaining acquisition gaps and generic Enshrouded ingredient constraints are itemized in coverage-audit.json. Recycling cycles and uncredited byproducts remain explicitly warned rather than inventing inputs or output credit. Removed V Rising pages are excluded from current pickers. Original artwork has a safe icon fallback.

Credential scans cover Git history and tracked/unignored current text in both public repositories. No private signing keys, issued access tokens, GitHub credentials, Discord credentials or service-account private keys were found. Public verification keys and Firebase web configuration are intentionally public. Private runtime credentials and key issuer files remain outside the repositories.


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

## 0.5.0 — September 28, 2026

- 26 unit tests passed; four offline catalogs, valid item/source IDs, local Grounded 2 icons, gearset membership, handoff tampering, safe stream paths, concurrent edits, persistence and update scheduling are covered.
- Production build and Windows NSIS installer completed. BancyCraft-Installer.exe is the only executable published for this version; a legacy signature alias preserves older-client verification.
- Packaged tests passed for four game catalogs, search/station variants, shopping-list completion/reset and persistence, existing production ledger, access-key encryption/gating, native IPC and renderer isolation.
- Two packaged app profiles connected emulator website accounts through the real native handoff, stored sessions with Windows encryption, shared a list, invited a friend, propagated pre-craft completion/reset and author names live, added targets and deleted the shared list. Desktop and compact layouts were visually checked.
- The actual website consent page reused an existing isolated-browser login, performed Web Crypto AES-GCM approval, and passed native account/project verification, session refresh/restore and disconnect against Firebase emulators.
- Live production Firebase tests passed with two temporary authenticated users and an outsider: private reads, live progress, author attribution, stale-row conflicts, owner-only membership/deletion and access revocation. QA records and accounts were removed afterward.
- All 23 existing website rule branches matched a fresh live baseline before deploying the four new BancyCraft branches. No existing bank/member permission was broadened. Production dependencies have zero reported vulnerabilities.

Installer replacement over the user's own installed app is intentionally not performed. Tests use isolated profiles; no game saves or Blackbox services are accessed. Shared offline writes are disabled and local lists remain usable.

Live delivery verified after publication: the website landing page, clean-URL connection page, Project Archive card, navbar and Nexus downloads are live. The stable installer endpoint returns the 0.5.0 executable. A fresh packaged 0.5.0 startup checked the published release without Settings. An actual preserved 0.4.1 build automatically discovered 0.5.0, downloaded BancyCraft-Installer.exe through its unmodified updater, and verified the legacy signature alias. The new verifier also downloaded and validated the published installer. No install was invoked over the user's app. GitHub release metadata briefly retained the prior version immediately after publication; a subsequent normal fresh check saw the new release.
## 0.5.1 — September 28, 2026

- All 26 unit tests passed; TypeScript/Vite and the Windows NSIS package built successfully.
- Packaged native smoke checks cover four offline catalogs, private/shared list placement and separator, removed duplicate sidebar entries, six loaded illustrations, Planned badges without title overlap, persistence, renderer isolation and update settings.
- Shopping-list smoke passed: multi-selection, exact materials, craft completion propagation/reset, quick-list cleanup, gearsets and restart persistence.
- Two packaged users passed account handoff/encrypted storage, sharing a private copy, invitation, live pre-craft progress/reset with editor names, target edits and deletion. The combined page test explicitly selects the shared section when private and shared copies have the same name.
- The website preview passed desktop/mobile checks: all six game illustrations and the app screenshot load, planned states remain explicit, the stable installer link is correct, the navbar is included and the mobile page has no horizontal overflow.
- Existing website navbar and Nexus links remain in place; the Projects card now uses the actual packaged app screenshot. The connection page and website database rules are unchanged.
## 0.6.0 — September 28, 2026

- 31 unit tests passed, including shared batch aggregation in crafting trees, selected/direct recipes, real Vis Cloth loom inputs, complete changelog extraction, V Rising rowspans and rejected unknown material quantities.
- Built the Windows NSIS installer and tested the packaged executable. Existing list progression/reset, quick lists, gearsets, persistence, renderer isolation and update controls passed.
- Feature UI checks passed offline: Vis Cloth and Mithril Mace recipe trees, station details, preview quantity changes without modifying list progress, compact layout, paginated Settings history through 0.1.0, V Rising items/sets and persisted selection.
- Packaged two-user UI checks passed with a shared pre-craft tree and unchanged shared progress, live completions/reset, author names, target changes and deletion.
- V Rising shared-list rules passed emulator and production checks with two temporary authenticated users, an outsider, stale-edit conflicts and owner-only membership/deletion. Temporary production QA records/accounts were cleaned up. Only the allowed game enum changed in the website rules.
- Final source import: 530 inventory entries, 315 own-page crafting recipes, 25 source-defined sets and 502 local icons. Removed infobox categories/pages are excluded. Every recipe reference resolves; all required icon files exist. Room/floor/server cost modifiers remain explicitly unapplied.

## 0.6.1

35 unit tests pass, including all Valheim gearset recipes and the Protector → cast → Bloodgold → Petrified Tissue chain, five-game set coverage with documented loot/unknown sources, and feedback validation/configuration/service acceptance/failure. Packaged Settings modal verifies both report types, draft retention, disabled sending before configuration and Escape/focus behavior. Feedback tests never send email. Direct delivery awaits an owner-supplied Formspree endpoint and inbox confirmation.

## 0.7.0 — September 28, 2026

- 39 unit tests pass: catalog and gearset chains, duplicate reference migration, owned DAG deductions, sourced upgrade levels, independent private builds, protected stores and per-row shared conflicts.
- TypeScript, production renderer and Windows NSIS packaging pass. Final packaged tests cover dedicated lists, favorites/recent, station views, native always-on-top, independent variants, Google embed isolation and restart persistence.
- Native backup tests verify full export/restore, before-restore copies, new imported build IDs and malformed/future backup rejection without data loss. No real user profile is modified.
- Two-user native UI tests verify website identity handoff, publication/discovery, private copies, opt-in source updates and retained variants. Existing live list completion/reset, authorship, target changes and cipher bank gates pass.
- Firebase emulator and production QA verify build owner rules, anonymous/outsider denial, avatar data, source attribution, stale-write rejection, assignments/owned amounts, member removal and shared-deletion undo. Temporary production QA builds/lists/profiles/accounts were cleaned up.
- Ledger regression remains 3,384 hides, 4 purchases and 50,760 Chit profit. Production timing, merchant orders and website bank sandbox pass. Website ledger is unchanged; only BancyCraft Firebase branches were updated.
- Valheim native upgrade UI verifies two owned level-1 tunics upgraded to level 4, 36 Bronze, exclusion of initial Protection Idol cost and matching tree. The repeatable importer retains 265 unambiguous verified chains.
- Changelog pagination through 0.1.0, crafting-tree read-only behavior and V Rising browser/sets pass. Update popup tests verify explicit download/install flow and backups without installing over the user's app.
- One labelled Google Form QA response reached the confirmation page; owner email notifications are enabled. Gmail inbox receipt is not claimed. Google controls inner form styling; the surrounding app modal matches BancyCraft.
- After publication, the actual 0.4.1 client discovered 0.7.0, downloaded BancyCraft-Installer.exe and verified the compatibility signature before offering restart/install. GitHub's briefly stale feed was rechecked successfully. The fresh 0.7.0 client checked automatically on startup. Installation was not invoked in QA.
- The live website download page, responsive layout, Projects card, navbar/Nexus links and clean login URL passed verification.
- The final current-app live updater test also passed anonymous release discovery, public installer download and embedded-key verification, with the restart/install corner prompt. QA polling now waits for completed native status rather than treating an async renderer promise as completion.

## 0.7.1

Native checks verify linked supplies and once-only deduction (154 Mithril Bars to 138 for two Mithril Maces), reset/re-complete without repeat deduction, target quantity editing, no target Already have field, overview deletion without recovery, Ashen Cape selection, helmet filtering, two-handed off-hand lock, separate Changelog and dark form display. The illustrated loadout was visually inspected. Isolated profiles protect user data.

## 0.8.1 verification — 2026-09-29

- 48 unit tests pass, including feedback receipt/validation/schema changes and owner key-panel denial for a copied display name, wrong UID, missing admin grant, sign-out and sign-out during verification.
- Packaged UI: fixed 680-pixel-wide, 624-pixel-high equipment grid; capped 64-pixel icon fallback; unsupported titles; read-only/edit flow; shopping cards at most 340 pixels; shared creator portrait and inline attribution; single-open Help accordion; combined authentication; native blue-gray feedback form; failure keeps draft; confirmed success; animated, disabled server refresh.
- Existing list/supply regression checks pass: linked supplies, once-only deduction, target quantity edit, deletion without recovery, capes, slot filtering and two-handed off-hand lock.
- Real Banri login verifies the encrypted owner-only panel with three key labels and no secret values in the DOM. The privately issued controller key was authorized by the live backend and activated locally; real registry and nine controller entries loaded. No production start/stop/restart operations were performed.
- Two clearly labeled form delivery test records were accepted by Google; the custom confirmation text initially failed the old receipt matcher. The receipt matcher now uses Google's confirmation link and rejects question/validation pages. The saved real confirmation receipt was verified without submitting another record. UI send/failure tests use mocks.
- The native feedback layout replaces the Google iframe. Existing form notifications/settings are preserved; there is no new mail-delivery service. Changing the hosted form questions requires updating the adapter.
- Keys are Windows-encrypted outside the repository and installer; public verification PEM files remain public. The website's pre-existing public registration code was copied only into the encrypted local vault, not the app source. Moving website registration enforcement to a backend remains separate website work.

- Final ASAR has 12,723 entries, contains the final native account-change safeguard, and contains no issuer/private signing PEMs, encrypted key vaults or account credentials. Working-tree and Git-history credential scans report no findings.
