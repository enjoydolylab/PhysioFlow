# UI step 4 implementation report

Date: 2026-10-26

The composer uses a display-only Japanese/Chinese/English catalog. The technical registry, exported labels/types, persisted option values and authored protocol content remain unchanged. Composer additions are resolved by a scoped translator; they are not registered with the legacy global DOM translator and do not add translations to desk, database or participant pages.

## Coverage

The current registry contains **23 components and 50 editor fields** (more than the 12 components in the request). All 23 display names, all 50 field labels, all 21 declared help texts, and all 10 option-list labels / 38 option entries are covered in Japanese and Chinese, with English coming from the registry. Missing translations fall back to registry English. Unknown option values remain intact.

Default component names, including the migrated `fixation` alias and Start/End, are localized for display. Other authored names are preserved; rendering does not rewrite protocol labels. Quick and Design hide palette, sequence and canvas type subtitles. Advanced exposes them. Existing collapsed technical disclosures retain their diagnostic details.

Migration review uses one shared outstanding-issues calculation for the Inspector, header actions and freezing. Zero issues, individually reviewed issues, or an acknowledged report require no review. A pending issue produces the Japanese notice with `1 件`, disables freezing, and can be acknowledged using the existing action. The old core test that required review for an empty issue list now supplies an actual pending issue.

## Validation

- `npm test`: **528 pass, 0 fail, 1 skipped** (529 total).
- `npm run lint -- --max-warnings=0`: passed.
- `npm run build`: passed.
- `node tests/e2e-ui-step4.mjs`: passed using headless Edge with a 1440 × 900 viewport, the real ComposerV2 and its state hook, and a Japanese fixture containing fixation, video, audio and a manual event.
- Browser assertions check the complete Quick palette/sequence/Inspector/header text, including scrolled content, for English or type identifiers (allowing only HTML and unit symbols px/ms). Additional checks cover Design/Advanced type visibility, zero/one/acknowledged migration issues, freeze controls, unchanged protocol names, and unchanged persisted select values.
- Screenshot visually inspected: [1440 px Quick composer](screenshots/UI_STEP4_COMPOSER_QUICK_1440.png).

## i18n audit

Entry point: `npm run audit:i18n` (`scripts/audit-i18n.mjs`).

| Measurement | Candidates | Covered | Coverage | Missing |
| --- | ---: | ---: | ---: | ---: |
| Original script, before this work | 3,735 | 453 | 12.1% | 3,282 |
| Same before-work candidates, recognizing the existing pfUIStrings dictionary | 3,735 | 644 | 17.2% | 3,091 |
| After this work, dictionary-aware script | 3,754 | 880 | 23.4% | 2,874 |

The updated audit recognizes the pre-existing `pfUIStrings` dictionary and the new composer/catalog dictionaries. It excludes the two new catalog files from candidate scanning so their Japanese/Chinese translation values are not reported as missing UI strings. The comparable translation delta is **+236 covered candidates, +6.2 percentage points, and 217 fewer missing candidates**; 191 of the apparent increase from the original script is recognition of previously existing translations. The request's 3,598 / 462 baseline does not match this checkout's measured starting state. The generated detailed report is [I18N_AUDIT.md](I18N_AUDIT.md).

## Deliberately retained English / technical tokens

- Registry labels/types, JSON/code-view content, export values, IDs, event names, permissions and technical diagnostics remain technical source data. This avoids changing protocol semantics or exports. Type subtitles are confined to Advanced.
- Authored names, prompts, questionnaire/response content, resource names and URLs remain authored content.
- HTML, JSON, SDK, BioDB, Go / No-Go and unit/key notation such as px, ms, cm, f/j/space remain standard technical names or symbols. Their surrounding researcher-facing labels are localized.
- Unregistered third-party vocabulary and missing future translation entries retain their English fallback; this is not a whole-application i18n pass.

## Files touched by this step

New display/copy modules:
- `src/composer/catalogLabels.js`
- `src/composer/composerStrings.js`
- `src/composer/translate.js`

Composer integration and chrome:
- `src/ComposerV2.jsx`
- `src/composer/Palette.jsx`
- `src/composer/Catalogs.jsx`
- `src/composer/Sequence.jsx`
- `src/composer/Canvas.jsx`
- `src/composer/Header.jsx`
- `src/composer/Inspector.jsx`
- `src/composer/NodeInspector.jsx`
- `src/composer/ResponseOptionsEditor.jsx`
- `src/composer/RepeatSequenceEditor.jsx`
- `src/composer/GroupSequenceEditor.jsx`
- `src/composer/GroupBatchEditor.jsx`
- `src/composer/useComposerState.js`

Migration consistency:
- `src/core/migrationReview.js` (new)
- `src/core/freezeProtocolGraph.js`

Checks and artifacts:
- `tests/core-model.test.js`
- `tests/ui-step4.test.js` (new)
- `tests/e2e-ui-step4.mjs` (new)
- `scripts/audit-i18n.mjs`
- `docs/refactor/I18N_AUDIT.md`
- `docs/refactor/screenshots/UI_STEP4_COMPOSER_QUICK_1440.png` (new)
- `docs/refactor/UI_STEP4_IMPLEMENTATION_REPORT.md` (this report)

No dependency was added. `src/core/componentRegistry.js` was not edited.
