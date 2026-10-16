# Declared variables in participant bindings

Source stage after beta.30, combined with binding checks in beta.31. See DELIVERY_WEB_beta.31.md for production evidence.

Composer now passes project variable declarations into participant-screen editing. Each supported binding field offers declared variable paths and standard participant/progress/timer paths while retaining manual input. Variable names are displayed literally. Choosing one updates only that binding through existing screen history.

Preview examples start from cloned JSON-compatible declared defaults and synthetic participant/progress/timer data. Empty project declarations do not invent a score variable. Standalone previews without project context retain the generic demonstration data. Apply remains temporary; Restore returns to the declared defaults. Neither changes the protocol defaults. The preview resets when declarations change.

Runtime variable initialization now constructs own properties safely, aligning declared names such as __proto__ with preview defaults and retaining explicit overrides. Four tests cover suggestions, typed/cloned defaults, empty declarations and runtime initialization. Actual Japanese Composer browser flow checks propagated defaults, temporary override/restore, variable selection, stored binding paths, unchanged variable defaults and 375/1280 layout. 552 automated tests, build and zero-warning lint passed; full current-editor/runtime/preparation/analytics/admin browser regression also passed. Human, formal hardware and original media acceptance remains incomplete.
