# beta.17 component configuration delivery

Source commit: 4a6647beb302f3807e54aedc7205bad7b56c209b. Package BUILD_INFO records trackedSourceDirty=false.

522 tests, production build, zero-warning lint and complete editor/runtime/hosted/SDK browser regression passed. Actual editor checks cover optional random weights, explicit zero, zero connected totals and typed loop conditions. Runtime tests verify normalized weights agree with configuration defaults.

Production ZIP browser checks passed: assets, SPA/admin routes, template persistence and independent repeated creation. A synthetic stored draft verified zero connected random weights are blocked, blank B restores its default, loop expected value uses numeric input and explicit zero clears its error. The dedicated component test uses only compiled production assets for UI behavior.

ZIP CRC, private-state/cache exclusion and all 366 Server manifest hashes passed. Server/SDK/launcher match beta.16; server installation/full DB execution were not repeated. Human trials, formal hardware and original-stimulus results remain pending.

Artifacts: release-web/PhysioFlow-Web-v0.6.0-beta.17.zip and PhysioFlow-Server-v0.6.0-beta.17.zip. Evidence: artifacts/component-config-2026-10-15/package-beta17/.

```text
ec9937f633c8610d25b74763eb82088b30155adf9ac4c0b0cbbd354131d0e403  PhysioFlow-Server-v0.6.0-beta.17.zip
785c05b7d1db434003b19f256fd9c7110b7b0385fb01d8e6437f290993c93131  PhysioFlow-Web-v0.6.0-beta.17.zip
```

Delivery branch: lab/codex/lab-handoff-20260924. Main unchanged.
