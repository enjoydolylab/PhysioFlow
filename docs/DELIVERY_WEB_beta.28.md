# beta.28 action and response integrity delivery

Application source commit: 6ddface005e7b3fb45c8fd00c449aecefb604198. BUILD_INFO records trackedSourceDirty=false.

Button assignment preserves literal own response fields, including __proto__, and renderer lookups ignore inherited properties for values/errors. Untouched fields such as constructor are no longer mistaken for entered answers. Assignment-only actions clear stale preview submission results; successful resubmission and reset behave consistently.

538 automated tests, build, zero-warning lint and full current-editor/runtime/preparation/analytics/admin browser regression passed in the component stage. Synthetic actual-run evidence verifies saved response readback, response_submitted payloads and JSONL export, with nested numeric/boolean values and string zero preserved. This is not human/device evidence.

Actual production package checks passed: compiled assets, static launcher and SPA/admin entry, literal field names, nested value types, untouched required checkbox state, no inherited errors, required submission blocking, assignment-only result invalidation, resubmission and reset. The first workflow attempt selected a background inline-preview checkbox; the selector was scoped to the active preview and the rerun passed.

Both ZIP CRC and private/cache exclusions passed. All 334 Server manifest hashes verified. Server/tools/scripts match beta.27; full DB execution was not repeated. Human trials, formal hardware and original stimulus acceptance remain pending.

Artifacts: release-web/PhysioFlow-Web-v0.6.0-beta.28.zip and PhysioFlow-Server-v0.6.0-beta.28.zip. Evidence: artifacts/action-response-stage/.

```text
df92374e53d3cdaf7baa5675361655b12c941af4b99c6d8f6be8e3c9f046dbd7  PhysioFlow-Web-v0.6.0-beta.28.zip
02e955889a064f61b345dd45aab99a9907f4df6fefdb0687067bbc561c9321e2  PhysioFlow-Server-v0.6.0-beta.28.zip
```

Delivery branch: lab/codex/lab-handoff-20260924. Main unchanged.
