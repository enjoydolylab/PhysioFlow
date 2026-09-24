# Operator controls acceptance — 2026-09-20

Graph and legacy runners now default to hiding the operator toolbar. Ctrl+Shift+O / Cmd+Shift+O toggles it; the pre-run page explains the shortcut. Graph device diagnostics, synchronization details and inspector follow the same visibility. Legacy marker tools are hidden with operator controls. Participant content uses the full viewport height.

Actual selected in-app browser run on http://127.0.0.1:5187:
- Imported QA conditional questionnaire score as a separate copy.
- Participant QA-HIDDEN-MENU: Begin experiment showed only Participant view, questionnaire and Submit; no toolbar.
- Ctrl+Shift+O displayed Operator controls; Pause produced Paused and disabled Retry/Skip.
- Resume worked; Cmd+Shift+O hid the toolbar again.
- Entered no and submitted. Session complete: 7 events, 5 responses, 22 export files; Session data saved.

Validation: 374 unit tests passed; production build and lint (zero warnings) passed; git diff --check passed. Legacy runner change has not yet been manually exercised. Existing operator UI browser scenarios will need to explicitly reveal controls before selecting toolbar actions.

Media-pool audit: current seeded shuffle uses no replacement within a cycle, shares consumption across nodes referencing the same pool, advances on completion/skip, and preserves the current draw on Retry. Exhaustion repeats the same seeded order. This turn has not changed that policy; user preference question is pending. No claim of a new randomization policy being implemented or manually accepted.

## Follow-up regression acceptance

Updated runtime browser scenarios to first assert that the toolbar is absent, then reveal it using the documented shortcut before testing operator actions. This exposed a shortcut listener retained by the completed hosted runner while a subsequent runner was mounted. The hook now removes its listener when the graph runtime is ready/completed/failed or the legacy session is done.

Re-run of npm run test:e2e:participant-public passed, covering participant entry, refresh recovery, hosted synchronization, timed Retry/Pause/Resume, attention pause, component editing, and questionnaire conditions/scoring. Build and zero-warning lint passed again. This is automated browser evidence; the preceding section contains the actual selected-browser operation evidence. Broader legacy manual acceptance and the user's media-pool policy preference remain outstanding.
