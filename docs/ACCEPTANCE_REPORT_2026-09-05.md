# UI / Block / Customization acceptance — 2026-09-05

> Historical verification record, clarified 2026-09-06. Included in released beta.4 (`68a3451`); publication does not add new test evidence. Current release and remaining work: [status](refactor/IMPLEMENTATION_STATUS.md).

## Scope

This review covers the Composer V2 authoring flow, participant UI editor, Protocol JSON editor, legacy Block/Trial ordering, and the built-in Stroop/Go-No-Go templates. It is an automated acceptance pass in Chrome at CSS viewport sizes; it is not a substitute for Windows DPI, WebView2, or physical-device testing.

## Passed

- Composer header controls were checked at 2560×1440, 1920×1080, 1366×768, 1093×614, 911×512, 768×540, 640×480 and 375×667.
- Embedded, full-screen and JSON authoring contexts were checked at those same viewports. Screenshots are in `release-desktop/acceptance-2026-09-05/`.
- JSON syntax errors and semantically invalid graph connections are rejected without changing the protocol. A valid graph round-trip applies and can be read back.
- Fixed pixel width/height from the participant editor now reaches the participant renderer. Free-layout content scrolls inside its container; the editor displays a warning that fixed pixel layouts need real-size preview.
- Block randomization was checked against an independent exhaustive feasibility oracle across 192 condition-count/limit combinations with five seeds each (960 runs). Impossible constraints now produce validation errors instead of silently relaxing. Fractional Block/Trial repeats are rejected.
- Block repeat contains Trial repeat in the documented nesting order. The hierarchy screen now explains that Latin square is cyclic row selection, not automatic participant allocation.
- Stroop congruent labels now match the actual word and ink color, with balanced counts by ink within the available odd/even limit.
- Dashboard, Session Manager and Analytics primary controls were checked at the same eight viewports. These checks do not cover every chart, dialog, data volume, keyboard path or arbitrary custom screen. Two participant-editor screenshots were visually inspected.
- Full unit suite: 340 total, 339 passed, 1 Windows symlink skip. Lint and production build pass. Composer browser E2E and participant-public E2E pass.

## Fixes made

- Added `sequenceConstraints.js` with feasibility-aware constrained ordering.
- Updated Block validation and execution error behavior.
- Added responsive container rules for embedded Participant UI editing and corrected Composer, Dashboard and Session Manager wrapping.
- Applied participant UI element width/height and free-layout overflow behavior at runtime.
- Added explicit free-layout warning and viewport-aware preview.
- Added browser and unit regression tests for viewport controls, JSON edit rejection/round-trip, custom UI behavior, Block nesting, constraint feasibility and Stroop semantics.

## Still requires researcher acceptance

Constrained legacy Block sequences may differ from earlier builds for the same seed. Saved Stroop trials are not rewritten by an app update. Recheck study versions and materials before continuing an existing experiment. The template fix does not establish a general condition-balancing guarantee for arbitrary experiments.

- Windows display scaling at 125%/150% and actual WebView2 rendering.
- Long text, large images, YouTube/external media, screen readers and keyboard-only authoring.
- Whether cyclic Latin-square rows match the study's desired participant allocation.
- Physical device timing, disconnection/reconnection and simultaneous connectors.
- Whether researchers find the JSON and free-layout editors understandable without training.
