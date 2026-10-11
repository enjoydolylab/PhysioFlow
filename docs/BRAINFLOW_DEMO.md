# 组会实机演示：PhysioFlow × BrainFlow 如何协同工作

Synthetic Board 演示，**不需要任何真实硬件**。本页所有数字和命令都在本机实测过。

---

## 0. 演示前必须做完（不要留到台上）

```sh
# 1) Python 环境（首次约 1 分钟；已完成，可跳过）
python3 -m venv tools/brainflow/.venv
tools/brainflow/.venv/bin/python -m pip install -r tools/brainflow/requirements.txt

# 2) 自检：能加载 BrainFlow 原生库、Synthetic Board 可用
tools/brainflow/.venv/bin/python -c "from brainflow.board_shim import BoardShim; print(BoardShim.get_sampling_rate(-1))"
# 期望输出：250
```

**端口必须先确定下来。** `npm run dev` 写死了 `--port 5174`；若 5174 被占用，Vite 会**自动回退到 5175**，此时代理的 `--origin` 就对不上，页面会报 `Origin or token rejected`（哪怕 token 填对了）。演示前二选一：

```sh
# 方案 A（推荐）：先腾出 5174，让默认 --origin 生效
lsof -nP -iTCP:5174 -sTCP:LISTEN     # 有输出就 kill 掉那些 PID

# 方案 B：接受回退端口，把实际端口传给 --origin
npm run dev                          # 注意看它打印的 Local: http://localhost:<端口>
```

**协议要提前配好**（见 §2 步骤 1–3），别在台上做连接器导入。

---

## 1. 台上开三个窗口

| 窗口 | 命令 |
|---|---|
| A | `npm run dev`（记下它打印的端口） |
| B | `tools/brainflow/.venv/bin/python tools/brainflow/agent.py --origin http://127.0.0.1:<端口>` |
| C | 浏览器打开该端口 |

窗口 B 启动后会打印一行 JSON，记下 `url`、`token`、`directory`：

```json
{"url": "http://127.0.0.1:8765", "token": "…", "directory": "…/brainflow-recordings/<runId>"}
```

---

## 2. 演示主线

### ① 两条独立的时间线 ← 全场的核心论点

在窗口 B 旁边开一个 `tail -f <directory>/samples.jsonl`，样本按 250 Hz 持续滚出来。

> **此时浏览器还没连上，甚至没打开。**

实测证据：准备这份文档期间，代理在没有任何浏览器接入的情况下录了 **9,527 帧 / 6.0 MB**，而 `events.jsonl` 是 **0 行**（没有任何会话绑定过）。

这正是设计意图——[agent.py:115](../tools/brainflow/agent.py#L115) 的 `rawRecordingContinues: true`：**网页崩溃、关闭、刷新都不会中断原始采集**。

目录里四个文件：

| 文件 | 内容 |
|---|---|
| `metadata.json` | boardId、采样率、BrainFlow boardDescription、时间戳单位 |
| `connector.json` | **可安装的连接器清单**（下一步要导入的就是它） |
| `samples.jsonl` | 每帧一行：`sequence`、BrainFlow `timestamp`、原始 `rows` |
| `events.jsonl` | 会话绑定/解除、marker 接收、采集失败 |

### ② 连接器清单来自设备本身，不是手写的

打开 `connector.json`：

```
connectorId : org.physioflow.brainflow
permissions : device.connect, device.read, device.write
channels    : eeg_1..eeg_4 (input, uV, 250 Hz) + marker (output)
brainflow   : { boardId: -1, previewRows: [1,2,3,4] }
```

强调两点：

- 通道数和采样率是 `BoardShim.get_sampling_rate()` / `get_eeg_channels()` **读出来的**，不是硬编码。
- **原始文件保留全部 32 个通道值**，而暴露给网页的只有 **4 路**。实测：board 实际有 **16 路 EEG**（`Fz,C3,Cz,C4,Pz,PO7,Oz,PO8,F5,F7,F3,F1,F2,F4,F6,F8`）。

> 浏览器只做预览；**分析原始信号一律用代理文件**。

导入步骤（应提前做完）：协议编辑器 → `Advanced` → 左侧 `Advanced` → **Import connector manifest** → 选 `connector.json` → 勾选 connect/read/write → 安装。

### ③ 网页侧只有预览

1. 选中实验节点 → 展开 `Analysis & recovery` → **Device connection** 选 `BrainFlow`（默认即"必需设备"）→ 保存协议。
2. `Preview run` → 填测试参与者编号 → 继续。
3. 运行准备页填代理 URL 与 token。token 框是 password 类型，**不写进协议、不进导出**。
4. `Begin experiment`。
5. **⌘⇧O（Windows: Ctrl+Shift+O）** 打开主试操作台 → 出现 `BrainFlow EEG preview (µV)` 四路实时数值。

> 网页只保留**最新约 20,000** 个通道样本，丢弃数量记在 `session.json.device_preview_policy.droppedSamples`。

### ④ 鉴权（可以现场演一次"故意失败"）

先把 token 故意填错 → `Begin experiment` 被拒。实测的三种情况：

| 请求 | 结果 |
|---|---|
| 错误 token | `HTTP 403 {"error": "Origin or token rejected"}` |
| 正确 token 但 Origin 不在白名单 | `HTTP 403` |
| 正确 token + 白名单 Origin | `HTTP 200`，返回 runId / boardId / 采样率 |

改回正确 token → `Retry device and begin`。收尾时可在导出文件里搜 token，**搜不到**。

### ⑤ 断连与恢复 ← 最有戏剧性的一段

1. 在窗口 B 按 **Ctrl+C** 停掉代理。
2. 页面出现 **`Reconnect devices`**，`Resume` 变灰——**必需设备断开会让实验暂停**，而不是静默地继续采空数据。
3. 重启代理（新 runId、**新 token**）→ 填入新 token → `Reconnect devices` → `Resume`。

> 重连生成新的设备连接记录，代理重启生成新 runId，**不伪造断连区间**。这正是"数据可信"的体现。

### ⑥ marker 桥：PF 事件 → BrainFlow 原始行

运行时事件自带 `sequence`，作为**非零 BrainFlow marker 值**通过 `insert_marker` 写入，因此能在原始 `samples.jsonl` 的 marker 通道里直接查到。

> 注意措辞：`marker_accepted` 只表示 **BrainFlow 接受了插入请求，不是硬件触发确认**；实际落在哪个采样帧以原始 marker 行为准。

### ⑦ 收尾

完成实验 → 等页面显示 `Session data saved.` → 下载数据包。

- 网页包 = **预览**。
- 分析原始信号 = 代理目录的 `samples.jsonl`。
- 要进 PhysioDB：`PhysioDB · BrainFlow recording` 页面上传 `samples.jsonl`，人工映射「零基行号 → 字段名 / 单位」（[PhysioDBUpload.jsx:63](../src/PhysioDBUpload.jsx#L63)）。**不做单位换算。**

**演示结束务必在窗口 B 按 Ctrl+C 停代理**——它会持续写盘。

---

## 3. 可以台上直接引用的验证结论

来自 [tests/e2e-offline.mjs](../tests/e2e-offline.mjs#L170) 的自动化断言（真起 Python 代理 + Synthetic Board）：

- 浏览器预览的**每一个值和设备时间戳**，都能在原始 `samples.jsonl` 的对应帧里找到相同值；
- **每一个被 acknowledge 的 marker** 都存在于原始帧中；
- 导出的会话数据中**不含 token**；
- 错 token 被拒、暂停/恢复、代理重启后新 token 重连，全部通过。

---

## 4. 现场兜底

| 症状 | 原因 | 处理 |
|---|---|---|
| 页面报 `Origin or token rejected`（token 明明对） | `--origin` 与实际端口不符（Vite 端口回退） | 看窗口 A 打印的端口，用它重启代理 |
| 代理起不来，提示端口占用 | 8765 上有残留代理 | `lsof -nP -iTCP:8765 -sTCP:LISTEN` 后 kill，或 `--port 8766` 并在页面改 URL |
| 页面没有 BrainFlow 输入框 | 协议里没有节点使用该连接器 | 检查节点 `Device connection` = BrainFlow |
| 实验开始后没有 µV 数值 | 主试操作台没打开 | ⌘⇧O |
| 代理重启后接不上 | token 每次重启都会变 | 用新 token 重填 |
| 代理中途崩了 | — | 重启代理 → 填新 token → `Reconnect devices` → `Resume`。**这就是第⑤段，可以当作演示内容继续讲** |

---

## 5. 三条红线

1. **只用 Synthetic 数据演示**，绝不用真实被试数据。合成数据必须标记为 QA，不得用于研究分析。
2. **不要把 token 贴进 PPT / 聊天 / 截图**。它每次重启都换，且不应外传。
3. **演示完停掉代理**，否则一直占磁盘。

---

## 6. 讲不了的部分（被问到就直说）

- 只验证过 **Synthetic Board**；真实 Ganglion / Cyton、BLE 参数、跨机器访问**未验证**。
- 网页时钟、代理时钟、board 时间戳三者都保留，但**未做时钟偏差校正——不能宣称毫秒级刺激对齐**。
- JSONL 逐行 flush 但**未 fsync**，断电可能丢尾部；**长时压力验收未做**。
- 一次代理只允许一个 sessionId 控制，不要并行打开同一会话的多个运行页。
