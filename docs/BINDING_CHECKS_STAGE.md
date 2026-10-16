# Binding checks and editing

Source stage after beta.30, not packaged or pushed yet.

Preview now lists unresolved supported binding paths against its current example context, and distinguishes properties that the renderer does not use. False, zero and explicit null count as existing values. These preview checks do not make a protocol invalid or claim that real-run values are missing. Paths are displayed literally in Japanese UI.

Configure returns to the matching element, opens advanced bindings and focuses the exact property. Editing covers text, media source, progress value/maximum, HTML and supported color/background properties. Media appearance bindings are excluded because the current media wrapper does not apply them. Unknown properties remain intact unless explicitly removed. Clearing a binding restores the saved-property behavior. All edits use the existing undo/redo history.

Three unit tests cover missing versus explicit values, independent/unused properties and renderer-supported targets. Actual Japanese Builder test covers missing/unused distinction, example-data resolution, exact field/group focus, independent binding preservation, remove/undo/redo, clear, progress maximum and 375/1280 controls. 548 automated tests, build, zero-warning lint and full current-editor/runtime/preparation/analytics/admin browser regression passed. Human, formal hardware and original-stimulus acceptance remains incomplete.
