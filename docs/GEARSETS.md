# Complete bundled gearset catalog

0.4.0 includes 37 Dragonwilds named armor-family bundles, 20 Valheim combat/equipment bundles and 82 Enshrouded source sets (59 armor, 23 cosmetic). Each card lists its real item IDs and adds one of each included piece to a shopping list. Seven Dragonwilds families offer a medium-helmet alternative that replaces the default helmet, rather than adding two helmets. Accessories and set bonuses are not inferred.

`scripts/catalog/gearsets.cjs` rebuilds the catalog. Dragonwilds/Valheim memberships are curated from the named families in the existing attributed item catalogs. Valheim includes the Bear/Vilebone and Deep North families present in that snapshot. The app still distinguishes unavailable recipe/source data from an uncraftable item.

Enshrouded sets are enumerated from the Armor Set and Cosmetic Armor Set categories through the official community wiki API, and member names are read from each set page's explicit Set pieces section. Set-page membership corrects an inconsistent item-page link between Golden Bulwark and Sunpiercer. Table location links are not treated as armor pieces. Source URLs and page revision IDs are stored in gearsets.json; source responses stay in the ignored catalog cache. Missing pieces disable an incomplete bundle rather than silently advertising it as complete. The bundled import has no unresolved set pieces.

The catalogs are release snapshots; newly added game content requires a subsequent catalog update. Armor and cosmetic filters apply to Enshrouded. Existing source licenses and game-owner rights in CATALOGS.md also apply to this grouping data and its item images.
