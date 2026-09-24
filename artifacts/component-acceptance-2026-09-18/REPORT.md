# 组件与编辑功能验收 · 2026-09-18

本轮在 http://127.0.0.1:5187 实际操作网页，另运行浏览器回归和自动检查。验收项目 QA complete component acceptance 已保存，恢复至10节点、9连线的有效基线；QA会话不是正式受试者数据。

## 本轮修复

- 零起点评分错误地从1开始：改用空值默认值，0正常显示及保存。
- 数字输入清空被转换为0：保留空字符串，使必填校验有效。
- 普通数字输入与问卷数字题未执行上下限校验：增加统一校验，拒绝非数值及越界值，允许合法0。
- 音频控件忽略 controls=false：按编辑配置渲染。
- 窄视口换行后的顶部工具栏遮住删除确认，实测误触返回项目：确认栏改为正常布局，随工具栏高度排列；修正“无法撤销”的错误提示。

## 实际网页与导出证据

| 范围 | 操作及结果 | 证据 |
|---|---|---|
| 输入边界 | 0–2评分包含0；0–10数字输入11被拒绝、0通过 | 01、02文本；导出 |
| 全部9种问卷题型 | Likert、单选、多选、VAS、SAM愉悦度、SAM唤醒度、数字、短文本、长文本均实际填写提交 | QA-COMPONENTS_session_bundle.zip |
| 问卷范围 | 0–5数字题输入6时Next被拦截，改0后通过 | 03-questionnaire-range.txt |
| 设备清单 | 未勾选Ready显示Required，两项勾选后通过 | 04-required-checklist.txt |
| 人工事件 | 空备注被拦截，多语言备注提交成功 | 05-required-operator-note.txt |
| 注视点 | 手动红色圆点实际显示、点击继续 | 06-fixation.png |
| Note/Junction与结束 | 自动经过两个辅助节点，进入结束页 | 07-session-complete.txt |
| 编辑节点 | 插入、复制；删除确认后10节点8连线，Undo恢复11节点10连线，Redo再次删除 | 实际网页操作；修复前遮挡问题已复现 |
| 快照 | 保存10节点基线、编辑后Restore恢复10节点9连线、Graph valid、Save | 08、09文本 |
| 导出 | 22个文件、15条响应；逐项比对0、多选数组、日中英文、引号及换行、人工备注 | export-verification.json |

## 覆盖清单与证据级别

本轮结合此前实际网页验收，覆盖全部20种可添加流程组件的代表性运行；不是所有配置组合的穷举证明。

| 流程组件 | 证据 |
|---|---|
| display.screen、display.media、input.rating、input.text、input.response | 前轮实际网页及导出；本轮屏幕输入边界补测 |
| input.questionnaire | 本轮全部9种题型实际网页与导出 |
| timing.wait、stimulus.attention-check、stimulus.custom-html | 前轮实际网页及回归 |
| stimulus.fixation、setup.device-check、operator.manual-event | 本轮实际网页必填和显示验证 |
| stimulus.screen-calibration、experiment.cognitive-task | 前轮实际校准、Stroop、Go/No-Go及导出 |
| utility.note、utility.junction | 本轮运行经过；未穷举自定义UI组合 |
| logic.condition、logic.random、logic.value-switch、logic.loop | 前轮实际分支、嵌套2×3循环、暂停刷新及回放 |
| core.start、core.end | 所有完整会话经过 |
| legacy.step | 兼容路径由现有回归覆盖，本轮未单独实际网页验收旧协议 |

11种参与者界面元素（Screen、Layout、Text、Media、Input、Button、Progress、Html、Divider、Rectangle、Ellipse）已通过浏览器内添加与结构有效性验证；复制、删除、Undo/Redo通过。该检查不等于逐个媒体设备播放验证。

编辑器浏览器回归同时覆盖自由画布移动、流程排序、缩放、嵌套布局、吸附、多选移动、撤销、Escape取消、锁定、几何有效性、媒体fit配置、变量、分组、可复用子流程、自定义组件及模拟设备。实际手动画布、冻结/新建版本证据见前轮报告。

## 检查结果

- quality:refactor：366/366测试通过，build通过，lint零警告。
- test:e2e、test:e2e:refactor-browser、test:e2e:participant-public 均通过。
- 布局回归：8种视口×3编辑器环境；Dashboard、Sessions、Analytics为主要控件检查，不是Windows DPI实机测试。
- git diff --check通过。
- 日志保存在本目录。代码保留在工作区，未提交或部署。

## 尚未完成的范围

不能据此宣称“所有功能全部验收通过”。媒体池全部组合、真实音视频播放及设备权限、远程YouTube、所有高级属性/快捷键组合仍未逐项手动覆盖；正式本地文件夹采集、真实OpenBCI/Mybeat、PhysioDB服务器需要对应环境。BrainFlow synthetic联调另见 ../brainflow-integration-2026-09-18/REPORT.md；此前流程证据见 ../experiment-design-fix-2026-09-17/REPORT.md。
