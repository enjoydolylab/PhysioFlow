# beta.6 离线验收证据

全部为 QA 测试素材和 BrainFlow Synthetic 合成数据，不是研究记录。

最终运行：445 项测试、构建、Lint、三个浏览器套件通过；离线浏览器套件通过；macOS Rust 2 项测试通过。完整结构 210 节点、208 个参与者节点、120 份问卷、1,080 个回答、40 个无重复素材，加速运行 103.438 秒。Synthetic 两段原始数据共 1,604 帧，5,444 条预览样本数值/时间戳逐项匹配。PhysioDB 本地 HTTP 上传 742 帧，分批 500/242，并验证失败、取消和超时。

`REPORT.json` 为最终机器结果；`offline-run.txt`、`quality-release.txt` 和 `rust-tests.txt` 为日志。`synthetic-raw/` 只保留最终两段；`synthetic-session.json` 和 `full-structure-session.json` 为完整测试会话。质量日志中的 beta.5 为执行时包版本；之后仅更新版本号和文档，beta.6 打包重新构建。

范围与复现见 ../../docs/OFFLINE_ACCEPTANCE_2026-09-24.md。Windows CI 结果与安装包在 beta.6 Release；CI 不等同于真机操作验收。
