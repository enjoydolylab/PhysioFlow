# PF 持续开发上下文

## 2026-10-12：Web研究试用包准备完成

用户明确选择Web研究试用包。beta.7源码提交85eeeb5，版本配置统一，Web包740651字节，SHA-256 40e59f41f2263ef3476c6bb7dfe353d9c849f3ebc24d08aeec51f58669dec60b，BUILD_INFO来源干净。481项测试、构建、零警告lint和四套浏览器通过；通过包内start.py实际试跑创建/保存/参与者/暂停恢复/导出/重开读取。40视频均为LFS指针，OID与设计一致，原字节需素材持有人取回；明确不作为正式实验或Windows实机证明。beta.6制品保留，不发送第三方或推送远端。详见[Web交付记录](DELIVERY_WEB_beta.7.md)。


## 2026-10-12：交付前验收继续进行

最终范围澄清与验收：用户提供 /Users/mac/Downloads/学術変革 experiment.protocol-graph (1).json，明确只有设计没有结果。之前要求真人签收/正式时长/Windows结果作为本轮软件验收阻塞，超出了已有设计的验收需要，不再沿用。实际Dashboard文件导入、210步骤、属性编辑撤销、图视图、保存图和素材身份/校验值完整保留、缺失视频检查通过，原文件不改动。设计图与完整离线样例完全相同，1080回答模拟执行证据有效。当前源码软件验收完成；真实研究和目标平台仍未验证，不宣称正式实验或安装包发布完成。证据 user-design.json、user-design-browser.log、user-design-editor.png；下文等待资料状态为历史。

最新终态：第六轮完整离线验收已退出0，481单测、构建、零警告lint与四套浏览器发布门禁通过（current-quality.log）。210节点/1080回答、合成设备重连恢复、原始值时间戳及标记、852样本本地HTTP传输与失败取消超时通过。下文“运行中”是历史时点，以本段及验收报告当前结论为准。完整交付仍待真人可用性、正式时长及目标Windows证据，异步询问已发出，尚无答复。

本轮目标覆盖原始定位、可视化编辑、组件扩展、稳定性、可用性和实验全流程，不以管理端单批修改代替完整验收。478项测试、构建、零警告lint和三个浏览器套件通过；新增实际管理窗口到运行时再到会话记录的浏览器场景，以及12视口溢出检查通过。已补管理端带原因重试/跳过、观察备注、操作回执和旧节点操作拒绝，循环实验完成次数与定义步骤数分开显示。

当前细分证据和未完成项见 [交付前验收](DELIVERY_ACCEPTANCE_2026-10-12.md)。管理备注的复核/导出已追加真实浏览器验收：复核列表显示观察和跳过原因，完整包CSV保留三类记录、JSONL备注无重复，日志review-browser.log。复核列表已实现，读取会话失败增加错误提示。自定义示例组件已完成编辑端安装→工具箱插入连线→标签编辑→保存→实际参与者运行→导出，新增test:e2e:sdk发布门禁。发现并修复示例按钮未绑定actions的交互缺陷，验证pressed=true和快照保留版本化组件包。第三方包导入补上结构校验，错误不再抛类型异常；失败保留权限卡片、冻结时禁止安装。浏览器新增实际文件导入、权限勾选和重复安装失败保持项目不变的场景；新增畸形JSON回归后共479项。最终门禁日志final-quality.log。设备连接器同类导入问题已修复，实际文件导入及权限/重复安装浏览器场景通过，480项单测、构建和lint通过。离线扩展验收输出到delivery-acceptance-2026-10-12/offline，第一轮210节点、40刺激、120问卷/1080回答核对通过，随后缺BRAINFLOW_PYTHON停止。已验证项目Python环境并补测试前置检查及失败终态记录，完整重跑已启动；终态以REPORT.json为准，第二轮结构通过（100.711秒加速），设备段旧测试未等待信号就期待自动开始而失败，页面确认4通道250Hz录制/接收正常。已按实际准备流程补等待receiving和再次开始，第三轮初始连接/运行通过，但暴露真实重连缺陷：采样已失败时session.status仍connected，begin复用分支误跳过重连。已要求deviceStatus.connected===true才能复用，第四轮重连及原始值/时间戳/标记、无令牌导出核对通过；随后旧上传测试寻找已移除的地址/令牌框失败，改为按当前client属性注入本地HTTP契约客户端，保留UUID绑定及真实文件上传，第五轮另发现恢复按钮读取空信号缓存而提前可用，恢复后即自动暂停；本地按钮改为实时checkPreflight与点击时复核，与独立管理窗口一致。第六轮全套运行中；SDK编辑字段/事件列表加强校验，481项单测通过。第三轮日志offline-third-attempt.log。文件导入成功后SDK完整运行/导出也通过。不能提前宣告全部通过。真人任务记录、正式长时实验和目标平台验收缺本轮证据，完整目标尚未完成。未发布安装包或删除现有记录。

## 2026-10-11：GitHub 源码同步

用户授权全部推送至 GitHub 并更新文档。当前分支 `codex/lab-handoff-20260924` 跟踪 `lab/main`，目标仓库为 `https://github.com/enjoydolylab/PhysioFlow`。本轮提交包含此前累积源码、测试、合成演示、说明与非敏感验收制品。私人 `.physioflow/` 配置、Python虚拟环境、构建目录及原始录制继续忽略，不提交凭据。README和实现状态已更新，明确最新源码与旧beta.6安装包的区别。提交前重新运行完整质量检查和文档引用检查；具体结果见GitHub同步记录。本轮不发布安装包。

## 2026-10-09：使用指南与首次引导重构

用户澄清“导入”指系统使用说明与操作指导，不是 JSON/素材导入。原首次引导不再以浮动箭头指向旧区域，改为“设计→检查→运行→查看结果”，提供创建空白实验、打开真实情绪模板、浏览工作区；沿用原创建和保存逻辑。

内置帮助默认显示四类任务：创建编辑、参与者与设备、运行与数据库、记录分析；每类提供四个操作步骤及状态说明，正文支持中文/日文/英文。旧节点/数据格式/存储参考保留。首页顶部和 Composer 均提供指南入口，空白编辑器显示下一步提示；Graph 准备页帮助直接定位参与者与设备任务。

帮助支持 Escape 关闭、Tab 焦点循环及关闭后焦点恢复。首次引导与帮助可滚动换行，修正新增帮助按钮后683×384/640×480更多菜单越界。浏览器回归验证首次引导、任务切换、保存与DB验证区分文案、Escape关闭、12种视口以及原编辑/统一准备/信号重连/保存/记录分析路径，退出0；build、零警告lint、文档引用检查和 git diff --check 通过。证据位于 `artifacts/user-guide-2026-10-09/`。

本轮未改用户项目、会话或DB数据。此轮完成使用引导改进，不等同于真人可用性评估或全部产品视觉最终定稿；后续按实际操作反馈继续收敛页面。

最后更新：2026-10-09，Asia/Tokyo。

## 当前状态（优先于下方带日期的历史记录）

本轮原 PF 修改重构已完成验收：统一工作区与记录分析入口、步骤/图双视图、同页管理员准备/真实信号检查、参与者角色隔离、官方 SDK 真实 API Test Run，以及12种视口适配。完整需求证据与边界见 `PF_REFACTOR_ACCEPTANCE_2026-10-09.md`。477项单测、build/lint、三个浏览器套件、SDK Python 1项与 BrainFlow Python 3项测试通过。原 PF 当前构建 UI 的真实测试记录 `PF_UI_REFACTOR_20261009` 已本地保存且 DB 回读500/500样本、2/2事件一致；测试对象保留。数据库读取还通过500样本/250Hz的统计与频率分析，CSV导出501行。

用户确认实机与前辈系统基础验证完成；本轮验证PF的软件接入，不重跑硬件精度测量。正式原始录制仍由采集电脑保留并显式上传；无正式自动离线入库队列、跨电脑采集控制或新版安装包发布。私人凭据不在文档中，现有协议与记录不删除。真实API运行用 `npm run desk`（8787），纯UI开发用5174。后续读取本节与最新验收，避免把历史“尚未实现”重新当作当前待办。

## 用户目标与偏好

继续推进 PhysioFlow（PF），正式接入 PhysioDB API，使用 DB 官方 Python 客户端重构，分离管理员监控、研究者设计与实验参与者界面。使用 Markdown 保存上下文，后续继续工作时先读取本文件和 `PHYSIODB_INTEGRATION.md`，完成新工作后更新进度和证据。

## 来源与接入约束

- 佐々木孟提供官方客户端：https://github.com/enjoydolylab/physiodb-client-python。
- SDK 使用 uv，Python >= 3.12。当前锁定 commit `d34e07c5cb0010c7e526af70cb361aa085b4c1a8`，依赖 httpx2、Pydantic；Async ApiClient 是官方 HTTP 边界。
- 服务端文档：https://github.com/enjoydolylab/physiodb/tree/main/docs。工作区旁 `../physiodb-main/docs/` 有本地参考，但不是 Git checkout。
- Console/学外 API：https://physiodb.jmessk.net。实验室高速 API：http://physiodb.dlab.ise.shibaura-it.ac.jp，仅实验室网络可达。两者同实例，测试数据可能重置。
- 用户粘贴的 Slack 消息是参考，不代表给其他成员发送消息的授权。

## 架构决定与本轮改动

1. 保留现有 React / Node Hosted 架构。官方 SDK 仅在服务端运行，不将数据库管理员凭据交给参与者。
2. `/` 研究者，`/admin` 数据库管理监控，`/participant` 独立参与者。main.jsx 按入口 lazy 加载，Hosted 静态服务支持 admin 路由。
3. 新建 `tools/physiodb/{pyproject.toml,uv.lock,bridge.py,test_bridge.py}`。官方依赖固定版本，uv sync 安装完成，.venv 忽略。
4. 新建 `server/physioDBBridge.mjs`；以 stdin/stdout JSON RPC 调用 SDK，操作白名单、超时和输出大小限制，不暴露 SDK stderr。
5. Hosted `/v1/physiodb/rpc` 仅允许 PF owner（audit.read 权限）。数据库配置以 tenantId+actorId 绑定，未配置返回 503。环境变量 `PHYSIOFLOW_PHYSIODB_ACTORS_JSON`，不在状态文件写 DB token。
6. 新建 `src/physioDBServiceClient.js`、`src/AdminMonitorPage.jsx`。管理员读取研究、实验、参与者、streams、events，手动刷新样本数量。上传组件改用服务端 SDK client，并支持从表格选择目标。
7. Dashboard 移除直接上传组件，改为 admin 链接。旧 PhysioDB HTTP 模块保留作为合约参考；旧 BioDB JWT 功能仍保留，与 PhysioDB 区分。
8. 说明文档：`docs/PHYSIODB_INTEGRATION.md`。真实凭据不可写入本文件。

## 验证证据

- npm test：454/454 通过。
- npm run build：通过，Admin / App / Participant 拆为独立 chunks。
- npm run lint -- --max-warnings=0：通过（已补 node:timers 导入）。
- 官方 SDK Python 单元测试：1/1 通过，验证 gzip 写入、响应模型、路径与无效 UUID/非法操作拒绝。
- Node 集成测试验证 owner 权限、跨租户拒绝、未配置拒绝、白名单与 admin/participant 静态入口。
- 实例匿名 GET `/api/v1/me`：401，说明地址可达但需要登录凭据。
- Browser 生产构建 + 本地 HTTP 测试实例 + 真实官方 SDK 进程：管理员登录、选择研究/实验/参与者、读取 120 样本 stream、填充上传目标验证通过。截图保存于 artifacts/physiodb-integration-2026-10-04/admin-monitor.jpg。
- 官方 SDK 对真实 HTTPS 实例使用无效合成 token 的只读连接探测：HTTP 401；没有使用真实凭据或写入数据。

## 真实凭据验证（2026-10-04）

- 学外 HTTPS 实例，通过 `createPhysioDBBridge` 调用锁定版本的官方 Python SDK。
- `/me` 认证成功，账户 active=true、PhysioDB role=member。这与 PF Hosted 的 owner 管理角色属于不同权限体系。
- 可访问 2 个研究、2 个实验、3 位参与者、5 条 streams；返回 sample_count 合计 601,337。
- 仅读取目录及计数，没有读取原始生理样本，没有写入/删除数据库对象，也没有改变成员权限。
- 实际 token 不可写入上下文；不得在后续回复中复述。

## 待办与真实限制

- 用户于 2026-10-04 提供真实 API token，已完成官方 SDK + PF Node 桥接的真实认证和目录读取。此前只在验证进程使用；本轮已配置到 Git 忽略、权限 600 的 `.physioflow/local-desk/credentials.json`，用于本机实验台。真实 token 不进入源码、Markdown 或日志。
- 真实入库及样本回读尚未验证。不要对现有研究记录执行测试写入；后续应创建独立合成测试对象，验证明确的 experiment/participant/stream 绑定和回读。
- 本次不是 PF 自动数据库同步完成版：protocol/session 与 PhysioDB 的持久映射、运行事件同步、离线队列、冲突/幂等与恢复还没有实现。
- 数据库目录手动刷新、设备监控只读轮询，无 SSE；当前每个 RPC 启动 Python 进程，高频采集要长驻 worker。
- 上传到已有 stream；新建 stream 的 RPC 已提供，管理员 UI 尚无创建向导。
- 实验台主要流程已补齐中日英三语；历史上传/运行完成诊断仍有英文。
- 未部署、未创建 commit/PR。

## 工作区保护

开始本轮前仓库已经有许多未提交修改及 untracked 文件，涉及 BrainFlow、问卷 checkpoint、group sequence、样式、demo、测试及 docs。不得 reset/清理或将它们误认为本轮独占改动。Dashboard、.gitignore 本轮也修改了，必须保留原有修改。

## 实验客户端 UI / 信号 / 分析推进（2026-10-04）

- `/admin` 改为准备、信号检查、数据与分析三步实验台；高级配置和上传折叠，独立 lazy chunk。
- Composer V2 实验准备页增加连接及信号检查；必需通道检查有限值、数量、3 秒新鲜度及平直信号。正式模式拒绝模拟设备，必需信号失联自动暂停。旧 Runtime 不具备此次新增门禁。
- `/operator` 独立监控窗口显示步骤、进度、checkpoint、信号和预览，允许暂停/恢复；BroadcastChannel 仅支持同源同浏览器 profile 的双窗口。未实现跨电脑监控，链接仅从实验准备页生成。
- 参考前辈源码 `../研究室DB相关打工/imgNoBio_long_physiodb_connect_lab-pr/src/monitoring/admin_server.py`；PF 仅代理其 GET snapshot，不调用采集控制。BrainFlow agent 新增被动 `/monitor`，不接管或延长采集租约。配置设备源后才可使用，当前没有真实设备连接。
- PhysioDB 分析：最多 5 分钟/100000 样本，实际时间波形、原值/去均值、均值、SD、RMS、极值和有条件频谱峰值，CSV 和含来源时间窗的 JSON 导出。缺失不插值，不修改 DB。
- 真实 SDK 只读时间窗测试：示例 CPU 流直接 SDK 读出 9 样本，随后经本机 Hosted 服务读取 60 秒窗得到 29 样本并完成统计，非均匀时间戳不计算频谱；EEG 流所选窗为空，不声称生理数据分析已实机验收。没有新增写入/删除。
- `npm run build && npm run desk` 启动本机实验台；私密 admin-access.txt 可用于首次连接。数据库 token 只在服务端。
- 验证：462 单元测试、lint、构建通过；Composer/Hosted 和公开参与者浏览器回归通过，包含 8 种宽度布局检查、刷新恢复和问卷场景。Python SDK 1 项、BrainFlow agent 3 项通过。
- 实际 EEG/myBeat 联调、自动 DB 会话映射/事件同步、离线补传与明确目标的真实上传回读仍待完成。

## 下一轮：权限分离、检查门禁、持久映射（2026-10-04）

- 公开 `/participant` 明确设置 participantOnly；禁用操作员快捷键和 BroadcastChannel 监控，准备页不显示会话标识/设备 token，完成页不显示技术诊断、导出或返回工作区。保存异常只给出保持窗口及联系管理员提示，可安全重试保存。
- 必需硬件实验不通过公开 launch 页连接本地设备；须使用采集电脑上的本地 Composer V2 准备/运行路径。跨电脑管理员控制与采集授权尚未实现，不能把这个阻断误记为远程硬件流程完成。
- 正式门禁校验所有必需 connector 是否存在、连接与信号是否有效；BrainFlow 额外校验 agent 实际采样率与协议一致，并确认 recordingActive。模拟 board 禁止正式运行；练习仍可使用。心率 bpm 单值允许稳定，EEG 平直仍阻断。这些检查不认证电极阻抗或临床信号质量。
- BrainFlow `/status`、`/attach`、被动 `/monitor` 返回 recordingActive；需重启更新后的 agent。现有 mock/旧版 agent 没有录制确认时，正式运行被阻断。
- 新增 owner-only GET/PUT `/v1/physiodb/bindings`，私有文件 `state.json.physiodb-bindings.json` 原子持久化，按 tenant+actor 隔离。绑定 sessionId/protocolId/protocolVersion → research/experiment/participant/streamIds。已有 Hosted session 验证租户和协议版本；本地会话 ID 由管理员输入，不表示服务端验证其本地存在性。
- 保存前使用官方 SDK 验证可访问 research、实验和参与者归属及 stream 的 experiment/participant/deleted 状态。绑定幂等；同一 session 改绑其他目标返回 409，避免不同实验混写。没有自动同步或修改 PhysioDB。
- `/admin` 选择数据流后展开“会话数据库绑定”，填写本地准备页折叠标识中的会话/方案/版本，验证保存并查看历史绑定。当前一轮可选一个 stream，API 支持最多 32 个。
- 新增权限、参与者拒绝、跨租户、目标归属、改绑冲突、并发幂等、重启回读及正式门禁测试。全套单元 467 项，Composer/Hosted 与公开参与者浏览器回归通过，lint/build 通过，BrainFlow agent 3 项通过。
- 本轮未写入/删除真实 PhysioDB 记录；实机 EEG/myBeat、自动事件/样本入库、离线队列、跨电脑控制仍待下轮。保持现有工作区修改，未提交或发布。

- 浏览器实测发现旧 service worker 将实验台 HTML 永久缓存，已改为在线优先导航；授权/API 请求绕过缓存，离线只回退对应页面。新增 worker 回归测试，避免更新后仍显示旧权限界面。

## 原 PF Test Run 接入真实 DB（2026-10-07）

- 用户明确要求“直接接入 DB API 进行 Test Run”，授权建立并保留隔离的测试记录。没有修改/删除先前的研究数据。
- 原 Composer V2 Preview run → 原 GraphSessionSetup 内新增 PhysioDB 验证选项，不要求跳转到独立实验台。已连接管理员时或本机 desk 8787 默认开启；其他部署可手动开启。使用 PF 操作员 key，真实 DB token 始终在服务端。
- 开始时通过官方 SDK 创建每次会话独立 `[PF TEST] <runId>` research/experiment 和合成 participant（example.com 邮箱，不发送邀请）。正式模式不运行这条测试管线。中途退出会保留已创建的空测试记录，不自动删除。
- 完成并保存本地记录后，在原完成页上传数字设备预览；没有设备样本时生成明确标记的 250 Hz / 500 点合成 probe。仅验证传输/读写链路，不冒充真实 EEG。BrainFlow 使用设备采集时间，其他连接器使用接收时间；毫秒时间碰撞、非数字样本会阻止上传，保留原本地数据。
- 运行事件保存在一个 `physioflow.test_run` DB Event 的 data.events 中，包含原 eventId、eventType、nodeId、时间和 payload；不是逐条创建 DB Event。数据流和事件均有 physioflow_test/runId/source 标记。
- 新增 owner-only POST `/v1/physiodb/test-runs/prepare`、`/complete`。journal `state.json.physiodb-test-runs.json` 权限 600 原子持久化，按 tenant+actor+session 隔离；单次最多 20000 样本、17 流、1000 事件，设备时间窗最多 5 分钟。
- 每个写操作前落盘 pending intent。重启/重试首先按唯一 run 标记或样本内容回读恢复；结果不确定且未发现完整写入时拒绝盲目重写。相同请求幂等，改变 payload 返回冲突。
- 回读核对样本数量、时间戳、每个值、stream 总数及全部事件内容。JSON 对象按内容规范化比较，修复真实 PostgreSQL JSON 字段顺序差异造成的误判。数组顺序仍严格比较。
- 原完成页显示读回波形和验证结果；完整报告保存到本地会话，原实验记录详情支持查看/再核对，列表标注数据库状态。PF key 只在当前标签页 sessionStorage 中供操作员流程续用，断开管理员连接会清除，不进入会话/Markdown。
- 真实验收：独立 SDK/API 调用创建并回读 500/500 合成样本、2/2 事件；重复请求未重复上传。随后浏览器从原 PF 首页 → 新建 Composer → Preview run → 原完成页，真实 DB 验证通过（另一个隔离测试研究），本地会话保存。证据 artifacts/physiodb-test-run-2026-10-07/verification.json 和截图。
- 现有 Composer/Hosted、公开参与者浏览器回归和官方 SDK Python 测试通过；新增幂等、重启后丢失响应恢复、JSON 顺序、设备时间及角色隔离测试。
- 边界：只整合 Composer V2 草稿测试，旧 Runtime 未接入；设备预览不是 BrainFlow 完整 raw 文件；实机硬件、断电/多进程文件锁、正式入库与后台离线队列仍未验收。失败记录保留，必要时新建测试会话；不承诺“exactly once” DB 事务。
- 最终验收：472/472 单元测试通过，lint/build 通过，两条浏览器回归通过，官方 Python SDK 测试通过。重新加载原 PF 后在原会话详情看到持久保存的 verified 报告及 500 点波形；截图 pf-history-test-result.png。修复原运行完成页在浅色模式下白字不可见的问题。

## 用户确认与全流程重构分析（2026-10-09）

- 用户确认实机与前辈系统验证已完成，直接复用相关代码。撤销“硬件基础验证仍待完成”的当前待办描述；历史记录保留原日期事实。后续关注 PF 接入后的时间/保存/回读和整体工作流。
- 用户要求先分析流程与全部 UI，提出建议和风格，本轮没有实施产品 UI 重构。
- 已检查 App、Dashboard、Composer header、sessionSetup、operator 和现有上下文。重构建议保存于 PF_REDESIGN_2026-10-09.md。
- 推荐暖白专业工具风格；优先统一项目、准备和结果，收拢分散数据入口，编辑器使用同一模型的顺序/图双视图，管理员与参与者流程分离。不能再以外围新增页面替代主流程重构。


## 主流程 UI 第一轮与响应式适配（2026-10-09）

- 用户授权推进重构，并追加“各种分辨率下文字和按钮正常显示”。本轮直接修改原 Dashboard、GraphSessionSetup、GraphRuntimeRunnerPage；没有新增前置窗口。
- 首页缩小宣传标题、压缩创建区；按更新时间选择最近项目，继续编辑/打开项目，冻结版本提供准备采集。保留原协议/版本/存储逻辑。
- 原 Graph 准备页重新分成参与者信息、采集前检查、数据保存；版本哈希与名义刺激顺序折叠，配置/媒体/保存阻塞仍可见。已配置的 PF 操作员连接默认折叠，可展开修改。正式/测试管线不变。
- 原操作员完成页显示采集完成、参与者/方案、本地保存与 DB 回读，文件统计折叠。参与者完成页继续保持独立，无管理员配置。
- 新增 pf-workflow.css；暖白/森林绿、紧凑分区、小圆角。修复中等宽度导航按钮仍占满行的问题；320px 下项目网格不再使用超出视口的 300px 最小宽度。
- 长标题/按钮/ID 可换行，窄屏创建操作为单列；实验记录字段在窄屏重新排布而非隐藏。窄屏恢复提示采用正常 sticky 排布，减少悬浮遮挡；管理员图表标题与连接列表可换行。
- 响应式验收扩展至 320×568、375×667、640×480、768×540、911×512、1093×614、1366×768、1920×1080、2560×1440、3840×2160。新增文字横向裁切检测；使用超长中日英实验名覆盖首页/准备页。
- 最终浏览器回归通过：上述 10 视口首页、原准备/完成页、记录管理、分析控件、管理员未登录连接页；首页和准备页三语文字检查通过。编辑器既有 8 视口×3 上下文回归通过。公开参与者回归通过；472 项单元测试、构建与 lint 通过。
- 浏览器可视检查确认新版首页实际加载。已有标签最初显示历史 service worker 页面，重新加载后显示新版；开发热更新 i18n 时曾出现 Context 重建错误，完整重新加载恢复。未修改浏览器数据库/历史项目。截图 artifacts/pf-redesign-2026-10-09/home.png。
- 本轮没有再次写真实 DB；原已验收 Test Run SDK 管线保留。未提交或发布。仍需后续统一编辑器工具栏、记录/分析入口，以及合并分散的管理员准备步骤。此轮不宣称全部 UI 重构已完成。
- 检查范围是 CSS 视口与现有测试内容；不是物理设备、Windows 系统 DPI 或所有已登录设备数据状态的全面验收。


## 记录与编辑器主流程收敛（2026-10-09，持续目标）

- 持续目标：完成修改重构，保持 active；不将局部界面修改视为全目标完成。
- 将 SessionManager 改为支持 embedded，在原 Dashboard 实验记录导航中显示完整列表、检索、有效性筛选、详情、审查、导出及 DB 报告。移除 App 的悬浮管理挂载，保留顶栏“管理记录”快捷入口进入同一页面；组件独立弹层模式仅保留复用兼容能力。
- 记录详情新增“分析这次实验”；分析页新增“查看保存记录”，App 保存返回页和会话 ID，返回时恢复同一份本地记录。initialSessionId 异步加载有卸载/切换失效保护。
- Composer 主操作突出测试运行/正式准备；导出和旧 BioDB 收入“更多操作”。旧 BioDB 的记录操作同样折叠，官方 PhysioDB 报告仍为原记录中的明确入口。
- Graph 首页运行不再经过额外 PreRunChecklist 弹层，直接使用已有 GraphSessionSetup 配置/媒体/存储阻塞检查；旧 Block/Trial 保留旧检查。修复准备页返回判断使用 Graph 状态 selector，而非旧协议 status 字段。
- 浏览器通过实际界面验证 embedded 记录→分析→同一记录恢复，10 种视口检查包含选中记录详情和展开编辑器菜单；构建、lint、472 项测试通过。截图 artifacts/pf-redesign-2026-10-09/records.png（当前用户浏览器该端口无已存记录；有数据路径通过独立浏览器回归验证）。
- 本轮未再次上传真实 DB，未发布/提交，用户已有协议和会话未删除。
- 完成审计仍未通过：参与者信息与运行器里的信号检查仍为两阶段界面；编辑器快速/设计/高级/代码模式未完全统一为顺序/图双视图；部分旧界面样式及数据入口仍需整合。后续继续这些工作，不重复已通过的硬件基础验证。


## 管理员统一准备页（2026-10-09）

- GraphSessionSetup 支持 renderPreparedSession，原 App 在同一准备页挂载真实 GraphRuntimeRunnerPage；运行器通过 renderPreparation 回调嵌入真实信号/连接面板，不新增窗口或模拟检查。
- 输入参与者与数据设置→确认→同页检查信号→开始实验。确认后设置锁定并折叠，参与者和模式仍可见；修改运行信息先等待采样器停止/marker 完成并断开连接，再卸载运行器以重新准备。
- 正式存储校验抽取 ensureFormalStorage，在确认准备及真正 Begin 两个时点重新读取文件夹权限。运行器 beginLock 防止并发启动；拒绝/错误显示在准备页，失败不启动运行。
- 开始后运行器直接渲染原刺激界面；管理员准备表单与 App Header 不保留在参与者刺激/完成画面。公开参与者入口继续走 participantOnly 专用路径；Hosted/恢复仍使用运行器独立准备兼容入口。
- Test Run 官方 SDK prepare/complete 链路保留；确认会话时准备隔离 DB 记录，修改信息不会删除它们，同一 session ID 准备请求保持原幂等语义。未再次写入真实 DB。
- 浏览器回归新增完整原 PF 路径：超长名称协议→参与者→同页信号→模拟连接 receiving→修改信息→重新连接 receiving→开始→完整本地保存→返回项目。检查信号本身不触发实验开始；参与者 ID 保存正确；10 视口覆盖统一准备页。
- 回归发现 createSimulatedDeviceAdapter 默认 read 的可选链使 sampleIndex++ 没有执行，默认样本一直为 0，信号被正确判 flat。已修复采样索引递增，新增默认信号变化、时间递增及断开后不能读取的测试。这是模拟器错误，不降低真实设备/正式模式门禁。
- 473 项单元测试、主流程/公开参与者浏览器回归通过，构建与 lint 通过。真机基础验证沿用用户确认；此轮新增链路以模拟设备软件回归验收，未声称重跑实机。
- 持续目标未完成：还需简化编辑器常规顺序/图编辑组织，并检查其他旧界面的主次层级；管理员统一准备已落地，不能再记为未实现。正式数据队列和跨电脑控制仍是现有边界，不以此轮 UI 验证声称实现。


## 编辑器顺序/图双视图（2026-10-09）

- 新增 composer/Sequence.jsx 与 sequenceModel.js，在同一个 Protocol Graph 上提供顺序视图。Quick 模式的完整直线协议默认顺序；用户可切换流程图/步骤。分支、logic 节点、循环、脱离路径的节点或未知控制端点保持图视图，避免隐藏复杂结构。
- 步骤点击沿用现有 Inspector、Palette 插入和 undo/redo。上移/下移重排控制连接，保留节点配置和连接 ID、每个节点原有端口；禁止把数据来源移到消费者之后，并固定 Start/End。冻结版本在 UI 和模型层都禁止重排。
- 选择 End 添加组件现在插入 End 之前，保留既有步骤顺序；原来会回退到 Start 后插入，已修正。Quick 模式媒体组默认折叠。
- CSS 以实际折行工具栏高度分配区域，641–1000px Inspector 改为下方分区，避免浮层盖住步骤和切换按钮；窄屏编辑器纵向滚动，面板有独立可用高度，取消过高 sticky 顶栏。
- 浏览器验收扩展：默认步骤视图、两个等待步骤插入、End 追加、重排/Undo、图/步骤切换后节点保持、冻结禁止调整；10 视口含文字、按钮边界及 elementFromPoint 指针可达检测，真实中等宽度截图已核对。
- 新增 4 项模型测试：复杂路径拒绝、重排保留端口/配置/ID、数据依赖与边界保护、冻结保护。477 项单测通过；最终主流程与公开参与者回归、构建和 lint 见本轮完成输出。截图 artifacts/pf-redesign-2026-10-09/sequence.png。
- 本轮没有修改用户已存协议或会话；可视检查仅打开已有空直线草稿，截图中的 Start/End 是该草稿原内容。
- 完成审计下一步：按原请求逐项核对主入口、编辑、管理员准备/参与者分离、保存/分析、官方 SDK 实际 Test Run 与分辨率，补充最新整体证据；持续目标暂保持 active，不能仅凭新增视图宣称全部完成。

- 最终本轮结果补充：477/477 单测、主流程浏览器套件（步骤追加/重排/Undo、图/步骤切换、统一准备/信号重连/保存及记录分析往返）、build/lint 通过。公开参与者 suite 一次画布 Undo 等待超时，单独重跑通过；该既有 Participant UI Builder 路径本轮未修改，保留此波动记录，不宣称修复它。
- 步骤视图的组件提示改为“选中步骤后点击插入”，关闭未实现的列表拖放提示/属性；图视图继续支持画布拖放。该文案调整经 build/lint 验证。

## 2026-10-09：分辨率适配补充

用户要求文字和按钮在各种分辨率正常显示。本轮修正低高度窗口的编辑器布局：683×384 下底部属性面板挤压步骤区域，导致按钮无法点击；现在窄屏或宽度 ≤1000px 且高度 ≤480px 时使用纵向滚动布局。低高度工作台取消固定导航，模板按钮允许换行。通用弹窗采用自适应内边距、动态视口最大高度及内部滚动，长文字和操作按钮允许换行。

验证：`npm run test:e2e:refactor-browser` 通过 12 种视口（320px 至3840px，包含683×384、568×320）；`npm run test:button-overflow` 6类场景均无按钮溢出；build及lint通过。中文、日文准备页面与主页通过文字检测；步骤按钮通过指针可达检测。实测范围为CSS视口，不代表全部操作系统DPI和浏览器组合。证据保存于 `artifacts/responsive-2026-10-09/`。用户当前5174页面已通过375×667目视检查，临时视口已恢复。

## 2026-10-09：整体完成审计

上一目标轮分类为 progress：改变分辨率布局并完成12视口验证。本轮按原始需求逐项审计，证据集中于 `PF_REFACTOR_ACCEPTANCE_2026-10-09.md`。最终 `quality:release` 退出0，477/477测试、构建、lint、旧协议/主重构/公开参与者浏览器全部通过；新增深色主页文字布局检查。官方SDK Python单测1项、BrainFlow合成板接入3项通过。

原8787页面完成真实API Test Run并在工作区记录中保存核对报告，分析→查看保存记录恢复同一会话；500个合成样本、2个运行事件一致。独立真实SDK回读500个样本完成250Hz/10Hz探针分析及CSV导出。截图、报告、CSV和最终质量日志保留在 `artifacts/pf-redesign-2026-10-09/`。原正式DB记录未改动，隔离测试记录保留。

收尾修正文档入口与当前/历史状态区分；旧BioDB方案标记历史，补齐原有文档导航遗漏。`node scripts/check-docs.mjs` 通过73个Markdown、249个本地链接、71个源码引用和60个npm命令，`git diff --check` 通过。未提交/发布。正式自动离线入库、跨电脑控制、Windows实机DPI和硬件时间精度仍如最新验收中的边界，不以当前软件验收声称实现。完整原请求的本轮软件重构已经有逐项证据，可结束持续目标；后续新需求按最新状态继续，不重做旧待办。

GitHub同步提交前验证（2026-10-11）：quality:release退出0，477/477单测、build、零警告lint及三个浏览器套件通过；文档检查73个Markdown通过。最新可提交日志保存在 artifacts/github-sync-2026-10-11/。合成CSV验收副本统一LF换行，数据内容不变。私人凭据精确匹配扫描无发现。

## 当前设备条件澄清（2026-10-14）

用户最新说明目前没有正式设备，正式设备相关代码以前辈系统为依据。历史实机验证表述不能作为本轮PF接入的实际设备验收证据。本轮启动 `imgNoBio_long_physiodb_connect_lab-main/src/monitoring` 的实际原代码，强制mock模式验证HTTP快照、PF代理、日语EEG/ECG预览与CSV保存；未执行正式设备或Windows驱动验证。正式刺激视频目录也尚未确认。

最新版DB适配、显式运行同步、完整raw分段同步、按运行回看已在源码实现。优先阅读 docs/DB_SYSTEM_PROGRESSION_2026-10-14.md 与 docs/PHYSIODB_INTEGRATION.md，避免把早期限制误认为当前实现。旧beta.7 Web发布包尚未包含这轮更新。
