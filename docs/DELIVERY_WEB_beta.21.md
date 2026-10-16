# beta.21 multiple-choice input delivery

Application source commit: 85940ceb56c6f93e6d34f5f6c44e362faf2af072. BUILD_INFO records trackedSourceDirty=false.

532 tests, production build, zero-warning lint and full editor/runtime/hosted/SDK plus multi-viewport browser regression passed. Dedicated builder tests cover option editing, validation, type switching, array preview and clearing all selections. Actual runner synthetic preview run confirms required selection, configured option order, optional unanswered [] and response/event/JSONL/CSV array storage.

Production checks passed: compiled assets, SPA/admin entry, template persistence and independent repeated creation. The production screen designer authored multiple-choice options, blocked empty required submission, submitted the configured-order array ["0","yes"] after clicking in reverse order and reset all checkboxes/results.

ZIP CRC, private/cache exclusions and 367 Server manifest hashes passed. Server/SDK/launcher match beta.20; installation and full DB execution were not repeated. Human trials, formal hardware and original-stimulus results remain pending.

Artifacts: release-web/PhysioFlow-Web-v0.6.0-beta.21.zip and PhysioFlow-Server-v0.6.0-beta.21.zip. Evidence: artifacts/participant-multi-choice-stage/package-beta21/.

```text
804a070804661a38fa7a5b6d2fc32f339be556ab2361bbac387267e695ced672  PhysioFlow-Server-v0.6.0-beta.21.zip
398fa4fd3396c98d3671ec05fd24f3679421504a51dec5eadba45963fd59b44f  PhysioFlow-Web-v0.6.0-beta.21.zip
```

Delivery branch: lab/codex/lab-handoff-20260924. Main unchanged.
