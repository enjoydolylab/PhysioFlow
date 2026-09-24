# 当前实现与发布状态

> 后续候选发布：v0.6.0-beta.5 收录当前基本流程及 Hosted 分组随机启动/恢复修复，438 项测试和完整质量检查通过。发布说明见 ../RELEASE_NOTES_beta.5.md。下文保留此前时点记录；真实媒体、硬件及 PhysioDB 验收仍未完成。

当前开发候选与对接进度（2026-09-24）：[已完成／进行中／未完成](../PROGRESS_REPORT_2026-09-24.md)。最新完整质量检查：437 项测试通过，构建、Lint 和三个浏览器套件通过；尚未发布新版安装包。下方旧日期记录保留作历史基线。

更新：2026-09-14。此页区分当前开发代码与已发布安装包；历史审查保留其日期，不作为新的验收结果。

## 发布基线

| 项目 | 已核实状态 |
| --- | --- |
| 最新研究测试版本 | [v0.6.0-beta.4](https://github.com/kyzzz22/physioflow-app/releases/tag/v0.6.0-beta.4) |
| 发布时间 | 2026-09-06 |
| 版本源码 | `68a3451c3f33dcb8cbf87f53d612bf0938e990d1`，demo 分支 |
| 安装包 | Windows x64 NSIS，当前用户安装，未签名 |
| 附件 | EXE、SHA256SUMS.txt、RELEASE_NOTES.md |
| macOS / Linux 安装包 | 未发布 |

安装包 SHA-256：`7176bd8edab95c34903c15669bccda1b8079575fedb0df610f75c4d003cd38c7`。

## 已有能力

- Composer V2 Graph：控制/数据连接、变量、条件、循环、随机分支、分组、子流程及版本冻结。
- Participant UI：声明式元素、可视化编辑、JSON 配置、模板和受限制的 HTML 展示；专用问卷、认知任务等仍有独立运行适配。
- 执行与记录：响应/事件、暂停/恢复、Retry/Skip、检查点、最终保存重试、失败会话保存。
- 资源与随机化：本地媒体内容校验、新 Graph 共享刺激池按实际执行消费。
- 兼容旧 Block/Trial：层级、重复、条件约束排序与迁移；不是 Graph 的通用 Trial 容器。
- 可选开发能力：声明式组件 SDK、可信控制处理器、设备连接契约、离线协作变更集和单节点 Hosted 服务。

业务含义与限制见[业务流程](../BUSINESS_WORKFLOW.md)，技术契约见[文档导航](../README.md)。

## 验证证据

2026-09-14 开发版新增首页整理、结构化响应选项、试次生成与流程重复入口，以及[画布布局和属性面板优化](CANVAS_EDITING.md)。这些改动尚未重新打包发布。[多语言审查](I18N_REVIEW_WORKFLOW.md)目前提供初步候选扫描，不表示翻译已完整。

本轮本地验证：

- JS 单测：348 项，347 通过，1 项跳过。
- lint（零警告）与生产构建通过。
- 公开参与者浏览器 E2E 通过，包含画布真实鼠标多选拖动、取消拖动、锁定和属性输入提交检查。

此前验证记录：

- Composer 浏览器 E2E 通过。
- Windows 文件替换的 2 项 Rust 测试在运行可靠性修复阶段通过。
- 8 种 CSS 视口检查覆盖编辑器及主要页面控件；不是全部页面内容、Windows DPI、WebView2 或所有设备的验收。
- [UI / Block 验收](../ACCEPTANCE_REPORT_2026-09-05.md)与[运行可靠性审查](RUNTIME_RELIABILITY_AUDIT_2026-09-05.md)提供具体范围。

不要由这些记录推断最新 CI 或真人研究已通过。

## 未完成与不确定项

- 真实 Windows 安装后的操作、125%/150% 缩放、真实设备并发/重连和时间同步。
- 研究人员独立完成任务的证据及三方签收。
- 未提交问卷和认知任务内部进度的完整崩溃恢复；会话多文件事务。
- 通用 Graph Trial 语义、跨被试配额分配及复杂实验的适用性。
- 所有自定义 UI、外部媒体及长文本的跨屏呈现一致性。
- 单节点 Hosted 的生产运维、身份服务与规模化部署，不能由契约测试替代。

[下一步路线图](OPTIMIZATION_PLAN.md)描述后续工作。[发布检查](RELEASE_CHECKLIST.md)应对每个新版本重新执行。正式可用性结果须通过 `verify:usability-study`，当前没有已确认的通过证据。

原阶段 0–7 的累积记录可从 [beta.4 时的旧状态文档](https://github.com/kyzzz22/physioflow-app/blob/68a3451c3f33dcb8cbf87f53d612bf0938e990d1/docs/refactor/IMPLEMENTATION_STATUS.md)追溯。
