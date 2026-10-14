# beta.16 entry and runtime UI delivery

Source commit: 2f8205fc1ef0d00f7fd47d59d2ea5269eac98c42. Production BUILD_INFO records trackedSourceDirty=false.

Source verification: 515 passing tests, production build, zero-warning lint, full editor/runtime/hosted/SDK browser regression and participant public-entry regression. Dedicated browser checks cover language round trips and invalid preferences, participant retry guidance, operator stale lock/recovery, lost acknowledgement without duplicate execution, and local media recovery while preserving checksum validation. Device/monitor/media fixtures are synthetic.

Production verification: ZIP CRC, exclusions for private state and dependency caches, 365 Server manifest file hashes, route/admin rendering, configured emotion template persistence and independent repeated creation. Dedicated production entry check covers Japanese/English/Chinese, invalid-language fallback and decoded 192/512 installation icons.

Server, SDK and launcher match beta.15; dependency installation and full DB execution were not rerun for this UI stage. Human trials, formal hardware and original-stimulus results remain pending.

Packages: release-web/PhysioFlow-Web-v0.6.0-beta.16.zip and PhysioFlow-Server-v0.6.0-beta.16.zip. Evidence: artifacts/entry-ui-2026-10-15/package-beta16/.

Checksums:

```text
d80c453ae2e923f4c4349b8ad3c2491304b35f3090627ca108516a8814938dbe  PhysioFlow-Server-v0.6.0-beta.16.zip
e84f3b9673b7c6b6ef9d720cc5b472e055af257e1dbdd46327551ca67384b22f  PhysioFlow-Web-v0.6.0-beta.16.zip
```

Delivery branch: lab/codex/lab-handoff-20260924. Main remains unchanged.
