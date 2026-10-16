# Action and response value integrity

Source work after beta.27; not packaged or pushed yet.

Button assignments now create literal own properties, preserving names such as __proto__ without changing the response object's prototype. Renderer lookups only consider actual own response/error properties. An untouched checkbox called constructor therefore starts unchecked, required validation blocks it, and an optional multi-choice called __proto__ defaults to an empty array.

Participant preview clears its last submission when any button action runs, including an assignment without submit. Successful submission then displays the newly accepted result. Reset still clears values/results. Runtime action recording behavior is unchanged.

Browser test tests/browser-action-response-values.mjs first reproduced missing __proto__ output, then verified preservation of nested number/boolean values, constructor text, action-only result invalidation, resubmission and reset. It also checks reserved-looking input names, no inherited error flags, required validation, and the empty-array default.

538 automated tests, build and zero-warning lint passed. Full current-editor/runtime/preparation/analytics/admin browser regression passed. Actual human, hardware and original media acceptance remains pending.

Synthetic actual-run verification in tests/browser-action-response-runtime.mjs completes a one-screen experiment, reloads the saved session, and verifies both literal field names and nested number/boolean/string values in responses, the response_submitted event, and JSONL export. This is automated synthetic evidence, not a human or device trial.
