# UI step 2: one shell for the whole workspace, and split 「機器と接続」

Date: 2026-10-25. Direction from the user, verbatim: *"点击设备与链接会很明显的跳转到另一个界面了，没有保证统一性，
而且这个设备与链接有点暧昧，到底是测试传感器信号还是链接DB的接口呢"* — the jump to a second-looking app breaks
unity, and the label merges two unrelated jobs.

This document is the spec for Codex. Read `docs/refactor/UI_SIMPLIFY_STEP1_2026-10-25.md` and
`docs/refactor/UI_STYLE_ALIGN_PHYSIODB.md` first; both still apply (neutral palette, one primary, no
machine vocabulary on researcher surfaces).

## What is wrong today (verified in the code)

- `/admin` renders `AdminMonitorPage` with its own chrome: 36 px `pf. PhysioFlow` header, an
  `EXPERIMENT DESK` hero, its own tab bar (`01 Preparation / 02 Signal check / 03 Data & analysis`) and
  its own footer. The workspace (`Dashboard.jsx`) has a 240 px sidebar, a 56 px sticky topbar and a
  1024 px content column. Two visual systems, one product.
- The sidebar entry is `機器と接続 / Devices & connections` and lands on that page. The page actually
  covers three unrelated things: **PF server login**, **sensor signal check** (BrainFlow agent or
  OpenBCI GUI + myBeat, through `server/deviceMonitorBridge.mjs`), and **PhysioDB read/write**
  (researches → experiments → participants → streams, through `server/physioDBBridge.mjs`).
- The first tab (`Preparation`) is a 3-card recap of the workflow; it duplicates what the projects page
  now says better.

## Target

### 1. One shell

Extract the workspace chrome from `Dashboard.jsx` into `src/WorkspaceShell.jsx` and use it for
`Dashboard` **and** `AdminMonitorPage`. It owns: the 240 px sidebar (`#fafafa`), the wordmark, the nav,
the 56 px sticky topbar with the language/dark toggles, the 1024 px content column and the footer.
`Dashboard` keeps its own page bodies; the desk pages keep theirs. No second header, no hero, no
separate footer.

### 2. Five explicit nav items, no ambiguous one

| # | label (ja) | label (en key) | route | what it is |
|---|---|---|---|---|
| 01 | プロジェクト | `Projects` | `/` | experiment projects |
| 02 | 記録 | `Records` | `/` + sessions page | saved sessions |
| 03 | デバイス | `Devices` | `/devices` | sensor connection + live signal check (BrainFlow / OpenBCI GUI + myBeat) |
| 04 | データベース | `Database` | `/database` | PhysioDB: pick research → experiment → participant → stream, read a window, analyse, upload |
| 05 | 設定 | `Settings` | `/` + tools page | storage folder, analysis, legacy BioDB, server key |

- Delete the `機器と接続 / Devices & connections` string and its nav entry.
- `/admin` must keep working for old links: `main.jsx` routes `/admin` to the **devices** page (or
  redirects to `/devices`), no separate layout.
- Keep `/operator` and the participant entry untouched.

### 3. Each page is one job, no tab bar

- **`/devices`** = `DeviceMonitorPanel` (already built, includes live quality) + the PF server
  connection it needs. Nothing else. Title 「センサー信号の確認」, one line explaining that this does
  not measure impedance and is not the database.
- **`/database`** = the current tab-3 content: recording selectors, stream list, `PhysioDBSessionBinding`,
  `PhysioDBAnalysis` (with signal quality), upload. Title 「データベース（PhysioDB）」, one line saying
  this reads the lab database through the server.
- The `Preparation` tab content is deleted — its job is the projects page now.
- Sign-in: keep the existing PF server key form but render it inside the shell (same card style as the
  サイドバー pages), with wording that says what the key is for on that page. Do **not** add a new auth
  mechanism, do not move PhysioDB credentials to the browser.

## Non-goals

- No change to `src/composer/**`, the protocol model, the runtime, `src/analysis/**` logic, the bridges
  (`server/physioDBBridge.mjs`, `server/deviceMonitorBridge.mjs`), or the PhysioDB client contracts.
- No new dependencies, no router library, no CSS framework.
- No changed behaviour in what the device monitor or the database page can do — this is navigation and
  layout only.

## Acceptance

- Opening デバイス / データベース shows the same sidebar, topbar, type scale and colours as the projects
  page (same `WorkspaceShell`), and the nav highlights the current item.
- No string `機器と接続` / `Devices & connections` remains anywhere (`grep`).
- `/admin` and `/devices` both reach the signal check; `/database` reaches the recording list.
- The workspace nav has exactly the five items above, in that order, with translations in
  `src/pfUIStrings.js` (ja + zh; English stays as the key).
- `npm test` ≥ 518 pass / 0 fail; `npm run lint -- --max-warnings=0`; `npm run build`.
- No horizontal overflow at 320 / 768 / 1440 px on `/`, `/devices`, `/database`.
- Report: files touched, the routes that resolve, test counts, and anything left out.
