# 组件配置一致性阶段

beta.16之后继续实验设计与组件编辑，不立即提交、打包或推送。

随机分支B/C/D的数字字段声明emptyValue=null；NodeInspector清空时恢复自动权重，显式0仍保存0。原B分支说明要求留空使用1−A，但此前空字符串会被运行时转换为0，造成配置与执行不一致。

随机显式权重、循环次数、认知任务各trial时长拒绝空字符串、布尔及数组的隐式数字转换。随机null保留原默认语义，认知任务允许fixation/ITI显式0，响应窗仍必须大于0。非字符串trialId产生定位错误而非校验器崩溃。

实际Composer浏览器验证清空B保存null，再输入0保存0。新增核心测试核对无效输入及合法值边界；全量518测试、生产构建和零警告lint通过。证据artifacts/component-config-2026-10-15/random-weights.json及/tmp/pf-component-numeric-quality.log。

下一步继续检查随机实际连接分支的权重总和和运行校验一致性，再统一验收该阶段。真人、设备、原素材条件仍未满足整体目标。

## 随机已连接分支总权重

提取randomBranchWeights供配置校验和运行时共用，保留既有null默认和输出顺序。只统计实际连接的a/b/c/d，已连接总权重为0时生成config.random_weight_total_invalid；运行时也拒绝非有限总值。中日文定位提示补齐，中文权重范围纠正为0–1。

直接测试验证默认B=1−A与实际runtime事件中的归一化权重一致；未连接C=1不能掩盖A/B全零；单个分支零权重仍合法。实际Composer将B改0后显示总和错误，改1后错误消失。521测试、生产构建及零警告lint通过，日志/tmp/pf-random-weights-quality.log，浏览器证据random-weights.json已更新。初次新增runtime测试遗漏显式开始时间，补齐测试夹具后通过。

下一步检查循环/条件配置的剩余运行前校验，以及组件修改后的整体运行回归。源码尚未交付。

## 循环条件与普通条件保持一致

conditionInputType可解析until输入类型；有绑定或数据边、且实际配置了operator的循环规则复用conditionExpectedError。数字/布尔比较错误定位到untilRule.expected；无until输入的规则沿用既有忽略语义。NodeInspector的循环比较值支持变量/输出绑定下的数字、布尔输入，真值判定隐藏未使用的比较值，中日文规则说明已补齐。

核心测试覆盖数字空值/0/负数、布尔空值/false/非法大小比较、真值判定和未绑定规则。实际日语Composer显示空数字错误，输入0后消除，切换is_truthy后隐藏比较值；原condition浏览器回归也通过。522项测试、构建、零警告lint通过。证据loop-until.json及/tmp/pf-loop-config-quality.log。完整浏览器回归正在核对，必须等待最终退出结果后再认定阶段验收完成。

整体编辑器/运行/托管/SDK及多视口浏览器回归已退出0，日志/tmp/pf-component-stage-browser.log。本阶段配置一致性的软件验收完成，下一步按用户要求统一版本、提交、打包与推送工作分支。整体目标仍有真人/正式设备/原素材证据缺口。
