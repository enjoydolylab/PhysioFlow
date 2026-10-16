# Participant screen save workflow

Source stage after beta.25, now included in beta.26. See DELIVERY_WEB_beta.26.md for production package evidence.

The app save shortcut previously returned early whenever an input, textarea, select or contenteditable field had focus. Ctrl/Cmd+S now saves the current protocol from these fields and prevents the browser Save Page action. Composition and already-handled events are ignored. Native text undo remains with the focused field; screen undo remains owned by the participant builder.

The full-screen participant editor now displays the protocol's actual unsaved/saved state and an explicit Save button. Done continues to return to the main editor; saving the screen uses the same protocol persistence path as the main Save button. Failure cannot clear the app's unsaved state because that is only cleared by successful persistence. The header wraps on narrow screens.

Direct browser verification: edit a focused protocol-name field, save with Ctrl+S and Cmd+S, read persisted values and reload; text Ctrl+Z remains unhandled by app shortcuts. Protocol undo and uppercase Shift+Z redo are also verified. Configure a participant response field, observe Unsaved changes, save through the full-screen button, observe Saved, verify persisted response name. Header fits at 375 and 1280 pixels. Test: tests/browser-save-shortcut.mjs.

535 automated tests, build and zero-warning lint passed. Full editor/runtime/preparation/analytics/admin browser regression also passed, including controls and readable layout across 12 viewports. Human trials and hardware/media acceptance remain pending.

## In-flight save protection

Protocol writes now execute in order through the app persistence queue. Save completion no longer replaces the active editor with its earlier snapshot. The app clears Unsaved changes only when the current protocol still matches the persisted snapshot. If editing continued, the newer content remains dirty and a toast explains that it still needs saving. Save-and-open also stays in the current editor when newer changes remain.

Actual browser OPFS verification (tests/browser-save-race.mjs): hold the first file write, edit and queue a second save, edit again, release the writes, inspect the file and current editor separately. The file contains the second saved snapshot, the editor retains the latest unsaved text. An injected QuotaExceededError leaves the file and latest edits intact; retry succeeds. The disk-full condition is simulated in an isolated browser profile; it is not evidence of a physical disk failure.

## Leaving the editor

The unsaved-changes dialog now offers Save & Leave, Discard & Leave and Cancel. Save is the primary action. Duplicate save clicks are blocked while persistence is running; discard is unavailable during that write. Cancel remains available and explicitly explains that writing continues while navigation is cancelled. The navigation request is invalidated on cancel, so save completion cannot unexpectedly take the user away. Failed writes leave the editor and its modifications available for retry.

The OPFS browser test also verifies all three leave choices, failed Save & Leave, cancellation during a delayed save, and dialog control layout at 375/1280 pixels. The beta.26 package separately verifies the normal production save and exit path.
