# BancyCraft 0.8.1

A more compact loadout workspace, feedback that matches the app, and a private administrator key panel.

### New Content
- Private administrator key panel with copy buttons for provisioned community, account-bound controller and website registration keys. Windows encryption keeps key values outside the installer, backups and public repository. Each copy verifies the exact owner account and live administrator grant.
- App-native bug and suggestion form submits to the existing Google Form and requires a confirmed receipt. No Google iframe or branding appears inside the app form.

### App Changes
- Fixed-size build slots and smaller artwork prevent images from stretching the loadout. Small inventory-icon fallbacks are capped to avoid excessive enlargement.
- Compact build and shopping-list overview cards. Shared build creator portraits sit at the top right with aligned creator text.
- Both access-key inputs sit under Bancy.gg authentication; website account connection remains separate.
- Builds uses a distinct loadout icon. Unavailable slots keep their titles and crossed-out symbols.
- Help guide and FAQ entries form one accordion: opening another closes the previous entry.

### Bug Fixes
- Server Refresh shows an animated busy state and prevents overlapping refresh requests.
- Feedback uses blue-gray app surfaces, readable light text and themed controls. Failed sends keep the draft and do not falsely report success.
- Private key-panel metadata never returns secret values to the renderer. Copy authorization is checked again before writing the clipboard; unchanged clipboard contents clear after one minute.

Free Windows 10/11 x64. Your workspace stays outside the installation folder. The private administrator key vault is provisioned on the owner's computer and is not included in exports or installers. Controller keys are tied to one website account and do not grant bank access. The website's existing client-side registration code remains a public registration gate, not a private security credential.
