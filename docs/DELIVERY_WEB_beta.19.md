# beta.19 participant design delivery

Application source commit: bab1f98081c30735c9007341cebd7863ded310d1. Package BUILD_INFO records trackedSourceDirty=false.

529 tests, production build, zero-warning lint and complete editor/runtime/hosted/SDK plus multi-viewport browser regression passed. Dedicated actual-builder/renderer checks cover optional numeric bounds, error location and focus, immediate correction feedback, keyboard rating, zero/decimal values and interactive preview. Schema and saved-session snapshots were unchanged by preview interactions.

Production ZIP verification passed: compiled assets, SPA/admin entry, template persistence and independent creation. The actual production screen designer opened from a synthetic draft; appearance-only preview initially disables submission, interactive preview rejects empty and out-of-range values, accepts numeric zero and resets answers/results. The first fixture clicked the sequence row container; it was corrected to click the real selection button, with no application change.

ZIP CRC, private/cache exclusions and 366 Server manifest hashes passed. Server/SDK/launcher match beta.18; installation and full DB execution were not repeated for this design stage. Human trials, formal hardware and original-stimulus results remain pending.

Artifacts: release-web/PhysioFlow-Web-v0.6.0-beta.19.zip and PhysioFlow-Server-v0.6.0-beta.19.zip. Evidence: artifacts/participant-design-stage/package-beta19/.

```text
529fe4dc76c04b0627ae2ac5f5cc0c253f092f0519e53a910577c122472473c6  PhysioFlow-Server-v0.6.0-beta.19.zip
c0281ae76139a18860bc3e61b76139530c44ca756b410468a72c3d3c5ae8cde8  PhysioFlow-Web-v0.6.0-beta.19.zip
```

Delivery branch: lab/codex/lab-handoff-20260924. Main unchanged.
