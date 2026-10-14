# PhysioDB 官方客户端接入

更新：2026-10-14（Asia/Tokyo）。

PF 浏览器通过 `/v1/physiodb/rpc` 调用 PF Hosted 服务；Hosted 使用 `uv` 运行官方 Python `ApiClient`。SDK 固定到 `f844fcf3c55afc5280b812e73ccc53c1ad0bd22c`，依赖记录在 `tools/physiodb/uv.lock`。不复制 SDK，也不在浏览器配置 PhysioDB token。

## 安装与配置

安装 Python 3.12+ 和 uv，然后执行：

```sh
uv sync --frozen --project tools/physiodb
npm run build
```

保留 Hosted 原有的 `PHYSIOFLOW_ACTORS_JSON`、`PHYSIOFLOW_CREDENTIAL_KEYS_JSON` 等配置，额外设置服务端环境变量：

```sh
export PHYSIOFLOW_PHYSIODB_ACTORS_JSON='[{"actorId":"lab-owner","tenantId":"default","baseUrl":"https://physiodb.jmessk.net","token":"REPLACE_WITH_PHYSIODB_API_TOKEN"}]'
# 当服务环境 PATH 中找不到 uv 时，配置其绝对路径
# export PHYSIOFLOW_UV_COMMAND=/absolute/path/to/uv
npm run hosted:serve
```

`actorId` / `tenantId` 必须与 PF Hosted 管理员匹配；PF `owner` 才能调用数据库接口。未设置租户的 PF actor 属于 `default`。每个管理员/租户分别绑定数据库凭据，不能复用其他租户的配置。环境变量不要提交到 Git；Markdown 不保存真实 token。

实验室内可将 `baseUrl` 改为 `http://physiodb.dlab.ise.shibaura-it.ac.jp`；学外使用 `https://physiodb.jmessk.net`。两者是同一个测试实例。Console 始终使用 HTTPS 地址。URL 自动规范化为 `/api/v1`，不从浏览器请求接受数据库 URL。

## 三个入口

- `/`：研究者工作区，设计和管理 PF 实验。
- `/admin`：PhysioDB 管理与监控。输入 **PF 管理员 token**，连接后选择研究、实验、参与者，自动列出数据流，点击记录读取时间窗。显示样本数量、字段和最近最多 50 个事件。手动刷新，当前没有实时 SSE。
- `/participant`：既有的独立参与者执行入口，使用 Hosted launch link。没有管理员设置或数据库 token；参与者凭据没有数据库 RPC 权限。

入口采用 React lazy 加载，参与者不会初始化研究者工作区。数据库访问权限由服务端检查，不依赖界面隐藏。

## BrainFlow 上传

从监控表选择已有 stream 作为上传目标，提供 `samples.jsonl` 和通道映射。上传前检查完整记录，再向 SDK 获取 stream 并验证 experiment、participant、字段顺序、float 类型和单位。样本按批上传；官方 SDK 使用 gzip。失败写入不自动重试，保留已确认批次及不确定批次信息。上传完成后手动刷新监控表。

RPC 允许读取 me、researches、experiments、participants、streams、stream、samples、events，及 createStream、appendSamples、createEvent。未开放删除、成员权限操作及任意 HTTP 代理。SDK 每个 RPC 创建独立进程，30 秒 HTTP 超时、45 秒进程上限；适用于当前监控/批上传，持续高频采集应后续改成长驻 worker。

`src/physioDBClient.js` 保留为既有直接 HTTP 合约测试参考，当前生产 UI 已使用 `physioDBServiceClient.js`。历史 BioDB JWT 集成属于另一个服务，未冒充新版 PhysioDB。

## 验证与边界

```sh
npm test
npm run build
npm run lint -- --max-warnings=0
uv run --frozen --project tools/physiodb python -m unittest discover -s tools/physiodb -p 'test_*.py'
```

官方 SDK 的网络请求和模型校验已使用本地测试 HTTP / MockTransport 验证。真实测试实例 `/api/v1/me` 匿名 GET 返回 401；随后使用用户提供的真实 API token，通过 PF Node 桥接和官方 SDK 完成认证及目录读取：账户已启用、角色 member，可访问 2 个研究、2 个实验、3 位参与者和 5 条数据流，样本计数合计 601,337。本轮另对示例 CPU 流读取了 9 个原始样本并完成统计；没有写入数据。凭据已配置于 Git 忽略、权限 600 的本机配置文件，常驻本机实验台已接通。

PF 会话仍由原 Hosted 服务保存；本次提供独立数据库监控和显式原始记录上传。已提供 PF session 与 PhysioDB 目标的持久绑定及完成后显式逐事件同步；自动实时同步、离线自动补传、跨电脑实时监控尚待实现。当前已有独立双窗口监控及有限时间窗的数据回读图表。

官方来源：[客户端](https://github.com/enjoydolylab/physiodb-client-python)、[服务端文档](https://github.com/enjoydolylab/physiodb/tree/main/docs)。

## 本机实验台

```sh
npm run build
npm run desk
```

打开 `.physioflow/local-desk/admin-access.txt` 中的私密链接并点击连接。此文件是 PF 管理员访问链接，不可分享；数据库 token 保留在服务端。此次已完成本机配置，无须重新输入 token。 `/operator` 从 Composer V2 实验准备页打开，须使用同浏览器 profile，实验窗口移至参与者屏幕。

设备检查读取服务端 `PHYSIOFLOW_DEVICE_SOURCES_JSON`，每条配置包含 actorId、tenantId、kind（brainflow/koguchi）、baseUrl（仅 origin）和 token。与当前管理员匹配后，仅固定 GET `/monitor` 或 `/api/snapshot` 可读；未提供采集开始/停止代理。本机 actorId 为 local-operator、tenantId 为 default。实际硬件采集配置仍由现有 BrainFlow agent 或前辈系统负责。

数据分析每次读取最多五分钟/100000 样本。缺失值保留，规律采样且完整的通道才估计频谱。原始数据不变；CSV 导出对应选择的处理方式，JSON 摘要记录数据来源、对象、请求时间窗与处理方式。初始窗从 stream 创建时间开始，仅作为定位起点；无样本时需要按真实录制时间调整。

## 会话持久绑定与权限边界

管理员选择数据流后可展开“会话数据库绑定”。从本地 Composer V2 准备页“会话标识”复制 session ID、protocol ID 和版本；保存前会通过官方 SDK 验证数据库对象归属。文件保存于 Hosted stateFile 后缀 `.physiodb-bindings.json`，文件权限 600，原子替换。记录按租户与管理员隔离，参与者/viewer 没有读写权限。重复保存相同目标幂等，修改已有会话目标返回冲突；这是为后续同步准备的目标登记，当前不会自动上传事件或样本。

公开参与者入口只呈现参与者流程，不能通过快捷键打开操作员工具。涉及必需硬件的实验请在采集电脑本地 Composer V2 准备并运行，再将刺激窗口移到参与者屏幕；尚未提供公开入口的跨电脑采集授权。正式 BrainFlow 实验要求更新后的 agent 回报原始录制已开启，且采样率与 connector 一致。

## 原 PF 的数据库 Test Run（2026-10-07）

在原 Composer 的 Preview run 准备页开启“使用 PhysioDB 验证测试运行”，填写 PF 操作员 key。可先在实验台登录，再返回实验；当前标签页保留 PF 连接。开始时创建 `[PF TEST]` 独立研究、实验和合成参与者。完成页自动上传并回读，显示匹配计数及读回波形；报告随本地会话保存，在“实验记录”详情中继续查看。

无设备样本时使用 500 点模拟信号验证真实 API。有设备时只上传数字预览，BrainFlow 按实际采集时间记录；不等同完整 raw 入库。最多 5 分钟、20000 样本、17 流及1000运行事件。运行事件归入单个 `physioflow.test_run` DB Event 的 data.events，严格核对内容与顺序。

新增官方 SDK createResearch/createExperiment/createParticipant 操作，无删除或权限管理。服务端测试日志在 stateFile 后缀 `.physiodb-test-runs.json`，写入前记录 intent；未知结果只能先回读核对，不盲目重写。关闭/中断会保留独立测试记录。真实 API 和原 PF 浏览器流程均已通过合成测试；正式入库仍使用原有显式上传流程。

## 新版兼容性推进（2026-10-14）

对照服务端 `a9a83d1`，参与者改为 Research 内唯一 `code`，不再提交或显示 `name/email`。隔离测试运行使用 `pf-test-<runId>`；恢复未知创建结果时也按 code 查询。官方 SDK 已更新并锁定到上述提交。

本地验证包括参与者创建请求与响应、gzip 样本、24 项 Node DB 测试，以及全量测试、构建和 lint。它们不代表当前线上实例已经部署相同版本；真实服务器闭环仍需单独验证。

## 正式运行显式同步（2026-10-14）

管理页选择 Research、Experiment 和参与者后，可选择已完成的本地 Graph session，点击上传并核对运行。会话携带自己的设计快照，事件逐条入库；独立响应记录作为 `physioflow.response_recorded` 事件保存，包括被替代的回答。参与者数据库目标由管理员选择，不根据姓名自动匹配。

也可导入运行上传 JSON：`sessionId`、`protocol`（含保存版本）、`destination`、`streams`、`events`。Stream 包含 `name`、固定 `fields`、`samples`、可选 `metadata`；样本必须是真实录制转换结果，禁止用浏览器数字预览代替 raw。目标采用界面当前选择，上传前显示运行、事件数和样本数。当前单次文件上限 9 MiB、100000 样本、32 流、10000 事件，超出需要后续的完整录制分段同步；既有 raw 独立上传功能仍保留。

`POST /v1/physiodb/runs` 显式同步，`GET` 获取当前管理员/租户的状态。服务端 `.physiodb-runs.json` 原子保存设计快照、上传内容与操作日志，权限 600。样本每批 500 点；未知写入结果只读回核对，不自动重复写入。重新提交相同文件可恢复已确认部分；更改设计、目标、已有事件或样本会冲突；可在原有数据流列表之后追加新的流，用于事件先入库后补充原始信号。状态核对时间表示上次回读结果，并非持续监控。

本机隔离的最新版 DB（a9a83d1）与 TimescaleDB 完成真实 HTTP/SDK 测试：短 Graph 流程 1200 个模拟样本、10 个事件，重复运行隔离、丢失已提交响应后恢复、重启后幂等均通过。日语浏览器另验证本地会话答案和完整运行文件上传。未访问生产研究数据；此证据不是实际设备或真人试用结果。

复现入口：`scripts/verify-physiodb-live.mjs` 与 `tests/browser-physiodb-runs.mjs`，仅连接 127.0.0.1:18080，并要求 `PF_VALIDATION_CREDENTIAL` 指向隔离凭据文件。凭据不写入报告。

## 完整 raw 分段同步（2026-10-14）

管理页的“附加完整原始记录”选择已核对运行、samples.jsonl、记录名称与明确的通道映射（行号、字段名、单位）。客户端逐行检查整份文件的序号和微秒时间连续性、计算文件 SHA-256，再按500点发送；保留原始值与顺序，不使用预览数据或插值。原始文件不受运行 JSON 的9MiB/100000点限制。

接口 `/v1/physiodb/recordings` 列出当前管理员/租户的记录；`/begin`、`/append`、`/finish` 均 POST。目标与设计溯源来自已核对运行，客户端不能另外指定数据库目标。服务端每批最多5000点，固定源文件哈希、字段、总数和时间边界。`.physiodb-recordings.json` 原子持久保存：确认批次仅保留哈希、范围、数量；待核对批次暂存样本。未知写入只回读，不重写；确认前不前进offset。结束时逐段重读，并检查全流sample_count。

停止在当前请求返回后生效，保留已确认数据。重新选择同一文件、记录名和映射可跳过已确认批次、核对不确定批次并继续；变更源文件或映射会被拒绝。管理界面重新打开仍可查看持久状态。

真实隔离 TimescaleDB 验证：52,883,924字节合成raw、100501点、402秒、21次写入，提交响应丢失后重启恢复与全量回读通过；确认日志4586字节。证据 `artifacts/db-progression-2026-10-14/live/long-result-1791910715271.json`。日语浏览器验证10001点JSONL途中停止并续传，最终回读通过。所有这些信号均为合成数据，不能代替真实设备与真人试用。

## 按运行回看与前辈采集代码（2026-10-14）

管理页按run_id筛选数据流和事件，分页浏览完整时间线，可只看回答并搜索题目或备注。`GET /v1/physiodb/runs/<sessionId>` 返回当前管理员/租户的设计快照、版本和核对报告；事件与样本仍从DB读取，不以缓存报告冒充实时回读。保存的设计恢复节点/题目标签，回答零值、被替代回答与超时元记录均保留。

当前用户没有正式设备。已有前辈采集代码支持 OpenBCI GUI UDP 与 myBeat SDK；PF仅复用其快照接口，不接管其采集控制。`tests/browser-koguchi-monitor.mjs` 启动实际原代码的强制mock模式，验证四路EEG、ECG预览、模拟标识和本地CSV保存。监控快照缺少可靠原始采样时刻，波形以样本顺序显示；myBeat ECG用源值显示，不推算心率或校准电压。前辈UDP监控CSV使用主机接收时间，不能视为OpenBCI原始板载时间记录；正式分析仍需保管GUI原记录和marker。

### 按运行导出研究数据（2026-10-14）

管理侧选择一次运行后，可在「実行タイムラインと回答」面板点击「この実行をエクスポート」。导出前重新读取该运行保存的设计及目标参与者的 DB 事件，不受当前搜索、仅回答筛选或分页限制。ZIP 包含 events.jsonl、events.csv、responses.json、responses.csv、protocol.json、manifest.json；CSV 带 UTF-8 BOM，保留数值零及负值，文本公式前缀转义。回答 JSON 保留原记录，包括替换历史。manifest 记录目标、设计来源、读取时间、数量及各数据文件 SHA-256；lastVerification 是此前同步验证报告，不代表此次重新验证全部原信号。原信号继续从信号导出功能单独取得。

导出检查保存设计指纹、事件设计版本、唯一 DB ID 和运行序号；异常时显示错误，不生成混合设计的分析包。此功能在源码及本机构建中已加入；此前交付 ZIP 不包含本次增量，重新打包后方可分发。
