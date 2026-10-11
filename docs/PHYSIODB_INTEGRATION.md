# PhysioDB 官方客户端接入

更新：2026-10-04（Asia/Tokyo）。

PF 浏览器通过 `/v1/physiodb/rpc` 调用 PF Hosted 服务；Hosted 使用 `uv` 运行官方 Python `ApiClient`。SDK 固定到 `d34e07c5cb0010c7e526af70cb361aa085b4c1a8`，依赖记录在 `tools/physiodb/uv.lock`。不复制 SDK，也不在浏览器配置 PhysioDB token。

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

PF 会话仍由原 Hosted 服务保存；本次提供独立数据库监控和显式原始记录上传。PF protocol/session 与 PhysioDB 对象的持久绑定、运行事件自动同步、离线补传、跨电脑实时监控尚待实现。当前已有独立双窗口监控及有限时间窗的数据回读图表。

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
