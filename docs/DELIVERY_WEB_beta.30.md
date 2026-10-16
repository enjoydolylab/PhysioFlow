# beta.30 binding preview delivery

Application source commit: cfac9311e1c657210f798a9eba829faf41edc236. BUILD_INFO records trackedSourceDirty=false.

Adds a temporary JSON example context to participant preview, covering participant, variables, outputs, progress and timer. Apply and restore reset trial answers/results; invalid roots, malformed JSON and overflowing values retain the current preview. Example data is not written to the plan or experiment records.

Text bindings display booleans and structured values safely, and binding paths read own values only. Japanese production testing found automatic UI translation changing a bound false value; renderer and editing canvas now preserve bound text literally. The source test includes the Japanese LanguageProvider, and the compiled Japanese interface test confirms the original values.

545 tests, build, zero-warning lint and full current-editor/runtime/preparation/analytics/admin browser regression passed. Actual production package checks cover live scalar/object/array text, progress, invalid data retaining current answers/results, reset on apply, restore, 375/1280 controls, unchanged protocol/record storage and no unsaved protocol changes. Generic compiled-assets and launcher SPA/admin checks also passed.

Both ZIP CRC and private/cache exclusions passed. All 336 Server manifest hashes verified. Server/tools/scripts match beta.29; full DB execution was not repeated. Human trials, formal hardware and original stimulus acceptance remain pending.

Artifacts: release-web/PhysioFlow-Web-v0.6.0-beta.30.zip and PhysioFlow-Server-v0.6.0-beta.30.zip. Evidence: artifacts/binding-preview-stage/.

```text
cb914e6bfa7c3f9a9e5b550502c34130a05a14819ad270f0ccd62f31fd5cfda3  PhysioFlow-Web-v0.6.0-beta.30.zip
3a18b7a433c299e0ec83d6be09d505e843f2613a02ee88e872ceee4609237c15  PhysioFlow-Server-v0.6.0-beta.30.zip
```

Delivery branch: lab/codex/lab-handoff-20260924. Main unchanged.
