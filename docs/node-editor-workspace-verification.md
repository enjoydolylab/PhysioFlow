# Node editor workspace verification

Verified 2026-10-26 using headless Chrome and the real ComposerV2/ParticipantUiBuilder components, Japanese UI, a generated display.screen protocol with a free 1280×720 screen. Baseline measurements used HEAD source; after measurements used the modified source. This is a component integration fixture, not the user's locally stored test1 protocol.

## Measurements (CSS pixels)

| Viewport | Measurement | Before | After |
| --- | --- | ---: | ---: |
| 1440×900 | Header height | 48.11 | 56 |
| 1440×900 | Body clientHeight / scrollHeight | 852 / 1004 | 844 / 844 |
| 1440×900 | Canvas layout height | 780 | 782 |
| 1440×900 | Canvas workspace height | 585 | 666.81 (74.1% of viewport) |
| 1440×900 | Inspector height | 640 | 782 |
| 1024×768 | Header height | 48.11 | 56 |
| 1024×768 | Body clientHeight / scrollHeight | 720 / 872 | 712 / 712 |
| 1024×768 | Canvas layout height | 648 | 650 |
| 1024×768 | Canvas workspace height | 499.19 | 534.81 (69.6% of viewport) |
| 1024×768 | Inspector height | 508 | 650 |

“Stage” here means the canvas workspace (.ui-canvas-wrap). The fitted 16:9 device itself measures 528.75 px and 300.38 px high respectively, because it preserves its aspect ratio within the center column. If acceptance means the device rectangle rather than its workspace must occupy 60% of viewport height, that condition is not met; at 1024 px wide, a 16:9 device cannot do so while retaining both side panels.

## Checks

- npm test: 529 passed, 0 failed, 1 skipped.
- npm run lint -- --max-warnings=0: passed.
- npm run build: passed.
- Browser: exactly one .ui-device-switch and no Layout mode select in the builder; root guidance visible, empty advanced appearance and bindings absent.
- Browser: previous/next titles and aria-labels are 前のステップ / 次のステップ.
- Browser: first Escape dismisses an element context menu while retaining the dialog; subsequent Escape closes the dialog.
- Both viewport measurements were made in the same open editor, exercising resize fitting.
- No occurrence of drag elements anywhere remains under src.

## Files changed

- src/ComposerV2.jsx: Escape close and navigation titles.
- src/ParticipantUiBuilder.jsx: canvas footer, root guidance, inspector sections and single layout control; preview diagnostics retained.
- src/ParticipantUiCanvas.jsx: builder translations for canvas chrome.
- src/participantUi/UiPropertyEditor.jsx: optional layout selector, omitted by the builder.
- src/participantUi/useParticipantUiState.js: initial/resize fit and Escape priority.
- src/composer/questionnaire-v2.css: bounded modal and independently scrolling workspace columns.
- src/composer/composerStrings.js: Japanese/Chinese copy.

English retained intentionally: experiment-authored text (the fixture's Welcome and Please read the instructions carefully.), schema/type identifiers in technical information, and underlying validation diagnostic messages. HTML remains a technical acronym. These are not translated canvas controls. The existing library group labels FORM / SHAPES are outside ParticipantUiCanvas.jsx and were left unchanged.
