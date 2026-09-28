# Dragonwilds production ledger

Production Ledger appears only while Dragonwilds is selected. It copies the owned website's full Profit Workshop, Production Planner, merchant catalog/order builder, inventory/hotbar settings, recovery calculations and Help guide. The website remains available. `scripts/sync-ledger.cjs` records the source commit in LEDGER-SOURCE.json and rebuilds this copy; it does not edit the website.

Public calculations run offline in an opaque sandboxed frame, with owned scripts/styles inlined and no network connections or native bridge. Material/chit stacks, 999-unit purchase batching, method prices/yields, ten-second station timing and chest-capacity definitions remain those of the source website. Values remain planning assumptions supplied by that existing ledger, rather than live market measurements. Fields begin blank; this copy does not create fictitious inventory or transactions.

The shared bank opens inside BancyCraft in a separate sandboxed browser window pinned to Bancy.gg. It uses the website's existing Firebase records, account sign-in, member/admin permissions, request approval transactions, activity history, adjustments and physical chest-capacity controls. The website's email/password login is available in that window. Remote pages receive no native preload/IPC bridge. No new Firebase project, bank database or paid service is created.

A valid app access key is required before opening this window. The bank tab and merchant requisition action are hidden without it. Local merchant orders can prefill a purchase amount and note in the real bank window; users sign in, review and submit using the existing website form. Importing an order never submits a transaction or pretends that funds were approved, and does not clear the local order automatically. Normal account permissions still govern the shared bank. No member/admin writes were exercised against production records during validation.

Selecting another game closes an open bank window. Removing a key closes the community window and clears its app browser session. Test profiles use separate browser partitions. Blackbox inventories and save parsing remain a separate milestone.

Crafting Planner is the existing manual project notebook (quantity, notes and status). Shopping Lists calculates game recipes. Production Ledger calculates merchant profit, station throughput and order funding; these purposes are separate.
