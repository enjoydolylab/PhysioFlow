# 旧版编辑器清理

已移除旧版文字 Builder、FlowCanvas、JSON 编辑视图，以及仅由旧编辑器引用的层级管理、资源编辑、问卷设计、属性检查和画布交互模块。

当前 ComposerV2 与 ParticipantUiBuilder 保留。旧格式方案打开后显示迁移入口，调用已有 migrateLegacyProtocolV1 创建新草稿，不覆盖原方案。旧格式运行、数据读取、迁移和共享核心逻辑继续保留。QuestionnaireEditorV2 仍由当前 NodeInspector 使用，保留。

验证：535 项自动测试通过；生产构建和 ESLint 零警告通过。旧版专用样式已移除；帮助面板及运行/准备页共享样式分别保留在 guide.css 和 theme/shared-controls.css。迁移入口支持日中英三语，并防止重复提交；保存失败不会报告迁移成功。

浏览器验证：旧方案打开迁移入口，375/1280 宽度适配，迁移后进入 ComposerV2；原方案内容不变，新图方案单独持久化。当前编辑器及帮助、运行准备、数据分析、管理连接页通过 12 视口回归。打包与推送仍待阶段交付。
