# 自定义多选输入阶段

beta.20之后继续组件与参与者界面设计。Input新增multi_choice类型，与单选复用选项配置及空值/重复值检查；画布显示复选项，交互预览和实际运行使用同一Renderer。

已选值为字符串数组，并按选项配置顺序排列。必填字段至少选一项；可选字段未回答时提交空数组。校验拒绝非数组、重复值、未知选项和非字符串选项。选项组关联标题、必填和错误信息，每个复选框使用原生标签和禁用状态。原单选、单个checkbox和其他输入类型的数据契约保持原样。

532项测试、构建和零警告lint通过。实际Builder验证配置错误定位/修复、类型切换、数组试填，以及清空全部选择后的必填拦截。实际GraphRuntimeRunnerPage合成preview会话验证：先点yes再点0，保存后值为配置顺序["0","yes"]；可选未回答为[]；loadSession、response_submitted、responses.jsonl一致，CSV使用完整JSON数组单元格。证据artifacts/participant-multi-choice-stage/browser.json及runtime.json。

增加可选字段后，首次运行测试误选了第一个可选组；已修正为选择aria-required=true的必填组，并验证通过。这是测试定位问题，不是应用修复。

完整浏览器回归日志/tmp/pf-participant-multi-choice-browser.log，最终退出状态待核对。当前未提交、打包或推送；真人、设备和原素材验收缺口仍存在。

完整编辑器/运行/托管/SDK及多视口浏览器回归已确认退出0。本阶段从配置、输入校验、类型切换、交互预览到实际运行的保存/导出均已有软件证据，源码验收完成；下一步统一版本、提交、打包并推送工作分支。
