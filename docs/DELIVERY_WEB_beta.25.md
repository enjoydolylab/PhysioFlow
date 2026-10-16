# beta.25 screen template and editor cleanup delivery

Application source commit: 310d8930086f59f33726119c5981461a2c3ea616. BUILD_INFO records trackedSourceDirty=false.

Includes reusable participant screen templates from beta.24 and removal of retired text/flow editors. Legacy plans open a migration notice, preserve the original, and save a new graph draft before opening ComposerV2. Shared runtime, migration and guide functionality remains.

535 automated tests, production build and zero-warning lint passed. Full current-editor/browser regression passed, including guide, editing, runtime save, preparation, analytics and admin connection controls across 12 viewports. Screen-template source-browser tests cover export/import, cancellation, invalid JSON, concurrent edits, unmount, responsive dimensions, undo/redo and preview responses.

Actual Web package checks passed for production assets, launcher SPA routes and admin login, configured template persistence, repeated independent template creation, and legacy migration into the compiled current editor while preserving the original. These production checks do not replace the fuller source-browser screen-template checks.

ZIP CRC and private/cache exclusions passed for both distributions. All 333 Server manifest hashes verified; server/tools/scripts match beta.24, so full DB installation/execution was not repeated. Human trials, formal hardware and original stimulus results remain pending.

Artifacts: release-web/PhysioFlow-Web-v0.6.0-beta.25.zip and PhysioFlow-Server-v0.6.0-beta.25.zip. Evidence: artifacts/legacy-editor-stage/package-beta25/.

```text
85926af60a37561d25570bc6285da325257c5c34d6c30fb1790d25f5d11e68e5  PhysioFlow-Web-v0.6.0-beta.25.zip
4cba91c2b4cd005a7349707b912877607d3b9887504d34504c9211e412ae5ddf  PhysioFlow-Server-v0.6.0-beta.25.zip
```

Delivery branch: lab/codex/lab-handoff-20260924. Main unchanged.
