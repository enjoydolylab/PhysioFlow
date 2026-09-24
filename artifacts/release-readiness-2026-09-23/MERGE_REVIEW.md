# 古口女士代码快照对比与移植记录

## 当前摘要（2026-09-24）

已重新核实用户提供的 ZIP：425 个条目，CRC 检查通过；SHA-256 为 `614bf046d5f9b200555fbb48931e0db9b06dc6db2223d28cb46145084b12e1f3`。以下正文保留开发过程，早期“待移植”状态请以本摘要和后续验证记录为准。

| 项目 | 当前状态 |
|---|---|
| balanced-halves 随机分配 | 已移植；算法测试和网页预览通过，原始40视频播放仍缺素材 |
| SAM dominance | 已移植；实际答题、必答校验和导出通过，移动端验收待补 |
| 组内批量修改 | 等待、问卷和媒体展示已实现；网页编辑及导出已检查，媒体实例仅证明绑定身份保留 |
| Test Run 返回上一页 | 本地新增，线性问卷回退、原始回答保留、分析和回放已验收；跨循环、媒体、刷新恢复待补 |
| Protocol 导出通知 | 已实现并验证 Graph 网页入口；表示生成并发起下载，不声称磁盘写入完成 |
| 版本删除与冻结 | 可恢复移除、恢复、冻结版本派生和关联历史会话读取已网页验证 |
| 矩阵问卷、媒体加载相关上游变更 | 仍需逐项评估，不能宣称整个 ZIP 已合并 |
| BrainFlow / PhysioDB | 保留本地集成；真实设备和新 PhysioDB 接口端到端联调仍未完成 |

最新完整质量检查：`npm run quality:release` 通过，408 项测试、Build、Lint 和浏览器套件；日志见 `quality-release-20260924.log`。最终交付限制见 `RELEASE_NOTES_DRAFT.md`。当前工作区未提交、未发布；ZIP 没有 Git 历史，文件差异及语义冲突审查不能替代三方合并验证。

源 ZIP：/Users/mac/Downloads/shibaura开题相关/physioflow-jikken-lab-main.zip
ZIP comment 提供的提交标识：c4bc63579a1e6f9a7c05dfa62a3f49039d0bd4a1。
独立解包目录：/tmp/physioflow-jikken-review-20260923/physioflow-jikken-lab-main。
无 AGENTS.md。ZIP 不含可用 Git 历史，本地没有该 commit object，尚不能计算共同祖先或正式三方合并冲突。

## 文件比较证据

只比较本地各引用跟踪的 src 文件：

| 本地参考 | 与 ZIP 相同 | 内容不同 | ZIP 中缺失 |
|---|---:|---:|---:|
| HEAD c75ed96 | 140 | 64 | 13 |
| 本地缓存 origin/main 99c5b2b | 23 | 29 | 2 |
| 本地 main 5192717 | 12 | 38 | 14 |

各引用的文件总量不同，不能据比例推断祖先。当前工作区另有未提交修复，逐功能审查而非覆盖。上述是文件差异证据，不是已证实的 Git merge conflict 数量。

## 合并清单

| 功能 | ZIP 中证据 | 决策/状态 |
|---|---|---|
| balanced-halves | core/stimulusRandomization.js 的 balancedHalfAssignments | 已移植类别拆分与半场配额；保留本地 Mulberry32、legacy 选择及完成历史规则；待网页验收 |
| SAM dominance | questionnaireModel.js、SamFigure.jsx、表单/编辑器相关改动 | 需要整体移植并检查图片资源；不能只让 validator 接受类型 |
| 视频/问卷批量修改 | core/sharedNodeEdits.js、编辑器相关调用 | 待移植；保留目标 ID、条件引用及刺激身份；需加上本任务要求的组内范围验收 |
| 矩阵问卷 | questionnaireMatrix.js 与表单改动 | 待评估并按原始实验需要移植，保留本地隐藏题/计分修复 |
| 媒体显示和加载检查 | mediaPresentation.js、mediaReadiness.js、mediaPerformance.js | 待移植评估，与本地资源重试/暂停修复逐块对照 |
| 退出 Test Run | TestRunExitButton.jsx、app/testRunExit.js、currentRunQueue.js | 已实现的是“结束测试回编辑器”，不是“返回上一个节点”；不能替代新增需求 |
| 返回上一页 | 本次检查未找到可直接采用的实现 | 按 RELEASE_PLAN.md 的访问快照方案开发 |
| 分组重复编辑 | ZIP 缺少本地 repeatSegment.js、RepeatSequenceEditor.jsx、TrialGenerator.jsx | 保留本地实现，新增真实网页用例覆盖 |
| BrainFlow | ZIP 缺少本地 brainflowConnector.js | 保留本地集成，不能用 ZIP 覆盖运行器 |
| 分析修复 | ZIP 缺少本地提取的 analysis helper 文件 | 保留已修复的时间线、响应、窗口与会话过滤逻辑 |

明确的语义冲突：ZIP questionnaireModel.js 没有本地 visibleQuestionnaireQuestions，覆盖会回退条件分支修复；ZIP 随机算法仍使用 LCG 低位取模，覆盖会回退分布修复；运行器覆盖会丢失设备和操作菜单修复。

## 已移植随机算法的验证

新增 tests/balanced-halves.test.js：100 个种子、40 素材、8 类，每半场 20，每类 2/3；全部素材不重复；Retry 与恢复的历史保持分配。非法半场 metadata 与缺失 category 明确报错。连同现有 stimulus-randomization 用例 11/11 通过。

此结果为核心算法验证，不是网页验收，也不表示整个 ZIP 已合并。原始 JSON 仍因 40 处 sam_dominance 不支持而无法通过配置校验，下一步须完成其模型/表单/编辑器移植，再以原始协议做网页验收。

## SAM 移植进度（后续更新）

已合入 sam_dominance 类型、预设、尺度编辑和答题数值验证；V2 答题渲染接入第三维。SamFigure 使用 ZIP 中提供的 16 张 SAM 图片（含偶数档中间图），保持 1–9 数值选择。保留本地 visibleQuestionnaireQuestions、暂停与数值校验逻辑，没有整体覆盖上游问卷表单。

实际网页：在 http://127.0.0.1:5187 通过 Import JSON 导入用户原件，成功进入 210 节点编辑器并显示 Graph valid；点击 01/40 SAM，三道题均保留，第三题编辑器选中 sam_dominance，Min=1、Max=9，英文题干 Rate dominance.。原始协议配置校验 valid=true，证据 protocol-validation-after-sam.json。

全量 quality:refactor 通过（388 tests、build、lint，日志 /tmp/physioflow-sam-quality.log）。尚未完成实际答题、图像视觉验收与导出核对；矩阵布局和其它旧版入口仍待逐项合入，不能据此将 P01 全项勾选。

## SAM 网页答题与导出验收

通过原始协议第一份 SAM 派生出的三节点副本 sam-runtime-fixture.json，实际导入并运行 QA-SAM-RELEASE。第一维漏答 Next 和第三维漏答 Submit 均被 Required 阻止。实际选择 valence=3、arousal=6、dominance=9 并完成，页面显示 Session data saved；下载 23 文件数据包，responses.csv 三个值逐项一致。valence/dominance 的全部九档图片加载成功，第三维截图已实际查看。

发现视觉改进项：1280px 视口下九档折成两行，后续须调整为保持量表连续可读的布局。矩阵同屏布局仍未移植。该短副本证明 SAM 实际答题链路，不替代原始 40 视频完整实验验收。导出 ZIP 和 sam-manual-result.json 已归档。

## Protocol 导出通知实现与网页验证

App.jsx 中 Graph/旧版两个 Export 入口共用 handleProtocolExport；成功生成并触发浏览器下载后显示带文件名、持续 6 秒的 role=status 通知，支持中文/日文/英文。序列化或下载触发抛错时显示错误对话框。普通 a.download 没有磁盘完成回调，因此文案准确表述“已生成并发起下载”，不声称已写入磁盘。尚未实现可确认 close() 完成的保存器路径。

实际在 Graph 编辑器导出 QA SAM release acceptance，DOM 中确认完整成功提示；下载文件 /Users/mac/Downloads/QA SAM release acceptance.protocol-graph.json 可解析，graph 与 sam-runtime-fixture.json 完全一致，三种 SAM 题型全部保留。Build、Lint 通过（/tmp/physioflow-export-build.log、/tmp/physioflow-export-lint.log）。旧版与失败路径、中文日文提示的网页验收尚未执行。

## SAM 单行布局修复

participant-ui.css 为 SAM 单独启用不折行布局与横向溢出滚动，选项保持至少 44px 宽。实际运行 QA-SAM-LAYOUT，1280px 视口下 valence 和 dominance 九个选项的 top 均为 212.28125px、宽约 56.22px；valence 截图确认九档连续同排、图片及数字完整。实际答题 1/5/9 并提交。小屏滚动行为仍待专项验收，不能据桌面结果宣称移动端通过。npm run build 和 git diff --check 通过。

## 组内批量内容修改首轮实现

已移植 core/sharedNodeEdits.js，新增 Inspector 的 GroupBatchEditor：明确列出同组兼容目标，问卷仅匹配相同 questionnaireKind，媒体仅匹配类型；一次 commit 应用，复用既有整体撤销。冻结时不展示操作入口。复制问卷内容保留目标 questionnaire/question ID 并映射条件引用；复制媒体画面保留各节点自己的素材、池与时序。组外节点不参与。

quality:refactor 通过（该轮 388 项既有测试、Build、Lint）；随后新增两项定向测试通过，覆盖目标 ID/条件重映射、源与组外数据不变、无共享可变对象、非法目标原子拒绝。尚未实际网页验收批量操作和撤销，等待时间批量修改也未实现；不能将 B01/B02 全项标为通过。界面文案国际化仍待补齐。

## 组内等待时长与冻结保护

新增 applyGroupWaitDuration 及组内批量面板的等待节点分支：从源等待复制 durationMs 到同组等待节点，保留画面内容，不触及组外节点；支持合法零时长，拒绝 NaN/负数及不兼容目标。三种批量命令均在核心入口拒绝 frozen 协议，避免仅靠隐藏按钮保护。

新增定向测试涵盖组外隔离、源不可变、零值、非法时长及冻结拒绝。quality:refactor 全部通过：393 tests、Build、Lint；日志 /tmp/physioflow-group-wait-quality.log。实际网页批量应用和撤销仍待执行，不视为 GUI 验收完成。

## 批量网页验收发现问题与修复

实际导入 group-wait-fixture.json：源 Wait 0=1500，组内 Wait 1=2500，组外 Wait 2=3500。点击应用后 Wait 1=1500，组外仍3500。撤销检查发现节点点击本身写入拖拽撤销记录：已改为超过3px拖拽阈值才记录历史。进一步操作发现批量面板与 RepeatSequenceEditor 同层 key 都可能是节点ID，导致重复面板；已给批量面板增加 batch: key 前缀。尚需刷新后重跑撤销/重做验收。拖拽修复的 Build/Lint 通过；key 修复后尚未重跑。不能将撤销标为通过。

## 撤销修复后的网页复测通过

保存测试项目并刷新清除热更新留下的重复 DOM 后，重新打开 QA group wait batch。Wait 1 初始2500ms；选择 Wait 0 后批量面板数量为1。点击应用再选择 Wait 1：1500ms；一次 Undo：2500ms；一次 Redo：1500ms；选择组外 Wait 2：仍3500ms。保存成功。此次实际网页证据覆盖等待时长批量应用、节点切换、撤销/重做及组外隔离。问卷/媒体批量路径仍待单独网页验收。

修复后 quality:refactor 通过：393 tests、Build、Lint；日志 /tmp/physioflow-batch-recheck.log。

## 问卷批量内容网页验收

实际导入 group-questionnaire-fixture.json，Questionnaire 1/2 同组，3 在组外。应用1到2后，2的题干为 Prompt from trial 1；Undo 恢复 Prompt from trial 2；Redo 后导出，2再次为源题干，3仍为 Prompt from trial 3。下载 JSON 逐项断言通过：三个 questionnaire_id 和 question_id 均保留各自试次编号，只有2的题干被更新。已保存项目，证据 group-questionnaire-manual.json。本例仅一个目标题目，复杂条件和多目标仍需扩展网页覆盖。

## 媒体批量绑定修复

代码核查发现上游 applyVideoScreenToAll 只保留目标 Media.props，而 sourceUrl 等 bindings 仍从源复制；ParticipantRenderer 的绑定值会覆盖 props，可能导致不同试次播放源节点刺激。已保留目标 sourceUrl/assetId/mediaType 绑定，目标没有绑定时移除源身份绑定，仍复制样式绑定。新增定向回归验证动态目标、静态目标、原始协议不变和目标时序保留；六项批量相关测试与 Build 通过。此处为代码与测试证据，媒体批量实际网页验收仍未完成。

## 媒体批量网页操作与导出检查

通过 UI 导入 group-media-fixture.json，选择 Media 1，面板仅列出同组 Media 2。实际点击应用并导出：Media 2 背景变为源的 #112233，config 与 UI 内 sourceUrl 均保持 media2.mp4，时长保持2000ms；组外 Media 3 背景保持 #778899。下载文件断言通过并保存项目。本例用 example.test 地址辨认素材身份，只验证编辑/导出，不作为真实视频播放证据；动态绑定播放、媒体批量撤销与多目标仍待验证。

## Test Run 返回功能：核心状态操作

新增 runtime/testNavigation.js：记录实际可展示节点访问，包括同一循环节点的不同访问；回退恢复变量、输出、循环与随机状态，同时保持事件序号和时钟单调，追加 test_navigation_back 与 component_entered，并记录旧访问的 superseded 序号区间。核心命令仅接受显式 preview；正式、hosted、未知模式、第一页、结束页和跨会话历史均拒绝。

3项定向测试通过、Lint通过。尚未接入运行器按钮、checkpoint、媒体/计时取消、旧回调失效及分析过滤。因此本模块仅为实现基础，返回上一页功能仍未交付，不能作为用户可用功能宣称完成。

## Test Run 访问历史接入

GraphRuntimeRunnerPage 现仅在显式 preview 且非 hosted 时记录进入的展示访问，并将 test_navigation_history 写入自动/重试恢复快照，恢复时读取；Retry 替换当前访问快照而非当作上一页。已有 attemptKey 检查可拒绝过期提交，界面以 attemptKey 重挂载。

397 项测试通过。新增闭包依赖触发的 lint 警告已用运行模式 ref 修复，随后 Lint/Build 通过。按钮尚未启用，分析排除旧访问、回退计时器清理和刷新后的实际导航仍待完成；本轮不能声称返回上一页已可用。

## 回退回答追溯与分析基础

新增回答 eventSequence 关联到 response_submitted 事件；supersedeTestResponses 按回退事件的序号区间和 session 标记旧回答，保留原始行、不影响其它会话。responseAnalysisData 排除已标记的旧回答。新增定向测试与相关分析测试共10项通过。回退按钮尚未接线，标记函数尚未由运行器调用，不能宣称端到端旧回答处理已完成；CSV 标记列、时间线/窗口与整体响应计数还需同步处理。

## 返回按钮与回答导出接通

Graph 测试运行的实验员操作区新增 Previous page (test)，第一页/非等待状态禁用，正式及 hosted 不显示；处理函数再次检查模式与访问历史。回退调用逻辑状态恢复、标记旧回答并追加审计事件；新 attemptKey 触发现有组件重挂载、计时 effect 清理和旧提交拒绝。恢复快照继续保留访问历史。

responses.csv 与数据字典新增 event_sequence、superseded_by_event_id，原始回答保留；响应图表和 Analytics 响应计数排除已替代记录。quality:refactor 通过：399 tests、Build、Lint（/tmp/physioflow-back-button-quality.log）。尚未做实际网页回退测试；时间线/分析窗口、旧恢复快照兼容、答案预填和多次跨循环回退仍待验证或完成，不能作为最终验收通过。

## 返回上一页首次真实网页验收

QA-BACK-PAGE：第一页按钮禁用；回答3进入第二节点后按钮启用；点击返回确实回到第一节点，完成次数从1恢复0，按钮再次禁用。重新回答8，再依次回答第二/三节点5/6，运行结束并成功保存。下载包检查第一节点两条答案：旧3有 superseded_by_event_id，新8为空；16个事件序号严格连续。ZIP已归档。该例覆盖线性问卷回退，不代表计时/媒体/循环/恢复、正式隐藏及所有分析视图已通过。

## 回退分析窗口修复

computeWindows 现在将被回退替代的旧窗口标记 invalid，原因 Superseded by test navigation；未结束就离开的窗口在回退事件处关闭，避免其与后来再次进入同节点的完成事件错误配对。有效新窗口保留正常时长。窗口相关两项测试通过，覆盖 A完成→B进入→返回A→A完成→B完成的配对与失效标记。该共享函数用于界面与 analysis_windows.csv；新的实际网页窗口导出验收仍待执行，TimelineView 单独逻辑尚需同步。

## 回退时间线一致性

buildTimeline 保留所有实际展示，已被回退替代者显示 superseded 状态；中途离开的访问在回退事件关闭，后来重新进入正确配对。进入事件以 eventId 为优先键，避免同节点同毫秒展示覆盖。新测试覆盖完整回退序列与原始事件不可变，时间线两项定向测试通过。窗口与时间线修改后的 quality:refactor 通过：401 tests、Build、Lint（/tmp/physioflow-back-analysis-quality.log）。实际 Analytics 视图与导出的一致性仍需网页核验。

## Analytics 网页发现事件注册遗漏并修复

实际 Review QA-BACK-PAGE，响应分析已排除被替代记录（6行，含3行超时元数据），但完整性为 INVALID，原因 Unknown event type test_navigation_back；完成次数仍把旧完成计为4。已注册新事件，并使新生成完整性报告统计有效完成3、有效响应6、raw_responses8，回退记 attention 提醒。用实际下载 ZIP 重新评估断言通过：零错误、一次回退提醒，证据 back-integrity-recheck.json；Lint通过。

已保存会话的旧 integrity 缓存不会因源码改动自动更新，页面仍可能显示旧报告；后续需修复读取时重新评估或提供重检，再实际网页验证。不得直接改写历史文件隐藏旧缺陷。

## 分析页即时重评网页验证

Analytics 读取 Graph session 后根据原始 protocol/events/responses/runtime 重新生成内存中的 integrity，未写回历史存储。实际切换 QA-SAM-LAYOUT→QA-BACK-PAGE 后，旧 Unknown event type 错误消失，显示 ATTENTION、3 Completed steps、6 Responses 与一次测试回退提醒。Build/Lint通过。Dashboard 摘要及其它读取旧摘要的视图尚未统一重评，仍可能显示历史 INVALID；需继续处理展示一致性。

## 会话摘要与详情统一检查

Graph integrity 增加 assessment_version；storage.loadSession 统一内存重评，loadSessions 对旧版本摘要读取详情并重评，新版摘要直接使用。Analytics 移除重复私有实现。没有重写历史文件。网页刷新后 Sessions 中 QA-BACK-PAGE 显示 attention，与分析页一致。quality:refactor 通过（401 tests、Build、Lint）。旧会话较多时会增加详情读取成本，尚未做大规模存储性能验收。

## 回退事件契约补强

test_navigation_back 现校验起始序号为正整数、范围不倒置、终点恰为回退事件前一序号，且必须提供 fromNodeId。Graph 完整性报告拒绝非 preview 会话出现回退事件。检查版本升级为3，旧摘要会重评。事件契约与相关导出测试5项通过、Lint通过；不替代正式运行按钮隐藏和恢复流程的网页验收。

## 回退会话事件回放修复

createRuntimeReplay 在 test_navigation_back 处从对应历史帧恢复变量、输出、循环与决策状态，保留真实 attempt 计数及连续事件序号；旧帧仍可查阅，不删除原始历史。拒绝指向错误节点/无效访问的回退范围。测试验证旧回答3→回退恢复初值0→重新回答8，最终只计一次有效完成。quality:refactor 通过：403 tests、Build、Lint（/tmp/physioflow-back-replay-quality.log）。回放界面的实际操作仍待验收。

## 回放界面实际验收

通过 Manage sessions 打开 QA-BACK-PAGE，Runtime replay 初始展示16/16完成。使用滑块Home到0并点击Next五次，5/16显示 Questionnaire 2、waiting、Outputs(1 nodes)；再次Next到6/16，test_navigation_back 显示 Questionnaire 1、waiting、Outputs(0 nodes)，符合回退恢复逻辑。未修改研究者审查结果。该网页例无变量定义，变量恢复仍由定向测试覆盖。会话详情 responses=8 为原始行数，与分析页有效6区别尚需明确文案。

## 回答记录计数文案验收

会话详情明确显示 raw/effective/superseded response records，分析指标改为 Effective response records，避免把问卷附加元数据行称为独立答案。补充中日翻译。实际重新打开 QA-BACK-PAGE，显示原始8、有效6、已替代2，与导出记录一致。Build通过。此调整不更改原始响应数据。

## 完整 Release 检查链结果

2026-09-23：npm run quality:release 退出码 0；403 项单元测试通过、0 失败，Build/Lint 及 legacy、refactor、public participant 浏览器检查通过。完整日志保存为 quality-release.log。布局检查覆盖 8 种 CSS 视口，并非真实 Windows DPI 验收。自动化结果与前述手动网页证据分别记录，不代表原始 40 视频、全部组件、真实设备或 PhysioDB 联调已通过。

## 平衡随机配置预检修复

发现 balanced-halves 在缺少 metadata.half、素材类别或半场配额不合法时，配置校验未拦截，GraphSessionSetup 直接计算分配可能导致渲染报错。配置校验现在使用同一平衡分配契约返回带节点位置的错误，同时拒绝不支持或同组不一致的随机模式；设置页仅在配置有效时生成分配预览。普通 shuffle 行为保留。

新增回归覆盖有效配置、缺少半场、缺少类别、无法平衡的半场数量和未知模式。定向6项通过；quality:refactor 通过（404 tests、Build、Lint），日志 /tmp/physioflow-balanced-validation-quality.log。此项新的错误提示与运行阻止仍待实际网页验证，不能沿用修改前的完整 quality:release 结果宣称本次浏览器验收通过。

## 平衡随机预检实际网页验收

通过 Import JSON 导入由原始协议派生、仅删掉首个媒体节点 metadata.half 的独立副本 invalid-balanced-fixture.json。页面弹出 Import failed，明确显示媒体池 imgnobio_emotion_videos 与 metadata.half = 1 or 2 要求，未进入异常运行页面。原始协议未修改。

随后打开现有 学術変革 experiment：编辑器显示 Graph valid；Preview run 正常进入准备页，显示210节点、209连接、configuration checked及40项随机预览。媒体检查明确提示 Missing local asset，未将缺失视频视为可运行。此例证明异常导入拦截和有效配置准备页可用，不证明原始40视频播放完整验收。

## 随机模式说明与重新生成验收

准备页原先统一使用普通 shuffle 的“按执行消耗素材”说明，不准确描述 balanced-halves 的节点半场预分配。现按实际启用模式分别说明；平衡模式说明类别平均拆分、重试保持、重复访问使用下一周期、分支绕过可能导致部分预分配素材未展示。实际网页确认显示平衡说明，未显示普通 shuffle 专属说明。Build通过。

点击 Generate another order 后，从页面40个素材名称核验顺序发生变化、无重复、两半场仍各20个且8类别各2或3个。这里只验证准备页随机预览，不替代完整运行的刺激呈现数据验收。

## 冻结版本随机池命令保护

检查发现组内批量命令已拒绝 frozen，createStimulusPool 核心命令却无对应保护。现于创建 ID、池和节点绑定前拒绝冻结协议，防止调用者获得带冻结状态却已改动配置的副本。新增测试覆盖单独创建与创建并绑定，确认原协议不变且未生成新 ID；随机池相关10项测试通过。GUI 冻结入口及其它编辑命令的完整验收仍未由此证明。

## 项目版本历史入口补齐

网页检查发现项目显示2个版本却只能打开最新草稿，无法从卡片进入旧冻结版本。新增可展开 Version history，逐版本显示版本号/状态与 Open 入口。实际 QA nested 2 x 3 - locked responses 展开后显示 v2 draft 与 v1 frozen，并成功打开 v1。Build通过。此功能补齐版本查看入口，不等同于已完成废弃版本删除或新建草稿的完整验收。

## 冻结版编辑控件状态修复

实际打开历史 v1 frozen 后点击 Screen 插入，节点未增加，但按钮仍启用；Label 输入框也看似可编辑，仅由 commit 拦截。这会误导用户。现冻结时禁用组件面板按钮、Inspector 属性 fieldset 与连接删除按钮。Build通过；网页确认 Screen 插入、Label 与协议名称的 isEnabled 均为 false。尚未覆盖所有高级面板。另发现从旧版本创建新草稿按 source.version+1 编号，已有更新版本时可能重复版本号，后续需修复并验证。

## 历史版本创建草稿编号修复与网页验证

createNextGraphProtocolVersion 支持 existingProtocols，按同项目现存最高版本号加1，包括归档版本，避免从旧版复制时重复编号。App 的 Graph 新建版本、冻结页创建草稿及无草稿重命名入口均传入当前版本集合。保留来源内容与独立 protocolId，不覆盖现有版本。回归覆盖跨项目隔离、归档编号和源对象不可变；quality:refactor通过（406 tests、Build、Lint）。

实际在 QA nested 2 x 3 - locked responses 的 v1 frozen 点击 Create editable version，进入可编辑草稿。返回项目后显示 v3、3 versions；展开历史确认 v3 draft、v2 draft、v1 frozen 均在。此例证明历史版本创建与保留，未证明所有内容逐字段一致或旧版Legacy编号处理。

## Legacy 版本编号同步修复

旧版 createNextProtocolVersion 同样支持 existingProtocols；从历史版本创建时按同项目最高编号递增，包含归档版本和同项目Graph版本，忽略其它项目。App旧版新版本与重命名派生入口传入版本集合。新增回归验证1→6编号、来源/既有对象不变、内容保留、默认无集合行为兼容；定向测试与Lint通过。旧版完整网页流程尚未验收，不能沿用Graph网页证据。

## Legacy 解冻覆盖历史版本修复

检查确认 App 的旧版视觉/文本编辑器 Unfreeze 原先对同 protocol_id 清除冻结状态并 handleSave，覆盖冻结版本。两入口现改为 createNextProtocolVersion + addAndOpen，创建独立草稿并使用现存最高编号；按钮改为 Create editable version，说明保留原冻结版本。旧 unfreezeProtocol API 暂保留兼容，但 App 不再调用。quality:refactor通过（407 tests、Build、Lint）。已生成有效的 legacy-frozen-fixture.json 供后续网页验收；本次未完成该场景网页操作，不能认定最终验收通过。

## Legacy 冻结派生网页验收与菜单层级修复

实际导入 legacy-frozen-fixture.json 后，旧版视觉编辑器显示 frozen、项目名及组件面板禁用。展开顶部菜单后 DOM 有 Create editable version，但截图发现菜单被 Inspector 遮住，点击无效。修复 flow-overlay-head 为有定位的 z-index:40，使菜单越过画布面板，同时低于已有80层资源弹窗。截图确认菜单完整可见；再次点击成功进入可编辑 draft。

返回项目，Version history (2) 展开显示 v2 draft 与 v1 frozen，原冻结记录保留。Build通过。此例覆盖旧版视觉入口；文本入口和各弹窗层级仍需分别验收。

## Legacy 文本入口派生实际验收

打开 QA legacy frozen preservation 的 v1 frozen，通过顶部 Advanced settings 进入文本编辑器：协议名、Block/Trial名称、重复次数、条件与Practice均显示禁用。点击 Create editable version，页面转为可编辑草稿并显示 Freeze。返回项目展开历史，确认 v3 draft、v2 draft、v1 frozen 全部保留，历史v1派生没有重复v2编号。此项实际网页通过；不覆盖所有步骤参数及所有保存失败情形。

## 单版本移除与恢复入口实现

新增 Version history 中每版 Remove 操作，确认框明确只移动选中 protocolId 到可恢复区域，保留其它版本与session；复用 archivedAt 存储，不做永久删除。项目页新增 Removed / archived versions 区域，包含既有归档记录并允许逐版恢复。App 持久化成功后才关闭确认框；失败保留错误提示。版本号分配已包含归档条目，避免恢复后编号冲突。Build/Lint通过。尚未实际点击完成移除、刷新与恢复链路，此项仍不能勾选最终验收通过。

## 单版本移除、刷新与恢复网页验收

在 QA legacy frozen preservation 的版本历史实际点击 Remove v2，确认框明确目标v2、其它版本和session保留、可恢复。确认后列表仅剩v3 draft和v1 frozen，回收区计数1。刷新页面后仍为2个有效版本；展开回收区显示 v2 draft，点击 Restore 后恢复3个版本；再次刷新仍为3个版本。此例验证Legacy单个草稿的持久化移除与恢复，不证明Graph冻结版本hash、最后一个版本、存储失败或关联session逐项验证。

## 2026-09-24 中断后恢复冻结版本验收

重新连接网页后确认回收区确有 QA nested 2 x 3 - locked responses v1 frozen，说明上次移除已保存。实际点击 Restore 后项目从2个有效版本恢复3个。恢复函数同时修复 Graph audit.updatedAt 被设为 null 的问题，恢复时记录当前时间。version-recovery.test.js 通过：移除/恢复均保持 protocolId、projectId、版本状态、graph、freeze字段及重新计算的冻结hash，源对象不变。hash结论来自核心回归测试；本次网页未下载对比实际冻结文件，关联session内容也尚未逐项核验。

## 版本恢复后同项目会话可读性检查

实际 Manage sessions 仍显示20条记录；打开 QA-NESTED-6 成功加载完整详情：37 events、30 raw/effective response records、6 completed visits，回放末帧37/37 completed。该记录属于同项目v2，而本次移除恢复的是v1，因此证据仅证明同项目其它版本会话仍可读，不应当作被移除版本的直接关联会话验收。该直接关联场景仍待补齐。

## 会话管理关闭按钮遮挡修复

执行直接关联版本验收时，Close点击无效。截图确认后台项目顶栏覆盖会话管理页头部；session-manager z-index40低于全局顶栏50。调整到60（仍低于模态1000）。实际点击Close后页面Close按钮数量为0，面板正常退出；Build通过。直接关联版本移除场景尚未执行完成，此处先记录阻断该验收的界面缺陷修复。

## 直接关联版本移除后会话读取网页验收

实际移除 QA nested 2 x 3 - locked responses v2，确认活动版本只剩v3/v1；刷新页面后仍为2版本。重新打开 Manage sessions（无旧详情缓存），选 QA-NESTED-6 v2，成功读取37 events、30 raw/effective responses、6 completed visits以及原有skip/retry/pause提醒。随后恢复v2，项目回到3版本。证明此直接关联版本的移除不会使历史会话详情不可读。此例未对导出字节逐一比对，不代表所有存储故障场景通过。

## 2026-09-24 完整检查链复核

npm run quality:release 已完成，退出码0；408 tests、Build、Lint及三个浏览器套件通过。日志 quality-release-20260924.log 已归档。新增 RELEASE_NOTES_DRAFT.md 汇总候选变化及阻止最终验收事项；未宣布Release完成。

## 恢复历史回退保护

检查发现 previousTestVisit 原先只核对目标快照的 session/protocol，没有验证整个历史序号、当前访问及 attempt 是否匹配。现拒绝非数组、混入其它会话、非 waiting 快照、非递增/超出当前序号及当前节点或 attempt 不匹配的历史；同一访问内新增暂停等事件仍允许回退。运行器忽略非数组恢复历史，并捕获回退异常，在操作区显示原因，保持当前运行不变。

新增定向用例验证异常历史不会修改运行状态及合法序号推进。quality:refactor 通过，409 tests、Build、Lint；日志 /tmp/physioflow-navigation-recovery-quality.log。本次恢复保护尚未完成真实网页刷新验收，不将单元测试作为该项 GUI 通过证据。

## 刷新恢复后回退：真实网页通过

在现有 QA group questionnaire batch 创建 QA-BACK-REFRESH。首题选3并进入 Questionnaire 2，操作区确认 Checkpoint saved 后实际刷新页面。首页出现对应未完成会话，点击 Resume experiment 后恢复 Questionnaire 2、1 completed visit。点击 Previous page (test) 成功返回 Questionnaire 1、0 completed visits，第一页回退按钮禁用；没有导航异常。重新回答8，后续依次5、6，页面显示 Session data saved（16 events、8 responses）。

通过网页下载完整包并归档 QA-BACK-REFRESH_session_bundle.zip。程序逐项核对下载内容：事件序号1–16连续，一次回退；旧答案3与其超时元数据共2行标记 superseded，新答案8/5/6均未标记。此次证明线性问卷刷新恢复后的回退和保存导出；不覆盖循环、媒体计时、正式模式或损坏快照的真实网页行为。

## 嵌套循环回退与计数显示修复

真实网页 QA-BACK-LOOP（既有2×3嵌套循环v3）：第二次访问返回第一次后完成数恢复0；后续从第五次访问连续返回第四次、第三次，Inspector loop counts 从 outer×2/inner×2 经 outer×2/inner×1 恢复到 outer×1/inner×3，变量和输出同时恢复。

网页发现顶部 completed visits 错用了去重节点覆盖数，循环4次仍显示1；Inspector Attempts也错用了节点数量。已分别改为 completedNodeIds.length 和 attempts各计数总和。保留参与者progress的节点覆盖语义。修复过程中曾误删progress导致到达after页出现App Error，已恢复变量并重跑quality:refactor通过（409 tests、Build、Lint，/tmp/physioflow-loop-counter-quality.log）。实际刷新恢复到5次完成，重新完成第6次后正常进入after页，顶部6 completed visits，点击Continue成功保存。

下载并归档 QA-BACK-LOOP_session_bundle.zip：54事件序号连续、3次回退、45原始回答行中30有效（6次响应×5字段）；最终completedNodeIds为6个response及1个after，loopCounts outer=2/inner=3。此例包括开发热更新及错误后检查点恢复，不冒充从头无中断的发布候选完整运行；媒体计时及正式模式仍待验收。

## 冻结版本运行入口文案修复

实际网页打开nested项目冻结v1，发现按钮仍名Preview run，但进入准备页显示Formal collection、冻结hash，并要求本地数据目录。已将Graph Header按locked显示Prepare collection（中文准备正式采集、日文本計測の準備），草稿仍Preview run，避免将正式入口误认为测试。重新打开冻结v1，实际DOM确认Prepare collection。Build/Lint通过。准备页未选择目录时Continue to collection正确禁用；本轮未启动正式采集，因此正式运行内回退按钮隐藏仍待网页验证。

## 准备页目录错误提示修复

实际准备页填写QA-FORMAL-NAV并点击Select local data folder后，页面保持未选择状态；本轮未能完成原生目录选择。工具不允许控制Codex原生窗口，未绕过该限制，正式运行隐藏回退的网页验证仍未完成。

源码确认独立缺陷：chooseDataDirectory catch调用setAlert，但view=setup的提前return未渲染AlertDialog，因此任何目录选择错误都会在准备页隐藏。已为Graph/旧版共用的setup分支补齐AlertDialog。Build/Lint通过。当前目录选择未返回可观察错误，故不能声称此轮已网页触发并看见错误对话框；此前评论中“选择失败”的判断仅为初步推测，实际结果只能确认未完成选择。

## 矩阵布局移植：适用规则

已读取上游questionnaireMatrix.js与表单实现，移植矩阵适用条件与SAM排序辅助模块。两个定向测试通过，覆盖显式选择布局、Likert统一0–5刻度、非统一刻度/条件题/逐题计时拒绝、SAM三种唯一维度、固定顺序保留ID以及shuffle拒绝。尚未接入本地表单和编辑器，因此目前没有新增用户可用的矩阵展示，也不作为矩阵网页验收通过。后续接入须保留本地responseValueError、条件题可见性与暂停计时逻辑。

## 矩阵表单与编辑器接入

QuestionnaireEditorV2新增Layout选择；QuestionnaireFormV2接入上游Likert表格与SAM三维同屏布局及对应CSS。适用判断基于完整baseOrder，避免先隐藏条件题后误判适用矩阵；SAM实际呈现顺序也用于导出的questionOrder。保留本地questionError数值/必答验证、可见题计分和暂停逻辑；矩阵radio/提交按disabled禁用，漏答定位并聚焦首个错误行。

quality:refactor通过：411 tests、Build、Lint（/tmp/physioflow-matrix-quality.log）。尚未完成新增矩阵的实际网页编辑、必答、键盘、窄屏及导出验收，不作为矩阵最终交付通过。

## SAM矩阵真实网页验收

现有QA SAM release acceptance在编辑器Layout选择SAM (three dimensions on one page)，保存后以QA-SAM-MATRIX运行。实际三行顺序Arousal/Valence/Dominance、每行9档图片同屏，截图检查完整图像与选项。空表提交被必答拦截；选arousal=6、valence=3后提交仍被缺失dominance拦截；补dominance=9后完成并显示Session data saved。

下载23文件数据包QA-SAM-MATRIX_session_bundle.zip已归档，断言协议快照display_mode=sam-matrix、三维对应回答6/3/9及空超时列表完全一致。尚未进行Likert矩阵、窄屏、暂停与键盘路径的实际网页验收。本轮改动的是已有QA测试项目，用户原始210节点JSON未修改。

## SAM矩阵暂停与键盘网页验收

QA-MATRIX-PAUSE-KEYS实际用Space选Arousal1、ArrowRight切换至2，页面checked与1/3 answered一致。显示操作栏并Pause后radio和提交按钮isEnabled均false，页面保持1/3；Resume后Space选择Valence4、Dominance7，之前Arousal2保留，显示3/3。Enter提交成功保存。

下载包QA-MATRIX-PAUSE-KEYS_session_bundle.zip已归档，回答2/4/7与UI一致，7事件序号连续，包含session_paused与session_resumed。该例证明SAM矩阵键盘选择/提交及暂停禁用和恢复保留；Likert矩阵、窄屏和逐题回退仍待对应场景验收。

## Likert矩阵真实网页验收

通过Duplicate project创建QA Likert matrix zero，GUI将三题改为likert、Min0/Max5、Layout matrix，保存成功且Graph valid。QA-LIKERT-MATRIX运行中0–5列完整；首题选择0后提交，只有后两行显示Required，零值未被误判漏答。补2/5后截图确认三行选中值与3/3进度，提交成功保存。

下载QA-LIKERT-MATRIX_session_bundle.zip已归档，断言回答0/2/5以及协议快照matrix布局、三题likert0–5一致。副本沿用原题ID（名字包含sam）但类型已为likert，原SAM项目未改动。当前上游表头硬编码Emotion，通用问卷语义仍需调整；窄屏与大型矩阵滚动尚未验收。

## 矩阵通用文案与不兼容配置提示

Likert列标题由Emotion改为Question（中文题目、日文質問）。编辑器新增不兼容布局状态提示，直接说明实际将逐题显示，并列出该布局的适用条件。网页在QA Likert matrix zero将Likert题选择SAM布局，确认SAM条件提示；恢复matrix后为首题填2秒时限，确认逐题计时不适用提示。随后清空时限、恢复matrix并保存。Build/Lint通过。通用表头此次仅构建验证，仍需后续运行页面确认；提示当前英文，与现有编辑器语言覆盖范围一致，完整国际化仍待审计。

## 窄屏尝试与测试配置纠正

QA-MATRIX-NARROW实际运行不是矩阵：导出快照显示首题time_limit_sec仍为2，因此回退为逐题，首题超时。不能算作矩阵窄屏通过。390×844截图还显示逐题内容较小，该缩放需后续单独检查；临时viewport已reset。

纠正上一轮“已清空并保存”的记录：浏览器fill('')后输入框实际仍为2，后续只凭动作成功与保存Toast判断不足。此次使用ControlOrMeta+A/Backspace，确认不兼容提示消失，保存后读取三题input.value均为空。独立矩阵项目已恢复无计时配置。此次没有修改产品代码；下一步须重新执行真正矩阵窄屏验收。

## 矩阵窄屏溢出修复与实际验收

QA-LIKERT-NARROW-2先确认Question/0–5表头，再切390×844。发现CSS grid item默认min-width:auto令表格撑开卡片：卡片706px、document.scrollWidth740，表格内部反而不滚动。为Graph直接矩阵卡片加min-width:0/max-width:100%，表格滚动容器限制宽度；同样规则覆盖SAM矩阵。

修复后实际测量document.scrollWidth=innerWidth=390，卡片322px，滚动区client296/scroll680；网页成功选择最右5、4、3，截图确认内滚动且提交按钮可见。提交成功保存，下载QA-LIKERT-NARROW-2_session_bundle.zip核对5/4/3一致并归档。viewport已reset，Build/Lint通过。SAM窄屏仍须独立实测，大型多行表格尚未验收。

## SAM矩阵窄屏网页验收

QA-SAM-NARROW在390×844下实际运行：document.scrollWidth与innerWidth均390，卡片322px，表格滚动区client296/scroll820；27张图像全部complete且naturalWidth>0。选择最右侧arousal9、valence8、dominance7，截图确认图像与选中状态、3/3进度、提交按钮均可用；点击提交成功保存。下载QA-SAM-NARROW_session_bundle.zip并核对9/8/7一致，已归档。临时viewport已reset。该例为三维矩阵，不替代大型多行Likert矩阵的纵向滚动验收。

## 上游媒体模块审查与本地预览修复

实际源路径为core/mediaPresentation.js、core/mediaReadiness.js与composer/mediaPerformance.js。上游readiness仅遍历媒体节点及所有池，本地assetStore.graphProtocolAssetReferences还递归UI引用并只检查使用中的池，不能整体替换以免回退覆盖；上游placeholder自动绑定和viewport展示仍未移植，需分别评估。上游预览限定当前节点资源范围，当前本地仍加载整个媒体库，性能优化仍待处理。

检查本地ComposerV2发现直接用assetStore.loadAsset读取IndexedDB，而工作目录素材需要fsStorage.loadAssetFile。已切换统一读取接口，并在异步读取完成、创建objectURL之前检查active，防止effect清理后生成无人释放的URL。Build/Lint通过。原生目录选择受当前工具限制，工作目录素材预览尚未实际网页验证；不宣称该链路已验收。

## 媒体预览按当前节点加载

移植上游previewResourceIds并接入ComposerV2：预览仅读取当前Inspector节点和全屏编辑节点的直接asset、嵌套UI Media、共享池及内嵌池素材。所需assets序列化键稳定时复用依赖，编辑标签或布局不重新加载二进制；切换引用集合才触发清理/读取。保留上一轮fsStorage统一读取和异步active保护。

新增测试覆盖嵌套UI、共享/内嵌池、未使用池排除、空选择及切换节点。quality:refactor通过：412 tests、Build、Lint（/tmp/physioflow-preview-scope-quality.log）。实际多素材网页切换及大文件内存峰值尚未测量，不能以范围函数测试证明性能指标或UI已全部通过。

## 按需媒体预览网页复测

实际打开QA audio video playback（媒体库4项），依次选择QA audio→QA video→Edit participant screen→Done→QA audio。DOM媒体状态：音频duration12/readyState4，无error；视频duration12/readyState4/videoWidth640，无error；全屏编辑与Inspector视频使用相同blob URL并均readyState4；关闭后切回音频再次readyState4。证明当前浏览器存储素材的节点切换与全屏编辑预览未被按需加载破坏。没有改动协议内容。此例不证明工作目录读取、实际音频听感、大文件峰值或所有资源绑定组合。

## 音视频回退实际播放验收

QA-MEDIA-BACK使用既有音频/视频各12秒协议。通过原生播放器启动音频，观察paused=false/currentTime推进；自然结束进入视频后点击Previous page，恢复音频且currentTime=0、ended=false、完成0。重新播放12秒后再次进入视频（完成1），播放视频12秒后成功保存。

归档QA-MEDIA-BACK_session_bundle.zip，16事件序号连续，包含一次回退；原音频start/end/completed保留，重播音频及视频各有一次start/end/completed，最终completedNodeIds仅qa-audio、qa-video。未出现旧播放器结束导致重复推进。此例使用手动播放器启动及media-ended完成模式，不证明autoplay或fixed计时所有组合、声音内容准确性。


## 矩阵与媒体整合后完整Release检查

2026-09-24再次执行npm run quality:release退出0：412 tests、Build、Lint、旧版E2E、Graph浏览器与公开参与者套件全部通过。归档quality-release-matrix-media-20260924.log。RELEASE_NOTES_DRAFT已更新矩阵、回退及媒体实际验收进展，并保留缺少40视频、真实硬件、PhysioDB端到端及发布产物等未完成项。完整套件通过不等于这些剩余项已验收。

## 2026-09-24 导出失败资源清理及连续导出

源码检查发现 saveFile 的 a.click() 抛错时，临时 Blob URL 未释放。现立即回收 URL 并重新抛出原始错误，沿用 App 已有导出失败 Alert；成功路径仍延迟 30 秒回收，不将下载发起误报为磁盘写入完成。

新增两项定向测试覆盖失败清理/错误传播，以及连续下载的独立内容、文件名和延迟回收；2 项测试、Build、Lint 通过。实际网页在 QA audio video playback 连续点击两次 Export，两条通知均正确显示 Protocol generated; download started，编辑器保持可用。此轮未读取浏览器落盘文件，也未在实际浏览器制造下载失败；E01 完整往返和 E02 浏览器失败仍未宣称完成。此前 426 项完整检查早于此修改。

## 2026-09-24 实际下载文件及重新导入往返核对

找到上轮两次实际浏览器下载文件，SHA256 均为 315eeaa7889dfd89c642ddebfb8f950f26838a95b548b3d382d9573163e35416，字节完全一致。通过网页 Import JSON 选择下载文件，已有项目对话框显示 No content differences；选择 Import as version，导入为 v2，再通过网页 Export 下载。

对导入前后 JSON 逐顶层字段深度比较：graph、assets（4 个引用）、metadata、biodb、variables、stimulusPools、templates、subflowTemplates、componentPackages、deviceConnectors、participantUi、questionnaireLibrary、dataPolicy、schemaVersion 和 projectId 完全一致。仅 protocolId、version（1→2）及 audit 改变，符合新增版本语义。归档 export-roundtrip-before.json 与 export-roundtrip-after.json。

这是 QA audio video playback 的实际文件往返证据；不代表未包含的非空分组、随机池、旧版协议及全部配置组合通过。原 v1 保留，新增 v2 未删除任何版本。另观察到现有项目对话框以 Cancel 表示导入为新项目，语义容易误解，需后续检查其取消行为。

## 2026-09-24 导入取消语义修复

修复 Existing project 对话框的 Cancel 实际创建新项目问题。ConfirmDialog 增加可选独立次级操作；此处明确显示 Import as version、Import as new project、Cancel。Cancel、Escape 和背景关闭均调用取消回调并终止导入，而非落入新项目分支。其他确认框未提供次级操作时保持原来的两个按钮。

实际网页：同一下载文件分别通过 Cancel 和 Escape 取消后，项目数保持 24，原测试协议保持 v2 / 2 versions。再明确点击 Import as new project，进入 QA audio video playback Copy；返回项目页显示 25 个项目，新项目 v1 / 1 version，原项目仍 v2 / 2 versions。保留该验收副本。Build 与 Lint 通过；本轮未重新跑完整质量套件。背景关闭逻辑经源码检查，未单独进行坐标点击验收。

## 2026-09-24 旧文件导入版本编号修复

Dashboard 的 Import as version 入口遗漏 existingProtocols 参数，导致导入旧 v1 时仍按文件版本生成 v2，即使项目已有 v2。Graph 和 legacy 两种入口现统一传入全部工作区版本，复用现有包含归档版本的最高编号分配逻辑。对应算法测试已存在于 core-model.test.js 和 legacy-version-number.test.js。

实际网页选择原始下载的 v1 文件，明确 Import as version 后返回项目页，显示 QA audio video playback v3 / Version 3 / 3 versions，未创建重复 v2；项目数保持不变。此轮为 Graph 网页验证，legacy 入口使用同样参数修复但未额外执行人工导入。

## 2026-09-24 导入差异比较范围修复

此前 Graph 导入仅比较 graph，图外媒体池、设备或其它配置变化会被误报 No content differences。新增 protocolGraphDiff，比较所有顶层内容字段（包含未来扩展字段），排除版本身份、版本信息、审计、冻结及协作记录。对象键顺序不构成差异，数组顺序仍保留语义。

两项定向测试覆盖图外配置/新增字段、版本身份排除、键顺序及数组顺序。Build、Lint 通过。实际网页导入 graph 完全不变、仅 metadata.description 改变的测试副本，Existing project 明确显示 metadata: configuration changed；随后取消，未创建版本。测试文件 import-metadata-diff.json 已归档。此轮未重跑完整质量套件。

## 2026-09-24 最终工作区嵌套循环连续运行

实际网页运行 QA nested 2 x 3 - locked responses v3，参与者 QA-LOOP-CONTINUOUS。全程未改代码、未刷新、未回退，六次依序选择 yes/no/yes/no/yes/no，每次 Continue 后推进。第六次后准确进入 after 屏幕，继续后显示 Session data saved。

下载并归档 QA-LOOP-CONTINUOUS_session_bundle.zip。核对 runtime status=completed，attempts.response=6、attempts.after=1，completedNodeIds 为六个 response 加一个 after，loopCounts.outer=2、inner=3，loopStack 为空、error=null。六个 value 回答顺序与实际操作完全一致；34 个事件、30 个响应字段记录（每次回答五个字段），不是 30 次回答。补齐此前被开发热更新打断的嵌套循环连续运行证据；仍不代替随机组次序和真实媒体的完整实验。

## 2026-09-24 安静→视频→问卷连续重复三次

独立派生协议 quiet-video-questionnaire-repeat.json，通过网页导入并运行 QA-COMBO-THREE。每轮为 1500ms 安静、手动启动后自然播完 12s 测试视频、必填单题评分。第二和第三轮视频实际 DOM 均为 currentTime=0、ended=false、paused=true；逐轮评分 1、2、3，第三轮后自动完成。全程参与者顶部操作栏隐藏。

归档 QA-COMBO-THREE_session_bundle.zip 和 combo-three-verification.json。33 个事件序号连续，完成节点精确为 [wait0,qa-video,qa-questionnaire] ×3，三类节点 attempts 均3，评分为 [1,2,3]，无错误。三轮等待约1503ms，media_started→media_ended 约11997/11995/12002ms，各一次开始与结束，无跳片或旧结束事件误推进。运行中未刷新、未改代码。

此例验证三次顺序组合运行及素材/问卷重置，使用脚本构造的独立协议后通过 GUI 导入；不代表 GUI 创建重复组操作已验收，也不替代真实40视频、原始安静时长、自动播放或组间随机。

## 2026-09-24 循环次数编辑、撤销重做及刷新持久化

实际网页打开 QA quiet video questionnaire x3，选择 Repeat trial x3 节点，在 Maximum iterations 将3改为2。读取控件依次确认：修改2、Undo回到3、Redo回到2。点击Save并整页刷新，重新打开项目及循环节点，仍为2。最后改回3并保存，页面说明同步为 The body runs 3 time(s) in total，Graph valid，显示Protocol saved。

这是现有循环节点次数编辑与持久化的人工验收，不等同于通过组工具创建循环或随机化。点击可视分组标题只选中分组，当前Quick模式Inspector未出现组设置；后续需检查完整分组操作入口，不能将该结果标记为组重复创建通过。本轮未修改源码。

## 2026-09-24 GUI 创建重复序列

现有循环内选择 Wait 0，Repeat a sequence 明确提示已在循环中并禁用创建。另导入无循环独立副本 gui-create-repeat-flat.json；选择 Wait 0，将 Last step to repeat 设为 Trial rating，保留 Total repetitions=3，界面列出安静/视频/问卷并说明3×3=9次访问。点击 Create repeat sequence 后生成 Loop，Graph valid。Undo 后循环数0，Redo后1；Save、Export成功。

实际下载文件归档 gui-create-repeat-result.json。核对 Start→Loop、Body→Wait→Video→Questionnaire→Loop、Exit→End，maxIterations=3；原节点config及groups深度相等，没有丢失媒体或问卷配置。这个GUI产物尚未另起会话完整运行；前轮 QA-COMBO-THREE 已验证同类三步三次结构运行，但不冒充本文件的运行证据。

## 2026-09-24 GUI产物连续运行及下载异常

QA GUI create repeat 通过网页创建会话 QA-GUI-REPEAT-RUN，完成三轮安静→视频→问卷，评分依次3/2/1；完成页显示33 events、6 responses，最终Session data saved。第二、第三轮明确读取视频从0开始并手动播放。第一轮播放后的状态读取遇到超时，再观察已进入问卷，不能仅靠页面确认其时长。

点击Export complete data package后未在Downloads找到目标ZIP；第二次使用浏览器download事件监听仍10秒超时，页面无错误、浏览器错误日志为空。会话停留完成页并保留。尚未取得数据包，因此本轮运行的数据核对未通过，不能套用前轮QA-COMBO-THREE结果。已定位下载入口为exporter.js:downloadBundle，下一步需分辨浏览器下载行为与应用导出问题。未对此未知原因进行猜测性代码修改。

## 2026-09-24 GUI会话保存与回放核对

下载目录未出现 QA-GUI-REPEAT-RUN 数据包，最近30分钟亦无新的 .crdownload 文件。转到会话管理检索该参与者，成功读取持久化会话：completed、33事件、6 raw/effective response records、9 completed node visits、0 superseded/skipped/retries/pauses，自动完整性检查无问题。完整导出入口再次操作仍未取得文件；根因尚未确认。

通过GUI回放滑块逐一读取事件10、20、30，均为 Trial rating 的 response_submitted，payload.values.rating依序3、2、1，与实际操作一致；事件33为protocol_completed、Loop→exit。该证据确认已保存回答并非仅结束页暂存显示，但不替代ZIP落盘/完整内容验证。会话与页面保留，未删除、未改研究者有效性标记。

## 2026-09-24 数据包导出反馈与手动链接

exporter.downloadBundle 原先仅点击离屏链接，无任何用户可见反馈。现将下载链接加入页面提示，明确说明生成并请求下载、请检查浏览器下载列表；提供 Download data package again 和 Dismiss。链接60秒后释放，关闭提示亦释放。同步生成/触发异常显示alert并释放URL，不宣称磁盘写入完成。

实际网页从QA-GUI-REPEAT-RUN会话导出，出现准确状态文案；链接download属性为QA-GUI-REPEAT-RUN_session_bundle.zip，手动点击可执行。之后本机Downloads仍未找到文件，浏览器落盘问题未解决。此修复是补齐反馈/显式下载入口，并非根因已证实。Build、Lint通过，完整回归待执行。会话保留。

## 2026-09-24 循环非法次数提示与运行拦截

GUI测试Maximum iterations=1.5时校验已有blocking issue且Preview run禁用，但说明原先仍显示执行1.5次。修复NodeInspector说明：非正整数显示填写正整数后再运行，避免与校验相矛盾。

实际网页确认1.5提示修复；键盘输入0后读取value=0、Preview run disabled；清空时运行同样不可用。期间一次fill(0)未改变实际值，未作为零值证据，改用键盘并重新读取确认。最后恢复3并Save，运行按钮恢复可用。Build与Lint通过。既有430项完整回归早于此文案修复。

## 2026-09-24 组间随机功能缺口及基础实现

源码核对：groupCommands只管理成员与分组信息；runtime的logic.random每次独立抽分支，不能保证每组只执行一次。G03仍属缺失功能，不是媒体池随机或普通分支测试可以代替。

新增core/groupSequence.js的纯调度规划：明确seed、每组选一次、按实际连线保持组内顺序、使用现有Mulberry32 Fisher–Yates；拒绝重复/重叠组、未知组、非连续路径及现有循环路径。返回算法标识、seed、groupOrder、nodeOrder，不修改原协议。两项测试覆盖100个seed下重现、三组六种排列、组内顺序、无重复、无源修改及边界拒绝，已通过。

尚未接入GUI、会话执行、恢复或导出，不能宣称组随机已可用。后续需将调度作为会话快照的一部分，保留源协议哈希并记录实际顺序，再完成GUI/运行/恢复验收。现有循环组的扩展仍需实现，不能把当前简单连续组限制作为最终需求替代。

## 2026-09-24 组调度执行图准备

新增prepareGroupSequence：按seed规划后复制源协议，仅重连组间入口/出口，保留组内节点、配置、分组成员与边数量。拒绝显式跨组数据连线，避免重排改变依赖含义。返回执行副本与独立plan，尚未接入会话；不得用副本冒充原冻结协议的哈希。

4项定向测试通过：100种seed可重现且三组六排列可达、组内连线顺序保持、非法边界拒绝、30种seed下沿控制边遍历恰好匹配计划且无新增循环、原协议不变、跨组数据依赖拒绝。这是图转换测试，非实际浏览器运行证据。GUI、会话快照/恢复、导出追溯及嵌套循环支持仍未完成。

## 2026-09-24 组随机执行图与真实运行引擎兼容性

新增group-sequence-runtime.test.js，使用正式组件注册表生成三组、每组两个Screen节点；三个seed分别经prepareGroupSequence转换、配置校验、startRuntime及completeCurrentNode执行。第三次访问后pause，将源协议、执行协议、plan与runtime快照做JSON往返，再restore/resume继续。每例完成顺序与plan完全相同，恰好六次访问，事件序号连续，暂停/恢复各一次，源协议未改变。连同组调度测试共5项通过。

此证据验证运行引擎兼容性和显式携带执行图的恢复方案，不证明当前应用已保存这些新增字段。现有restoreRuntime仅比较协议身份，不能区分同ID源图与执行图；接入时必须额外验证执行图/调度摘要，避免错误恢复。GUI、应用会话持久化及实际网页随机运行仍待实现。

## 2026-09-24 组随机恢复快照格式

新增createGroupExecutionSnapshot/restoreGroupExecutionSnapshot，显式保存源协议、选择组ID、seed/算法/顺序计划和执行图。恢复只从保存的源协议重建预期计划并比较执行图，拒绝不匹配或未知schema；不从当前编辑器重新抽取。测试确认编辑器源对象后续变化不影响已存快照，篡改顺序/边界被拒绝。相关6项测试通过。

应用接入尚未完成。必须以sourceProtocol作为原始协议/冻结哈希证据，将executionGraph作为单独执行追溯数据保存，不能宣称派生图仍满足原冻结哈希。此一致性校验不是针对同时改写全部快照内容的密码学认证。

## 2026-09-24 组随机会话链路初步接入

协议groupRandomization.enabled/groupIds配置现在在配置校验时检查连续边界及数据依赖。准备页生成session专属组seed、展示实际组顺序，可重新生成；错误阻止继续。启动时将源协议、plan、执行图保存于session.group_execution_snapshot。运行入口验证快照与源协议一致后使用执行图；checkpoint协议仍保存源协议，恢复通过session中的快照重建执行图。最终session保存源协议，ZIP额外提供group_execution_snapshot.json；protocol_snapshot.json保持源协议，不冒充派生图冻结哈希。

6项定向测试、Build通过，runner接入后的Lint通过；最后新增配置校验仍需完整回归。尚无编辑器启用控件，尚未实际网页验证启用、恢复和导出，亦未完成hosted路径与嵌套循环支持；此为进行中实现，不标记G03通过。

## 2026-09-24 组随机编辑器与首次完整网页验收

新增GroupSequenceEditor：选择组、启用每会话一次随机，配置通过commit进入撤销/保存链路，冻结版fieldset禁用。导入randomized-groups-gui.json（三组各两个Screen，标签包含quiet/questionnaire但实际为Screen），GUI勾选A/B/C并启用、Save、Preview。准备页顺序A→C→B，QA-GROUP-RANDOM-UI实际运行顺序A quiet/A questionnaire/C quiet/C questionnaire/B quiet/B questionnaire，完成并保存。

原浏览器tab1已失效、同浏览器无标签，重新打开tab2后原本地数据正常加载。本轮导出成功落盘，归档QA-GROUP-RANDOM-UI_session_bundle.zip。核对protocol_snapshot等于group_execution_snapshot.sourceProtocol；plan.groupOrder=A,C,B，runtime.completedNodeIds等于plan.nodeOrder且completed；执行图边与源图不同，独立导出。24个导出文件含新快照。Build、Lint通过。

这证明简单连续组GUI启用→会话随机→实际执行→导出链路，非真实问卷/媒体组、冻结正式采集、hosted或嵌套循环支持的证据。旧QA-GUI-REPEAT-RUN下载故障尚待在新标签重试核对，不能仅因本轮成功推定旧包已取得。

## 2026-09-24 旧下载恢复及组随机刷新验收

在新tab2会话管理重导出QA-GUI-REPEAT-RUN成功落盘。归档数据包及gui-repeat-run-verification.json：协议graph与GUI导出完全一致，三类节点各3次，评分3/2/1，三轮media_started→ended为11993/11991/12005ms，33事件连续。此前缺失ZIP的验收证据已补齐；旧标签下载失败根因未确认，不声称由某一代码修复解决。

QA-GROUP-RESTORE准备页顺序A/C/B，运行至A questionnaire，确认Checkpoint saved、Pause，再刷新。恢复提示出现；Resume experiment回到相同节点且保持paused，继续后顺序A questionnaire→C quiet→C questionnaire→B quiet→B questionnaire。保存及下载成功，归档QA-GROUP-RESTORE_session_bundle.zip：六次完成与计划一致，22事件连续，暂停/恢复各一次。观察恢复横幅Graph名称为空，修复其使用protocolNameOf，文案修复后的完整回归仍待执行。

## 2026-09-24 随机组冻结与导出一致性回归

增加正式freezeProtocolGraph生成的冻结协议测试，分别以源图和执行图调用buildGraphSessionFiles，验证protocol_snapshot.json始终等于源协议且SHA-256等于原freeze.configHash；session保留protocol_hash，独立group_execution_snapshot.json完整。定向测试通过。

运行入口新增缺失计划保护：source启用随机但session没有group_execution_snapshot时拒绝启动，不能在不支持的入口静默顺序运行。完整回归首次436 tests通过；新增保护及冻结导出测试后的最终回归单独记录，不能混用首次结果。
