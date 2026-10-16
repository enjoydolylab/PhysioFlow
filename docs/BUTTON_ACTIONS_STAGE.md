# Participant button actions

Source stage after beta.26; not packaged or pushed yet.

The former action editor showed only actions[0] and replaced the entire array during every edit. It also edited every variable value as a string. The editor now displays all actions, updates one action without dropping the others or its extra properties, and supports add/remove/reorder with the existing screen undo/redo history. An empty list is explicitly described as no action.

Variable action values use JSON to retain numbers, booleans, text, arrays, objects and null. Invalid JSON leaves the last valid value unchanged and displays an inline warning. Assignments run in list order; submit/next request the existing renderer validation and a single submission of final values after processing the list.

Direct Builder browser test covers multiple actions, metadata preservation, typed number and boolean, invalid JSON, reorder/undo/redo, actual preview submission after reordered assignments, add/remove, and 375/1280 width. Test: tests/browser-button-actions.mjs. 536 automated tests, production build and zero-warning lint passed. Full current-editor/runtime/preparation/analytics/admin browser regression also passed. Human/hardware/media acceptance remains incomplete.

Action issues now appear in Screen checks, with distinct rows for each invalid action. Locate opens the action section and focuses the correct action/type or variable-name field. Changing a button to setVariable initializes an absent value to explicit null. Non-string imported variable names report validation errors instead of throwing. Browser coverage includes multiple missing names, exact second-action focus, incremental repair, arrays and objects with mixed types.
