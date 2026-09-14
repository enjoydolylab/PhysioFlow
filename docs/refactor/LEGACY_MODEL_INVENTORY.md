# 旧模型与迁移边界

更新：2026-09-06。此页已替换立项期的目标映射表；当前实现见 [migrateProtocolV1.js](../../src/legacy/migrateProtocolV1.js)。

旧协议以 `Protocol → Block → Trial → Steps` 存储内容，Trial 的 `flow.nodes/edges` 表达旧执行图。旧 editor 和 runtime 仍存在，不能用“Graph 是唯一模型”的设计目标推断旧路径已经删除。

迁移器复制生成新 Graph 草稿，并保留来源、ID 映射和旧 step payload。说明、媒体、等待、评分及问卷可转换为原生组件；不能原生表达的步骤保留 `legacy.step` 供人工替换。

| 旧能力 | 迁移后必须核对 |
| --- | --- |
| Block / Trial 次数与顺序 | 重复、随机、Latin square 和手动排序是否需重新编排 |
| Step 与 Flow 双结构 | 引用、重复访问、分支及未使用步骤 |
| 问卷 | 题目、答案编码、评分及跳题，而不只检查节点存在 |
| HTML / CSS / 脚本 | 展示与沙箱限制，任意脚本不迁移为可信执行代码 |
| 媒体 | 资源 ID、文件存在、来源和 checksum |
| 运行结果 | 事件、响应和分析所需信息是否与原实验一致 |

迁移创建 Group 或节点并不等于创建可执行随机/重复容器。原文中对 `sequence/randomize/counterbalance container`、`logic.merge` 等的映射属于设计设想，不能作为当前能力承诺。

遵循[迁移操作指南](MIGRATION_GUIDE.md)检查报告并试跑；保留旧协议和一次参考导出用于比较。
