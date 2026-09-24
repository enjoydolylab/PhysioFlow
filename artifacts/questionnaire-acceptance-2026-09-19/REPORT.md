# 问卷条件与计时验收 · 2026-09-19

## 发现与修复

- 条件隐藏题目原先仍计入得分分母；提交现在仅对最终显示的题目计分，并过滤已隐藏题目的超时标记。
- 当前限时题作答后使后续题显示时，计时回调原先持有旧题目列表，可能直接提交问卷。计时器现在响应显示顺序变化，保留当前剩余时间，按更新后的题目列表推进。

## 验证证据

实际网页导入conditional-score.json，在QA-CONDITIONAL-SCORE会话填写no，使第二道必填且带正确答案的题目保持隐藏。页面显示1/1，提交正常结束。完整导出22文件，5条响应；score-verification.json核对correct=1、total=1、pct=100，hidden题目没有答案。若沿用修复前对全部题目计分的逻辑，此例会得到1/2、50%。

浏览器React回归另外验证：限时gate题输入yes，新出现必填followup；到期进入followup而不提交；填写followup后两题答案完整提交。该限时场景为自动浏览器验证，不宣称已在所选网页手动计时完成。

quality:refactor通过：372项测试、构建、lint零警告。Participant完整浏览器回归通过，包含新增条件计分与限时后续题场景。git diff --check通过。

## 未完成范围

问卷高级编辑的所有组合、随机化与条件依赖组合仍需扩展验收。正式文件夹、真实传感器及PhysioDB需要可用环境。代码保留在工作区，未提交或部署；目标尚未标记完成。

## 9月20日条件依赖补充

修复条件分支使用隐藏前置题旧答案的问题。现在仅已显示且已作答的前置题参与条件判断；隐藏父题后，所有依赖它的下级题也隐藏。未作答不再被not_equals误判为成立；数值0仍有效。

新增浏览器回归实际挂载问卷组件并操作：gate=yes→child=show→填写descendant→连续Previous返回gate→改为no→Submit。断言提交仅包含gate=no，child与descendant旧答案均不在结果中。这是自动浏览器场景，本轮未重新连接所选网页手动重复此操作。

conditions-browser.log记录完整Participant回归通过。conditions-quality.log记录374项测试通过、build通过、lint零警告。git diff --check通过。条件显示与问题顺序随机化的组合仍由既有配置校验明确禁止，不把该组合记为支持。
