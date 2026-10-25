# UI step 3: the composer header, the identifiers it leaks, and the stale research list

Date: 2026-10-25. Follow-up to `UI_SIMPLIFY_STEP1_2026-10-25.md` and `UI_STEP2_SHELL_AND_ROUTES.md`.
Both still apply: one primary action per surface, no machine vocabulary on researcher-facing screens,
neutral palette, Japanese by default.

Three separate jobs, all small. Do them in this order.

## 1. Composer header: one row, one primary action

`src/composer/Header.jsx` currently puts ten controls in one flex row that wraps into two visual rows at
1440 px, and every control has the same weight: help, undo, redo, Test run, Mark migration reviewed,
Freeze, More actions, Save, Back, plus the mode switch. Undo/redo sit far from the canvas they act on and
`Save` is the last thing in the row, after `← Projects`.

Target layout, left to right:

```
[← プロジェクト]  感情課題（パイロット） ●   |   Quick  Design  詳細設定  { } コード   |   ↩ ↪   [プレビュー実行]  [保存]  [⋯]
```

- `← プロジェクト` moves to the far left (it is navigation, not an action).
- Undo/redo become icon-only buttons with `aria-label` + `title`, placed immediately left of the primary
  action; disabled state stays as today.
- Exactly **one** green/filled primary: `保存` when there are unsaved changes, otherwise `プレビュー実行`
  (`Prepare collection` when locked — keep that wording). Do not fill both.
- `⋯` menu holds, in this order: `バージョン凍結` (or `新しいバージョンを作成` when locked), `エクスポート`,
  `旧 BioDB 接続`, `使い方`, and `Mark migration reviewed` **only** when it is required — with one muted
  line under it saying why it is offered.
- `バージョン凍結` is no longer a standalone button; it keeps its disabled rule
  (`!validation.valid || migrationReviewRequired`).
- Keep the mode switch, but make it visually secondary (no filled background on the active mode; use the
  muted/underline treatment already used for tabs elsewhere).
- Nothing else may live in the header row.

## 2. Stop showing identifiers to researchers

Three leaks, all verified on screen:

| Where | Today | Required |
|---|---|---|
| Inspector, a selected node | `core.start@1.0.0` under the title | component label only; the type + version appear inside the existing collapsed details (label it `技術情報`), or when `editorMode === 'advanced'` |
| Validation / step issues | raw code such as `config_media_mode_invalid` | never render a raw code as a sentence; map it to a human sentence, or hide it behind the same `技術情報` disclosure |
| Sequence rows | label (`手動イベント`) plus a second line repeating the component type (`timing.wait`), sometimes identical across different rows | drop the type line when it adds nothing; keep it only if it differs from the label *and* the row is in `advanced` mode |

Rule of thumb to encode in one helper: any string that matches `/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*$/` is an
identifier, not a message — route it through a label map or hide it. Add that helper (e.g.
`src/composer/labels.js` with `humanizeIssueCode` + `isIdentifier`) and unit-test it, rather than patching
strings inline.

## 3. The research list on the database page can be stale

First half of the write-path work surfaced this: the `研究` dropdown showed three researches while the same
page context, calling `/v1/physiodb/rpc` with `operation: 'researches'`, returned four — the one created
while the desk was open was missing.

- Re-fetch `me` + `researches` when the database page mounts **and** add a `更新` control next to the three
  selectors that re-runs the same fetch (it may reuse the existing `refresh` path for streams/events).
- Selecting a research must keep working; do not reset the current stream selection when only the research
  list is refreshed.
- Add a test: a research that appears in the second `researches` response is listed after refresh and not
  before.

## Non-goals

- No change to save / freeze / validation / migration logic, the protocol model, the runner, the desk, or
  the participant UI.
- No new dependencies, no router, no CSS framework.
- Do not delete `src/composer/Header.jsx` exports or props that other files pass; keep the prop contract.

## Acceptance

- `npm test` ≥ 521 pass / 0 fail / 1 skipped; `npm run lint -- --max-warnings=0`; `npm run build`.
- Composer header: **one** filled primary button; count of header controls before/after in the report.
- No `@1.0.0`-style version string and no snake_case issue code visible in the composer at default zoom
  (grep the rendered DOM in your own check if you can; Hermes will screenshot).
- The database page lists a newly created research after `更新`.
- Report: files touched, before/after header control counts, new tests and their names, anything left out.
