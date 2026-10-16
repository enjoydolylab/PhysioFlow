# beta.26 participant save workflow delivery

Application source commit: 10b418a3e94a5b17171e1038f779ad2cd43d253d. BUILD_INFO records trackedSourceDirty=false.

Includes focused-field Ctrl/Cmd+S, uppercase redo, full-screen participant Save and actual saved/unsaved state, ordered protocol writes, protection of newer edits during saving, and Save/Discard/Cancel exit choices. Cancelling navigation during a write leaves the editor open after persistence completes. Errors retain edits for retry.

535 automated tests, build, zero-warning lint and full current-editor/runtime/preparation/analytics/admin browser regression passed. Source-browser OPFS tests cover delayed overlapping writes, newer edits, simulated QuotaExceededError, retry, all leave choices and cancelled pending navigation. Header and leave controls fit at 375/1280 pixels. Simulated failure is not physical disk failure evidence.

Actual Web package: compiled assets, static launcher, SPA/admin entry, focused-field shortcut saves, persistence after reload, native text undo, uppercase redo, full-screen Save and state, and Save & Leave passed. The first concurrent launcher test hit test-harness port collision; the isolated rerun passed. Package checks complement source OPFS failure coverage rather than repeating it.

Both ZIP CRC and private/cache exclusions passed. All 333 Server manifest hashes verified. Server/tools/scripts match beta.25; full DB execution was not repeated. Human trials, formal hardware and original stimulus acceptance remain pending.

Artifacts: release-web/PhysioFlow-Web-v0.6.0-beta.26.zip and PhysioFlow-Server-v0.6.0-beta.26.zip. Evidence: artifacts/participant-save-stage/.

```text
d67617c682d4b2a55091ede92d6c7f3314e7786d9102554e937deeb72171fb7b  PhysioFlow-Web-v0.6.0-beta.26.zip
ec45b75b4e084564c8e6b5a54048827ff94449577b245fca5c06b5032807cbb8  PhysioFlow-Server-v0.6.0-beta.26.zip
```

Delivery branch: lab/codex/lab-handoff-20260924. Main unchanged.
