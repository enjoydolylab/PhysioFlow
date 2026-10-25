# UI step 3 implementation report

Implemented the header, identifier presentation, and database catalog refresh in the requested order.

## Header counts

Counting visible buttons, the menu summary, and the title input individually (the four mode buttons count separately; closed menu contents do not count): **13 → 11**, or **14 → 11** when migration review is required. Using the request's grouped convention (mode switch counts as one control, title excluded): **10 → 7** with migration review, **9 → 7** otherwise.

The header retains all props. Save alone is primary when dirty; otherwise preview/Prepare collection alone is primary. Freeze, export, legacy BioDB, help, and conditional migration review are in the menu. Freeze eligibility and action callbacks are unchanged.

## Files touched

- `src/composer/Header.jsx`: navigation, mode tabs, undo/redo, primary selection, menu.
- `src/composer/questionnaire-v2.css`: compact desktop header and secondary mode styling.
- `src/composer/labels.js`: identifier detection and safe issue message fallback.
- `src/composer/toolbox.js`: existing localized validation maps and identifier fallback.
- `src/composer/Inspector.jsx`: human issue messages, collapsed technical codes.
- `src/composer/NodeInspector.jsx`: type/version in collapsed technical information or advanced mode.
- `src/composer/Sequence.jsx`: component subtitle only in advanced mode when different from label.
- `src/ComposerV2.jsx`: fullscreen node preview version only in advanced mode.
- `src/pfUIStrings.js`: Japanese and Chinese translations.
- `src/databaseRefresh.js`: shared me/researches fetch.
- `src/AdminMonitorPage.jsx`: restore operator connection, load catalog on mount/connection/page entry, refresh catalog beside selectors without resetting selections.
- `src/admin-monitor.css`: refresh control beside the selectors.
- `tests/ui-step3.test.js`, `tests/e2e-ui-step3.mjs`: regression coverage.
- This report. The supplied `UI_STEP3_COMPOSER_AND_IDS.md` was left unchanged.

## New tests

`tests/ui-step3.test.js`:

1. `identifiers are distinguished from researcher messages`
2. `issue identifiers use a label map or a human fallback`
3. `composer header renders exactly one primary for clean, dirty and locked states`
4. `sequence component types only render in advanced mode and when different`
5. `research added in second response is listed after catalog refresh`

`node tests/e2e-ui-step3.mjs` uses a real headless browser and mounted components. It checks the 1440px header row/count/primary, Japanese preview label, visible Inspector text without versions or raw issue codes, and database options before/after clicking refresh. Database responses are mocked; the real service was not modified or used to create a research. Set `CHROME_BIN` to override the default Windows Edge executable.

## Validation

- `npm test`: **525 passed, 0 failed, 1 skipped**.
- `npm run lint -- --max-warnings=0`: passed.
- `npm run build`: passed.
- Browser check: passed; header height 64px, 11 visible controls, one primary. Closed technical disclosures retain the identifiers while `innerText` excludes them.

No requested implementation was omitted. Hermes screenshots and verification against a live newly created database research remain external checks. Protocol, runner, desk service, participant behavior, save/freeze eligibility, and migration logic were not changed.
