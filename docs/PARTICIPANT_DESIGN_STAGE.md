# 组件与参与者界面设计阶段

用户在beta.18后选择继续组件与参与者界面设计。本阶段继续源码开发，大阶段验收完成后才统一打包推送。

## 数字输入范围设计

UiPropertyEditor支持number的可选Min/Max，清空保存null而非0；rating清空保留无效空值供修复。数字输入支持负数、小数和单值范围，实际HTML数字字段step=any。participant UI结构校验拒绝非数值上下限和反向范围，问题携带elementId。

ScreenChecks列出number/rating范围错误，点击定位退出预览、选择输入并聚焦Input minimum。配置保存后仍由ParticipantRenderer的既有响应验证检查上下限；未修改协议数据契约。

tests/browser-participant-number-bounds.mjs验证实际Builder的错误定位及焦点、清空可选边界、修复范围、JSON序列化后挂载实际Renderer、越界3被拒绝、0和-1.5正确提交。新增核心边界测试通过。529项测试、构建和零警告lint通过，日志/tmp/pf-participant-number-quality.log。浏览器证据artifacts/participant-design-stage/number-bounds.json。

该证据使用隔离浏览器与合成配置，不代表真人体验或完整实验。下一步继续检查响应控件的类型切换、操作反馈和设计器预览一致性；暂未提交、打包或推送。整体原目标仍包含真人/设备/原素材验收缺口。

## 作答错误反馈与键盘操作

ParticipantRenderer提交失败后聚焦第一个无效控件；输入修正时重新校验已报错字段，即时移除旧提示。输入通过唯一id关联标签，aria-invalid与aria-describedby关联错误，提示使用alert。量表使用有名称的group与按钮aria-pressed，保持原0分和值类型，复选框仍输出既有yes/空字符串契约。数值范围提示补齐中日文。

实际Renderer浏览器验证四种输入共同提交：空提交聚焦首错；越界数字出现日语范围提示；Enter选择量表0分；第二次提交聚焦剩余数字错误；修正后无需再次提交即清除提示，最终text/number/rating/checkbox数据保持原类型。证据feedback.json。首次键盘夹具未发送Enter字符事件，修正CDP输入后通过。

全局回归暴露独立Builder没有LanguageProvider时新增useT调用失败；useT已提供默认日语回退，保留独立嵌入支持。修复后全量质量与全局浏览器回归正在重新核对，不能将第一次失败记录当成通过。源码继续保留本地。

修复后的529项测试、生产构建、零警告lint及完整编辑器/独立Builder嵌入/运行/托管/SDK、多视口浏览器回归均通过（退出0）。日志/tmp/pf-participant-feedback-quality.log、/tmp/pf-participant-feedback-browser.log。原数字范围设计至实际提交的浏览器场景也已回归通过。本次仍未提交、打包或推送。

## 设计器交互预览

预览默认仍仅作显示检查，新增试填回答、重置和已校验提交值查看。ParticipantRenderer提供显式previewInteractions开关，复用实际响应校验与按钮动作，但保留preview呈现模式；不会创建运行、触发流程跳转或连接采集服务。PreviewSession仅在组件内存中保存回答，方案变化或重置时重新开始，编辑回答后清除旧提交结果。进度仍为既有预览示例值，不是正式运行状态。

实际Builder浏览器验证默认提交禁用，进入试填后必填/范围检查、0回答和setVariable动作值展示、修改后结果清除、重置空白。前后方案JSON和loadSessions结果一致。1280/375预览工具无横向溢出，窄屏截图已视觉检查。证据interactive-preview.json及preview截图。529项测试、构建与零警告lint通过，完整浏览器回归尚待最终退出核对；日志/tmp/pf-interactive-preview-quality.log与/tmp/pf-interactive-preview-browser.log。

完整浏览器回归已确认退出0。数字输入配置、作答反馈和交互预览三部分构成本轮参与者界面设计阶段，源码验收完成。下一步统一更新版本、提交、核对成品包并推送工作分支。真人、正式设备与原素材条件仍未满足整体目标。
