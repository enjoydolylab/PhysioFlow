# beta.29 JSON action value delivery

Application source commit: d001cf8b8fff908d4b4b82f1e161b2def936644e. BUILD_INFO records trackedSourceDirty=false.

Rejects button variable values that JSON storage would lose or turn into null, including overflowing numbers. The editor retains the last valid action value with a localized warning. Invalid existing values are listed with exact-field location. Screen-template and protocol configuration validation use the same rules.

542 tests, build, zero-warning lint and full current-editor/runtime/preparation/analytics/admin browser regression passed in the source stage. Targeted tests cover mixed/shared JSON data, non-finite and non-JSON values, repair paths, and template/protocol import rejection.

Actual production package checks passed for compiled assets, static launcher SPA/admin entry, complete action lists, exact error-field focus, malformed JSON and overflowing input rejection, saving the previous valid zero without null coercion, repairing to 42, reorder/metadata preservation and typed preview submission. The first attempt exposed a test wait that accepted any action-variable focus; it now waits for the exact target field, and the rerun passed. The corresponding earlier package test helper was corrected too. Launcher verification was repeated from the package directory at its emitted port after correcting the manual test invocation.

Both ZIP CRC and private/cache exclusions passed. All 335 Server manifest hashes verified. Server/tools/scripts match beta.28; full DB execution was not repeated. Human trials, formal hardware and original stimulus acceptance remain pending.

Artifacts: release-web/PhysioFlow-Web-v0.6.0-beta.29.zip and PhysioFlow-Server-v0.6.0-beta.29.zip. Evidence: artifacts/json-action-value-stage/.

```text
5bb26423a5f4785012e48a93a09f5b526cff8f6837d094d98f6debd5fc8005aa  PhysioFlow-Web-v0.6.0-beta.29.zip
e39686709520144d31f620145139e078f954b3575422a5f228c1cd5669fbc7ac  PhysioFlow-Server-v0.6.0-beta.29.zip
```

Delivery branch: lab/codex/lab-handoff-20260924. Main unchanged.
