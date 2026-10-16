# Runtime binding preview data

Source stage after beta.29, not packaged or pushed yet.

Participant preview now has a collapsible JSON example-context editor for participant, variables, outputs, progress and timer. It starts with clearly synthetic example data. Apply replaces only the preview context and resets trial answers/results; invalid JSON, non-object roots and non-finite numbers keep the existing preview. Restore returns to the synthetic example. Context is temporary component state and never changes the plan or saves experiment records.

Text bindings format booleans as text and structured values as JSON instead of passing an object into React. Renderer and editing canvas share the formatting helper. UI binding resolution reads only actual own path fields, preserving explicit false/zero and literal keys while ignoring inherited constructor/toString properties.

Three automated tests cover own binding values and safe text formatting. Actual preview browser coverage includes scalar/object/array values, progress updates, malformed/array/null/overflow contexts, retention of current answer/result for invalid data, reset on apply, restore, 375/1280 layout and unchanged schema/record storage. All 545 automated tests, build and zero-warning lint passed. Full current-editor/runtime/preparation/analytics/admin browser regression also passed. Human/hardware/original-stimulus acceptance remains pending.
