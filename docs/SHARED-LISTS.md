# Website accounts and shared lists

Sharing needs only the existing Bancy.gg Firebase account. Bank and Blackbox retain their cipher keys and backend permissions.

Connect from Settings or Shared Lists. The system browser reuses the existing website login and asks for consent. A five-minute AES-256-GCM handoff uses a random 256-bit request and encryption key in a URL fragment, which is removed from history. The database holds only ciphertext, UID, IV and expiry. Parent enumeration and expired reads are denied. Approval is write-once; accepted records are deleted. Abandoned encrypted records can remain after expiry; there is no paid cleanup function.

Native Google verification checks account and refresh credential against the configured Firebase project. Windows safeStorage encrypts the stored refresh token and UID. ID tokens stay native-only, outside renderer IPC and workspace exports. App Disconnect deletes the credential; browser sign-out is separate. Firebase session revocation revokes refresh sessions.

Share a copy of a local list; its original stays local. Search connected app users by website display name, checking UID suffixes for duplicate names. Lists are private to members. Members edit targets, recipes and progress; only owners manage members or delete lists. Existing publicProfiles permissions stay unchanged; only the current account's email is displayed.

Authenticated REST streams subscribe to the user's list index and open list. Base64url encodes recipe/progress keys. ETag conditional writes preserve independent edits and reject stale changes to the same field/row. Direct changes store author UID, amount and time; names come from website profiles. The existing recipe engine handles completed craft dependencies. There is no offline write queue or sharing of personal supplies.

Rules keep the 16 UID slots immutable for non-owners and consistent with membership. Reads and indexes remain private. Shared list content is not end-to-end encrypted: members and the Firebase administrator can access it. Handoff and local credentials are encrypted. No new Firebase project or paid service is used; no game saves are changed.

Validation: shared-emulator-smoke.cjs covers live progress and authorization with two users and an outsider. account-browser-smoke.cjs uses the actual consent page and Web Crypto with emulator accounts and fixture storage. shared-ui-smoke.cjs checks Windows-encrypted storage, native IPC and two packaged app users. Browser flags allow loopback access only in the isolated test profile.
