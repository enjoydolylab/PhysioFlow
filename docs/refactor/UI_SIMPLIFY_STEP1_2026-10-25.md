# UI simplification — step 1: the projects page

Date: 2026-10-25. Owner: Hermes (verification) / Codex (implementation).
Direction approved by the user: **maximum simplicity and clarity**. This step touches the projects page only.

The user's rule for this step: *"尽量保持 ui 最大程度的简洁清晰"* — fewer elements beats prettier elements. If a
decision can go two ways, pick the one that removes something from the screen.

## Non-goals (hard)

- Do not touch `src/composer/**`, `src/AdminMonitorPage.jsx`, `src/OperatorMonitorPage.jsx`,
  `src/GraphRuntimeRunnerPage.jsx`, `src/core/**`, `src/analysis/**`, the protocol model, storage, or
  `SessionManager` internals.
- No new dependencies, no CSS framework, no new route or page.
- No dark-mode redesign — keep existing tokens and let both themes inherit the new list.
- Nothing that exists may become unreachable: rename / duplicate / archive / new version / version
  history / migrate / restore must stay available (inside the row menu is fine).

## Problems this step removes (all visible in the current page)

1. Two badges per card (`DRAFT` and `NEEDS SETUP`) that describe the same thing.
2. Machine-model text aimed at nobody who is running a study: `11 nodes · 10 connections`,
   `Composer V2 · v2 · Draft 1 migration draft · 2 バージョンs` (note the broken plural), `Version history (2)`.
3. Three competing primary buttons on one screen: `新規プロトコル`, `編集を続ける` (recent-project strip),
   `ドラフト編集` (per card).
4. The recent-project strip duplicates the first row of the project list.
5. Workspace counters (4 / 2 / 20) sit beside the title and answer no question.
6. English sentences inside the Japanese UI: `Search projects…`, `Version history (n)`,
   `Removed / archived versions`, `Create an experiment`, `New protocol`, `Import JSON`,
   `Start from a template`, `Your projects`.

## Target layout: a compact list, one primary action per row

```
実験プロジェクト                                      [＋ 新規 ▾]
4 プロジェクト · 20 記録 · 保存先: ローカルフォルダ

名前                  状態              最終更新        操作
感情課題（パイロット）  準備完了          10-22 · 3 記録  [準備する]  記録 3 ⋯
test1                 準備中 ・ 未凍結    10-21 · 0 記録  [編集]        ⋯
```

Rules:

- **One primary (green) button per row**, and one on the page (`新規 ▾` → small menu: 空のプロトコル /
  テンプレートから作成 / JSON を読み込む). Nothing else is green.
- **Stage vocabulary collapses to three words**, derived in one pure function:
  - `記録あり` — at least one completed session matches the protocol;
  - `準備完了` — version is frozen and `assessProtocolReadiness(...).status === 'ready'`;
  - `準備中` — otherwise, plus **one** reason (first failing item, errors before warnings). Not a list.
- **A row shows at most**: name, stage (+ reason), last-updated date, session count, one action, one `⋯`.
  No node counts, no version counts, no `Composer V2`, no `migration draft`, no second badge.
- **No card, no nested `<details>`.** The row menu (native `<details>` or a small popover, your choice —
  whichever is less code) holds: バージョン履歴, 新しいバージョン, 名前を変更, 複製, アーカイブ,
  Composer V2 へ移行 (only when `!graphProtocol`), 復元 (archived versions section).
- **Every visible string goes through `t()`**, with entries in `src/pfUIStrings.js` (ja + zh; the English
  original stays as the key). In Japanese mode no English sentence may remain except proper nouns
  (PhysioFlow, PhysioDB, JSON, BrainFlow, YouTube).

## Implementation

1. **New pure module `src/projectStage.js`**

   ```js
   export function projectStage(protocol, { sessions = [], storageInfo = {} } = {})
   // -> { stage: 'preparing' | 'ready' | 'recorded',
   //      reason: { label: 'Protocol validation', detail: '3 blocking issue(s).' } | null,
   //      sessions: number, updatedAt: string | null }
   ```

   - reuse `assessProtocolReadiness` and `protocolStatusOf` from `./readiness.js` / `./core/index.js`;
     no new validation logic;
   - `reason.label` stays the English readiness label (it is the translation key); `reason` is `null`
     for `ready` and `recorded`;
   - no counts interpolated into the stage word.

2. **`src/Dashboard.jsx`** — replace `workspace-resume` + `protocol-grid` / `ProjectCard` with
   `ProjectList` + `ProjectRow`. Keep the page's existing handlers (`onOpen`, `onRun`, `onNew`,
   `onTemplate`, `onStroopTemplate`, `onGonogoTemplate`, `onDuplicate`, `onArchive`,
   `onNextVersion`, `onRemoveVersion`, `onRestoreVersion`, `onRenameProject`, `onMigrate`,
   `onImport`) wired to the menu items. Do not change `Dashboard`'s props.
   Keep the search input (search is a real need) but place it on the list header line.

3. **`src/dashboard.css`** — add list styles next to the existing `.protocol-grid` block; do not delete
   rules used elsewhere in the app (grep before removing). No horizontal overflow at 320 px.

4. **`src/pfUIStrings.js`** — add every new string, plus japanese/chinese for the readiness labels used
   as reasons:

   | en (key) | ja | zh |
   |---|---|---|
   | `Experiment projects` | 実験プロジェクト | 实验项目 |
   | `New` | 新規 | 新建 |
   | `Blank protocol` | 空のプロトコル | 空白方案 |
   | `From template` | テンプレートから作成 | 从模板创建 |
   | `Import JSON` | JSON を読み込む | 导入 JSON |
   | `Name` | 名前 | 名称 |
   | `State` | 状態 | 状态 |
   | `Last updated` | 最終更新 | 最后更新 |
   | `Records` | 記録 | 记录 |
   | `recorded` | 記録あり | 有记录 |
   | `ready to run` | 準備完了 | 准备完毕 |
   | `preparing` | 準備中 | 准备中 |
   | `not frozen` | 未凍結 | 未冻结 |
   | `Experiment structure` | 実験の構成 | 实验结构 |
   | `Protocol validation` | プロトコル検証 | 方案校验 |
   | `Required content` | 必要な内容 | 必填内容 |
   | `Stimulus media` | 刺激メディア | 刺激素材 |
   | `Analysis windows` | 分析区間 | 分析区间 |
   | `Frozen reproducible version` | 凍結バージョン | 冻结版本 |
   | `Pilot run evidence` | 予備実施の記録 | 预试记录 |
   | `Local data storage` | データ保存先 | 数据保存位置 |
   | `Version history` | バージョン履歴 | 版本历史 |
   | `New version` | 新しいバージョン | 新版本 |
   | `Rename` | 名前を変更 | 重命名 |
   | `Duplicate` | 複製 | 复制 |
   | `Archive` | アーカイブ | 归档 |
   | `Restore` | 復元 | 恢复 |
   | `Search projects` | プロジェクトを検索 | 搜索项目 |
   | `No projects yet` | プロジェクトはまだありません | 暂无项目 |
   | `Start with a blank protocol` | 空のプロトコルから始める | 从空白方案开始 |

5. **Tests** — `tests/project-stage.test.js`, four cases:
   draft → `preparing` + a reason; frozen but blocked → `preparing` + the first error reason;
   frozen + ready → `ready` + `reason === null`; a completed formal session → `recorded`.
   Build fixtures from `createProtocolGraph` / `freezeProtocolGraph` in `src/core/index.js` (see
   `tests/` for existing fixture helpers) — do not hand-roll protocol objects that the validators reject.

## Acceptance (all must be true before reporting done)

- `npm test` → ≥ 514 pass, 0 fail, 1 skipped; `npm run lint -- --max-warnings=0`; `npm run build`.
- **Visible element count on the projects page goes down.** Count buttons + badges + standalone text
  blocks on the page before and after; put both numbers in the commit message body.
- In Japanese mode, no English sentence is visible on the page (proper nouns above excepted).
- No horizontal overflow at 320 / 375 / 768 / 1024 / 1440 px.
- Nothing in the Non-goals list was modified (`git status` should show only the files above).
- Report: files touched, the two element counts, test counts, and anything you deliberately left out.
