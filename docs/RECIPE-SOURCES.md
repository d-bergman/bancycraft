# Recipe source shortlist

Researched September 27, 2026. Planned games: Valheim, RuneScape: Dragonwilds, Enshrouded.

Historical research shortlist. The subsequent user request authorized connecting all three sources. Version 0.2.0 now ships imported catalogs; see [current coverage and attribution](CATALOGS.md). The observations below describe the earlier research, not the current implementation.

## Valheim — Jötunn / JotunnDoc

Recommended technical starting point: [generated recipe list](https://valheim-modding.github.io/Jotunn/data/objects/recipe-list.html), supported by [data documentation](https://valheim-modding.github.io/Jotunn/data/intro.html) and the [maintained source repository](https://github.com/Valheim-Modding/Jotunn).

Verified: the recipe page includes internal recipe names, asset identifiers, localized item names, output amounts and ingredient quantities, including upgrade levels. The page identifies its source game build as Valheim 1.0.7; that is the page's version label, not confirmation of the user's installed version. JotunnDoc generates the documentation from game data.

Potential import: parse a pinned generated table or use a controlled JotunnDoc export after approval. This is published data/documentation, not a verified public JSON recipe API. Consumers would use a bundled BancyCraft catalog; they would not need to install a mod just to browse recipes.

Coverage caveat: ordinary recipes are not the entire production system. [Item-conversion documentation](https://valheim-modding.github.io/Jotunn/tutorials/item-conversions.html) distinguishes cooking, fermentation, smelting and incineration. Station, fuel, processing-time, building-piece and upgrade data need separate coverage checks. The repository lists an MIT code license; this does not automatically establish rights to redistribute all game artwork or extracted assets.

## Dragonwilds — RuneScape: Dragonwilds Wiki

Recommended primary reference: [community wiki](https://dragonwilds.runescape.wiki/), specifically the [Spinning Wheel](https://dragonwilds.runescape.wiki/w/Spinning_Wheel), [Loom](https://dragonwilds.runescape.wiki/w/Loom) and [Tannery](https://dragonwilds.runescape.wiki/w/Tannery) station pages and their product pages.

Verified through indexed wiki content: the Tannery has a Products table with input/output quantities and facility, and discusses the Tanner's Kit improvement. This is the kind of station-to-recipe relationship BancyCraft needs. Do not mistake the cost of building the station for the recipes processed inside it.

Access/freshness limitation: direct wiki retrieval was blocked by robots restrictions; some indexed pages were old. The current complete Spinning Wheel/Loom lists, API availability, reuse terms, recipe timings and current-patch coverage were not verified. Treat this as the best candidate to validate, not an import-ready feed. Do not bypass site restrictions or import stale snippets as current recipes.

Secondary reference: [MetaForge's Dragonwilds database](https://metaforge.app/runescape-dragonwilds) and [crafting guide](https://metaforge.app/runescape-dragonwilds/complete-guide-to-crafting-in-runescape-dragonwilds). The guide labels its last update June 29, 2026. MetaForge's Recipes category includes recipe-unlock/vestige items; its name alone does not prove a complete processing-recipe dataset. No supported bulk API or redistribution permission was established.

Proposed first user-facing feature, after approval: select a station and see what goes in, quantities, what comes out, required improvement, processing time when verified, and source/game-version information. Start with the three stations above, then connect their outputs into equipment recipe chains. These are offline catalog features and do not depend on Blackbox.

## Enshrouded — Official Enshrouded Wiki / Cargo

Recommended starting point: [official community-maintained wiki](https://enshrouded.wiki.gg/) and its [Ingredients table declaration](https://enshrouded.wiki.gg/wiki/Template:Database/Ingredients/CargoDeclare).

Verified schema fields include CraftedItem, CraftedQuantity, SourceItem, SourceQuantity, Crafter, Workshop, Workshop2, CraftingTime and RecipeID. This is the most explicit relational recipe schema found for this shortlist. [DataQuery documentation](https://enshrouded.wiki.gg/wiki/Help:Editing/DataQuery_templates) supports finding recipes by output, material or station. Preserve alternative recipes as distinct records; do not merge their ingredients or ignore output batch sizes.

Potential import: a supported MediaWiki/Cargo query or export, with recipe rows grouped by recipe identity. Live API retrieval and rate limits still require verification; direct retrieval of some pages returned 403. The wiki's page footer states CC BY-SA 4.0 unless otherwise noted ([example](https://enshrouded.wiki.gg/wiki/Template:PatchNotes)). Check attribution/share-alike obligations and separate image rights before distributing a catalog.

Secondary validation source: [enshrouded.gg](https://enshrouded.gg/), whose [about page](https://enshrouded.gg/about/) reports game-file extraction, 1,942 recipes and a last extraction date of August 15, 2026. This is a source-reported snapshot, not proof of current completeness. Useful for comparing recipe chains; no supported public API or bulk reuse license was established during this pass.

## Recommended delivery model after approval

Maintain a versioned, attributed catalog per game and bundle validated snapshots with BancyCraft. Refresh through a controlled release/update process, not live scraping on every user's startup. Keep source URL/revision, source game build, retrieval date and validation status for each dataset. Catalog lookup and station guides remain available offline without login.

Before implementation, verify permitted access and reuse, test a small representative recipe set for each source, and compare against the user's game versions. Blackbox inventory ingestion is separate work. No game-save parser, website auth or shared-storage dependency is needed for station recipe reference pages.
