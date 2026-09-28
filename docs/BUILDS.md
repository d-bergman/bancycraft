# Builds and workspace tools

Builds are private by default in tools-workspace.json. Each game has equipment slots, quantities, tags, descriptions and skills/spells/mutations notes. These are planning choices, not simulated combat statistics.

Website accounts can publish builds by game. Only the publishing owner can update/remove one. Copies keep original creator attribution but are independent; source updates require a manual check and explicit save as a new copy. Public website avatars display with initials as fallback. Community queries show up to 200 builds per game, paginated by twelve.

Full shopping lists combine equipped quantities through the recipe calculator. Share them using the existing account-only list flow. Bank/Blackbox permissions remain separate.

Owned amounts and My Supplies are planning deductions counted once per list, without reserving across lists. Resource/station views share calculations; comparisons show known alternatives. Undo refuses rows a friend changed after your edit. Owners can undo shared deletion for ten minutes in the same session, creating a new shared copy.

Valheim levels use scripts/catalog/upgrades.cjs and the attributed Jotunn snapshot. Unknown/ambiguous upgrade inputs are excluded, never guessed. Refresh manually with --refresh before a release and review changes; clients never scrape.

Validated list/build imports get new IDs. Full backups include workspace, private builds, favorites and recents; restore validates, confirms replacement and saves before-restore copies. Credentials/keys are excluded. Gaming checklist uses native always-on-top and stays live for shared lists.
