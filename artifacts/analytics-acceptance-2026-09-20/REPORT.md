# Analytics acceptance

Actual browser: Sessions search found QA-SHUFFLE-V2, but rows had no review action. Added an accessible Review button that opens Analytics with that exact session selected.

Actual Analytics initially showed 30 events but no timeline, 0 completed steps and 0 skips. Graph event/fact fields were incompatible with the legacy view. Added graph timeline normalization and graph metric fallbacks. Also fixed timeline rendering mutating recorded events, ambiguous prefix matching between IDs, and treating a zero start timestamp as missing.

Actual post-fix page showed 3 completed steps, 1 skip, 1 retry and a five-occurrence media timeline (including the retry). A pure regression verifies exact ID matching, zero start, stable rerender and no event mutation. 377 tests and build passed; lint passed after removing an unused loop variable.

Still to inspect: Analysis windows, Responses, Compare, export from Analytics, failed-session inclusion, and list/detail time-zone consistency. These are not yet accepted by this report.

## Compare acceptance

Actual click on Compare reproduced an application-wide TypeError: itemsToShow.forEach is not a function. itemsToShow was a numeric limit. Fixed iteration to use the sliced metrics array, and updated graph completion/skip fields in both chart and table.

Actual post-fix Compare displayed two sessions (QA-MEDIA-POOL and QA-SHUFFLE-V2), with 29/30 events respectively, and 3 completed steps plus 1 skip each. The app remained usable. Full 377-test/build/zero-warning-lint gate passed. Response charts and analysis windows remain unaccepted.

## Response identification and summary acceptance

Actual QA-COMPONENTS had 15 responses but no recognized graph questions. Added graph node/name matching and node-scoped group keys so equal field names in different nodes remain separate; retained legacy questionnaire lookup. Fixed summary filtering that removed numeric zero and false.

Actual expanded summary now displays all 15 rows, including rating=0, amount=0, Likert=0, number=0, both selected multiple-choice options, SAM 5/7, and Chinese/Japanese multiline text. 379 tests, build and lint passed. This accepts identification and summary display; SAM scatter pairing and remaining chart semantics still require follow-up. Analysis windows also remain outstanding.

## SAM pairing

Replaced fixed question-ID lookups and positional pairing with question-type recognition plus session/node/submission timestamp matching. Missing or ambiguous pairs are excluded rather than inventing a zero or joining different submissions. Actual QA-COMPONENTS response page now shows SAM matched pairs: 5, 7 and one matched submission. Regression checks mismatched timestamps, different nodes and duplicate-axis ambiguity. Full 380-test/build/lint gate passed. Legacy recordings with separate timestamps per answer may not supply an unambiguous submission pair; their individual answers remain in the summary.

## Graph analysis-window calculation

Actual Analysis windows tab on QA-COMPONENTS displays no configured windows. Source inspection confirmed the view only indexed legacy blocks/steps despite readiness supporting graph config.isAnalysisWindow. Added graph event normalization and graph window metadata lookup, using component presentation boundaries. Legacy media playback boundaries remain unchanged. Regression covers repeated visits, retry, pause, skip and disabled windows; 381 tests/build/lint passed.

Still incomplete: actual run with isAnalysisWindow configured, graph editor enable/disable control, and graph export parity (graph bundles currently lack analysis_windows.csv). Do not treat the existing empty-state check or the pure calculation test as full acceptance of the feature.

## Window editor → run → export → review acceptance

Added Generate analysis window and Window label controls for participant nodes. Graph export now includes analysis_windows.csv, its dictionary definition, and manifest count; it shares computeWindows with the analysis page and records event IDs plus wall/monotonic boundaries.

Actual UI: imported a standalone screen protocol, selected Window stimulus, checked Generate analysis window, entered QA baseline, saved, and ran participant QA-WINDOW. Completed the screen and exported 23 files. Parsed CSV contains one valid window of 13185.10009765625 ms with matching start/end event references and manifest count 1. Bundle retained as QA-WINDOW_session_bundle.zip.

Opening this non-empty window chart exposed the same numeric itemsToShow.forEach crash previously found in Compare. Fixed it and reopened the same session through Review. Actual Analysis windows page now shows one valid QA baseline window, 13.2 s average/actual, zero pauses. 381 tests/build/lint passed after this fix.

## Export consistency and session switching — 2026-09-21

Actual Analytics Export ZIP for QA-WINDOW was downloaded and compared with the completion-page bundle: analysis_windows.csv, events.jsonl, responses.jsonl and runtime_snapshot.json are byte-identical.

Fixed an asynchronous detail-loading race: responses from a previously selected session are now ignored after selection changes/unmount; old detail is cleared during loading; missing/failed loads display an alert rather than leaving unrelated detail visible. Actual UI switching QA-WINDOW → QA-COMPONENTS → QA-WINDOW displayed 5 → 40 → 5 events with the correct participant and protocol each time. Ordinary switching is manually accepted; artificially delayed out-of-order reads have not yet been browser-tested. 381 tests/build/lint passed.

Remaining analysis acceptance gaps: failed-session inclusion, consistent timezone display between dashboard and analysis, chart value semantics for continuous/multiple-choice answers, error-path and out-of-order-load regression, and legacy window compatibility through the actual UI. Broader component/editor acceptance and hardware/PhysioDB limitations are recorded in the other reports and are not closed by this analysis work.

## Terminal status and timezone consistency — 2026-09-21

Analytics and Compare previously excluded failed graph runs. Both now use a shared terminal-status predicate for completed/aborted/failed, with wording changed to finished sessions. Unit regression covers terminal and active states; no failure was injected into the user's browser data in this turn, so manual failed-session review remains to be verified.

Dashboard previously sliced the UTC ISO string while Analytics used local time. Dashboard now uses the same formatter and retains the original ISO in its time element. Actual QA-WINDOW list now displays 2026/9/20 22:09:17, matching the analysis sidebar, rather than the prior UTC 13:09:17. 382 tests/build/lint passed.

## Choice distribution — 2026-09-21

Fixed choice questions being treated as integer scales when their model contains default scale bounds. Choice distributions now accept arrays and legacy pipe-separated values, preserve zero-valued options and support localized option lists. Likert counting uses exact numeric values rather than parseInt; other continuous values stay in their original summary form. Actual QA-COMPONENTS chart accessibility output confirms single-choice Option 1:0/Option 2:1 and multiple-choice Option 1:1/Option 2:1. The full quality gate passed before the localized-option fallback; targeted response tests passed again afterward.

PhysioDB source supplied by user: https://github.com/enjoydolylab/physiodb. Public API and connected GitHub fetch both returned 404; repository contents have not been obtained. Do not claim interface compatibility based on the link alone.
