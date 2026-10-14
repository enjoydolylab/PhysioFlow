# beta.12 当前范围验收（2026-10-14）

整体目标仍为按照顺序推进。用户后续明确优先模板、配置和校验；本轮具体软件改进已交付，不将整体目标标为完成。

| 范围 | 证据 | 当前结论 |
| --- | --- | --- |
| 校验与配置定位 | navigation.json、validation-focus-actual.log；实际Inspector和Composer，节点/连接选择清理、当前选择筛选、远处问题节点进入视野 | 本轮软件验证通过，beta.12包内源码与当前源码一致 |
| 模板创建与配置 | template-config.json、emotion-template.json、template-save-failure-browser.log；Stroop/Go-No-Go非法参数拦截与数量摘要、情绪时长/顺序配置、保存失败保留参数 | 本轮软件验证通过，生产包模板创建保存打开编辑器通过 |
| 组件编辑保存再打开 | component-config-save.json；空数值不转0、配置校验阻止空时长，750ms修正存储重读一致；等待及固定模式边界回归 | 本轮软件验证通过 |
| 编辑器广泛回归 | integrated-browser.log；Composer、子流程、发布、Hosted和多语言多视口；功能修改后511项测试/构建/lint | 已覆盖场景通过；不声明真人效率通过 |
| Web交付 | package-beta12/browser.json、template.json、archive.json；实际启动、生产资源、模板保存、校验值、归档源文件一致 | beta.12已交付，旧beta.11保留 |
| 服务端与DB | beta.11安装/启动；beta.12原归档服务端/启动脚本/SDK逐项与beta.11一致；beta.9隔离DB短流程、完整结构、长记录和回答导出 | 历史证据保留；本轮不冒充所有DB场景重跑 |
| 原素材与正式设备 | 用户说明没有正式设备；实际原视频和原时长验收没有结果 | 待实际条件 |
| 真人试用 | 记录CSV仍0条；用户确认暂无 | 未完成，不能以自动测试补写 |

前五类编辑证据位于 artifacts/editor-progression-2026-10-14。beta.9 DB证据位于 artifacts/db-progression-2026-10-14/package-beta9-live 与package-beta9-full-db。本轮确认原始beta.12 ZIP校验值一致，关键编辑实现与当前源码逐字节一致。

当前没有仍在运行的编辑器验证任务。下一步需要实际使用者给出使用结果，或提出新的具体软件需求。未将新增文档或重复测试当作真人验收进展。版本与功能不继续无依据扩增。
