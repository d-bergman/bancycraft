# Private BancyCraft access keys

Settings contains the cipher-key input. With no valid key, the Bancy.gg navigation and home connection panel are absent. A key must have a trusted Ed25519 issuer signature, the bancy-community scope, an active issue time and an unexpired expiration. Random text, altered keys, unrelated signing keys and expired keys are rejected by native code. Bank IPC also checks the key and selected game, rather than relying on sidebar visibility.

The app embeds only `electron/access-public.pem`. The private issuer key is stored outside the repository and app at `%LOCALAPPDATA%/BancyCraft-access-keys/issuer-private.pem`, in a folder restricted to the Windows user and SYSTEM. This is separate from the update-signing key. Preserve a private backup before moving development machines; do not rotate it silently. Never commit issued keys or the issuer's private key.

Issue keys privately on the developer machine:

```powershell
node scripts/access-keys.cjs issue "Recipient name" 365
```

The command writes the key to a new private file and prints only its path. Send that file privately to the intended recipient. Paste its contents into Settings → Cipher key → Validate & unlock. Issued keys are bearer keys: anyone given a copy can use that key until expiration. The app stores the accepted key in Windows-encrypted `community-key.bin`, separate from workspace JSON and exported backups. Lock & remove key deletes it and clears the community browser session. Browser previews cannot unlock access.

This is a signed access gate for the normal desktop app, not a replacement for backend authentication or protection against someone modifying their own copy of an offline application. Recipient labels do not grant website administrator privileges or bind a Firebase account. Shared bank access still uses the existing website's account permissions. Community keys retain the local gate described above. Controller keys use the separate online authorization described below. Expiration uses the local computer's clock.

## Server controller keys (0.8.0)

Controller access is a separate `bancy-controller` key, bound to a specific Firebase website UID. A community/bank key does not grant server controls. A controller key alone reveals Servers but does not reveal the bank. The recipient must connect their Bancy.gg account first. Settings → Website account → Copy account ID provides the UID to send privately to the issuer.

```powershell
node scripts/access-keys.cjs issue-controller WEBSITE_UID "Recipient name" 365
```

The issuer writes a private file outside the repository and prints its path only. Give it privately to that person. Paste it into Settings → Server controller key → Verify key. The backend checks the issuer signature, scope, UID, issue time, expiry and revocation on activation and every server mutation. This grants controller actions without granting website roles.

To revoke an issued controller key immediately, set `serverController/revokedKeys/KEY_ID` to `true` using an administrator's Firebase console. KEY_ID is the `id` in the signed key payload. Never publish a key or its payload. Deleting a local key removes its Windows-encrypted controller-key.bin. Signing out prevents controller actions. Workspace backups omit keys and account tokens.

The reviewed public verifier and installation helper are in `server/controller-key.mjs` and `scripts/controller-install.cjs`. The private controller retains its existing website-role path for website requests; app requests supplying a controller key cannot fall back to that role path if their key is rejected. No private controller configuration, Docker address, service account, passwords or issued key is bundled.


## Private administrator key panel (0.8.1)

Settings displays a private key panel only when an encrypted `admin-key-vault.bin` was provisioned in the owner’s app data folder. Exact Firebase UID and a live administrator grant are checked before displaying metadata and before every copy. Display names and email prefixes grant no access. Key values stay in the native process and Windows-encrypted storage, outside the repository, installer and workspace backups; the renderer receives labels and expiry only. Clipboard values clear after one minute if unchanged.

This release provisions the owner's current computer with its existing community key, a newly issued controller key and the website registration code. A controller key is bound to its recipient's account; issue another key for another person rather than handing out the owner's key. The private signing PEM is never bundled or exposed by the panel. A replacement computer must be separately provisioned.

The website registration code currently lives in public website JavaScript and is not a secret or an authorization boundary. Moving registration enforcement to a backend is separate website work. BancyCraft does not bundle that code.
