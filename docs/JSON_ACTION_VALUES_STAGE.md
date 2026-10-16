# JSON action value integrity

Source stage after beta.28, included in beta.29. See DELIVERY_WEB_beta.29.md for production evidence.

JSON.parse accepts a number such as 1e309 as Infinity, while JSON storage later serializes it as null. Action editing now rejects unsupported/non-finite JSON values and keeps the last valid action value with a localized warning. Missing or invalid existing values are displayed as invalid instead of falsely appearing to be null.

Core screen validation emits ui.action_value_invalid with the exact action value path. Screen checks lists the issue and opens/focuses the correct value editor. The same validation rejects overflowing values in participant-screen templates, protocol import/configuration and code editing. Explicit null and ordinary JSON primitives/arrays/objects remain supported. The validator also rejects undefined fields, sparse arrays, cycles and non-JSON objects that serialization would lose or transform.

Four targeted automated tests cover mixed/shared data, silent-loss cases, repair paths and template/protocol rejection. Direct Builder regression checks rejected 1e309 retaining 42, existing invalid-value location and repair to 0, alongside prior typed action/reorder/preview tests. All 542 automated tests, build and zero-warning lint passed. Full current-editor/runtime/preparation/analytics/admin browser regression also passed. This is software verification; human, formal device and original-stimulus acceptance remains pending.
