# 文档导航

更新：2026-09-14。当前发布为 beta.4；画布与实验自定义新增功能属于开发版，尚未重新打包发布。应用版本事实以[实现状态](refactor/IMPLEMENTATION_STATUS.md)为准。

第一次使用：先读[业务流程](BUSINESS_WORKFLOW.md)，再按[使用指南](USER_GUIDE.md)完成一个实验。业务文档使用中文；技术契约保留原英文和代码字段名。

业务流程：设计协议 → 配置刺激与问卷 → 预览检查 → 冻结版本 → 采集 → 复核导出。当前 UI 不包含完整阶段向导，改版建议在[路线图](refactor/OPTIMIZATION_PLAN.md)。

## 文档维护规则

- 当前状态：只在实现状态页集中维护版本、制品和验证边界。
- 业务指南：描述当前可操作能力，不能把目标架构当作已交付功能。
- 技术参考：模块接口或运维规则，不要求普通研究人员逐项配置。
- 验证记录：保留测试时点和范围；发布成功不增加测试证据。
- 历史材料：只追溯旧结论，不作为当前发布或任务列表。
- ADR：保留决策本身，同时明确兼容路径和实现边界。

原 `refactor/` 目录保留稳定路径；其目录名不表示内容全部过时。[本轮审查与删除清单](DOCUMENTATION_AUDIT_2026-09-06.md)记录调整。运行 `node scripts/check-docs.mjs` 可检查本地链接和导航覆盖。

## 业务与日常操作

- [组会进展报告：9/4 会后至 9/14](PROGRESS_REPORT_2026-09-14.md)
- [画布编辑：布局、选中、拖动与属性面板](refactor/CANVAS_EDITING.md)
- [实验自定义改进与使用路径](refactor/CUSTOMIZATION_USABILITY.md)
- [多语言审查工作流](refactor/I18N_REVIEW_WORKFLOW.md)
- [研究室局域网架构规划](refactor/LAN_ARCHITECTURE.md)
- [业务流程与能力边界](BUSINESS_WORKFLOW.md)
- [开发、验证与发布](DEVELOPMENT.md)
- [代表实验与验证入口](refactor/BASELINE_EXPERIMENTS.md)
- [业务与技术术语](refactor/GLOSSARY.md)
- [当前实现与发布状态](refactor/IMPLEMENTATION_STATUS.md)
- [旧模型与迁移边界](refactor/LEGACY_MODEL_INVENTORY.md)
- [Legacy Protocol Migration Guide](refactor/MIGRATION_GUIDE.md)
- [操作员试跑与数据交接](refactor/OPERATOR_PILOT_GUIDE.md)
- [产品与工程优化路线图](refactor/OPTIMIZATION_PLAN.md)
- [每次发布检查](refactor/RELEASE_CHECKLIST.md)
- [Composer V2 可用性验收规程](refactor/USABILITY_STUDY_PROTOCOL.md)
- [PhysioFlow v0.6.0-beta.4 发布说明](RELEASE_NOTES_beta.4.md)
- [研究人员使用指南](USER_GUIDE.md)

## 技术接口与可选部署

- [Hosted Audit Integrity](refactor/AUDIT_INTEGRITY.md)
- [Single-Node Backup and Recovery](refactor/BACKUP_AND_RECOVERY.md)
- [Local-first Collaboration Change Sets 1.0](refactor/COLLABORATION_CHANGE_SETS.md)
- [PhysioFlow Declarative Component SDK 1.0](refactor/COMPONENT_SDK.md)
- [Trusted Control Handler Contract 1.0](refactor/CONTROL_HANDLERS.md)
- [Hosted Credential Protection](refactor/CREDENTIAL_PROTECTION.md)
- [PhysioFlow Data Contract V2](refactor/DATA_CONTRACT_V2.md)
- [Hosted Data Retention and Pseudonymization](refactor/DATA_RETENTION.md)
- [Deployment Asset Pipeline](refactor/DEPLOYMENT_ASSETS.md)
- [External Device Connector Contract 1.0](refactor/DEVICE_CONNECTORS.md)
- [Hosted Deployment Data Export](refactor/HOSTED_DATA_EXPORT.md)
- [Hosted HTTP API v1](refactor/HOSTED_HTTP_API.md)
- [Hosted Operations and Abuse Controls](refactor/HOSTED_OPERATIONS.md)
- [Hosted Service Contract 1.0](refactor/HOSTED_SERVICE_CONTRACT.md)
- [Participant Bootstrap Contract 1.0](refactor/PARTICIPANT_BOOTSTRAP.md)
- [Portable Deployment Contract 1.0](refactor/PORTABLE_DEPLOYMENT.md)
- [Public Participant Application](refactor/PUBLIC_PARTICIPANT_APP.md)
- [Single-Node Self-Hosting](refactor/SELF_HOSTING.md)
- [Hosted Tenant Capacity](refactor/TENANT_CAPACITY.md)
- [Hosted Tenant Isolation](refactor/TENANT_ISOLATION.md)

## 版本验证记录

- [UI / Block / Customization acceptance — 2026-09-05](ACCEPTANCE_REPORT_2026-09-05.md)
- [Runtime reliability follow-up — 2026-09-05](refactor/RUNTIME_RELIABILITY_AUDIT_2026-09-05.md)

## 架构决策

- [ADR-0001：Protocol Graph 是唯一可执行模型](adr/0001-single-protocol-graph.md)
- [ADR-0002：分离控制流端口与数据流端口](adr/0002-control-and-data-ports.md)
- [ADR-0003：使用版本化 Component Registry](adr/0003-component-registry.md)
- [ADR-0004：运行时采用确定性状态机](adr/0004-deterministic-runtime.md)
- [ADR-0005：原始事件使用 append-only Event Envelope](adr/0005-append-only-events.md)
- [ADR-0006：参与者界面使用声明式 UI 树](adr/0006-declarative-participant-ui.md)
- [ADR-0007：编辑器通过 Graph Commands 修改协议](adr/0007-graph-commands.md)
- [ADR-0008：预览与正式运行共享组件实现](adr/0008-shared-preview-runtime.md)
- [Architecture Decision Records](adr/README.md)

## 历史计划与审查

- [组件体系与元素功能 · 验收审查报告](refactor/COMPONENT_ACCEPTANCE.md)
- [Pilot Verification Report](refactor/PILOT_VERIFICATION_REPORT.md)
- [Refactor Completion Audit](refactor/REFACTOR_COMPLETION_AUDIT.md)
- [PhysioFlow 系统业务分析与重构开发计划书](SYSTEM_REFACTOR_PLAN.md)
