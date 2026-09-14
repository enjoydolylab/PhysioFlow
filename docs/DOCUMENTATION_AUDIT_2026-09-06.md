# 文档整理记录

日期：2026-09-06。基线：已发布的 beta.4，源码提交 `68a3451`。本轮只整理 Markdown 和文档检查脚本，不修改实验执行逻辑，也没有重新生成安装包。

## 当前业务入口

- [文档导航](README.md)：所有当前文档及历史材料的分类入口。
- [业务流程](BUSINESS_WORKFLOW.md)：角色、对象、两套协议模型、随机化、自定义、数据交接。
- [研究人员指南](USER_GUIDE.md)：创建至导出的操作顺序。
- [当前状态](refactor/IMPLEMENTATION_STATUS.md)：版本和验证范围的唯一汇总。
- [路线图](refactor/OPTIMIZATION_PLAN.md)：下一轮业务与界面体验计划。
- [开发指南](DEVELOPMENT.md)：构建、验证、发布和文档维护。

## 已纠正的过时信息

| 原问题 | 处理 |
| --- | --- |
| README 下载指向 beta.3，beta.4 仍写未发布 | 核对 GitHub Release 后更新版本、附件、日期与 commit |
| macOS 下载入口并无对应已发布包 | 删除虚假的下载入口，明确未发布平台 |
| Block / Trial 与新 Graph 混作同一套业务 | 分别说明旧层级、Graph Group/Subflow、专用任务内部试次 |
| 目标迁移表被当作已实现映射 | 重写术语与旧模型清单，强调迁移报告和语义复核 |
| 累计状态含多套冲突测试数与已完成工作 | 改为有日期的当前状态；历史内容通过固定 Git 链接追溯 |
| 发布清单永久全部打勾 | 改为每个版本重新记录的检查模板 |
| 不存在的 tests/fixtures/refactor 目录 | 改为实际测试文件导航 |
| 以固定文件数解释所有导出 | 分开 Graph 与旧协议包，补齐设备与通道字典，并说明 BIDS 风格导出边界 |
| Hosted API 称所有端点都需 Bearer | 补充公开兑换与运维/签名资源的例外 |
| 旧验收“全部通过”可能被理解为当前全系统通过 | 标注历史范围；最新报告说明仅部分控件与截图检查 |

## 删除与保留

删除两份内容重复且不断追加旧结论的文档：

- `refactor/COMPOSER_V2_GAP_ANALYSIS.md`：当前模型差异进入业务说明，后续缺口进入路线图。[原文](https://github.com/kyzzz22/physioflow-app/blob/68a3451c3f33dcb8cbf87f53d612bf0938e990d1/docs/refactor/COMPOSER_V2_GAP_ANALYSIS.md)。
- `refactor/EXPERIMENT_DESIGN_ANALYSIS.md`：业务能力进入业务说明，旧修复结论保留在版本历史和验收记录。[原文](https://github.com/kyzzz22/physioflow-app/blob/68a3451c3f33dcb8cbf87f53d612bf0938e990d1/docs/refactor/EXPERIMENT_DESIGN_ANALYSIS.md)。

删除内容可从 Git 恢复。历史立项计划、组件/试点/重构审查仍保留并标为历史；接口契约与 ADR 保留稳定路径。`refactor/` 中有大量仍适用的技术参考，未按目录名一概删除。

## 审查与校验范围

核对内容包括仓库 Markdown 目录、版本配置、发布附件、业务入口、迁移实现、导出文件与实际测试入口。技术契约保留其模块范围，不把此次文档整理描述为所有 Hosted 接口、安全性或硬件能力的重新审计。

使用 `node scripts/check-docs.mjs` 检查本地链接、文档导航覆盖、代码引用和 npm 命令；历史材料中的规划路径不强制当作当前文件。外部 URL 与章节锚点不属于该脚本检查范围。应用测试数量引用此前记录，未因文档修改重新计为通过。

本轮校验通过：52 份 Markdown、191 个本地链接、6 处代码路径引用、26 处 npm 命令；全部 docs 文档可从导航入口到达。`git diff --check` 通过。

后续业务改版应更新指南、状态、路线图和相应技术契约；历史验证只增加注记，不随意更改原测试结论。
