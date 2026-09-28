# Private BancyCraft access keys

Settings contains the cipher-key input. With no valid key, the Bancy.gg navigation and home connection panel are absent. A key must have a trusted Ed25519 issuer signature, the bancy-community scope, an active issue time and an unexpired expiration. Random text, altered keys, unrelated signing keys and expired keys are rejected by native code. Bank IPC also checks the key and selected game, rather than relying on sidebar visibility.

The app embeds only `electron/access-public.pem`. The private issuer key is stored outside the repository and app at `%LOCALAPPDATA%/BancyCraft-access-keys/issuer-private.pem`, in a folder restricted to the Windows user and SYSTEM. This is separate from the update-signing key. Preserve a private backup before moving development machines; do not rotate it silently. Never commit issued keys or the issuer's private key.

Issue keys privately on the developer machine:

```powershell
node scripts/access-keys.cjs issue "Recipient name" 365
```

The command writes the key to a new private file and prints only its path. Send that file privately to the intended recipient. Paste its contents into Settings → Cipher key → Validate & unlock. Issued keys are bearer keys: anyone given a copy can use that key until expiration. The app stores the accepted key in Windows-encrypted `community-key.bin`, separate from workspace JSON and exported backups. Lock & remove key deletes it and clears the community browser session. Browser previews cannot unlock access.

This is a signed access gate for the normal desktop app, not a replacement for backend authentication or protection against someone modifying their own copy of an offline application. Recipient labels do not grant website administrator privileges or bind a Firebase account. Shared bank access still uses the existing website's account permissions. Immediate central revocation of app keys and secure Blackbox APIs require a future server-side validator; no such service is claimed in this release. Expiration uses the local computer's clock.
