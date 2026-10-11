# PF 修改重构验收

日期：2026-10-09（Asia/Tokyo）。验收对象：当前工作区源码与本机运行实例，未重新发布安装包。

## 原请求与验收结果

| 原请求 | 当前实现 | 验收证据 |
| --- | --- | --- |
| 重构原 PF 流程及 UI，不仅添加运行前窗口 | 原 Dashboard 统一项目、记录、数据设置；原 Composer 提供步骤/图视图；原准备页嵌入真实运行器预检；原完成页及记录详情显示 DB 验证 | `src/Dashboard.jsx`、`src/ComposerV2.jsx`、`src/app/sessionSetup.jsx`、`src/SessionManager.jsx`；浏览器完成设计→准备→运行→本地保存→记录→分析→同一记录返回 |
| 轻量、简洁、美观、操作符合习惯 | 暖白与森林绿；近期项目继续编辑；主操作突出测试/准备；技术标识、导出及旧 BioDB 按需展开；直线实验默认步骤列表 | `src/dashboard.css`、`src/pf-workflow.css`；`../artifacts/pf-redesign-2026-10-09/{home,sequence,records}.png`；追加组件、重排、Undo、冻结与双视图一致性检查通过。可用性证据为软件操作验证，未声称真人研究签收 |
| 使用 DB 官方客户端，直接接入 API 做 test run | Node 服务通过 uv 调用固定版本官方 Python ApiClient；隔离测试记录，上传后核对样本值/时间与事件；重复请求幂等，丢失响应先核对 | `tools/physiodb/pyproject.toml`、`server/physioDBBridge.mjs`、`server/physioDBTestRuns.mjs`；官方 SDK 单测通过；真实 API 报告 `../artifacts/pf-redesign-2026-10-09/live-sdk-verification.json` |
| 原 PF 页面实际完成 DB test run | 当前构建的 8787 工作区已有草稿→Preview→统一准备→Begin→保存→真实 DB 核对；记录页保存验证结果，分析往返后仍恢复同一记录 | 测试参与者 `PF_UI_REFACTOR_20261009`，会话 `900e1e56-05d3-4e57-b035-be9ed558ed81`；500/500 样本、2/2 事件一致；`../artifacts/pf-redesign-2026-10-09/live-ui-test-result.png`、`live-ui-saved-record.png`。该协议为 Start→End，API 信号为明确标注的合成探针；刺激/问卷路径由完整浏览器回归另行覆盖 |
| 管理员和实验参与者画面分离 | 管理员在同页完成配置/信号检查，独立 `/operator` 监控；刺激显示不保留准备表单；公开参与者模式禁止操作员快捷键、凭据、监控入口和导出 | `src/GraphRuntimeRunnerPage.jsx`、`src/OperatorMonitorPage.jsx`；`tests/e2e-participant-public.mjs` 检查参与者入口、运行、刷新恢复、结束及角色隔离；`tests/physiodb-service.test.js` / `physiodb-test-runs.test.js` 验证服务端权限 |
| 参考前辈系统，实验前检查设备信号，复用已验证代码 | 前辈监控 snapshot 与 BrainFlow 被动桥接；必需信号检查新鲜度、样本、平线、采样率和原始录制；正式模式禁止模拟设备；检查本身不启动实验 | `server/deviceMonitorBridge.mjs`、`src/DeviceMonitorPanel.jsx`、`src/operator/signalReadiness.js` / `experimentPreflight.js`；`tests/operator-monitor.test.js`；BrainFlow Python 3 项测试通过。完整 PF 软件路径验证连接→接收信号→编辑→断开→重新连接→开始。实机基础验证沿用用户确认，本轮未重新测量硬件时间精度 |
| 利用 API 进行数据处理、分析和导出 | 官方客户端读取指定时间窗；波形、原始值/去均值、均值/SD/RMS/范围/缺失/峰值频率；CSV、JSON 摘要；本地记录事件回放与分析 | `src/PhysioDBAnalysis.jsx`、`src/analysis/physioDBWindow.js`；真实 DB 回读 500 个样本，250Hz，10Hz 探针峰值估计 9.765625Hz；`../artifacts/pf-redesign-2026-10-09/live-analysis-verification.json`、`live-analysis.csv`（501 行含表头）；缺失和不规则采样不误算频谱的单测通过 |
| 文字和按钮适配不同分辨率 | 窄屏/低高度改纵向滚动；按实际工具栏高度分配区域；中等宽度属性面板下移；长文字/按钮换行、弹窗限高可滚动 | 12 种 CSS 视口：320×568、375×667、568×320、640×480、683×384、768×540、911×512、1093×614、1366×768、1920×1080、2560×1440、3840×2160。步骤按钮指针可达、主要页面文字与按钮、6 类参与者/工具栏场景通过；中文/日文页面及深色主页检查通过。日志 `../artifacts/responsive-2026-10-09/` 与最终质量日志 |
| 用 Markdown 保存上下文 | 持续上下文、方案、接入手册和本验收报告均在工作区 | `PF_CONTEXT.md`、`PF_REDESIGN_2026-10-09.md`、`PHYSIODB_INTEGRATION.md`、本文件 |
| 保留既有协议、记录和运行能力 | 双视图共用同一协议；重排保留配置和端口；冻结禁止改动；旧 Block/Trial 读取/运行保留；本地保存失败与正式存储权限继续阻塞/可重试 | 477 项单元测试；旧协议浏览器完整保存 8 个事件；重构浏览器冻结/追加/重排/Undo、恢复和保存检查。未删除用户已有协议/会话或正式 DB 记录 |

## 最终验证

- `npm run quality:release`：退出 0，477/477 单测、生产构建、零警告 lint、旧协议浏览器、重构浏览器、公开参与者浏览器均通过。当前运行结果保存于 `../artifacts/pf-redesign-2026-10-09/completion-quality.log`。
- `npm run test:button-overflow`：6 类场景 ×12 种视口，无溢出发现。
- `uv run --project tools/physiodb python tools/physiodb/test_bridge.py`：1 项通过。
- `tools/brainflow/.venv/bin/python tools/brainflow/test_agent.py`：3 项通过（合成板软件接入，非重新测试真实硬件）。
- 真实 SDK 请求验证、幂等重复核对、当前 UI 上传/回读、真实数据分析均已完成，测试对象保留用于复核。
- `node scripts/check-docs.mjs`：73个Markdown、249个本地链接、71个源码引用、60个npm命令，导航与引用检查通过；`git diff --check` 通过。

## 使用与边界

普通界面开发用 `npm run dev`（5174）；真实 API 集成用 `npm run desk`（8787，当前本机已运行）。PF 管理入口的访问密钥由本机服务验证角色和租户，再由服务端使用 PhysioDB 凭据请求远端；不是浏览器本地假登录。私人配置文件被 Git 忽略，DB 密钥不出现在源码、Markdown、截图或验证日志。

当前交付包含直接 API Test Run 和显式原始录制上传；正式实验仍保留原始录制在采集电脑，管理员显式上传并核对。尚无正式数据自动离线上传队列。双屏监控基于同源、同浏览器 BroadcastChannel，未提供跨电脑远程采集控制。每次 SDK RPC 启动独立 Python 进程，时间窗分析最多5分钟；不是持续高频采集 worker。

这些边界已明确呈现在接入文档与软件中，不将合成信号称为真实设备采集，不把软件检查称为硬件时间精度或真人可用性证明。Windows DPI/WebView2、所有自定义实验屏幕、生产多节点部署和新版安装包发布没有由本轮检查覆盖。用户未要求本轮发布、提交或删除测试对象。

结论：本轮原 PF 修改重构、官方客户端接入、真实 Test Run、角色分离、设备软件接入与分辨率适配已完成并验收；以上真实使用边界保留。
