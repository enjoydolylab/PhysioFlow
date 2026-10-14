# 条件执行一致性增量

beta.17之后继续核对组件执行。数字输入2与合法数字字符串expected="2.0"此前校验通过，但equals按字符串比较得到false；not_equals也与数值含义相反。

运行时equals/not_equals在实际值为有限number时，将合法非空数字期望值按数值比较。文本实际值保持原字符串比较（"2"与"2.0"仍不同），布尔与contains沿用原规则。空值、布尔、数组和非有限值不作为数字0接受。compare绑定覆盖值采用同一规则。

新增测试覆盖小数形式、负零、负数、科学计数、空白包围数字、非法期望值和文本/布尔兼容；实际runtime完整条件分支验证score=2与expected="2.0"进入true_branch，事件result=true。此修改会纠正旧协议中以数字变量配数字字符串时的比较结果，协议JSON不自动改写。

源码尚未提交打包。全量质量与浏览器回归结果待进程最终退出后记录。真人/正式设备/原素材仍未满足整体目标。

525项测试、生产构建、零警告lint通过，日志/tmp/pf-numeric-execution-quality.log。完整编辑器/运行/托管/SDK及多视口浏览器回归已确认退出0，日志/tmp/pf-numeric-execution-browser.log。此增量保留源码，继续与后续配置执行核对汇总到阶段交付。

## 动态数字比较输入

greater/less各比较符在运行时验证实际值和期望值为有限number或非空合法数字字符串。null、undefined、空字符串、布尔、数组、对象和非有限值不再隐式转换为0或NaN后选分支。失败沿用runtime_failed记录和既有结束保存流程；运行页显示中日文检查输入变量/上游回答的说明。合法0、负数和数字字符串仍可用。

新增测试直接验证无效动态输入停止运行、记录runtime_failed且不生成condition_evaluated；实际GraphRuntimeRunnerPage合成运行在score=null时停止并显示日语说明。527测试通过，生产构建及零警告lint通过。证据artifacts/condition-execution-2026-10-15/dynamic.json及/tmp/pf-dynamic-comparison-tests.log、/tmp/pf-dynamic-comparison-quality.log。全局运行回归正在核对，日志/tmp/pf-dynamic-comparison-browser.log。

全局编辑器/运行/托管/SDK及多视口浏览器回归已确认退出0。本阶段条件执行的软件验收完成，下一步统一版本、提交、打包并推送工作分支；未达到真人/正式设备/原素材整体验收条件。
