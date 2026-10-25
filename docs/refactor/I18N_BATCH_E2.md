# i18n batch E2

Completed without committing.

- New dictionary keys: Japanese 671, Chinese 671, English 0 (English source remains the fallback).
- App shell and hosted UI audit: 351 present, 0 missing, 0 allowlisted. All retained app/hosted UI candidates are present.
- Global audit: 3,314 candidates; 2,201 present; 819 missing; 294 matched allowlisted candidates. Dynamic templates are now audited as complete messages, and dictionary keys are parsed with Babel so escaped quotes and newlines are recognized.
- Allowlist: 318 unique values — content 48, data 172, multilingual 98. The complete skipped-value inventory is in [i18n-allowlist.json](../../scripts/i18n-allowlist.json); matching source locations are in the allowlisted section of [I18N_AUDIT.md](I18N_AUDIT.md).

App setup and legacy builder use explicit translation at display time, including attributes, confirmation dialogs, readiness blockers and interpolated notices. Hosted, deployment, collaboration, core and integrity diagnostics retain their English source values; templates translate them when displayed. More specific templates take precedence over general status messages. Download notifications receive the UI translator without passing it into any export builder.

Skipped unchanged: authored protocol/template content in domain/taskTemplates; multilingual constants/questionnaire tables; exporter CSV/README/data-dictionary documentation; graph/joint export documentation and manifest warning text; CSV headers, JSON keys, columns, MIME types and file names (including samples.jsonl and analysis_windows.csv). Some joint/integrity diagnostics are also displayed; only the rendered copy is translated.

No exported file format changed. domain.js, taskTemplates.js, graphExport.js and jointExport.js match HEAD after line-ending normalization; all exporter.js code outside downloadBundle matches HEAD. The pre-existing UI translation of the missing-BioDB-credentials message passed into a manifest was removed so that exported diagnostic stays English independently of UI language.

No display-only English prose was deliberately retained. English language names remain autonyms (English / 中文 / 日本語). Product names, technical identifiers and examples (response, rating, yes/no values), acronyms (HTML, SHA-256, ISO 8601), keyboard shortcuts, participant-ID examples and units remain unchanged; the surrounding instructions and sample response labels are localized.

Validation:

- npm test: 538 passed, 0 failed, 1 skipped (539 total).
- npm run lint -- --max-warnings=0: passed.
- npm run build: passed.
- Audit with empty stdin: passed; allowlisted values are separate from missing.
- E2 regressions cover every added display key and interpolated parameter, hosted runtime error preservation, unchanged joint manifest warnings/authored content, allowlist classification and app/hosted coverage.
