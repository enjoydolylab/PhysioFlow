# beta.22 input library delivery

Application source commit: 1097303a2e87fafbed13961dea02235e7ade26d5. BUILD_INFO records trackedSourceDirty=false.

533 tests, production build, zero-warning lint and full editor/runtime/hosted/SDK plus independent embedding and multi-viewport browser regression passed. Actual builder checks cover Enter insertion, clicking, canvas/tree drops, unique response names and undo/redo. New input presets remain ordinary Input schemas with independent default options.

Production checks passed: compiled assets, SPA/admin entry, template persistence and repeated creation. The actual production designer inserted a numeric field with Enter and single/multiple choice with clicks, generated three unique names, and previewed values with number/string/array types. The first synthetic fixture omitted its participant UI; supplying a valid instruction UI corrected the fixture without an application change.

ZIP CRC, private/cache exclusions and 368 Server manifest hashes passed. Server/SDK/launcher match beta.21; installation and full DB execution were not repeated. Human trials, formal hardware and original-stimulus results remain pending.

Artifacts: release-web/PhysioFlow-Web-v0.6.0-beta.22.zip and PhysioFlow-Server-v0.6.0-beta.22.zip. Evidence: artifacts/participant-library-stage/package-beta22/.

```text
07999639286e8c8417e5a57abb2bddd47fb4f31d51f3e124ff20eae940351045  PhysioFlow-Server-v0.6.0-beta.22.zip
cc48677b9c06e53bf51e78430d006fbc9bbed50d10c4a6b12c9e73184abfe7af  PhysioFlow-Web-v0.6.0-beta.22.zip
```

Delivery branch: lab/codex/lab-handoff-20260924. Main unchanged.
