# i18n batch B report

The supplied B list has **13 remaining missing entries out of 285** (below 25); all are deliberate skips listed below. The unfiltered audit is heuristic: it also reports 95 candidates across the corresponding files, including imports, CSS, identifiers and additional strings outside the supplied B list. The file-wide raw count is therefore not below 25.

Added **74 main dictionary keys per language** and **126 composer catalog keys per language**. Both Japanese and Chinese are provided; English remains the source.

Core modules were not edited. **No code value, field name, message value or other test/export value changed anywhere in src/core/**. Pure validation messages are localized by validationIssueMessage at the composer display boundary, and pure-function errors are translated in Canvas/Catalogs/TrialGenerator at render time.

Trial generation instructions retain 10–10,000 and 4–10,000 with en dashes, and the multiples 4 and 8. Authored protocols, questionnaire presets and templates are unchanged. The audit writes its standard docs report; that generated file was restored byte-for-byte afterward to honor the docs exclusion.

## Remaining supplied B entries

| String | Reason |
|---|---|
| .composer-node, .composer-port, .composer-wires | DOM selector used by pointer handling. |
| 'SF Mono', 'Cascadia Code', monospace | CSS font stack. |
| "Comic Sans MS", cursive | CSS font stack. |
| (missing) | Internal missing-identity sentinel; core/export values retained. |
| (whole entity) | Internal conflict comparison path sentinel. |
| Ctrl+C | Keyboard shortcut notation. |
| Ctrl+D | Keyboard shortcut notation. |
| Ctrl+V | Keyboard shortcut notation. |
| HTML / CSS / JS | Standard technical language abbreviations. |
| value \| label \| key | Parser field names in the option-format hint. |
| xMidYMid meet | SVG preserveAspectRatio value. |
| yes \| Yes \| 1 no \| No \| 2 | Literal option-format example; translating tokens changes its parsing example. |
| 日本語 | Language self-name in the multilingual content selector. |

## Hardcoded Japanese/Chinese conversions

Inspector’s 中文标题 and 日本語タイトル now use the English sources “Chinese title” and “Japanese title”. The labels helper now uses “Please check this setting.” instead of language branches containing 設定を確認してください。 and 请检查设置。. Language self-names remain unchanged.

All existing validation translations were relocated from toolbox language maps into the existing composer catalog. The formatter selects an English source by the unchanged issue code, then looks up ja/zh. Every converted explanation is listed below.

| Stable code | English source | Japanese translation | Chinese translation |
|---|---|---|---|
| protocol.invalid | Protocol must be an object | プロトコルのデータ構造が無効です | 协议文档结构无效 |
| protocol.id_missing | Protocol ID is required | プロトコルIDがありません | 协议缺少 ID |
| protocol.name_missing | Protocol name is required | プロトコル名を入力してください | 协议缺少名称 |
| graph.empty | Protocol graph needs nodes | フローが空です。ノードを追加してください | 协议流程为空，请先添加节点 |
| graph.entry_missing | Graph entry node is missing or invalid | 開始ノードがありません | 流程缺少开始节点 |
| graph.entry_not_start | Graph entry node must be a core.start component | 入口はStartノードである必要があります | 入口节点不是 start 节点 |
| graph.start_count | Exactly one Start node is required | Startノードは1つだけ必要です | 流程中存在多个开始节点 |
| graph.end_missing | Graph needs at least one End node | Endノードがありません | 流程缺少结束节点 |
| graph.end_unreachable | No End node is reachable from Start | Endノードに到達できません | 结束节点不可达（有节点未连到主路径） |
| node.unreachable | Node is unreachable from the flow | このノードはフローから到達できません | 节点不可达，缺少输入边 |
| node.id_missing | Node ID is required | ノードIDがありません | 节点缺少 ID |
| node.id_duplicate | Node IDs must be unique | ノードIDが重複しています | 节点 ID 重复 |
| node.component_missing | Node component type and version are required | ノードのコンポーネント種別がありません | 节点缺少组件类型 |
| node.component_unknown | Node component is not registered | 未登録のコンポーネントです | 未知的组件类型，请安装对应 SDK 包 |
| edge.source_missing | Connection source node is missing | 接続元ノードがありません | 连线缺少源节点 |
| edge.target_missing | Connection target node is missing | 接続先ノードがありません | 连线缺少目标节点 |
| edge.source_port_missing | Connection source port is missing | 接続元ポートがありません | 连线缺少源端口 |
| edge.target_port_missing | Connection target port is missing | 接続先ポートがありません | 连线缺少目标端口 |
| edge.source_direction | Edge source must be an output port | 接続元の向きが正しくありません（出力ポートから出る必要があります） | 连线源方向错误（应从输出端口出发） |
| edge.target_direction | Edge target must be an input port | 接続先の向きが正しくありません（入力ポートへ向かう必要があります） | 连线目标方向错误（应指向输入端口） |
| edge.kind_mismatch | Edge kind must match both ports | 接続タイプとポートタイプが一致しません | 连线类型与控制流端口不匹配 |
| edge.target_multiple | Input port cannot have multiple connections | この入力ポートには複数接続できません | 控制端口已有多条连线，只能保留一条 |
| port.required_unbound | Required port has no variable binding | 必須ポートに変数が割り当てられていません | 必需端口未绑定变量 |
| port.required_unconnected | Required port is not connected | 必須ポートが接続されていません | 必需端口未连接 |
| binding.variable_missing | Referenced variable is missing | 参照している変数がありません | 绑定的变量不存在 |
| binding.variable_type_mismatch | Variable and port types do not match | 変数とポートの型が一致しません | 绑定变量的类型与端口不匹配 |
| variable.name_missing | Variable name is required | 変数名を入力してください | 变量缺少名称 |
| variable.name_duplicate | Variable names must be unique | 変数名が重複しています | 变量名称重复 |
| variable.type_invalid | Variable type is invalid | 変数の型が無効です | 变量类型无效 |
| variable.scope_invalid | Variable scope is invalid | 変数のスコープが無効です | 变量作用域无效 |
| group.name_missing | Group name is required | グループ名を入力してください | 分组缺少名称 |
| group.empty | Group is empty | グループが空です | 分组为空 |
| group.node_missing | Group contains a missing node | グループ内のノードが見つかりません | 分组中的节点不存在 |
| group.node_multiple | A node can belong to only one group | 1つのノードは1つのグループにのみ所属できます | 节点只能属于一个分组 |
| subflow.parameter_mapping_missing | Subflow parameter mapping is missing | サブフローのパラメータ対応がありません | 子流程参数映射缺失 |
| subflow.parameter_mapping_type_mismatch | Subflow parameter mapping types do not match | サブフローのパラメータ対応の型が一致しません | 子流程参数映射类型不匹配 |
| subflow.template_empty | Subflow template is empty | サブフローのテンプレートが空です | 子流程模板为空 |
| subflow.entry_invalid | Subflow entry node is invalid | サブフローの入口ノードが無効です | 子流程入口节点无效 |
| subflow.exit_invalid | Subflow exit node is invalid | サブフローの出口ノードが無効です | 子流程出口节点无效 |
| sdk.permission_unapproved | SDK permissions have not been approved | SDKの権限が承認されていません | SDK 权限未批准 |
| sdk.permission_variable_read | SDK lacks permission to read variables | SDKに変数の読み取り権限がありません | SDK 缺少变量读取权限 |
| sdk.permission_network_media | SDK lacks permission to access network media | SDKにネットワークメディアの権限がありません | SDK 缺少网络媒体权限 |
| sdk.permission_asset_read | SDK lacks permission to read assets | SDKにアセットの読み取り権限がありません | SDK 缺少资产读取权限 |
| device.connector_missing | Device connector is not installed | デバイスコネクタがインストールされていません | 未安装设备连接器 |
| device.connector_invalid | Device connector is invalid | デバイスコネクタが無効です | 设备连接器无效 |
| device.permission_unapproved | Device permissions have not been approved | デバイスの権限が承認されていません | 设备权限未批准 |
| config.media_source_missing | Set a media URL, asset or stimulus pool | メディアURL、アセット、または刺激プールを設定してください | 媒体节点缺少 URL 或资产 |
| config.media_url_invalid | Media URL is invalid | メディアURLが無効です | 媒体 URL 无效，请检查地址或改用资产 |
| config.media_mode_invalid | Media completion mode is invalid | メディアの完了方法が無効です | 媒体完成模式无效 |
| config.stimulus_pool_id_invalid | Stimulus pool ID is missing or duplicated | 刺激プールIDがないか重複しています | 刺激池 ID 缺失或重复 |
| config.stimulus_pool_name_missing | Stimulus pool name is required | 刺激プール名を入力してください | 刺激池缺少名称 |
| config.stimulus_pool_type_invalid | Stimulus pool media type is invalid | 刺激プールのメディア種別が無効です | 刺激池媒体类型无效 |
| config.stimulus_pool_missing | Selected stimulus pool is missing | 選択した刺激プールがありません | 节点引用的刺激池不存在 |
| config.stimulus_pool_empty | Add stimuli to the stimulus pool | 刺激プールに刺激を追加してください | 刺激池中还没有可用刺激 |
| config.stimulus_pool_asset_missing | Stimulus pool media asset is missing | 刺激プールのメディアが見つかりません | 刺激池引用的媒体资源不存在 |
| config.stimulus_pool_type_mismatch | Stimulus pool and Media node types do not match | 刺激プールとMediaノードの種別が一致しません | 刺激池与媒体节点的类型不一致 |
| config.stimulus_pool_inconsistent | Legacy embedded stimulus pool configuration is inconsistent | 旧形式の埋め込み刺激プール設定が一致していません | 旧版内嵌刺激池配置不一致 |
| config.stimulus_pool_too_small | Not enough stimuli for allocation without replacement | 重複なしで割り当てるための刺激数が不足しています | 刺激数量不足以进行无放回分配 |
| config.participant_ui_missing | Participant screen is missing | 参加者画面がありません | 界面模板为空 |
| config.ui_variable_missing | Screen binding references a missing variable | 画面のバインディングが存在しない変数を参照しています | 界面绑定引用了不存在的变量 |
| config.input_missing | Participant screen has no input controls | 参加者画面に入力項目がありません | 界面缺少输入控件 |
| config.completion_action_missing | Manual completion requires a submit or continue button | 手動完了には送信または次へボタンが必要です | 手动完成模式需要界面中有提交按钮 |
| config.duration_invalid | Display duration must be at least 0 | 表示時間は0以上で指定してください | 持续时间无效（需为正数） |
| config.wait_duration_invalid | Wait duration must be at least 0 | 待機時間は0以上で指定してください | 等待时长无效（需为正数） |
| config.rating_range_invalid | Rating maximum must be greater than minimum | 評価の最大値は最小値より大きくしてください | 评分范围无效（min 需小于 max） |
| config.loop_limit_invalid | Loop count must be an integer of at least 1 | ループ回数は1以上の整数で指定してください | 循环次数无效（需为正整数） |
| config.condition_operator_invalid | Condition operator is invalid | 条件演算子が無効です | 条件运算符无效 |
| config.loop_until_operator_invalid | Loop termination operator is invalid | ループ終了条件の演算子が無効です | 循环终止运算符无效 |
| config.random_probability_invalid | Random branch probability is invalid | ランダム分岐の確率が無効です | 随机概率需在 0–100 之间 |
| config.fixation_shape_invalid | Fixation shape is invalid | 注視点の形状が無効です | 注视点形状无效 |
| config.cognitive_task_kind_invalid | Cognitive task type is invalid | 認知課題の種類が無効です | 认知任务类型无效 |
| config.cognitive_task_trials_empty | Generate cognitive task trials first | 認知課題に試行がありません。先に生成してください | 认知任务没有试次，请先生成 |
| config.cognitive_task_trial_id_invalid | Cognitive task trial ID is invalid | 認知課題の試行IDが無効です | 认知任务试次 ID 无效 |
| config.cognitive_task_timing_invalid | Cognitive task trial timing is invalid | 認知課題の試行時間が無効です | 认知任务试次时长无效 |
| config.migration.review_required | Review settings after migration | 移行後に設定を確認してください | 迁移后需要人工复核配置 |

## Source files touched

- `src/Inspector.jsx`
- `src/composer/Canvas.jsx`
- `src/composer/Catalogs.jsx`
- `src/composer/NodeInspector.jsx`
- `src/composer/StimulusPoolEditor.jsx`
- `src/composer/TrialGenerator.jsx`
- `src/composer/composerStrings.js`
- `src/composer/labels.js`
- `src/composer/toolbox.js`
- `src/composer/translate.js`
- `src/composer/useCatalogActions.js`
- `src/composer/useComposerState.js`
- `src/i18n.jsx`

## Validation

- Audit: `node scripts/audit-i18n.mjs` with stdin redirected from Windows NUL (equivalent to /dev/null).
- `npm test`: 531 pass / 0 fail / 1 skipped.
- `npm run lint -- --max-warnings=0`: passed.
- `npm run build`: passed.
- No commit created.

## Unfiltered file-wide audit candidates

These are included for transparency; the 13-entry supplied-list result above must not be mistaken for the entire raw file-wide audit count.

- `../i18n.jsx` — src/composer/Catalogs.jsx:9, src/composer/GroupBatchEditor.jsx:2, src/composer/GroupSequenceEditor.jsx:1, src/composer/NodeInspector.jsx:11, src/composer/RepeatSequenceEditor.jsx:2, src/composer/ResponseOptionsEditor.jsx:1, src/composer/translate.js:1, src/composer/useComposerState.js:23, src/flowCanvas/NodeCard.jsx:4, src/participantUi/useBuilderT.js:2
- `../QuestionnaireEditorV2.jsx` — src/composer/NodeInspector.jsx:14
- `../QuestionnaireFormV2.jsx` — src/composer/NodeInspector.jsx:15
- `./i18n.jsx` — src/App.jsx:36, src/AttentionCheckRunner.jsx:1, src/CalibrationRunner.jsx:1, src/CognitiveTaskRunner.jsx:1, src/FlowCanvas.jsx:9, src/FlowJsonEditor.jsx:14, src/Inspector.jsx:1, src/MediaStep.jsx:1, src/ParticipantRenderer.jsx:1, src/PreRunChecklist.jsx:3, src/QuestionnaireDesigner.jsx:4, src/ResponseRunner.jsx:1, src/RuntimeContent.jsx:1, src/RuntimeRunnerPage.jsx:1
- `.15rem` — src/Inspector.jsx:205, src/Inspector.jsx:211, src/app/legacyBuilder.jsx:167, src/app/legacyBuilder.jsx:193, src/flowCanvas/NodePreviewModal.jsx:111, src/flowCanvas/NodePreviewModal.jsx:120, src/flowCanvas/NodePreviewModal.jsx:128, src/flowCanvas/NodePreviewModal.jsx:133, src/flowCanvas/NodePreviewModal.jsx:58, src/flowCanvas/NodePreviewModal.jsx:91
- `.25rem` — src/Inspector.jsx:300, src/Inspector.jsx:305, src/Inspector.jsx:309, src/Inspector.jsx:314, src/Inspector.jsx:319, src/Inspector.jsx:325, src/Inspector.jsx:332, src/Inspector.jsx:415, src/Inspector.jsx:420, src/Inspector.jsx:437, src/ThemeSettings.jsx:76, src/ThemeSettings.jsx:87, src/ThemeSettings.jsx:98
- `.2rem .4rem` — src/Inspector.jsx:335, src/flowCanvas/CanvasToolbar.jsx:33, src/flowCanvas/CanvasToolbar.jsx:34, src/flowCanvas/CanvasToolbar.jsx:35
- `.35rem .5rem` — src/FlowCanvas.jsx:505, src/ThemeSettings.jsx:102, src/ThemeSettings.jsx:80, src/ThemeSettings.jsx:91, src/flowCanvas/CanvasToolbar.jsx:30
- `.3rem` — src/Inspector.jsx:161, src/Inspector.jsx:203, src/TemplateConfig.jsx:19, src/TemplateConfig.jsx:24, src/TemplateConfig.jsx:31, src/flowCanvas/NodePreviewModal.jsx:143
- `.4rem` — src/Inspector.jsx:204, src/Inspector.jsx:333, src/TemplateConfig.jsx:38, src/flowCanvas/CanvasToolbar.jsx:30, src/flowCanvas/NodePreviewModal.jsx:111, src/flowCanvas/NodePreviewModal.jsx:114, src/flowCanvas/NodePreviewModal.jsx:122, src/flowCanvas/NodePreviewModal.jsx:131, src/flowCanvas/NodePreviewModal.jsx:135, src/flowCanvas/NodePreviewModal.jsx:143, src/flowCanvas/NodePreviewModal.jsx:51, src/flowCanvas/NodePreviewModal.jsx:58, src/flowCanvas/NodePreviewModal.jsx:62, src/flowCanvas/NodePreviewModal.jsx:72, src/flowCanvas/NodePreviewModal.jsx:85, src/flowCanvas/NodePreviewModal.jsx:93
- `.55rem` — src/ThemeSettings.jsx:117
- `.5rem` — src/BioDBSettings.jsx:62, src/BioDBSettings.jsx:81, src/DataPanel.jsx:264, src/DataPanel.jsx:391, src/Inspector.jsx:190, src/Inspector.jsx:229, src/Inspector.jsx:247, src/Inspector.jsx:262, src/Inspector.jsx:278, src/Inspector.jsx:298, src/Inspector.jsx:299, src/Inspector.jsx:342, src/Inspector.jsx:343, src/Inspector.jsx:367, src/Inspector.jsx:370, src/Inspector.jsx:39, src/Inspector.jsx:414, src/Inspector.jsx:435, src/Inspector.jsx:448, src/Inspector.jsx:58, src/MediaStep.jsx:134, src/ProtocolBioDBConfig.jsx:63, src/ProtocolBioDBConfig.jsx:92, src/QuestionnaireDesigner.jsx:63, src/RuntimeContent.jsx:101, src/RuntimeContent.jsx:123, src/RuntimeRunnerPage.jsx:409, src/RuntimeRunnerPage.jsx:423, src/RuntimeRunnerPage.jsx:478, src/RuntimeRunnerPage.jsx:635, src/SessionManager.jsx:351, src/TemplateConfig.jsx:18, src/TemplateConfig.jsx:23, src/TemplateConfig.jsx:26, src/TemplateConfig.jsx:31, src/TemplateConfig.jsx:34, src/ThemeSettings.jsx:63, src/app/legacyBuilder.jsx:111, src/app/legacyBuilder.jsx:277, src/app/legacyBuilder.jsx:431, src/flowCanvas/CanvasToolbar.jsx:12, src/flowCanvas/CanvasToolbar.jsx:23, src/flowCanvas/CanvasToolbar.jsx:28, src/flowCanvas/NodePreviewModal.jsx:37
- `.62rem` — src/Inspector.jsx:335
- `.65rem` — src/FlowCanvas.jsx:504, src/FlowCanvas.jsx:505, src/Inspector.jsx:298, src/flowCanvas/CanvasToolbar.jsx:32, src/flowCanvas/NodePreviewModal.jsx:153
- `.68rem` — src/Inspector.jsx:205, src/Inspector.jsx:211, src/flowCanvas/CanvasToolbar.jsx:33, src/flowCanvas/CanvasToolbar.jsx:34, src/flowCanvas/CanvasToolbar.jsx:35
- `.72rem` — src/Inspector.jsx:201, src/Inspector.jsx:203, src/Inspector.jsx:253, src/Inspector.jsx:269, src/Inspector.jsx:283, src/Inspector.jsx:300, src/Inspector.jsx:305, src/Inspector.jsx:309, src/Inspector.jsx:314, src/Inspector.jsx:319, src/Inspector.jsx:325, src/Inspector.jsx:332, src/Inspector.jsx:415, src/Inspector.jsx:420, src/Inspector.jsx:437, src/Inspector.jsx:452, src/RuntimeRunnerPage.jsx:558, src/RuntimeRunnerPage.jsx:560, src/app/legacyBuilder.jsx:162, src/app/legacyBuilder.jsx:166, src/app/legacyBuilder.jsx:169, src/app/legacyBuilder.jsx:192, src/app/legacyBuilder.jsx:195, src/app/legacyBuilder.jsx:411, src/app/legacyBuilder.jsx:431, src/flowCanvas/CanvasToolbar.jsx:26, src/flowCanvas/CanvasToolbar.jsx:31
- `.78rem` — src/Inspector.jsx:450, src/TemplateConfig.jsx:16, src/ThemeSettings.jsx:68, src/flowCanvas/CanvasToolbar.jsx:25, src/flowCanvas/CanvasToolbar.jsx:28, src/flowCanvas/NodePreviewModal.jsx:85
- `.7rem` — src/Inspector.jsx:325, src/RuntimeRunnerPage.jsx:481, src/flowCanvas/CanvasToolbar.jsx:12
- `.82rem` — src/ThemeSettings.jsx:102, src/ThemeSettings.jsx:127, src/ThemeSettings.jsx:63, src/ThemeSettings.jsx:76, src/ThemeSettings.jsx:80, src/ThemeSettings.jsx:87, src/ThemeSettings.jsx:91, src/ThemeSettings.jsx:98, src/flowCanvas/NodePreviewModal.jsx:62, src/flowCanvas/NodePreviewModal.jsx:72
- `.8rem` — src/QuestionnaireDesigner.jsx:63, src/RuntimeContent.jsx:115, src/RuntimeContent.jsx:133, src/RuntimeRunnerPage.jsx:409, src/TemplateConfig.jsx:16, src/ThemeSettings.jsx:63, src/app/legacyBuilder.jsx:118, src/app/legacyBuilder.jsx:413, src/flowCanvas/NodePreviewModal.jsx:109, src/flowCanvas/NodePreviewModal.jsx:119, src/flowCanvas/NodePreviewModal.jsx:153, src/flowCanvas/NodePreviewModal.jsx:49, src/flowCanvas/NodePreviewModal.jsx:55, src/flowCanvas/NodePreviewModal.jsx:69, src/flowCanvas/NodePreviewModal.jsx:74, src/flowCanvas/NodePreviewModal.jsx:90, src/flowCanvas/NodePreviewModal.jsx:99, src/main.jsx:63
- `.composer-node, .composer-port, .composer-wires` — src/composer/useComposerState.js:410
- `.instruction { font-family: Georgia, serif; }` — src/Inspector.jsx:325
- `'Inter', system-ui, sans-serif` — src/ThemeSettings.jsx:84
- `'SF Mono', 'Cascadia Code', monospace` — src/Inspector.jsx:450, src/ThemeSettings.jsx:83
- `"Comic Sans MS", cursive` — src/Inspector.jsx:37
- `(missing)` — src/composer/Catalogs.jsx:87, src/core/questionnaireModel.js:35, src/core/validateProtocolGraph.js:101, src/core/validateProtocolGraph.js:102, src/core/validateProtocolGraph.js:24, src/core/validateProtocolGraph.js:243, src/data/graphIntegrity.js:16, src/deployment/deploymentBundle.js:107, src/deployment/deploymentBundle.js:120, src/deployment/deploymentBundle.js:91, src/devices/deviceConnector.js:10, src/hosted/hostedService.js:150, src/hosted/hostedService.js:31, src/hosted/hostedService.js:377, src/hosted/hostedService.js:514, src/hosted/hostedStateStore.js:116, src/hosted/hostedStateStore.js:120, src/hosted/hostedStateStore.js:122, src/hosted/hostedStateStore.js:40, src/hosted/hostedStateStore.js:52, src/hosted/hostedStateStore.js:53, src/hosted/hostedStateStore.js:62, src/hosted/hostedStateStore.js:63, src/hosted/hostedStateStore.js:65, src/hosted/hostedStateStore.js:66, src/hosted/hostedStateStore.js:88, src/hosted/hostedStateStore.js:89, src/hosted/hostedStateStore.js:90, src/hosted/hostedStateStore.js:96, src/hosted/participantBootstrap.js:140, src/hosted/participantBootstrap.js:159, src/hosted/participantBootstrap.js:160, src/sdk/componentPackage.js:19
- `(whole entity)` — src/composer/Catalogs.jsx:142
- `{edges}` — src/composer/Canvas.jsx:21
- `{n}` — src/CalibrationRunner.jsx:56, src/ComposerV2.jsx:63, src/GraphRuntimeRunnerPage.jsx:607, src/GraphRuntimeRunnerPage.jsx:611, src/PreRunChecklist.jsx:230, src/PreRunChecklist.jsx:234, src/composer/Canvas.jsx:27, src/composer/Canvas.jsx:59, src/composer/Canvas.jsx:87, src/composer/Catalogs.jsx:448, src/composer/Catalogs.jsx:456, src/composer/Catalogs.jsx:459, src/composer/GroupBatchEditor.jsx:27, src/composer/Inspector.jsx:20, src/composer/Inspector.jsx:24, src/composer/NodeInspector.jsx:161
- `{name}` — src/GraphRuntimeRunnerPage.jsx:607, src/GraphRuntimeRunnerPage.jsx:611, src/GraphRuntimeRunnerPage.jsx:615, src/GraphRuntimeRunnerPage.jsx:623, src/GraphRuntimeRunnerPage.jsx:628, src/RuntimeRunnerPage.jsx:482, src/RuntimeRunnerPage.jsx:565, src/composer/Catalogs.jsx:448, src/composer/useComposerState.js:181, src/composer/useComposerState.js:203, src/participantUi/PositionFields.jsx:15, src/participantUi/ScreenChecks.jsx:16, src/participantUi/ScreenChecks.jsx:20, src/participantUi/StyleEditor.jsx:12, src/participantUi/StyleEditor.jsx:20
- `{nodes}` — src/composer/Canvas.jsx:21
- `{source}` — src/composer/GroupBatchEditor.jsx:27, src/composer/useComposerState.js:181
- `{total}` — src/GraphRuntimeRunnerPage.jsx:628, src/composer/Catalogs.jsx:448
- `<h1>Hello</h1> <style>h1{color:#197453;font-family:Georgia}</style>` — src/Inspector.jsx:450
- `$protocol` — src/collaboration/changeSets.js:113, src/collaboration/changeSets.js:114, src/collaboration/changeSets.js:116, src/collaboration/changeSets.js:117, src/collaboration/changeSets.js:118, src/collaboration/changeSets.js:120, src/collaboration/changeSets.js:135, src/collaboration/changeSets.js:153, src/collaboration/changeSets.js:174
- `0.7rem` — src/Inspector.jsx:303, src/analysis/CrossSessionCompare.jsx:177, src/analysis/ResponseCharts.jsx:164, src/analysis/ResponseCharts.jsx:166, src/analysis/ResponseCharts.jsx:84, src/analysis/WindowCards.jsx:150, src/constants.js:221
- `0.85rem` — src/Inspector.jsx:303, src/RuntimeContent.jsx:142, src/RuntimeContent.jsx:154, src/RuntimeContent.jsx:167, src/RuntimeContent.jsx:241, src/analysis/ResponseCharts.jsx:144
- `1.2rem` — src/Inspector.jsx:303, src/analysis/WindowCards.jsx:166
- `1.5rem` — src/Inspector.jsx:303, src/MediaStep.jsx:134, src/RuntimeContent.jsx:101, src/RuntimeContent.jsx:123, src/RuntimeContent.jsx:152, src/RuntimeContent.jsx:153, src/RuntimeContent.jsx:165, src/RuntimeContent.jsx:166, src/RuntimeRunnerPage.jsx:407, src/SessionManager.jsx:350, src/analysis/CrossSessionCompare.jsx:22, src/analysis/ResponseCharts.jsx:23, src/app/legacyBuilder.jsx:383, src/constants.js:223, src/flowCanvas/NodePreviewModal.jsx:47
- `1px solid var(--line)` — src/Inspector.jsx:334, src/MediaStep.jsx:130, src/RuntimeContent.jsx:274, src/SessionManager.jsx:350, src/TemplateConfig.jsx:16, src/TemplateConfig.jsx:19, src/TemplateConfig.jsx:24, src/ThemeSettings.jsx:102, src/ThemeSettings.jsx:67, src/ThemeSettings.jsx:80, src/ThemeSettings.jsx:91, src/analysis/CrossSessionCompare.jsx:159, src/analysis/ResponseCharts.jsx:162, src/analysis/WindowCards.jsx:139, src/flowCanvas/CanvasContextMenu.jsx:16, src/flowCanvas/CanvasToolbar.jsx:23, src/flowCanvas/CanvasToolbar.jsx:30, src/flowCanvas/NodePreviewModal.jsx:114, src/flowCanvas/NodePreviewModal.jsx:122, src/flowCanvas/NodePreviewModal.jsx:131, src/flowCanvas/NodePreviewModal.jsx:135, src/flowCanvas/NodePreviewModal.jsx:51, src/flowCanvas/NodePreviewModal.jsx:62, src/flowCanvas/NodePreviewModal.jsx:72, src/flowCanvas/NodePreviewModal.jsx:85, src/flowCanvas/NodePreviewModal.jsx:93
- `1rem` — src/BioDBSettings.jsx:39, src/BioDBSettings.jsx:81, src/DataPanel.jsx:218, src/DataPanel.jsx:391, src/Inspector.jsx:303, src/ProtocolBioDBConfig.jsx:52, src/ProtocolBioDBConfig.jsx:92, src/SessionManager.jsx:350, src/ThemeSettings.jsx:40, src/ThemeSettings.jsx:75, src/analysis/WindowCards.jsx:16, src/constants.js:222, src/flowCanvas/NodePreviewModal.jsx:119, src/flowCanvas/NodePreviewModal.jsx:164, src/flowCanvas/NodePreviewModal.jsx:33, src/main.jsx:67
- `2.5rem` — src/Inspector.jsx:303, src/app/legacyBuilder.jsx:111, src/domain.js:218, src/domain.js:248
- `2rem` — src/Inspector.jsx:303, src/MediaStep.jsx:134, src/RuntimeContent.jsx:152, src/RuntimeContent.jsx:165, src/RuntimeContent.jsx:263, src/RuntimeContent.jsx:264, src/analysis/CrossSessionCompare.jsx:16, src/analysis/ResponseCharts.jsx:10, src/analysis/ResponseCharts.jsx:17, src/analysis/TimelineView.jsx:19, src/analysis/WindowCards.jsx:10, src/constants.js:224, src/main.jsx:56
- `日本語` — src/Inspector.jsx:291, src/app/legacyBuilder.jsx:322, src/app/sessionSetup.jsx:164, src/app/sessionSetup.jsx:92, src/core/questionnaireModel.js:5, src/flowCanvas/NodePreviewModal.jsx:59
- `中文` — src/Inspector.jsx:291, src/app/legacyBuilder.jsx:321, src/app/sessionSetup.jsx:164, src/app/sessionSetup.jsx:92, src/core/questionnaireModel.js:5, src/flowCanvas/NodePreviewModal.jsx:59
- `A nested write requires a path` — src/collaboration/changeSets.js:162
- `Base hash must be SHA-256` — src/collaboration/changeSets.js:103
- `Base version must be a positive integer` — src/collaboration/changeSets.js:102
- `Border radius` — src/ThemeSettings.jsx:98, src/app/legacyBuilder.jsx:391
- `Change set exceeds the 10,000-operation safety limit` — src/collaboration/changeSets.js:106
- `Change set ID is required` — src/collaboration/changeSets.js:99
- `Change set targets a different protocol or project` — src/collaboration/changeSets.js:206
- `Change sets cannot cross protocol versions` — src/collaboration/changeSets.js:132
- `Change sets require the same protocol and project identity` — src/collaboration/changeSets.js:131
- `Color theme` — src/ThemeSettings.jsx:48
- `Compact (0.9x)` — src/ThemeSettings.jsx:92
- `composer-guide guide-h` — src/composer/Canvas.jsx:93
- `composer-guide guide-v` — src/composer/Canvas.jsx:92
- `composer-wire temp` — src/composer/Canvas.jsx:72
- `content-fields stimulus-pool-fields` — src/composer/NodeInspector.jsx:171
- `Create an editable protocol version before applying collaboration changes` — src/collaboration/changeSets.js:205
- `Ctrl+C` — src/Inspector.jsx:66
- `Ctrl+D` — src/Inspector.jsx:68
- `Ctrl+V` — src/Inspector.jsx:67
- `Custom primary color:` — src/ThemeSettings.jsx:63
- `Dark mode by default (participant view)` — src/ThemeSettings.jsx:129
- `Default trial layout` — src/ThemeSettings.jsx:109
- `e.g. 1.2rem, 18px` — src/Inspector.jsx:301
- `Extra large (1.15x)` — src/ThemeSettings.jsx:95
- `Font family` — src/ThemeSettings.jsx:76
- `Font scale` — src/ThemeSettings.jsx:87
- `Georgia (serif)` — src/ThemeSettings.jsx:82
- `group-fisher-yates-mulberry32-v1` — src/core/groupSequence.js:22
- `HTML / CSS / JS` — src/Inspector.jsx:449
- `i18n-group` — src/Inspector.jsx:127, src/Inspector.jsx:290
- `image/*,audio/*,video/*` — src/composer/Catalogs.jsx:467, src/composer/Catalogs.jsx:476
- `Large (1.1x)` — src/ThemeSettings.jsx:94
- `nodes selected` — src/Inspector.jsx:77
- `Normal (1.0x)` — src/ThemeSettings.jsx:93
- `Operations must be an array` — src/collaboration/changeSets.js:105
- `Project ID is required` — src/collaboration/changeSets.js:101
- `Protocol theme & style presets` — src/ThemeSettings.jsx:40
- `response or rating` — src/Inspector.jsx:192, src/app/legacyBuilder.jsx:329
- `Result hash must be SHA-256` — src/collaboration/changeSets.js:104
- `SANDBOX-P001` — src/composer/Catalogs.jsx:161
- `studio-inspector empty-inspector` — src/Inspector.jsx:76, src/Inspector.jsx:84
- `System UI (default)` — src/ThemeSettings.jsx:81
- `THEME SETTINGS` — src/ThemeSettings.jsx:39
- `theme-preset-card layout-preset` — src/ThemeSettings.jsx:113
- `unknown time` — src/composer/Catalogs.jsx:132
- `value | label | key` — src/Inspector.jsx:194, src/app/legacyBuilder.jsx:330
- `var(--green)` — src/Inspector.jsx:203, src/Inspector.jsx:436, src/RuntimeContent.jsx:106, src/RuntimeContent.jsx:183, src/app/legacyBuilder.jsx:411, src/flowCanvas/CanvasLayers.jsx:20, src/flowCanvas/CanvasLayers.jsx:24, src/flowCanvas/CanvasLayers.jsx:32, src/flowCanvas/CanvasLayers.jsx:53
- `var(--muted)` — src/App.jsx:47, src/Inspector.jsx:194, src/Inspector.jsx:201, src/Inspector.jsx:253, src/Inspector.jsx:269, src/Inspector.jsx:283, src/Inspector.jsx:452, src/QuestionnaireDesigner.jsx:63, src/RuntimeContent.jsx:115, src/RuntimeContent.jsx:133, src/RuntimeContent.jsx:263, src/TemplateConfig.jsx:20, src/analysis/CrossSessionCompare.jsx:16, src/analysis/ResponseCharts.jsx:10, src/analysis/ResponseCharts.jsx:17, src/analysis/TimelineView.jsx:19, src/analysis/WindowCards.jsx:10, src/flowCanvas/CanvasToolbar.jsx:28, src/flowCanvas/CanvasToolbar.jsx:32, src/flowCanvas/NodePreviewModal.jsx:112, src/flowCanvas/NodePreviewModal.jsx:153, src/flowCanvas/NodePreviewModal.jsx:59
- `xMidYMid meet` — src/composer/Canvas.jsx:104
- `yes | Yes | 1 no | No | 2` — src/Inspector.jsx:195, src/app/legacyBuilder.jsx:330
