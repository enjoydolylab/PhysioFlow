# beta.9 推进验收状态（2026-10-14）

本表区分新版包内结果与此前软件证据。用户已选择先继续软件功能；真人试用留待后续，不补写结果。

| 顺序 | 项目 | beta.9 当前证据 | 结论 |
| --- | --- | --- | --- |
| 1 | 最新 DB 兼容性 | 包内官方 SDK f844fcf3 + 隔离 DB a9a83d1；短实验实际读写 | 本机最新版通过；远端部署未验证 |
| 2 | 映射和追溯 | 包内短实验运行隔离、1200 点、冻结设计、实际 DB 事件导出 | 软件验证通过 |
| 3 | 实验闭环 | 包内短实验、长 raw 100501 点/52.9 MB/402 秒、响应丢失及重启恢复；完整 1863 条已同步并逐条核对1200响应记录 | 短实验、长记录与完整测试数据同步通过 |
| 4 | 管理和参与者 | beta.9 浏览器实际 ZIP 下载（筛选不截断），丢失操作确认查询恢复；beta.8 的公开入口、断线、保存恢复证据保留 | 新增功能通过；未将旧版浏览器证据声明为全部新版重跑 |
| 5 | 组件和编辑器 | beta.9 全量503项测试/构建/零警告lint；beta.8 组件与编辑浏览器验证 | 新版回归通过；真人效率未验证 |
| 6 | 真人试用 | 用户确认暂无记录 | 未完成，待实际试用 |

证据位置：package-beta9-live/result-*.json、package-beta9-live/long-result-*.json、export/browser-result.json、operator-recovery/browser-result.json、package/browser.json、package/server.json，均位于 artifacts/db-progression-2026-10-14。完整同步最终结果应位于 package-beta9-full-db/result-*.json，本轮已产生验证通过的结果，见下方证据。

两份 beta.9 ZIP CRC 与源文件清单通过，旧 beta.8 保留。SOURCE_FILES_SHA256 对应实际未提交源码，不能仅依赖基准 Git 提交重现。解压包测试后生成私用目录，分发原 ZIP。

正式设备、Windows 驱动/SDK实机、原刺激视频和原时长没有验收结果。原210节点运行证据采用测试媒体及加速时长。真人试用与正式可用性人数/指标/签收仍待实际记录。

完整同步最终证据：artifacts/db-progression-2026-10-14/package-beta9-full-db/result-1791921030868.json。1863 DB 事件、1200 响应原记录（1080 题答案与120元记录）逐条一致，重新打开同步服务读取确认通过。复用此前加速测试媒体运行记录，不声明新版完整原时长或实机验收。

完整实验导出包追加验证：artifacts/db-progression-2026-10-14/package-beta9-full-db/export-result-1791921476794.json。1863事件、1200响应原记录与源文件严格一致，设计快照一致，所有数据文件SHA-256/字节数核对通过。使用 beta.9 包内导出实现和实际隔离 DB。日语操作说明：docs/OPERATOR_GUIDE_beta.9_日本語.md（单独文档，原ZIP保持不变）。
