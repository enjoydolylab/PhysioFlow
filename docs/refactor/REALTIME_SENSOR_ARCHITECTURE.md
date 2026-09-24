# 传感器接入与实时数据通道规划

> 2026-09-18 update: local BrainFlow acquisition, HTTP batch preview and the node device selector are implemented. The missing-network-adapter findings below describe the earlier audit baseline. See [BrainFlow integration](BRAINFLOW_INTEGRATION.md). This does not implement remote broadcasting or PhysioDB sample upload.

更新：2026-09-17。目标：把生理传感器接到采集工作站，并让其他客户端能实时检查数据。本文区分现有实现与后续工作，**不代表实时通道或真实设备已交付**。设备契约见[External Device Connector Contract 1.0](DEVICE_CONNECTORS.md)，局域网与分工见[研究室局域网架构规划](LAN_ARCHITECTURE.md)。

## 结论摘要

1. 实时通道**目前完全不存在**，且没有任何脚手架。仓库内没有 SSE、WebSocket、长轮询或 `text/event-stream`。
2. 设备连接子系统是真实的（manifest、权限门禁、会话生命周期、漂移校正采样器），但**唯一可用的硬件传输是 Web Bluetooth（Muse EEG）**；`serial` / `usb` / `network` 只是 manifest 里的字符串。
3. 实时查看的**渲染端已经写好**（`src/analysis/LiveChart.jsx`，rAF 节流 + min/max 抽取），缺的只是数据源。
4. 时间对齐是比传输更难的环节，且当前是空的：`offset_ms` 等字段采集后从未被应用。
5. 实时通道不得成为实验真相来源。权威记录仍是采集工作站的本地文件。

## 一、现有实现

### 设备连接

`src/devices/deviceConnector.js` 定义 `DEVICE_CONNECTOR_SDK_VERSION = '1.0.0'`、`DEVICE_PERMISSIONS`（`device.connect` / `device.read` / `device.write`）与 manifest 校验；`installDeviceConnector` 要求每个权限显式批准，重复 `connectorId@version` 拒绝。`src/core/validateProtocolGraph.js` 校验连接器清单、重复版本、权限批准与节点引用；`uninstallDeviceConnector` 在仍被节点引用时拒绝卸载。

运行时适配器在 `src/GraphRuntimeRunnerPage.jsx` 的 `createDeviceAdapter` 中二选一：

- `transport === 'simulated'` → `src/devices/exampleSimulatedConnector.js`（确定性参考实现）；
- `transport === 'bluetooth'` 且 `connectorId` 以 `org.physioflow.muse` 开头 → `src/devices/museConnector.js`。

`src/devices/museConnector.js` 与 `src/devices/museProtocol.js` 是真实硬件代码：真实 UUID、12-bit 大端解包、µV 换算、有界逐电极队列、`halt → preset → status → resume` 启动序列，并在 Athena/Gen-3 固件上显式报错而非错误解码。`src/devices/transports/webBluetooth.js` 是全仓库**唯一**触碰硬件平台 API 的文件。

其余传输没有实现：`serial` / `usb` / `network` 的适配器返回 `null`，运行时报 "No runtime adapter is installed"。`src-tauri/` 侧没有任何 BLE/串口插件。

采样由 `src/runtime/deviceRuntime.js` 的 `createDeviceSampler` 驱动：漂移校正的递归 `setTimeout`，逐通道 `read`，每样本产出一个 `device_sample_received` 事件并追加进内存数组。`maxInputSampleRateHz` 在通道未声明 `sampleRateHz` 时默认为 10 Hz。

### 时间戳

运行事件（`src/runtime/eventEnvelope.js`）带主机时钟三元组：`timestampIso`、`timestampEpochMs`、`elapsedMonotonicMs`（相对 `startedAtMonotonicMs`）。

设备事件（`src/devices/deviceConnector.js`）带同样的三元组，外加 `payload.deviceTimestamp`。**设备时间戳与主机时间戳并列存放，从不互相调和**。`createPacketTimestampResolver`（`src/devices/museConnector.js`）在设备本身没有时钟时，用 uint16 包序号重建一个设备本地相对时钟（256 Hz 下约 46.875 ms/包，含 16-bit 回绕处理）。

会话级同步字段在 `src/app/sessionSetup.jsx` 采集：`sync_method`（`same_computer_clock` / `manual_offset` / `manual_marker`）、`offset_ms`、`device_time_column`、`device_time_format`、`timezone`、`sampling_rate`、`device_start_reference`。这些字段原样写入会话记录，并出现在 `src/exporter.js` 的 BIDS 侧车表头。

### 传输与服务器同步

Hosted API（`src/hosted/hostedHttp.js`）是纯 `Request → Response` 函数，全部路由为请求/响应，**没有任何流式分支**。

`src/hosted/hostedRuntimeSync.js` 是唯一的客户端→服务器同步引擎：按序号连续性检查后 `POST /v1/sessions/:id/events` 追加事件批次，再 `PUT /v1/sessions/:id/state` 同步整份 `runtimeSnapshot`，终止时 `POST /v1/sessions/:id/complete`。触发是**事件驱动**的——每次运行事件状态变化触发一次，没有定时器。

`runtimeSnapshot`（`src/runtime/runtimeMachine.js`）包含 `status`、`currentNodeId`、`variables`、`completedNodeIds`、`eventSequence` 等，是现成的"参与者现在在哪一步"。

服务端状态（`server/fileHostedStateStore.mjs`）是**单个 JSON 文件**，每次变更整体重写；`appendEvents` 每批次做全数组拷贝。限流在 `server/requestProtection.mjs`：`api` 作用域为 **600 请求/分钟/(IP, 租户)**。

### 实时查看的渲染端

`src/analysis/LiveChart.jsx` 已实现滑动窗口实时曲线：渲染由 `requestAnimationFrame` 驱动（不随样本到达重渲染），经 `decimateMinMax` 抽取，256 Hz 不会拖垮主线程。它接受一个 `sampleSource` 注入点，但当前形状是**每帧拉取** `() => ({ channelId: value })`，不是接收流。文件头注释明确写着 PF 尚未把设备运行时接入该面板。

### 本地持久化

运行中每 2000 ms 通过 `src/GraphRuntimeRunnerPage.jsx` 的 `checkpointTick` 把整份会话快照写入 IndexedDB（`src/dataStore.js`），快照**已包含 `device_events`**。设备样本因此已有运行中的本地副本，但**从不进入服务器**：运行页原文写明"runtime synchronization does not upload the device sample stream"。

## 二、已核对的缺口

以下均为代码级核对结果，非推测：

| 缺口 | 证据 |
| --- | --- |
| `deviceConnectorId` **没有任何写入路径** | 全仓库无 `deviceConnectorId:` 赋值、无 `'deviceConnectorId'` 字符串路径；`src/composer/NodeInspector.jsx` 的设备开关以该字段**已存在**为显示条件 |
| `offset_ms` / `device_time_format` / `device_time_column` **从未被应用** | `offset_ms` 仅出现在 `src/app/sessionSetup.jsx`，无任何消费点 |
| `sync_method: 'manual_marker'` **未实现** | 仅为下拉字符串，无同步标记逻辑 |
| 设备事件**不是**主机侧同步标记 | `write('marker', …)` 发往设备，不产生主机侧标记 |
| 样本合并按 **ISO 毫秒**键 | `src/bioDBClient.js` 的 `rowsFromDeviceEvents` 把同一 ISO 时间戳的样本合并成一行 → 1 kHz 以上会撞点 |
| 读端点**无增量参数** | `GET /v1/sessions/:id/data` 每次返回全部事件，轮询会反复下载整个日志 |
| 实时状态在长刺激期间**停滞** | 同步是事件驱动；参与者停在长视频里时不产生运行事件，快照不动 |
| **无单会话读授权** | `analyst` 角色（`deployment.read` + `session.read` + `data.read`）是租户级，没有"只读某一个 session"的粒度 |

## 三、方案对比

### 设备接入

| | 接法 | 适合 | 代价 |
| --- | --- | --- | --- |
| A | 浏览器直连（WebSerial / WebBluetooth） | 低采样率；或显示机即采集机 | 渲染抖动会丢样本；桌面版无 Web Bluetooth |
| **B** | **采集工作站本地代理**（BrainFlow / MyBeat SDK） | **推荐主路径** | 需实现代理进程与适配器 |
| C | LSL（Lab Streaming Layer） | 起步最快；时间对齐最成熟 | 校园网多播常被禁；浏览器不能直连，需桥接 |

选 B 的理由：设备驱动和采集保留在实际连接设备的电脑上（见[局域网架构](LAN_ARCHITECTURE.md)），浏览器的渲染抖动对高采样率是硬伤，而代理恰好落在既有适配器边界内（`connect` / `read` / `write` / `disconnect` / `recover` / `provenance`），协议与图无需改动。

C 值得作为阶段 0 的对照：LSL 提供成熟的时钟校正，且 LabRecorder 与 lsl_viewer 免费提供权威文件与实时查看——**不需要写任何 PhysioFlow 代码**即可验证"真实设备 + 刺激 + 时间对齐"。代价是它不是 Web 技术，与 PhysioFlow 集成仍需桥接。

### 实时上行

1. **复用 `POST /v1/sessions/:id/events`**——不推荐。服务端每批次全数组拷贝并整体重写 JSON 状态文件，限流 600/min，高采样率数据会把存储和限流同时打爆。
2. **新增样本专用路由 + SSE 广播**——推荐。监控是单向的（服务端 → 观看者），SSE 走普通 HTTP、自动重连内建、能穿过只允许 HTTP 的代理。
3. **直接写 BioDB 时序库（VictoriaMetrics）并用 Grafana 查看**——省掉自建监控 UI，但会把工作带回 BioDB 对接那条线。

## 四、建议契约草案

以下为**草案，尚未实现**。

### 样本上行

```
POST /v1/sessions/:id/samples
  权限    data.ingest（参与者 token 已具备）
  限流    独立作用域（server/requestProtection.mjs 的 requestRateScope 为扩展点）
  幂等    batchId（沿用既有 idempotency 命名空间）
  载荷    列式:
          { batchId, sessionId, seq, connectorId,
            t0DeviceMs, t0EpochMs, dtMs,
            channels: { <channelId>: [ … ] },
            markers: [ { atSampleIndex, kind, label } ] }
  落盘    内存环形缓冲（最近 N 秒）+ 独立追加文件
          ——不进入 hosted-state.json
```

要点：列式而非逐样本，按 1 Hz 或 250 ms 批量（限流下余量充足）；`seq` 用于缺口检测，服务端保留高水位，客户端发现缺口时标注数据不完整而非静默；实时流按 25–50 Hz 降采样（min/max 桶保包络），全采样率只进权威文件。

### 实时下行

```
GET /v1/sessions/:id/stream      SSE，只读
  权限  session.monitor（建议新增；analyst 的 data.read 为租户级，粒度过粗）
  事件  snapshot（复用 runtimeSnapshot）、samples（降采样帧）、status
```

### LiveChart 接入

`src/analysis/LiveChart.jsx` 的 `sampleSource` 当前是每帧拉取形状。接入流式数据源有两条路：写一个把环形缓冲按帧排空的适配器（不改组件），或把契约改为"缓冲 + 游标"。建议前者，避免改动已被 `src/Analytics.jsx` 使用的组件。

## 五、时间对齐

这是比传输更关键的环节。推荐做法：PhysioFlow 在每次呈现刺激时，通过代理向设备流**写入一个 marker**，让设备数据里留下**设备时钟的硬件时间戳**，事后按设备时钟对齐，完全不依赖浏览器时钟。

所需的 `write` 通道与 ack 事件在 `src/devices/deviceConnector.js` 中已经存在，只是尚未接线。配套需定义：

- marker 编码（刺激序号 / 条件 / onset 类型）；
- 漂移校验：实验前后各打一次校准 marker，量化漂移率；
- 允许误差（须与设备负责人确认）。

## 六、交付顺序

| 阶段 | 内容 | 目的 |
| --- | --- | --- |
| 0 | LSL + LabRecorder 跑通一个真实实验；PhysioFlow 侧仅发 marker | 零上传代码，先验证真实设备与时间对齐 |
| 1 | 采集代理 + 权威文件 + 实验后可靠上传 → DB 回读确认 | 与[局域网架构](LAN_ARCHITECTURE.md)已定阶段一致 |
| 2a | 参与者侧时间驱动 tick + `?since=` 增量读端点 + 轮询式进度页 | 几乎零新概念，先拿到"实时流程进度" |
| 2b | 代理发降采样帧 → `POST /samples` → 环形缓冲 → SSE → 接入 `LiveChart` | 实时波形 |

阶段 2a 之前必须先补 `deviceConnectorId` 的写入 UI，并修正样本合并的时间键，否则阶段 2b 无立足点。

## 七、未决事项

- **OpenBCI / MyBeat 提供的是文件还是数据流**，以及可接受的时间同步误差——组会待确认项。
- **实时查看的授权粒度**：是否需要一个"只读某一个 session"的 scoped token，而非整租户 `analyst` 读权限。
- **校园网多播与防火墙**策略（选择 LSL 前必须确认）。
- 采集代理的责任人与接口定稿（本地采集接口草案见[局域网架构](LAN_ARCHITECTURE.md)）。
- 隐私：实时流会让研究者屏幕出现生理原始数据，需明确授权边界与验收要求。

## 八、本轮核对记录

- 依据：对 `src/devices/`、`src/hosted/`、`src/runtime/`、`src/data/`、`src/analysis/`、`server/` 的代码通读与检索；未连接任何真实设备。
- 已逐条验证的否定性结论：无 SSE / WebSocket / 长轮询；无 `navigator.serial` / `navigator.usb`；`deviceConnectorId` 无写入路径；`offset_ms` 无消费点。
- `src/runtime/deviceRuntime.js`、`src/data/channelDictionary.js`、`src/data/graphExport.js`、`src/data/jointExport.js` 的现有能力未在本文重复展开。
- 边界：本文不含真实设备并发、重连、时间同步精度或 Windows 缩放的验证；这些仍属[当前状态](IMPLEMENTATION_STATUS.md)中的未验证项。
