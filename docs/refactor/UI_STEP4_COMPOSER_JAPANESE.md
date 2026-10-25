# UI step 4: the composer speaks Japanese (and stops shouting in English)

Date: 2026-10-25. Follow-up to steps 1–3. Step 3 fixed the header and hid the version strings, but a
screenshot of the composer at 1440 px still shows the mixed-language mess below. All of it is
researcher-facing.

## What is on screen today

| Surface | Today |
|---|---|
| Palette items | `スクリーン` + `display.screen`, `メディア` + `display.media`, `Screen`, `Custom HTML`, `Text Input`, `fixation`, `input.questionnaire` — half translated, half registry English, every item carrying its type id |
| Sequence rows | `1 fixation`, `2 動画`, `3 音声`, `4 手動イベント`, `• End` |
| Quick-mode hint | `Quick mode: build the execution flow and set essential properties.` (all English) |
| Inspector migration notice | `Migration review required` / `0 item(s) must be checked before this draft can be frozen.` — English, and it contradicts itself: 0 items, yet review is "required" |
| Inspector field labels / help | `Screen content`, `Completion`, `Duration (ms)`, `Prompt`, `Response variable`, `Timeout (ms)`, `Auto-advance on key press`, `Shape`, `Pulse animation`, `Checklist (one per line)`, … (all from `src/core/componentRegistry.js`) |

`npx tsx scripts/audit-i18n*` (or whatever the existing audit entry point is — find it) reports 3598
candidate strings at 462 covered (13%). This step is **not** a full i18n pass; it is the composer surface.

## 1. A label layer, not a registry rewrite

`src/core/componentRegistry.js` stays the technical source of truth: `label` there is English and is used in
exports, logs and the code view. Do **not** rename those.

Add `src/composer/catalogLabels.js` exporting:

- `componentLabel(type, language)` — display name per component type, in `ja` / `zh` / `en`.
- `fieldLabel(componentType, path, language)` and `fieldHelp(componentType, path, language)` — per editor
  field, keyed by `${type}:${path}`; fall back to the registry's English when a key is missing.
- `optionLabel(componentType, path, option, language)` for select options that are words rather than
  numbers (`manual`, `fixed`, `media-ended`, `auto`, `fill`, `fit`, `cross`, `dot`, `diamond`, `none`,
  `correct_incorrect`, `always`).

Cover **every** component in the registry (12 today) and **every** `editorFields` entry they declare, plus
the `label` of each option list. Use the vocabulary already in the库: 完了方法 (Completion), 表示 (Display),
評価 / アンケート / 反応 / 待機 / 注視点 / 手動イベント, 所要時間（ms）, 応答変数, 応答の選択肢, 正解の値,
フィードバック, タイムアウト（ms）, 応答必須, 図形, サイズ（px）, 色, 点滅, 期待するキー, チェック項目（1 行に 1 つ）.
Keep parenthetical units in half-width where the existing 日本語 already does so.

Palette (`Palette.jsx` / `Catalogs.jsx`), sequence rows (`Sequence.jsx`) and the Inspector
(`Inspector.jsx`, `NodeInspector.jsx`) render through this layer.

## 2. Type ids only in advanced mode

The `display.screen`-style subtitle under each palette item, and the type line on a sequence row, are
developer vocabulary. Show them only when `editorMode === 'advanced'`. In `quick` / `design` the item is
just its display name (plus the one-line help already there).

## 3. The migration notice is wrong, not just English

`migrationReviewRequired` currently reaches the Inspector with `issues.length === 0`. Fix the derivation so
review is required only when there is at least one unreviewed issue, and translate the notice:

- `ja`: `移行した設定の確認が必要です` / `この下書きを凍結する前に {n} 件を確認してください。`
- with `n === 1` → `1 件`, no `item(s)`.
- when there is nothing to review, render nothing at all.

Find where it is derived (`src/composer/useComposerState.js`, `src/App.jsx`, or wherever `legacy.migrationReport`
is read) and keep `Mark migration reviewed` and the freeze block behaving consistently with the fix.

## 4. Chrome strings

Translate the composer's own strings — quick-mode hint, mode help tooltips, `ブロック問題`, `技術情報`, the
`⋯` menu items you added in step 3, empty states, palette category headings (`PRESENTATION` /
`INTERACTION` / `SETUP` / `TIMING` are currently raw English).

## Non-goals

- No behavioural change to validation, migration, freezing, saving or the runtime.
- Do not translate protocol **content** (user-typed names, prompts).
- Do not rename registry labels or types, and do not touch the desk / participant / database pages.
- No new dependency.

## Acceptance

- `npm test` ≥ 526 pass / 0 fail / 1 skipped; `npm run lint -- --max-warnings=0`; `npm run build`.
- Screenshot the composer at 1440 px in Quick mode: no `xxx.yyy` identifier visible, no all-English
  researcher string, palette and rows fully Japanese.
- Re-run the existing i18n audit and report the coverage number before/after.
- Report: files touched, the number of components/fields covered, any string you deliberately left in
  English and why, and the audit delta.
