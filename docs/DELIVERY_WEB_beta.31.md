# beta.31 participant binding design milestone

Application source commit: 119e78eace807980ff06273ac161cf9d0928b084. BUILD_INFO records trackedSourceDirty=false.

Combines missing/unused binding checks, exact-field location, supported runtime-property editing, declared variable selection and preview defaults. Clearing a binding restores saved-property behavior; changes use existing undo/redo. Preview defaults are cloned and temporary overrides do not mutate the protocol. Runtime initialization preserves literal declared variable names and explicit overrides.

552 automated tests, build, zero-warning lint and full current-editor/runtime/preparation/analytics/admin browser regression passed in the source stage. Unit coverage includes typed/cloned defaults, empty declarations, runtime initialization and missing versus explicit values.

Actual Japanese production package passed declared boolean/number/object defaults, temporary override/restore, dynamic progress maximum, path picker, binding persistence, unchanged protocol defaults, unused binding removal, missing-path location/repair and 375/1280 layout. Compiled assets and launcher SPA/admin entry also passed. Preview checks use example data and do not prove availability or correctness of actual run values.

Both ZIP CRC and private/cache exclusions passed. All 340 Server manifest hashes verified. Server/tools/scripts match beta.30; full DB execution was not repeated. Human trials, formal hardware and original stimulus acceptance remain pending.

Artifacts: release-web/PhysioFlow-Web-v0.6.0-beta.31.zip and PhysioFlow-Server-v0.6.0-beta.31.zip. Evidence: artifacts/declared-binding-stage/package-beta31/ and artifacts/binding-checks-stage/.

```text
40b0f8f6d0dfeaf33c11e38b92492eea95e408f100818a99c812857ba6a980ac  PhysioFlow-Web-v0.6.0-beta.31.zip
c50331d62a6249c92639175d7c1388215be3f42f4c948af01cc3264d06317552  PhysioFlow-Server-v0.6.0-beta.31.zip
```

Delivery branch: lab/codex/lab-handoff-20260924. Main unchanged.
