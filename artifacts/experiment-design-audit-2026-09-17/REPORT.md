# PhysioFlow 实验设计与执行检查

日期：2026-09-17。源码基线：`c75ed96b4fedb4ccfb476770c68a49aa4ace9d34`，检查当前工作目录。原有未提交内容为文档修改。本轮未修改产品源码，新增复现脚本与本报告。

## 结论

确认 6 个问题，其中 3 个直接影响试次数量、响应有效性或反应时。基础自动化通过不能代表完整实验语义正确。建议先修复 P1，再让古口用真实实验验收；目前尤其不宜依赖嵌套循环和带反馈的响应节点来取得正式研究数据。

范围：Composer V2 的图连接与冻结、循环执行、响应节点、会话记录、导出；运行已有公开参与者浏览器回归，其中包含准备页、创作界面、恢复和保存场景，并追加真实 Chromium 中的定向复现。未使用真实传感器，未验收 Windows 安装包，也未对所有问卷、认知任务、旧模型组合做穷尽检查。

## 1. P1：嵌套循环静默少跑试次

- 复现：Start → 外层 Loop（2 次）→ 内层 Loop（3 次）→ Wait → 内层；内层 Exit 返回外层，外层 Exit 到 End。
- 预期：Wait 总计执行 6 次。
- 实际：配置验证通过、冻结成功，Wait 仅执行 3 次，会话仍为 `completed`；最终计数为 outer=2、inner=3。
- 原因：[runtimeMachine.js](../../src/runtime/runtimeMachine.js#L182) 使用会话级 `loopCounts[node.id]`，内层循环退出后不会在下一次外层迭代重新初始化。
- 影响：多 Block × 多 Trial 的设计少采一部分数据，操作者可能直到统计时才发现。
- 边界：Repeat sequence 快捷入口已有嵌套保护；手动构图及图配置验证/冻结仍可接受上述图。因此不能把快捷入口的保护视为全局保障。
- 修复建议：明确循环激活/嵌套语义并跟踪调用作用域；若暂不支持，应在验证、冻结与编辑阶段明确拒绝。不能简单在 Exit 清零而不检查非结构化回边。
- 验收：2×3、3×2、提前退出、暂停恢复及相同子流程多次调用，核对每一轮的执行事件与总次数。

## 2. P1：已按键的有效响应被反馈期间的超时覆盖

- 复现：Response 设置 `timeoutMs=500`、`feedbackMode='always'`；进入约 100 ms 后按 y，显示反馈。
- 预期：记录已取得的 y/yes 与按键 RT，反馈结束后进入下一节点。
- 实际：500 ms 的超时仍触发，提交 `value=null`、`response_key=null`、`reaction_time_ms=null`、`timed_out=true`。
- 同时复现：`autoAdvance=false` 时，已按键但尚未点击 Continue，也会被超时替换为空响应。
- 原因：[ResponseRunner.jsx](../../src/ResponseRunner.jsx#L111) 超时 Effect 只检查 `resolved`；反馈/等待确认尚未调用 submit，未停止响应窗口。
- 影响：有反应的试次误判为遗漏，正确率和超时率不可信。
- 修复建议：区分“已收到响应”和“已完成页面”，首个有效响应到达时锁定响应并停止响应超时；反馈和确认使用独立状态。
- 验收：时限前/临界点按键、无按键、反馈、手动确认、暂停恢复，分别检查最终唯一提交。

## 3. P1：统一 RT 记录包含反馈时间，且影响条件分支

- 复现：Graph 中放一个 Response，开启反馈、不设超时，并声明 `last_rt_ms`；约 165 ms 时按 y。
- 实际保存：组件 `reaction_time_ms` 值为 **165**；每条 response 的 `reactionTimeMs` 为 **1167**，`runtime.variables.last_rt_ms` 同样为 **1167**。
- 原因：[GraphRuntimeRunnerPage.jsx](../../src/GraphRuntimeRunnerPage.jsx#L195) 在整个组件提交时重新计时，而非采用响应组件捕获的按键 RT；第 208 行又把该值写入 `last_rt_ms`。
- 影响：统一导出 RT 列增加约 1 秒反馈时长；例如按 `last_rt_ms < 500` 做反馈/自适应分支，会把快速响应判成慢响应。关闭自动前进时还可能加入等待确认的时间。
- 修复建议：分别记录 response RT、节点停留时长及提交时间；统一 RT 应采用对应组件提供的响应时间，未响应时允许空值。问卷和认知任务的总耗时不能直接替代单次反应时。
- 验收：开启/关闭反馈及手动确认，按键 RT 与条件变量应保持一致；停留时长另存。

## 4. P2：同一个控制输出连接两条边仍可冻结，运行立即失败

- 复现：Start.next 同时连 End A 与 Wait，Wait.next 连 End B（使用两个 End 避免目标输入多连接错误）。
- 实际：`validateProtocolGraphConfiguration.valid=true`，`freezeProtocolGraph` 成功；开始运行即 `failed`，报 `requires exactly one next control connection; found 2`。
- 原因：[validateProtocolGraph.js](../../src/core/validateProtocolGraph.js#L177) 只检查必需控制输出“是否连接”，没有检查唯一目标；[graphCommands.js](../../src/core/graphCommands.js#L75) 也允许相同源端口连不同目标。
- 影响：实验作者可将不可执行图冻结为正式版本，直到运行才遇到错误。
- 修复建议：校验每个控制输出端口的边数，并在画布连接时阻止或明确替换已有边；随机/条件分支通过不同端口表达。
- 验收：普通 next、Condition true/false、Loop body/exit、Random 各分支端口重复连线，以及导入图。

## 5. P2：等待确认期间，后续按键仍会覆盖首次响应

- 复现：Response 设置 `autoAdvance=false`、不设超时、不显示反馈。先按 y，等待约 80 ms，再按 n。
- 预期：首次按键已进入确认画面，答案保持 y/yes（与组件内 `pressed` 防重复逻辑一致）。
- 实际：确认画面变成 `Pressed n — no`，RT 也更新为第二次按键时间。
- 原因：[ResponseRunner.jsx](../../src/ResponseRunner.jsx#L109) 键盘监听 Effect 缺少 `pressed`/`feedback` 依赖，旧 `commitKey` 闭包持续看到空状态，绕过首次响应锁定。
- 影响：无意多按或持续敲键改变已捕获答案与反应时。
- 修复建议：使用同步的“已接受响应”状态门禁，结合问题 2 的状态划分修复；仅补依赖还应测试同一渲染间隔内的多次输入。
- 验收：连续不同按键、键盘自动重复、反馈期间输入及暂停恢复，最终提交仍为首次有效响应。

## 6. P2：标为 TSV 的事件导出实际是逗号分隔

- 复现：调用 `buildGraphBidsBundle`，读取 `_events.tsv` 首行。
- 实际首行：`onset,duration,sample,trial_type,component_type,node_id,stim_file,value,accuracy`。按 Tab 解析得到 1 列，按逗号解析才得到 9 列。
- 原因：[graphExport.js](../../src/data/graphExport.js#L205) 写 `.tsv` 时复用 CSV 序列化函数。
- 影响：按扩展名使用 Tab 分隔的分析程序无法读出所需事件列。本轮未运行外部 BIDS validator，不将此结论扩大为完整 BIDS 合规审查。
- 修复建议：使用真正的 TSV 序列化，并检查字段中的 Tab、换行及缺失值；补充实际文件解析回归。

## 验证记录与复现

| 检查 | 结果 |
| --- | --- |
| `npm test` | 350/350 通过，无跳过 |
| `npm run lint -- --max-warnings=0` | 通过 |
| `npm run build` | 通过 |
| 公开参与者 E2E 及其运行/准备/创作场景 | 通过；由浏览器审查脚本包含的原有场景执行 |
| 嵌套循环、错误连线、TSV 格式定向复现 | 上述异常已复现 |
| 浏览器响应超时、连续按键、完整 Graph 保存 RT | 上述异常已复现 |

在仓库根目录运行：

```sh
node tests/audit-experiment-design-core.mjs
node tests/audit-experiment-design-browser.mjs
```

浏览器脚本需要本机 Chrome，使用独立临时浏览器配置、本地测试服务器和合成参与者数据。脚本输出观察结果，是问题复现工具；其已有场景 `passed` 不代表新增问题已修复，也不是修复后的回归断言。

证据：[核心复现结果](core-results.json)、[浏览器持久化与响应结果](browser-results.json)、[浏览器日志](browser-run.log)、[单测日志](unit-tests.log)、[构建日志](build.log)、[lint 日志](lint.log)。

## 后续真实用例验收

优先修复 1–3，再修复连线阻断和导出。与古口选一个包含“指导语 → 多 Block/Trial → 刺激 → 响应 → 问卷 → 导出”的实际用例；由实验设计先列出预期试次数、条件/刺激分配、退出规则和各字段含义，再逐条对照执行事件和导出文件。

通用 Trial/条件表、跨被试平衡分配、问卷/认知任务内部崩溃恢复仍是现有文档中的能力边界，并非本轮新发现或已完成验证的功能。当前结果也不能证明其余路径没有问题。
