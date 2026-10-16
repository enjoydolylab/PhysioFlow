# beta.27 button actions delivery

Application source commit: ac9f9c81ed3b9ec62033296beb4679aa946f7738. BUILD_INFO records trackedSourceDirty=false.

Includes complete ordered button-action editing, metadata preservation, JSON-typed values, explicit null for new assignments, multiple action errors with exact-field location, and existing screen undo/redo. Invalid JSON retains the last committed valid value and displays a warning.

538 tests, build and zero-warning lint passed. The component stage passed full current-editor/runtime/preparation/analytics/admin browser regression. Direct Builder coverage includes arrays/objects, number/boolean/string distinctions, reorder/undo/redo, preview submission, add/remove, no-action state, error location and 375/1280 layout.

Actual production package checks passed: compiled assets, launcher SPA/admin entry, two assignment-name errors located and repaired, complete action list, invalid JSON warning, reorder, retained metadata, typed values saved, and interactive preview submission {second:false,answer:42}.

ZIP CRC and private/cache exclusions passed. All 334 Server manifest hashes verified. Server/tools/scripts match the original beta.26 source distribution; full DB execution was not repeated. Human trials, formal devices and original stimulus acceptance remain pending.

A failed preparation command initially led to replacement of local beta.26 archives. Misversioned files were isolated and beta.26 was rebuilt from its original clean commit; the original ZIP bytes could not be recovered. See [recovery record](PACKAGE_RECOVERY_beta.26.md) for current rebuilt hashes. Both packaging scripts now refuse existing output by default, with direct archive-preservation tests.

Artifacts: release-web/PhysioFlow-Web-v0.6.0-beta.27.zip and PhysioFlow-Server-v0.6.0-beta.27.zip. Evidence: artifacts/button-actions-stage/package-beta27/.

```text
ab936da619d52ac0a18d648fa3f8a6466cdaafb5fb449d35adf17fee0d4c044a  PhysioFlow-Web-v0.6.0-beta.27.zip
1e5a1413bedcf2a849ed95f26bae1ad92651ae2024db44e2023d71f7fbec77bd  PhysioFlow-Server-v0.6.0-beta.27.zip
```

Delivery branch: lab/codex/lab-handoff-20260924. Main unchanged.
