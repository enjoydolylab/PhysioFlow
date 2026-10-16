# beta.20 single-choice input delivery

Application source commit: 9aa1b2c3138fe6b55cbba52f53ceba06a72591bc. BUILD_INFO records trackedSourceDirty=false.

531 tests, production build, zero-warning lint and full editor/runtime/hosted/SDK plus multi-viewport browser regression passed. Actual builder checks cover option editing, invalid/duplicate values, punctuation in labels, type switching and preview. Actual runner synthetic preview run confirms saved/reloaded response, event, JSONL and CSV values preserve the recorded string zero; labels remain in the protocol snapshot.

Production checks passed: compiled assets, SPA/admin entry, template persistence and independent creation. A synthetic draft opened the actual participant screen designer, located an empty choice list, authored a choice, entered interactive preview, rejected an empty response, submitted string zero and reset. No formal participant or hardware result is inferred.

ZIP CRC, private-state/cache exclusions and 367 Server manifest hashes passed. Server/SDK/launcher match beta.19; installation/full DB execution were not repeated. Human trials, formal hardware and original stimulus results remain pending.

Artifacts: release-web/PhysioFlow-Web-v0.6.0-beta.20.zip and PhysioFlow-Server-v0.6.0-beta.20.zip. Evidence: artifacts/participant-choice-stage/package-beta20/.

```text
d441a3ea77cb03a641a0a9499e2e97d8b618bb95c8a7e00e3cb598d136617b3c  PhysioFlow-Server-v0.6.0-beta.20.zip
1d2528a31fc9ed6c74dd97e9ebe7f17e0856e524c829c14c3047c1883a7c55f1  PhysioFlow-Web-v0.6.0-beta.20.zip
```

Delivery branch: lab/codex/lab-handoff-20260924. Main unchanged.
