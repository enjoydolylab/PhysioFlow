# beta.9 Web 研究试用交付

2026-10-14。新增按运行导出研究数据，以及实验途中操作确认丢失的查询恢复。日语界面可用。beta.8 归档保留。

- 静态试用包：release-web/PhysioFlow-Web-v0.6.0-beta.9.zip。解压后运行 start 脚本。
- 服务端配套包：release-web/PhysioFlow-Server-v0.6.0-beta.9.zip。包含 DB 功能的实际源码、构建和锁定依赖，按照 README_日本語.md 安装与启动。
- 校验清单：release-web/SHA256SUMS-beta.9.txt。

503 项单元/集成测试、生产构建、零警告 lint 通过。浏览器验证实际导出 ZIP 包含搜索范围外的全部 30 条合成回答，以及丢失一次操作确认后查询原结果、只执行一次。归档 CRC、服务端全部源文件校验、私用目录排除检查通过。beta.9 服务端包已单独安装 npm 依赖和锁定 Python SDK，在独立 18879 端口启动；源文件校验、owner 认证和 SPA 页面入口通过。包内代码与隔离最新版 DB 的短实验验证通过：完成运行、1200 点合成信号、写入响应丢失后的重启恢复、不重复追加、重复运行隔离。新版包内完整数据同步和长记录已另行验证通过，此前 beta.8 证据不冒充新版完整验收。

未提交源码包含在服务端包中；BUILD_INFO 的基准提交不足以单独重现版本。原信号单独导出。真人试用、正式设备、正式刺激视频与原时长验收仍待执行。

打包后的 start.py 实际在 8081 启动；浏览器确认 beta.9 BUILD_INFO、生产模块加载、SPA 路由以及 /admin/ 登录界面。证据：artifacts/db-progression-2026-10-14/package/browser.json。

包内按运行导出已用实际隔离 DB 的事件验证数量，证据：artifacts/db-progression-2026-10-14/package-beta9-live/result-1791920985812.json。验证期间生成的私用 .physioflow、node_modules 和 .venv 不在原 ZIP 内；仅分发 ZIP。

新版包内长记录验证通过：100501 点，402 秒合成信号，源 JSONL 超过 50 MB；提交响应丢失后恢复，21 次写入，重启读取确认，持久化日志小于 15 KB。证据：artifacts/db-progression-2026-10-14/package-beta9-live/long-result-1791921031951.json。完整设计数据同步最终核对已通过，见下方证据。

完整设计测试数据的包内同步验证通过：artifacts/db-progression-2026-10-14/package-beta9-full-db/result-1791921030868.json。1863事件，1200响应记录逐条一致，重启读取确认成功。此验证不等于新版原时长实验或真人试用。

完整实验导出包追加验证：artifacts/db-progression-2026-10-14/package-beta9-full-db/export-result-1791921476794.json。1863事件、1200响应原记录与源文件严格一致，设计快照一致，所有数据文件SHA-256/字节数核对通过。使用 beta.9 包内导出实现和实际隔离 DB。日语操作说明：docs/OPERATOR_GUIDE_beta.9_日本語.md（单独文档，原ZIP保持不变）。
