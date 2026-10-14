# beta.15 UI stage delivery

Source commit: 5bf6212eaec5585977f88e1a252c8ca17083d463. Both packages were built with trackedSourceDirty=false.

515 tests passed, production build and zero-warning lint passed. Shared template dialogs, short-screen bounds, dark theme, keyboard handling, save failure retention and multi-viewport editor regression passed. Production ZIP browser verification confirmed assets, SPA routes, admin entry, configured emotion template persistence and independent repeated templates.

ZIP CRC and private/cache directory exclusion passed. The Server source manifest hashes were verified. Server, SDK and launcher contents match beta.14; installation and full PhysioDB execution were not repeated for this UI-only stage. Earlier server evidence remains scoped to its recorded version. Human trials and formal hardware acceptance remain pending.

Packages: release-web/PhysioFlow-Web-v0.6.0-beta.15.zip and PhysioFlow-Server-v0.6.0-beta.15.zip.

Checksums:

```text
eea0f399d38e4c719ef2536388da8a6c3e747465b5bc6c001bf95d00c0e44e33  PhysioFlow-Server-v0.6.0-beta.15.zip
519ad982758ef159c997e4c8f651cb2b39d022febe5e1ecc0f292a65cdc51c9e  PhysioFlow-Web-v0.6.0-beta.15.zip
```

Production evidence: artifacts/editor-ui-2026-10-15/package-beta15/. Delivery branch: codex/lab-handoff-20260924 on lab; main is unchanged.
