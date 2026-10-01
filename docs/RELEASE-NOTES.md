# BancyCraft 1.2.2 — Dune startup feedback

The server loading modal now waits for Blackbox to confirm the requested state. It reaches 100% and closes automatically when the server is online or stopped; if startup takes longer than the estimate, it remains visible instead of claiming completion.

The Dune startup path now retries transient LAN reflection failures and retains its last job result for diagnosis. Blackbox is running again. Guides are planned for 2.5.0 and are not included in this release.

Existing users can update through Settings & updates. New users can install BancyCraft-Installer.exe. This update preserves the local workspace under AppData.
