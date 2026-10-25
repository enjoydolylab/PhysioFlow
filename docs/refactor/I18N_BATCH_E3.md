# i18n batch E3

Validation completed without a commit.

## Dictionary changes

- Added 100 unique source keys to each language (ja: 100, zh: 100), compared with the starting dictionaries. Removed three obsolete Japanese source keys from each language; net growth is 97 keys per language.
- Replaced Japanese sources with English: `回答が記録されました` → `Response recorded` (zh `回答已记录`, ja `回答が記録されました`); `回答を送信` → `Submit response` (zh `提交回答`, ja `回答を送信`); `次へ` → `Next` (zh `下一步`, ja `次へ`). Updated questionnaire rendering to translate using the participant language.
- Corrected the Chinese label `version` from `个版本` to `版本`.
- Remaining effective Chinese dictionary entries identical to a kana-containing source: **0**. The regression test includes pfUIStrings merges.
- Converted interpolated app/setup/builder/dashboard UI calls to static English sources with named placeholders (`{n}`, `{n1}`, `{n2}`), preserving numbers including zero. Added interpolation after translation to useT().
- Kept readiness and validation model messages in English; added display-only matching templates. Error codes and enum values remain unchanged. Corrected comparisons that previously translated the `ready` / `fixed` enum operands.

## Observed audit

The initial fresh audit already classified the cited setup/builder examples as present. This did not prove their interpolated calls worked, so those calls were corrected separately.

Final command: `node scripts/audit-i18n.mjs` with empty stdin. Counts below come from the generated `I18N_AUDIT.md`, whose new E3 per-file table is also emitted in the command's JSON output.

| File | Present | Missing | Allowlisted |
| --- | ---: | ---: | ---: |
| src/app/sessionSetup.jsx | 106 | 0 | 0 |
| src/app/legacyBuilder.jsx | 96 | 0 | 0 |
| src/App.jsx | 35 | 0 | 1 |
| src/Dashboard.jsx | 59 | 0 | 0 |
| src/readiness.js | 33 | 0 | 0 |
| src/i18nMessage.js | 344 | 0 | 1 |

The audit now scans i18nMessage.js's English message keys while skipping RegExp constructor syntax. It previously excluded that entire file.

Allowlisted exceptions:

- `physioflow.onboarding-v1` in App.jsx: `reason: "data"`; persisted onboarding storage key (new entry).
- `BioDB leg failed: {0}. The PF session package is complete on its own.` in i18nMessage.js: existing `reason: "data"`; exported joint-package warning, preserved in the data model.

Repository-wide audit: 252 files, 3,327 candidates; 2,295 present, **737 missing outside this scope**, 295 allowlisted. This batch does not claim repository-wide zero missing.

## Validation

- `npm test`: **541 pass / 0 fail / 1 skipped** (542 tests).
- `npm run lint -- --max-warnings=0`: passed.
- `npm run build`: passed.
- Regression tests cover named placeholder interpolation (including zero and empty values), the three English questionnaire sources and Chinese version label, the kana-source defect check, and display-only translation of readiness counts.
