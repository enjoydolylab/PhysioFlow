# Node editor (double-click a node): make the screen tab an actual workspace

Date: 2026-10-25. Reporter: the user, after using it. "双击节点之后的自定义编辑界面没有完善。"

## What works today (do not "fix" these)

Verified in the browser against the real `test1` protocol, 1440×900, graph view, double-click on the
`動画` node:

- The full-screen editor opens, `key={previewNode.id}` remounts it per node, `‹ ›` walk the sequence.
- Clicking an element in the stage **does** select it (`[data-ui-id].selected`) and the right panel **does**
  switch to that element: X / Y / 幅 / 高さ / テキスト / 種類 / 文字サイズ / 外観 / バインディング.
- Typing in テキスト updates the canvas live and turns on the editor's unsaved dot, i.e.
  `onChange → updatePreviewUi → commit` reaches the protocol.

So this is a completeness and layout job, not a broken-feature job.

## Measured defects

```
.node-editor-fullscreen  fixed, 900 px                      ← fine
.node-editor-body        height 852, scrollHeight 1008      ← the whole body scrolls
.ui-canvas-layout        height 780                          ← and it is 100dvh-120 tall
.ui-canvas-wrap          height 585
.ui-inspector            height 640
participant-ui-builder   overflow:auto, padding 18px         ← scrolls again
```

1. **The dialog scrolls as one block.** `questionnaire-v2.css:281` gives `.ui-canvas-layout`
   `min-height: calc(100dvh - 120px)` *inside* a builder that already has 18 px padding, a toolbar,
   `ScreenChecks`, a layout notice and 「技術情報」. The sum is 1008 px in an 852 px viewport, so the stage
   rides up and down while you edit, the bottom strip is clipped mid-sentence, and the page behind shows
   through under the dialog.
2. **The stage is too small.** It opens at 67 % with a wide empty band under it, because the canvas column
   never takes the leftover height.
3. **The layout switch appears twice** — 自由配置 / 自動整列 in the toolbar *and* again at the top of the
   right panel (`ui-inspector-bar`), next to a mode badge that says the same thing.
4. **English on the stage**: `FREE · drag elements anywhere` (hardcoded in `ParticipantUiCanvas.jsx:490`).
5. **No Escape.** `Escape` only clears a marquee (`useParticipantUiState.js:475`); it does not close the
   editor, and `‹ ›` have no visible tooltips.
6. **The right panel looks unfinished when nothing is selected.** Selecting the root `画面` shows
   配置モード / 余白 / 背景 / 文字色, then 「外観の詳細設定 (0)」 and 「バインディングとアクション」 collapsed
   and empty. Nothing tells the user that clicking an element is what fills this panel.

## Required

1. **Give the dialog a real layout**: header 56 px fixed, body `flex:1; min-height:0; overflow:hidden`.
   Inside the body the builder must not scroll: `.ui-canvas-layout` becomes `height:100%` with
   `grid-template-rows: minmax(0,1fr)`, and each column (`.ui-element-library`, `.ui-canvas-wrap`,
   `.ui-inspector`) scrolls on its own with `min-height:0`. Delete the `100dvh - 120px` arithmetic.
   `ScreenChecks`, the fixed-screen notice and 「技術情報」 become a single footer strip at the bottom of the
   canvas column (`flex:0 0 auto`), so they never add page height.
2. **Fit on open**: call the builder's `fitView()` once after mount so the stage fills the available area,
   and re-fit on window resize while the editor is open.
3. **One layout switch.** Keep it in the toolbar; in the right panel keep only the read-only badge
   (`自由配置` / `自動整列`) plus 自動整列 (the arrange action) when it applies. Nothing else duplicated.
4. **Translate** the free-canvas hint and route it through the builder's `t` (`ja`: 自由配置：要素をドラッグ
   して配置, `zh`: 自由布局：拖动元素放置位置). Sweep the same file for other hardcoded English strings and
   route them through `useBuilderT()`.
5. **Escape closes** the node editor (context menu first, then marquee, then the dialog). Add `title` +
   `aria-label` tooltips to `‹ ›` (`前のステップ` / `次のステップ`).
6. **Empty-state line** in the right panel when `selected.id === normalized.root.id`: one muted sentence
   explaining how to add (左の要素をクリックで挿入) and how to edit (画面内の要素をクリックするとここで編集できます).
   Hide 「外観の詳細設定 (0)」 and the bindings section when they would render empty.

## Non-goals

- Do not change the runtime, the schema, `node.config.ui` shape, saving, or `updatePreviewUi`.
- Do not change element selection, drag, resize, marquee, context menu or the preview mode.
- Do not restyle the composer behind the dialog or the desk.
- No new dependency.

## Acceptance

- 1440×900 and 1024×768: `document.querySelector('.node-editor-body').scrollHeight === clientHeight`
  (no modal-level scroll) and the stage occupies ≥ 60 % of the viewport height.
- Exactly one 自由配置 / 自動整列 control; `grep -rn "drag elements anywhere" src` returns nothing.
- Escape closes the editor; `‹ ›` show tooltips.
- `npm test` ≥ 529 pass / 0 fail / 1 skipped; `npm run lint -- --max-warnings=0`; `npm run build`.
- Report: files touched, the measured heights before/after at both viewport sizes, and any string left in
  English on purpose.
