# The node editor behind a double-click is half a tool

Date: 2026-10-25. Reported by the user: 「双击节点之后的自定义编辑界面没有完善」.

## What actually happens today

Double-clicking a node in Design/Graph view opens `node-editor-fullscreen` (`src/ComposerV2.jsx:73-82`):

```
動画   表示   ✕ 完了          ← header
[ParticipantUiBuilder | ParticipantRenderer]
```

Evidence collected in the browser on `test1` (node `2 動画`):

| # | Problem | Evidence |
|---|---|---|
| A | The header's only toggle reads `表示` **in both states** — `t(previewEdit ? 'View' : '✎ Edit')`; `'✎ Edit'` is mapped to the same string as `View`, so there is no way to tell view from edit | header DOM: `動画 / 表示 / ✕ 完了` |
| B | Edit mode leaks: `previewEdit` is a bare `useState` in `useComposerState.js:47`, never reset when `previewNodeId` changes or closes, so a node can open straight into the editor — or stay in preview after you asked for edit | code + observed: first double-click opened the builder chrome while the button offered `表示` |
| C | **No node settings.** Name, duration, completion mode, prompt, media cannot be set here; those fields live in the right-hand `Inspector`, which is *behind* the overlay. Double-click promises "edit this node" and delivers layout only | `ComposerV2.jsx:73-82` renders only the builder or the preview |
| D | `input.questionnaire` / `timing.wait` get `fullscreenUiEditable = false` (`ComposerV2.jsx:58`) → no toggle at all, a dead preview with no explanation of why | code |
| E | The builder speaks three languages at once: `内容`/`レイアウト` (ja) next to `FORM`/`SHAPES` (en) group headings, `Text / Heading or body copy / Html / Input / Button / Continue`, context menu `Duplicate / Copy / Paste / Move up / Bring to front / Edit style / Delete`, badges `Free canvas` / `Auto layout`, `⚙ Settings`, `▶ プレビュー`, `Bindings and actions` | panel DOM dump |
| F | No way to move to the previous/next step from inside the editor — every node costs close → find → double-click | UI |
| G | The editor hides the composer header, so save state (`●` unsaved), undo/redo and `保存` are invisible while editing | UI |

The builder itself is competent (elements, presets, layers, marquee select, snap, undo, validation "4 elements · schema valid"). The gap is the **editor shell around it**, plus its language.

## Required changes

### 1. Two tabs, settings first when there is nothing to edit

Header: `動画` · tab `設定` / `画面` · `●` (dirty) · `保存` · `✕ 完了`, and `‹` `›` to step to the previous/next node.

- `設定` renders the same field set the right-hand `Inspector` renders for a node (reuse the component, do not duplicate the schema logic).
- `画面` renders `ParticipantUiBuilder` when the node can have a custom screen, otherwise a one-line explanation: `このステップの画面は自動生成です（設定は「設定」タブ）`.
- Opening: `設定` when the node has no `config.ui`, `画面` when it has one. Always reset on open — never inherit the previous node's tab or edit state.

### 2. Kill the leak

Replace the ad-hoc `previewEdit` boolean with the tab state owned by the editor, reset whenever `previewNodeId` changes, and drop `previewEdit` from `useComposerState` if nothing else needs it (line 552's guard must keep working — see that it still suppresses the inspector's duplicate builder).

### 3. Vertical navigation

`‹` / `›` walk `protocolSequence(protocol)` order (nodes only), keeping the current tab. Disabled at the ends.

### 4. Save state inside the overlay

Show the dirty dot and a `保存` button in the editor header (same handlers as the composer header), so editing a screen does not require closing first. Undo/redo may stay in the composer header.

### 5. Japanese for the builder

Route every builder string through the label layer added in step 4 (`src/composer/translate.js` / `composerStrings.js`):

- group headings `内容 / フォーム / レイアウト / 図形`, element names `テキスト / 画像・音声・動画 / HTML / 入力欄 / ボタン / 進捗バー / グループ / 矩形`, hints in one short Japanese sentence.
- context menu: 複製 / コピー / 貼り付け / 前面へ / 背面へ / 上へ移動 / 下へ移動 / スタイルを編集 / 削除.
- badges & chrome: `自由配置` / `自動整列`, `⚙ 設定`, `▶ プレビュー`, `外観`, `バインディングとアクション`, `表示 / 編集` (distinct strings!).
- Element `type` names shown in the inspector head (`Text`, `Layout`, `Screen`) become the Japanese display names; the raw type stays in `技術情報` / advanced mode.

## Non-goals

- Do not change the UI schema model, `ParticipantUiCanvas` interaction semantics, or what the participant renderer draws.
- Do not add drag-and-drop of new element kinds; the library stays as is.
- Do not touch the desk, participant runtime, or database pages.

## Acceptance

- `npm test` ≥ 529 pass / 0 fail / 1 skipped; `npm run lint -- --max-warnings=0`; `npm run build`.
- Browser check on `test1`:
  - double-click `2 動画` → editor opens with `画面` selected and the builder usable;
  - double-click `4 手動イベント` (or `アンケート` if present) → opens with `設定` selected;
  - switching nodes with `‹` `›` always lands on the tab rule in §1, never on the previous node's tab;
  - editing in the builder marks `●` and `保存` persists it (reload the project and the change is still there);
  - no English left in the builder library, group headings, context menu or inspector head.
- Report: files touched, how the tab state is owned, what line 552's guard became, and the browser-check outcome.
