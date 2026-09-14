# 业务与技术术语

更新：2026-09-06。定义以 beta.4 当前模型为范围；目标架构与未来计划见[路线图](OPTIMIZATION_PLAN.md)。

| 术语 | 当前含义 | 容易混淆的地方 |
| --- | --- | --- |
| Project | 同一研究的协议与版本组织 | 不是 Session，也不自动具有 Hosted 账户权限 |
| Protocol | 可保存、验证、冻结的实验定义 | 不含本次运行的全部结果 |
| Protocol Graph | 新协议的 nodes/edges 执行结构 | 旧协议仍保留 blocks/trials/steps 兼容路径 |
| Node / Component | 组件实例 / 版本化类型定义 | 同类型节点不共享一次运行的状态 |
| Control Edge | 决定下一个执行节点 | 画布坐标与连线外观不决定业务顺序 |
| Data Edge / Binding | 提供变量或上游输出 | 不替代控制连接 |
| Group | 节点组织与编辑分组 | 不是通用的 Block/Trial 执行容器 |
| Subflow | 可复用的节点片段及参数/端口映射 | 不自动提供跨被试平衡或旧 Trial 语义 |
| Block / Trial / Step | 旧模型的区块、试次和内容步骤 | 新 Graph 没有与三者完全等价的通用层级 |
| Cognitive task trial | Stroop/Go-No-Go 专用节点的内部试次 | 不等于任意 Graph 节点组合 |
| Stimulus pool | 供节点共享分配的刺激集合 | 不随机化整个协议控制流 |
| Screen / UI Element | 参与者画面根及其声明式元素 | 不等于 Trial |
| Questionnaire | 专用题目配置、评分和表单运行 | 并非全部已迁移成通用 UI 元素 |
| Action | UI 的标准提交或变量操作 | 不是任意 JavaScript |
| Session | 一次协议运行及参与者上下文 | 预览会话不等于正式采集 |
| Event / Response | 按序事实 / 参与者提交结果 | 数据派生表不能替代原始日志 |
| Snapshot | 运行恢复状态 | 不保证恢复所有未提交输入 |
| Freeze | 固化配置与版本并计算哈希 | 不代表资源文件已交付或真人验收完成 |
| Migration | 复制旧协议、转换并生成审阅报告 | 不是保证实验等价的原地升级 |
| Hosted sandbox | 本地参考托管生命周期 | 不代表云服务已部署 |
| Deployment / Bootstrap | 托管发布定义 / 参与者启动材料 | 均不等于 GitHub Release |
| GitHub Release | 应用安装包和源码标签的发布 | 与实验协议 Freeze 是不同业务 |

详细规则见[业务流程](../BUSINESS_WORKFLOW.md)和[迁移指南](MIGRATION_GUIDE.md)。
