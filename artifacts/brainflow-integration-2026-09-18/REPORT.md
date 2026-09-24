# BrainFlow 第一阶段交付与验证

日期：2026-09-18。已实现可运行的本机 Synthetic Board 接入链路，未接触真实受试者或传感器。

## 已交付

- Python 代理实际加载 BrainFlow 5.22.2，启动 Synthetic Board；设备元数据生成连接器清单，默认 preset 原始数据连续写入独立 runId 文件夹。
- HTTP loopback 服务，Bearer 令牌及 Origin 白名单；会话绑定、批量序号读取、marker 插入与解除绑定。
- PhysioFlow BrainFlow network 适配器及 readBatch；节点设备选择；运行页凭据输入；四路 EEG 数值预览。
- 实验事件 sequence 转为 marker，保留网页时间与代理接收确认；原始 marker 行可追溯。
- 采集失败自动暂停必需设备实验；重连支持输入新令牌；代理重启使用新 runId。
- 浏览器约20,000条通道样本保留上限，导出记录 droppedSamples；原始文件不裁剪。
- 最终保存等待当前读取、marker 队列和断开记录；令牌不写入协议或导出。

## 实际网页验证

通过本地网页操作安装清单、绑定节点、预览运行，并完成三轮采集：

| 会话 | 操作 | 结果 |
| --- | --- | --- |
| QA-BRAINFLOW | 空令牌启动、正常连接、暂停、刷新、检查点恢复、完成、网页下载 | 空令牌被拦截；28,552个通道样本；7个实验事件/marker；22文件导出包 |
| QA-BRAINFLOW-RECOVER | 采样失败、自动暂停、代理重启、更换token、重连、恢复、完成 | 导出保留 device_read_failed；两个runId；24,888个通道样本；最后事件为device_disconnected |
| QA-BRAINFLOW-BOUNDED | 最终保留策略下持续采集并完成 | 导出20,425条样本，明确记录主动移除7,007条预览；无采集失败；完整原始数据在代理文件 |

第一轮7,138帧×4通道的每个数值和BrainFlow时间戳，已与原始文件逐项比对一致。marker 1–7 均实际存在于原始marker行。导出内容不包含代理令牌。见 export-verification.json、各会话verification.json、网页txt/png及ZIP。runId子目录保留metadata、代理日志和原始marker帧摘录。

前三轮分别覆盖新增功能，后续加入预览上限的最终行为以QA-BRAINFLOW-BOUNDED为准。第一轮刷新期间网页不补采离线区间；完整区间由代理文件保存。

## 自动验证

- `npm run quality:refactor`：364/364测试通过、生产构建通过、ESLint零警告。
- `npm run test:e2e:participant-public`：通过。
- `npm run test:e2e:refactor-browser`：通过，包含已有模拟设备及8种视口布局回归。
- `tools/brainflow/test_agent.py`：通过，实际Synthetic采样、marker入原始文件、token/Origin拒绝和会话解除后持续记录。
- `git diff --check`：通过。

## 使用与边界

完整启动与网页操作见 [使用说明](../../tools/brainflow/README.md)。测试代理已停止；需按说明重新启动并使用新令牌。网页保留了QA演示项目。

尚未交付：真实Ganglion/Cyton和Mybeat验证、其他preset、局域网远程流、PhysioDB入库、时钟偏差校正及长时压力验收。四路预览不等于设备总通道数；marker确认不等于硬件同步精度。原始JSONL逐行flush但未实现fsync/断电恢复。测试原始文件在本机临时目录，正式采集应显式指定可靠的`--output`目录。

代码保留在工作区，未提交或部署。
