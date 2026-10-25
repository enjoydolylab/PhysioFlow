# i18n batch C

Added 65 keys in Chinese (`zh`) and 65 in Japanese (`ja`) to `src/pfUIStrings.js`. English uses the source keys, so no English dictionary entries were needed.

All 65 translatable strings from the 67-entry scope are **present** in the regenerated `I18N_AUDIT.md`. The only two scoped **missing** entries are the explicitly excluded filename and format example below. No scoped entries are absent from the audit.

Updated record/session notices, integrity messages, database labels, upload controls and status messages, analysis metrics, canvas chart text, and replay labels to use `t()`. Recording-reader errors keep their stable source messages and are translated at the upload display boundary. `useT()` now returns a stable callback so effects can depend on it and update when the language changes.

The Inspector already used `<b>{t('Migration review required')}</b>`; verified that behavior and existing translations without adding duplicate keys. The existing formal-collection label in session setup also already used `t()` and now resolves to the new translations.

## Explicit skip list

- `BrainFlow samples.jsonl`: filename; retained unchanged (in the scope).
- `1, EEG1, uV`: machine-format example; retained unchanged (in the scope).
- `xMidYMid meet`: SVG attribute value; retained unchanged (outside the supplied scope).
- `Ctrl+C`, `Ctrl+D`, `Ctrl+V`: keyboard shortcuts; retained unchanged (outside the supplied scope).

No other strings were excluded as technical.

## Validation

- Audit: `node scripts/audit-i18n.mjs` with stdin redirected from Windows `NUL` (equivalent to `/dev/null`): scoped **65 present / 2 explicit skips missing / 0 absent**.
- Repository-wide audit: 252 source files, 3,705 candidates, 1,437 present, 2,268 missing. These totals include unrelated batches and files.
- `npm test`: **532 pass / 0 fail / 1 skipped**. Added a regression check covering every scoped translation, reader-error display translation, timeout translation, and the Inspector heading.
- `npm run lint -- --max-warnings=0`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.

No commit was created.
