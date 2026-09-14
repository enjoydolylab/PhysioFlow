# 代表实验与验证入口

本页列出要核对的研究场景，不宣称每个场景都有单独 fixture 目录或已完成人工验收。此前规划的 `tests/fixtures/refactor/<id>/` 并不存在，实际测试入口如下。

| 场景 | 核对内容 | 当前自动化入口 |
| --- | --- | --- |
| 最小 Graph 实验 | 编排、验证、冻结、运行、恢复、导出 | [refactor-e2e.test.js](../../tests/refactor-e2e.test.js) |
| 随机刺激 | 消费顺序、重试、分支访问与耗尽 | [stimulus-randomization.test.js](../../tests/stimulus-randomization.test.js) |
| 问卷与恢复 | 连续问卷、保存失败、缺失资源、设备门禁 | [browser-runtime-scenarios.mjs](../../tests/browser-runtime-scenarios.mjs) |
| 旧 Block / Trial | 次数嵌套、不可满足约束、可行顺序 | [block-acceptance.test.js](../../tests/block-acceptance.test.js) |
| Emotion / Stroop / Go-No-Go | 模板结构、实际试次与语义 | [task-templates.test.js](../../tests/task-templates.test.js) |
| 编辑与小屏 | JSON 回读、控件位置、自定义尺寸与滚动 | [browser-layout-acceptance.mjs](../../tests/browser-layout-acceptance.mjs) |
| 公开参与者 | Bootstrap、Hosted 恢复和同步 | [e2e-participant-public.mjs](../../tests/e2e-participant-public.mjs) |

人工代表任务与通过标准见[可用性规程](USABILITY_STUDY_PROTOCOL.md)。真实设备和实际桌面安装的验证范围见[当前状态](IMPLEMENTATION_STATUS.md)。
