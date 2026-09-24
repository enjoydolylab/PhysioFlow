# BrainFlow 接入工作单

更新：2026-09-18。状态：第一阶段本机 Synthetic Board 链路已实现并完成网页联调；真实硬件和 PhysioDB 尚未对接。

使用方法、文件格式和边界见 [BrainFlow 代理 README](../../tools/brainflow/README.md)。已实现本机采集和原始保存、来源和令牌校验、metadata 清单导入、节点设备选择、批量预览、实验 marker、断连暂停及重连。以下工作单保留作真实设备联调依据。

## 接入边界

采集电脑运行 Python + BrainFlow BoardShim，由它负责传感器连接、连续读取和原始记录。PhysioFlow 负责实验生命周期、刺激/响应事件、会话关联和数据预览。PhysioDB 的入库接口由服务端负责人确认后接入。

数据路径：传感器 → BoardShim → 本地采集代理 → PhysioFlow；代理独立保存原始文件。远程存储/监控不应阻塞采样。

浏览器不直接加载 BrainFlow 原生驱动。BrainFlow 的 streaming board 与网页 WebSocket 是不同接口；网页连接代理需另行实现。

## 实施状态与后续缺口

- network 已支持 org.physioflow.brainflow 本机适配器；其他 network 连接器仍需实现。
- 已新增 readBatch 及序号缺口检查；权威连续记录保留在采集代理，不依赖浏览器。
- 节点设备选择、会话关联及代理连接设置已贯通；下一步需要真实 board 参数和设备项目。
- 设备事件未进入 hosted 服务器；不得直接把高频采样塞进现有整文件 JSON 状态存储。

## 第一阶段交付与验收

先使用 BrainFlow 自身 Synthetic Board（区别于项目已有模拟连接器）完成：

1. CLI 启动/停止 BoardShim；从 board metadata 获取采样率、通道索引、时间戳与 marker 行，禁止写死四通道/200Hz。
2. 原始数据在采集端保存；批量 get_board_data 消费缓冲，预览读取不能重复归档同一批数据。
3. 本地代理提供状态、批量样本及 marker 命令；以 loopback 默认绑定、校验 Origin/令牌，只允许明确的采集客户端控制设备。
4. PhysioFlow 显示连接状态和实时预览；会话绑定后记录 experimentId、sessionId、participantId、采集 runId。
5. 实验事件分别记录网页事件时间、代理接收时间、marker 请求/确认；marker 写入成功不代表硬件级同步精度。
6. 断开时明确报错并记录缺口；恢复后创建新数据段，不把断连区间补成连续数据。浏览器刷新不应终止采集端原始记录。
7. Synthetic 连续运行、网页开始/结束实验、刷新、断连、导出并核对样本序列与标记。然后更换真实 board 配置重复验收。

## 待与设备负责人确认的接口

| 项目 | 必要信息 |
| --- | --- |
| 硬件 | 完整型号、固件、BrainFlow board_id、连接参数 |
| 采集环境 | Windows/macOS/Linux，Python 与 BrainFlow 版本 |
| 已有代码 | 可运行脚本/仓库，安装及启动命令 |
| 数据 | EEG/ECG/加速度通道、各单位、采样率、时间戳来源；200×4不能代替设备元数据 |
| 服务 | PhysioDB endpoint、认证、批量格式、重试/去重约定 |
| 实验行为 | 是否实验前持续采样、暂停是否持续记录、事件 marker 编码 |

建议默认：采集在实验暂停时继续，记录 pause/resume marker；结束实验不删除原始记录。实际行为需与采集项目共同确定。

## 官方依据

- https://github.com/brainflow-dev/brainflow
- https://brainflow.readthedocs.io/en/stable/Examples.html

官方示例覆盖 prepare_session/start_stream/get_board_data/stop_stream/release_session、Synthetic Board、通道元数据和 insert_marker。设备具体参数仍以对应 supported boards 文档及已有采集代码为准。
