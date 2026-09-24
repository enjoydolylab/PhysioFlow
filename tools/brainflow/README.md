# BrainFlow 本机采集代理（第一阶段）

已实现 Synthetic Board → 本地原始记录 → PhysioFlow 网页预览/实验 marker。
不需要实机即可运行。当前支持默认 preset 的 EEG board，网页显示其前四路 EEG；原始文件保留该 preset 全部行，包括时间戳、marker 及设备提供的其他信号。未验证真实 Ganglion/Cyton、BLE 参数、跨机器访问或 PhysioDB 入库。

## 启动

在项目根目录执行（Python 3.9+）：

```sh
python3 -m venv tools/brainflow/.venv
tools/brainflow/.venv/bin/python -m pip install -r tools/brainflow/requirements.txt
tools/brainflow/.venv/bin/python tools/brainflow/agent.py --origin http://127.0.0.1:5174
```

Windows 将 Python 路径替换为 `tools\brainflow\.venv\Scripts\python.exe`。
另开终端运行 `npm run dev -- --host 127.0.0.1`，使用终端实际显示的端口；如果是5187，代理改用 `--origin http://127.0.0.1:5187`。可重复 `--origin` 明确允许多个页面来源。

默认 `--board-id -1` 为 BrainFlow Synthetic Board（250Hz），不是 PhysioFlow 内置模拟器。输出 JSON 包含代理 URL、临时 token、记录目录。token 每次重启更换，不要放进协议或提交到 Git。

## 网页操作

1. 在协议编辑器选择 Advanced，展开左侧 Advanced。
2. Import connector manifest：选择本次记录目录中的 `connector.json`，勾选 connect/read/write 并安装。清单来自设备实际 metadata，不手写通道数或频率。
3. 选择实验节点，展开 Analysis & recovery，Device connection 选择 BrainFlow。默认是必需设备。保存协议。
4. Preview run，填写测试参与者编号并继续。
5. 在运行准备页填写代理 token（URL 默认 http://127.0.0.1:8765），开始实验。
6. 观察四路 µV 数值。暂停实验时采集继续；网页刷新后从检查点恢复，重新输入 token。
7. 完成实验后等待保存，再下载数据包。网页包是预览记录；分析原始信号应使用代理文件。
8. 结束采集时在代理终端按 Ctrl+C。网页结束或关闭不会停止原始采集，避免浏览器故障造成记录中断；不用时必须停止代理，避免持续占用磁盘。

断连会暂停必需设备的实验。修复连接后点击 Reconnect devices；若代理重启，先在提示区输入新 token。恢复成功后点击 Resume。重连生成新的设备连接记录，代理重启生成新 runId，不伪造断连区间。

## 文件与时间

每次启动生成独立 runId 目录：

- `metadata.json`：boardId、采样率、BrainFlow boardDescription、时间戳单位。
- `connector.json`：可安装的连接器清单。
- `samples.jsonl`：每个采样帧一行，`sequence`、BrainFlow `timestamp`（Unix秒）与原始 `rows` 数组；行号解释见 metadata。保留全部默认 preset 通道，不仅是网页四路。
- `events.jsonl`：会话绑定/解除、marker 接收与采集失败。关联 sessionId、participantId、experimentId、protocolId；runId 在各事件中保留。

每个运行时事件的 sequence 作为非零 BrainFlow marker 数值，日志 label 保留 eventType、nodeId、网页事件 timestampEpochMs；多个会话可出现相同数值，结合 session 绑定区间和日志解释。

`marker_accepted`/网页 acknowledgement 表示 BrainFlow 接受插入请求，不是硬件触发确认。实际落在哪个采样帧以原始 marker 行为准。网页时钟、代理时钟和 board 时间戳都保留，未进行时钟偏差校正，不能宣称毫秒级刺激对齐。

## 传输、边界与故障

- 只监听127.0.0.1；Bearer token + Origin 白名单；token仅保留在运行页内存。当前不开放局域网直连，不使用 WebSocket。
- 每250ms批量拉取，代理30秒环形缓存；序号断裂或 runId 变化会报错。超过5秒无新样本会停止正常采集状态并记录失败。
- 网页按通道展开为现有 device_sample_received 事件；保留约20,000个最新 BrainFlow 通道样本（批量清理，瞬时最多21,000），保留所有生命周期/marker/失败事件。`session.json.device_preview_policy.droppedSamples` 说明主动移除的预览数。原始文件不裁剪。
- 刷新/重连的预览从当前采集位置开始，不补齐网页离线数据；完整区间仍在代理文件。网页连接记录中的 runId 与原始目录对应。
- 停止实验先等待正在处理的批次及 marker 请求，再保存最终包。页面主动卸载仍不保证未确认 marker 送达，需检查日志。
- 原始 JSONL 逐行 flush，未做 fsync/磁盘故障恢复；断电可能损失末尾数据。默认持续记录，需监控磁盘空间。尚未完成长时压力验收。
- 目前一次代理只允许一个 sessionId 控制；同一session可刷新重新绑定。若不再恢复旧实验，需要重启代理后创建新实验。不要并行打开同一会话的多个运行页。

## 验证

```sh
tools/brainflow/.venv/bin/python tools/brainflow/test_agent.py
node --test tests/brainflow-connector.test.js
npm run quality:refactor
npm run test:e2e:participant-public
```

Python集成测试实际加载 BrainFlow 原生库，验证Synthetic采样、原始marker、鉴权和结束网页会话后继续采样。JS测试覆盖批次序号、时间戳、断层、代理重启、读取停止和预览保留策略。
