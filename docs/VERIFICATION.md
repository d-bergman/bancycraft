# Verification

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
