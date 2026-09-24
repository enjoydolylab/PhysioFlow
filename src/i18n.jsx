import { createContext, useContext, useEffect, useRef, useState } from 'react';

// 日本語を既定の表示言語にする（研究室内の共通言語）。
// UI 文言の原文は英語で JSX に埋め込み、ここで上書きする。
export const DEFAULT_LANGUAGE = 'ja';
const dictionaries = {
  zh: {
    'EXPERIMENT WORKSPACE':'实验工作区','Design the flow.':'设计流程。','Trust the timeline.':'信任时间线。','New protocol':'新建实验方案','Import protocol':'导入实验方案','Edit flow':'编辑流程','New version':'新版本','Duplicate':'复制','Archive':'归档','Run':'正式运行','Sessions':'实验记录','Manage sessions':'管理实验记录',
    'Add to flow':'添加到流程','Drag later to arrange':'添加后可拖动排列','Presentation':'呈现','Media':'媒体','Interaction':'交互','Flow control':'流程控制','Instruction':'指导语','Fixation':'注视点','Timer':'计时器','Rest':'休息','Video':'视频','Audio':'音频','Image':'图片','Questionnaire':'问卷','Manual event':'手动事件','Device check':'设备检查','Condition':'条件','True / false':'真 / 假','Loop':'循环','Body / exit':'循环体 / 退出','Auto layout':'自动布局','Ready':'就绪','Select a node':'选择节点','Delete node':'删除节点','Delete connection':'删除连接','Display label':'显示名称','Event type':'事件类型','Timing & behavior':'时间与行为','Start mode':'开始方式','End mode':'结束方式','Duration (milliseconds)':'时长（毫秒）','Automatically continue':'自动继续','Operator may skip':'实验员可跳过','Media resource':'媒体资源','Source':'来源','Upload file':'上传文件','Resource URL':'资源地址','Show player controls':'显示播放器控件','Participant content':'参与者内容','Questionnaire designer':'问卷设计器','Add question':'添加问题','Required':'必填','Questionnaire name':'问卷名称','Minimum':'最小值','Maximum':'最大值','Continue when':'满足以下条件时继续','Variable':'变量','Comparison':'比较方式','Value':'值','Maximum iterations':'最大循环次数',
    'Review, export and validate':'审核、导出与验证','Select a Session':'选择一条实验记录','Automatic integrity check':'自动完整性检查','Researcher validity':'研究者有效性判断','Researcher notes':'研究者备注','Save review':'保存审核','Delete Session':'删除实验记录','No Sessions stored.':'尚无实验记录。','No integrity issue detected':'未检测到完整性问题','Export complete bundle':'导出完整数据包',
    'Create protocol':'新建实验方案','Use emotion template':'使用情绪实验模板','Import JSON':'导入 JSON','Protocols':'实验方案','Recent sessions':'最近的实验记录','saved locally':'保存在本地','stored':'条记录','No protocol yet. Start from a blank canvas or load the five-condition template.':'暂无实验方案。可从空白方案或五条件情绪实验模板开始。','Local-first workspace':'本地优先工作区','Projects':'项目','Export config':'导出配置','Save':'保存','Freeze':'冻结版本','Test run':'试运行','Step palette':'步骤组件','Protocol check':'方案检查','Ready to run':'可以运行','Add trial':'添加 Trial','Add block':'添加 Block','Customize complete trial interface':'自定义完整 Trial 界面','Background':'背景','Text color':'文字颜色','Content width':'内容宽度','Alignment':'对齐方式','Padding':'内边距','Spacing':'间距','Progress':'显示进度','Step label':'显示步骤类型','End mode':'结束方式','Fixed time':'固定时间','When media ends':'媒体结束时','Manual continue':'手动继续','Duration (ms)':'时长（毫秒）','Start':'开始方式','Automatic':'自动','Participant click':'参与者点击','Auto advance':'自动跳转','Media source':'媒体来源','Direct URL':'直链','YouTube embed':'YouTube 嵌入','Upload local file':'上传本地文件','Choose media file':'选择媒体文件','Source URL':'媒体地址','Volume':'音量','Controls':'播放器控件','Muted':'静音','Loop':'循环','SESSION SETUP':'SESSION 设置','Participant ID':'参与者 ID','Participant language':'参与者语言','Operator ID':'实验员 ID','Device start reference':'设备开始时间参考','Order row':'顺序行','Protocol integrity':'方案完整性','Start session':'开始实验','READY':'准备就绪','Begin experiment':'开始实验','Pause':'暂停','Resume':'继续','Skip':'跳过','Abort':'中止','Continue':'继续','Quick markers':'快速异常标记','events captured':'个事件已记录','SESSION COMPLETE':'实验完成','events':'事件','steps':'步骤','export files':'导出文件','Export complete bundle':'导出完整数据包','Return to projects':'返回项目','How do you feel right now?':'您现在感觉如何？','Submit response':'提交回答','Waiting for operator confirmation.':'等待实验员确认。','seconds planned':'计划秒数','Left':'左对齐','Center':'居中','Right':'右对齐','Draft test run — no frozen hash':'草稿试运行——尚无冻结哈希','No media source assigned':'未设置媒体来源','Invalid YouTube URL':'无效的 YouTube 地址'
  },
  ja: {
    'EXPERIMENT WORKSPACE':'実験ワークスペース','Design the flow.':'フローを設計。','Trust the timeline.':'タイムラインを信頼。','New protocol':'新規プロトコル','Import protocol':'プロトコル読込','Edit flow':'フロー編集','New version':'新しいバージョン','Duplicate':'複製','Archive':'アーカイブ','Run':'本実行','Sessions':'セッション','Manage sessions':'セッション管理',
    'Add to flow':'フローに追加','Drag later to arrange':'追加後にドラッグして配置','Presentation':'提示','Media':'メディア','Interaction':'インタラクション','Flow control':'フロー制御','Instruction':'教示','Fixation':'注視点','Timer':'タイマー','Rest':'休憩','Video':'動画','Audio':'音声','Image':'画像','Questionnaire':'アンケート','Manual event':'手動イベント','Device check':'デバイス確認','Condition':'条件','True / false':'真 / 偽','Loop':'ループ','Body / exit':'本体 / 終了','Auto layout':'自動配置','Ready':'準備完了','Select a node':'ノードを選択','Delete node':'ノード削除','Delete connection':'接続削除','Display label':'表示ラベル','Event type':'イベント種別','Timing & behavior':'時間と動作','Start mode':'開始方法','End mode':'終了方法','Duration (milliseconds)':'時間（ミリ秒）','Automatically continue':'自動で続行','Operator may skip':'実験者がスキップ可能','Media resource':'メディア資源','Source':'ソース','Upload file':'ファイルをアップロード','Resource URL':'リソースURL','Show player controls':'プレイヤー操作を表示','Participant content':'参加者向け内容','Questionnaire designer':'アンケート設計','Add question':'質問を追加','Required':'必須','Questionnaire name':'アンケート名','Minimum':'最小値','Maximum':'最大値','Continue when':'次の条件で続行','Variable':'変数','Comparison':'比較','Value':'値','Maximum iterations':'最大反復回数',
    'Review, export and validate':'確認・出力・検証','Select a Session':'セッションを選択','Automatic integrity check':'自動整合性チェック','Researcher validity':'研究者による有効性','Researcher notes':'研究者メモ','Save review':'確認を保存','Delete Session':'セッション削除','No Sessions stored.':'保存済みセッションはありません。','No integrity issue detected':'整合性の問題は検出されませんでした','Export complete bundle':'完全データを書き出す',
    'Create protocol':'プロトコル作成','Use emotion template':'感情実験テンプレート','Import JSON':'JSONを読み込む','Protocols':'プロトコル','Recent sessions':'最近のセッション','saved locally':'ローカル保存','stored':'件保存','No protocol yet. Start from a blank canvas or load the five-condition template.':'プロトコルはまだありません。空白または5条件テンプレートから開始できます。','Local-first workspace':'ローカル優先ワークスペース','Projects':'プロジェクト','Export config':'設定を書き出す','Save':'保存','Freeze':'凍結','Test run':'テスト実行','Step palette':'ステップ一覧','Protocol check':'プロトコル確認','Ready to run':'実行できます','Add trial':'Trialを追加','Add block':'Blockを追加','Customize complete trial interface':'Trial画面全体をカスタマイズ','Background':'背景','Text color':'文字色','Content width':'コンテンツ幅','Alignment':'配置','Padding':'余白','Spacing':'間隔','Progress':'進捗を表示','Step label':'ステップ種別を表示','End mode':'終了方法','Fixed time':'固定時間','When media ends':'メディア終了時','Manual continue':'手動で続行','Duration (ms)':'時間（ミリ秒）','Start':'開始方法','Automatic':'自動','Participant click':'参加者がクリック','Auto advance':'自動で次へ','Media source':'メディアソース','Direct URL':'直接URL','YouTube embed':'YouTube埋め込み','Upload local file':'ローカルファイル','Choose media file':'メディアを選択','Source URL':'ソースURL','Volume':'音量','Controls':'再生コントロール','Muted':'ミュート','Loop':'ループ','SESSION SETUP':'セッション設定','Participant ID':'参加者ID','Participant language':'参加者の言語','Operator ID':'実験者ID','Device start reference':'デバイス開始時刻の参照','Order row':'順序行','Protocol integrity':'プロトコル整合性','Start session':'セッション開始','READY':'準備完了','Begin experiment':'実験開始','Pause':'一時停止','Resume':'再開','Skip':'スキップ','Abort':'中止','Continue':'次へ','Quick markers':'クイックマーカー','events captured':'件のイベント','SESSION COMPLETE':'セッション完了','events':'イベント','steps':'ステップ','export files':'出力ファイル','Export complete bundle':'完全データを書き出す','Return to projects':'プロジェクトへ戻る','How do you feel right now?':'今の気分を教えてください。','Submit response':'回答を送信','Waiting for operator confirmation.':'実験者の確認を待っています。','seconds planned':'予定秒数','Left':'左','Center':'中央','Right':'右','Draft test run — no frozen hash':'ドラフトテスト——凍結ハッシュなし','No media source assigned':'メディアソース未設定','Invalid YouTube URL':'無効なYouTube URL'
  },
  en: {},
};

Object.assign(dictionaries.zh,{
  'Projects':'项目','Blocks & Trials':'区块与试次','Stimuli':'刺激资源','Questionnaires':'问卷库','Save flow':'保存流程','Advanced settings':'高级设置','Editing':'正在编辑','EXPERIMENT STRUCTURE':'实验结构','Blocks and Trials':'区块与试次','Add Trial':'添加试次','Add Block':'添加区块','Duplicate project':'复制项目','Archive project':'归档项目','Rename':'重命名','Edit draft':'编辑草稿','Run latest':'运行最新版本','Version history':'版本历史','View':'查看','Close':'关闭','Delete':'删除','Repeat':'重复次数','Condition':'条件','Fixed':'固定','Random':'随机','Latin square':'拉丁方','Manual':'手动',
  'STIMULUS LIBRARY':'刺激资源库','Reusable media resources':'可复用媒体资源','Add stimulus':'添加刺激资源','Local upload':'本地上传','QUESTIONNAIRE LIBRARY':'问卷库','Reusable questionnaires':'可复用问卷','Add questionnaire':'添加问卷','Shared stimulus library':'共享刺激资源库','Reusable resource':'可复用资源','Shared questionnaire library':'共享问卷库','Reusable questionnaire':'可复用问卷','Detach as editable copy':'分离为可编辑副本','Node-local questionnaire':'节点独立问卷',
  'Integrity & analysis':'完整性与分析','Required for a valid Session':'有效 Session 必须完成','Operator may retry':'实验员可重试','Recovery after reload':'刷新后的恢复方式','Resume remaining time':'继续剩余时间','Restart this event':'重新开始此事件','Wait for operator':'等待实验员','Generate analysis window':'生成分析窗口','Analysis role':'分析角色','Analysis label':'分析标签',
  'Device synchronization':'设备时间同步','Sync method':'同步方式','Same computer clock':'同一电脑时钟','Manual offset':'手动偏移','Manual sync marker':'手动同步标记','Offset (ms)':'偏移量（毫秒）','Device time column':'设备时间列','Time format':'时间格式','Epoch milliseconds':'Unix 毫秒','Epoch seconds':'Unix 秒','Relative milliseconds':'相对毫秒','Timezone':'时区','Sampling rate (Hz)':'采样率（Hz）','Actual Trial order preview':'实际试次顺序预览','Manual order':'手动顺序',
  'Instant markers':'瞬时标记','Interval marker':'区间标记','Start interval':'开始区间','End interval':'结束区间','Participant fullscreen':'参与者全屏','SESSION DATA':'Session 数据','Unreviewed':'未审核','Valid':'有效','Invalid':'无效','Exclude from analysis':'排除分析',
  'Analytics':'数据分析','No completed sessions':'暂无完成的实验','timeline':'时间线','windows':'分析窗口','responses':'回答','compare':'对比','Export chart as PNG':'导出图表为PNG','Task':'任务','Recovery':'恢复','Baseline':'基线','Stimulus':'刺激','Custom':'自定义','seconds':'秒',
  // v0.3.0 — new UI text (extensive coverage)
  'nodes':'节点','connections':'连接','Snap':'吸附','Flow snapshots':'流程快照','+ Save':'+ 保存','Restore':'恢复','Rename':'重命名','Delete':'删除','No snapshots yet. Save a snapshot to preserve your current flow layout.':'暂无快照。保存快照以保留当前流程布局。',
  'Steps outside flow':'未放入流程的步骤','Insert':'插入','Remove unused':'移除未使用','Connect':'连接','Cancel':'取消',
  'Quick note':'快速笔记','Markers':'标记','events captured':'个事件已记录','Recording':'记录中','Start here':'从这里开始','Tutorial':'教程','Storage':'存储','Storage guide':'存储指南','Data folder':'数据文件夹','Help':'帮助',
  'Saved':'已保存','Save flow':'保存流程','Built-in guide':'内置指南','Data format':'数据格式','Export JSON':'导出 JSON','Freeze version':'冻结版本','Unfreeze version':'解冻版本','Advanced settings':'高级设置',
  'Navigation':'导航','Blocks & Trials':'区块与试次','Stimuli library':'刺激资源库','Questionnaire library':'问卷库',
  'Export simplified data':'导出简化数据','Export complete (advanced)':'导出完整数据（高级）','Export complete bundle (advanced)':'导出完整数据包（高级）',
  'Saved to local storage. The export bundle is ready.':'已保存到本地存储。导出数据包已就绪。',
  'Session review saved':'Session 审核已保存','Loading Session…':'正在加载 Session…','Select a Session':'选择一条 Session',
  'No Sessions stored.':'尚无存储的 Session。','Automatic integrity check':'自动完整性检查','No integrity issue detected':'未检测到完整性问题',
  'Researcher validity':'研究者有效性判断','Researcher notes':'研究者备注','Save review':'保存审核',
  'Export package':'导出数据包','Delete this session':'删除此 Session',
  'nodes ·':'节点 ·',
  'node':'节点','edge':'连线','Continue →':'继续 →','Abort session?':'中止 Session？',
  'This will mark the session as aborted. All data so far will be preserved.':'这将标记 Session 为已中止。所有已记录数据将被保留。',
  'SESSION COMPLETE':'Session 完成','events':'事件','steps':'步骤','export files':'导出文件',
  'Return to projects':'返回项目列表','Discard recovery?':'放弃恢复？',
  'Discard':'放弃','Resume experiment':'恢复实验','UNFINISHED SESSION':'未完成的 Session',
  'Building protocol index…':'正在构建方案索引…','No projects yet':'暂无项目',
  'projects':'项目','active projects':'活跃项目','frozen versions':'已冻结版本','sessions':'Session','ready':'就绪',
  'Fix':'定位并修改','Dismiss':'关闭','Show palette':'显示面板','Hide palette':'隐藏面板','Show inspector':'显示检查器','Hide inspector':'隐藏检查器',
  'Preview (double-click)':'预览（双击）','Preview step (double-click)':'预览步骤（双击）',
  'Duration mode':'时长模式','Planned':'计划时长','Start mode':'开始方式','Auto advance':'自动继续',
  'Analysis window':'分析窗口','Close preview':'关闭预览',
  'No media source configured':'未配置媒体来源','Uploaded file':'已上传文件',
  'Source':'来源','YouTube':'YouTube','URL':'链接','Vol':'音量','Muted':'静音','Looping':'循环','Controls visible':'显示控件',
  // Flow editor
  'Flow':'流程','Utils':'工具','Add event':'添加事件','Add condition':'添加条件','Add loop':'添加循环','Add note':'添加便签','Add junction':'添加连接点','Select all':'全选','Delete selected':'删除选中','Copy':'复制','Paste':'粘贴','Duplicate':'复制',
  'Connect a wire to here':'连接线到此','Drag to connect':'拖动连接','true':'真','false':'假','body':'循环体','exit':'退出','next':'下一个',
  'Add to flow':'添加到流程','Drag nodes to arrange':'拖动节点排列','Find node by name...':'按名称搜索节点...','match':'匹配','matches':'匹配',
  'Back to projects':'返回项目','Project name':'项目名称','Select trial to edit':'选择要编辑的 Trial','Node manual':'节点手册','Test run':'试运行','More actions':'更多操作',
  'Unsaved changes':'未保存的更改','Protocol saved':'方案已保存',
  // Builder
  'Experiment → Block → Trial → Step':'实验 → Block → Trial → Step','Step palette':'步骤面板','Start building your experiment':'开始构建你的实验',
  'Add a Block below — this is your top-level container':'在下方添加一个 Block — 这是你的顶层容器',
  'Add Trials inside the Block — each Trial is one run-through':'在 Block 内添加 Trial — 每个 Trial 是一次完整运行',
  'Choose Step types for each Trial — instruction, video, questionnaire…':'为每个 Trial 选择 Step 类型 — 指导语、视频、问卷……',
  '+ Add Block':'+ 添加 Block','+ Add trial':'+ 添加 Trial','+ Add block':'+ 添加 Block',
  'Block name':'Block 名称','Trial name':'Trial 名称','Step name':'Step 名称','condition':'条件','Repeat count':'重复次数',
  'Export config':'导出配置','Freeze':'冻结版本',
  // Session setup
  'SESSION SETUP':'Session 设置','SESSION DATA':'Session 数据',
  'Bind this run to an anonymous participant and an exact protocol version.':'将本次运行与匿名参与者和精确方案版本绑定。',
  'Trial order preview':'Trial 顺序预览','Device synchronization (advanced)':'设备时间同步（高级）',
  'Actual Trial order preview':'实际 Trial 顺序预览','Protocol integrity':'方案完整性',
  'Draft test run — no frozen hash':'草稿试运行—无冻结哈希','Start session':'开始实验',
  'Local data folder required':'需要本地数据文件夹','Preview storage':'预览存储','Select a folder before formal collection':'正式采集前请选择一个文件夹',
  'Local data folder active':'本地数据文件夹已激活',
  // Runtime
  'Loading uploaded media…':'正在加载已上传的媒体…','No media source assigned':'未设置媒体来源','Invalid YouTube URL':'无效的 YouTube URL',
  'No questions configured for this questionnaire.':'此问卷没有配置任何问题。',
  'Required / 必填 / 必須':'必填 / Required / 必須',
  'Responses recorded':'回答已记录','回答已记录':'回答已记录','回答が記録されました':'回答が記録されました',
  'Submit response':'提交回答','回答を送信':'回答を送信','回答を送信':'回答を送信',
  'Continue':'继续','次へ':'次へ',
  'seconds planned':'计划秒数','seconds':'秒',
  'Pause':'暂停','Resume':'继续','Skip':'跳过','Retry':'重试','Abort':'中止',
  'Ready when you are':'准备好了就开始','Operator note (required)':'操作员备注（必填）','Operator note (optional)':'操作员备注（可选）',
  'Optional note':'可选备注','Required confirmation note':'必填确认备注',
  'Confirm event':'确认事件','Complete device check →':'完成设备检查 →',
  'Block':'Block','Trial':'Trial','Step':'Step',
  'block':'block','trial':'trial','step':'step',
  'session_started':'Session 开始','session_resumed':'Session 恢复','session_paused':'Session 暂停','session_resumed':'Session 恢复','session_completed':'Session 完成','session_aborted':'Session 中止',
  'step_entered':'步骤进入','step_completed':'步骤完成','step_started':'步骤开始','step_skipped':'步骤跳过','step_retried':'步骤重试','step_recovered':'步骤恢复',
  'trial_started':'Trial 开始','trial_completed':'Trial 完成','block_started':'Block 开始','block_completed':'Block 完成',
  'media_play_started':'媒体播放开始','media_play_requested':'媒体播放请求','media_ended':'媒体结束','media_paused':'媒体暂停','media_resumed':'媒体恢复','media_ready':'媒体就绪','media_error':'媒体错误','media_load_requested':'媒体加载请求',
  'questionnaire_submitted':'问卷已提交','response_recorded':'回答已记录','response_missed':'回答未记录',
  'manual_marker':'手动标记','manual_event_confirmed':'手动事件已确认','device_check_completed':'设备检查已完成','marker_interval_started':'标记区间开始','marker_interval_ended':'标记区间结束',
  // Markers
  'cough':'咳嗽','speech':'说话','movement':'动作','device_adjustment':'设备调整','device_disconnected':'设备断开','distraction':'分心','sync_marker':'同步标记','operator_note':'操作员备注','custom':'自定义',
  // Integrity
  'valid':'有效','invalid':'无效','attention':'需注意','exclude':'排除','unreviewed':'未审核',
  // Export
  'Session export':'Session 导出','Export complete bundle':'导出完整数据包',
  'events.csv':'events.csv','responses.csv':'responses.csv','analysis_windows.csv':'analysis_windows.csv','stimulus_manifest.csv':'stimulus_manifest.csv','integrity_report.json':'integrity_report.json','data_dictionary.csv':'data_dictionary.csv',
  // Misc
  'All':'全部','Search sessions...':'搜索 Session...','Clear search':'清除搜索','Close':'关闭','Back':'返回',
  'Unsaved':'未保存','Local-first workspace':'本地优先工作区',
  'Edit':'编辑','Edit draft':'编辑草稿','Run latest':'运行最新','New version':'新版本','Duplicate project':'复制项目','Archive project':'归档项目','Version history':'版本历史',
  'View':'查看','Open folder':'打开文件夹','Change folder':'更换文件夹','Select folder':'选择文件夹',
  'Choose a local data folder':'选择本地数据文件夹','No projects yet':'暂无项目',
  'Create a blank workflow or start from the emotion experiment template.':'创建一个空白工作流或从情绪实验模板开始。',
  'New protocol':'新建方案','Import protocol':'导入方案','Emotion template':'情绪模板','Stroop task':'Stroop 任务','Go/No-Go task':'Go/No-Go 任务',
  'Design protocols, run sessions, review integrity, and export analysis-ready data from one local-first workspace.':'在本地优先的工作区中设计方案、运行 Session、审核完整性和导出分析就绪的数据。',
  'EXPERIMENT WORKSPACE':'实验工作区','PhysioFlow workspace':'PhysioFlow 工作区',
  '1. Build':'1. 构建','2. Validate':'2. 验证','3. Run':'3. 运行','4. Review':'4. 审核',
  'Blocks, trials, nodes, media, and questionnaire content.':'Block、Trial、节点、媒体和问卷内容。',
  'Readiness checks, protocol freeze, pilot run, and local storage.':'就绪检查、方案冻结、试运行和本地存储。',
  'Participant setup, sync metadata, recovery, and event logging.':'参与者设置、同步元数据、恢复和事件记录。',
  'Session integrity, responses, analysis windows, and export package.':'Session 完整性、回答、分析窗口和导出数据包。',
  'Lab readiness':'实验室就绪','need review':'需要检查','blocked':'被阻止','average':'平均',
  'Fix blocking protocol, media, content, or storage issues before formal collection.':'正式采集前请修复阻止性的方案、媒体、内容或存储问题。',
  'Review warnings, freeze versions, and run pilot sessions before handoff.':'交接前请检查警告、冻结版本并运行试运行。',
  'Workspace is ready for collection and export.':'工作区已准备好进行采集和导出。',
  // Canvas/Code dual view + presets + empty guide (IC-style editor)
  'Canvas':'画布','Code':'代码','Presets':'预设','Stimulus trial':'刺激试次','SAM block':'SAM 模块','Instruction + check':'指导语 + 检查','Apply now':'立即应用','Trial JSON':'Trial JSON','Start building your flow':'开始构建你的流程','Drag a step or preset from the palette to place your first node.':'从左侧面板拖入步骤或预设以放置第一个节点。',
  'Search steps…':'搜索步骤…','Drag to canvas, or click to add':'拖到画布，或点击添加','Undo (⌘Z)':'撤销 (⌘Z)','Redo (⌘⇧Z)':'重做 (⌘⇧Z)','Fit view':'适应视图','Duplicate (⌘D)':'复制 (⌘D)','Expand':'展开','Collapse':'折叠','Ungroup':'解散分组','Group selected':'分组选中','No steps match':'无匹配步骤','… syncing':'… 同步中','✗ Invalid JSON':'✗ JSON 无效','Baseline → media stimulus → rating response':'基线 → 媒体刺激 → 评分响应','Baseline → SAM questionnaire':'基线 → SAM 问卷','Instruction → attention check':'指导语 → 注意检查',
});
Object.assign(dictionaries.ja,{
  'Projects':'プロジェクト','Blocks & Trials':'Block・Trial','Stimuli':'刺激ライブラリ','Questionnaires':'アンケート','Save flow':'フロー保存','Advanced settings':'詳細設定','Editing':'編集中','EXPERIMENT STRUCTURE':'実験構造','Blocks and Trials':'Block と Trial','Add Trial':'Trialを追加','Add Block':'Blockを追加','Duplicate project':'プロジェクト複製','Archive project':'プロジェクトを保管','Rename':'名前変更','Edit draft':'ドラフト編集','Run latest':'最新版を実行','Version history':'バージョン履歴','View':'表示','Close':'閉じる','Delete':'削除','Repeat':'反復回数','Condition':'条件','Fixed':'固定','Random':'ランダム','Latin square':'ラテン方格','Manual':'手動',
  'STIMULUS LIBRARY':'刺激ライブラリ','Reusable media resources':'再利用可能なメディア','Add stimulus':'刺激を追加','Local upload':'ローカルアップロード','QUESTIONNAIRE LIBRARY':'アンケートライブラリ','Reusable questionnaires':'再利用可能なアンケート','Add questionnaire':'アンケートを追加','Shared stimulus library':'共有刺激ライブラリ','Reusable resource':'再利用リソース','Shared questionnaire library':'共有アンケート','Reusable questionnaire':'再利用アンケート','Detach as editable copy':'編集可能なコピーとして分離','Node-local questionnaire':'ノード固有アンケート',
  'Integrity & analysis':'整合性・分析','Required for a valid Session':'有効なSessionに必須','Operator may retry':'実験者が再試行可能','Recovery after reload':'再読込後の復旧','Resume remaining time':'残り時間から再開','Restart this event':'イベントを再開始','Wait for operator':'実験者を待つ','Generate analysis window':'分析区間を生成','Analysis role':'分析役割','Analysis label':'分析ラベル',
  'Device synchronization':'デバイス時刻同期','Sync method':'同期方法','Same computer clock':'同一PC時刻','Manual offset':'手動オフセット','Manual sync marker':'手動同期マーカー','Offset (ms)':'オフセット（ms）','Device time column':'デバイス時刻列','Time format':'時刻形式','Epoch milliseconds':'Unixミリ秒','Epoch seconds':'Unix秒','Relative milliseconds':'相対ミリ秒','Timezone':'タイムゾーン','Sampling rate (Hz)':'サンプリング周波数（Hz）','Actual Trial order preview':'実際のTrial順序プレビュー','Manual order':'手動順序',
  'Instant markers':'瞬時マーカー','Interval marker':'区間マーカー','Start interval':'区間開始','End interval':'区間終了','Participant fullscreen':'参加者画面を全画面表示','SESSION DATA':'Sessionデータ','Unreviewed':'未確認','Valid':'有効','Invalid':'無効','Exclude from analysis':'分析から除外',
  'Analytics':'分析','No completed sessions':'完了したセッションがありません','timeline':'タイムライン','windows':'分析区間','responses':'回答','compare':'比較','Export chart as PNG':'PNGでエクスポート','Task':'課題','Recovery':'回復','Baseline':'ベースライン','Stimulus':'刺激','Custom':'カスタム','seconds':'秒',
  // v0.3.0 — new UI text (extensive coverage)
  'nodes':'ノード','connections':'接続','Snap':'スナップ','Flow snapshots':'フロースナップショット','+ Save':'+ 保存','Restore':'復元','Rename':'名前変更','Delete':'削除','No snapshots yet. Save a snapshot to preserve your current flow layout.':'スナップショットはまだありません。現在のフローレイアウトを保存してください。',
  'Steps outside flow':'フロー外のステップ','Insert':'挿入','Remove unused':'未使用を削除','Connect':'接続','Cancel':'キャンセル',
  'Quick note':'クイックメモ','Markers':'マーカー','events captured':'イベント記録済','Recording':'記録中','Start here':'ここから始める','Tutorial':'チュートリアル','Storage':'ストレージ','Storage guide':'ストレージガイド','Data folder':'データフォルダ','Help':'ヘルプ',
  'Saved':'保存済','Save flow':'フロー保存','Built-in guide':'内蔵ガイド','Data format':'データ形式','Export JSON':'JSON出力','Freeze version':'バージョン凍結','Unfreeze version':'凍結解除','Advanced settings':'詳細設定',
  'Navigation':'ナビゲーション','Blocks & Trials':'Block・Trial','Stimuli library':'刺激ライブラリ','Questionnaire library':'アンケートライブラリ',
  'Export simplified data':'簡易データ出力','Export complete (advanced)':'完全出力（詳細）','Export complete bundle (advanced)':'完全データ出力（詳細）',
  'Saved to local storage. The export bundle is ready.':'ローカルストレージに保存されました。出力パッケージの準備ができました。',
  'Session review saved':'セッション審査を保存しました','Loading Session…':'セッション読込中…','Select a Session':'セッションを選択',
  'No Sessions stored.':'保存済みセッションはありません。','Automatic integrity check':'自動整合性チェック','No integrity issue detected':'整合性の問題は検出されませんでした',
  'Researcher validity':'研究者による有効性判断','Researcher notes':'研究者メモ','Save review':'審査を保存',
  'Export package':'出力パッケージ','Delete this session':'このセッションを削除',
  'nodes ·':'ノード ·',
  'node':'ノード','edge':'エッジ','Continue →':'続行 →','Abort session?':'セッションを中止しますか？',
  'This will mark the session as aborted. All data so far will be preserved.':'セッションを中止としてマークします。これまでのデータはすべて保持されます。',
  'SESSION COMPLETE':'セッション完了','events':'イベント','steps':'ステップ','export files':'出力ファイル',
  'Return to projects':'プロジェクトに戻る','Discard recovery?':'回復を破棄しますか？',
  'Discard':'破棄','Resume experiment':'実験を再開','UNFINISHED SESSION':'未完了のセッション',
  'Building protocol index…':'プロトコル索引を構築中…','No projects yet':'プロジェクトなし',
  'projects':'プロジェクト','active projects':'アクティブプロジェクト','frozen versions':'凍結バージョン','sessions':'セッション','ready':'準備完了',
  'Fix':'修正','Dismiss':'閉じる','Show palette':'パレットを表示','Hide palette':'パレットを隠す','Show inspector':'インスペクタを表示','Hide inspector':'インスペクタを隠す',
  'Preview (double-click)':'プレビュー（ダブルクリック）','Preview step (double-click)':'ステップをプレビュー（ダブルクリック）',
  'Duration mode':'時間モード','Planned':'予定','Start mode':'開始モード','Auto advance':'自動進行',
  'Analysis window':'分析区間','Close preview':'プレビューを閉じる',
  'No media source configured':'メディアソースが設定されていません','Uploaded file':'アップロードファイル',
  'Source':'ソース','YouTube':'YouTube','URL':'URL','Vol':'音量','Muted':'ミュート','Looping':'ループ中','Controls visible':'コントロール表示',
  // Flow editor
  'Flow':'フロー','Utils':'ユーティリティ','Add event':'イベント追加','Add condition':'条件追加','Add loop':'ループ追加','Add note':'メモ追加','Add junction':'合流点追加','Select all':'全て選択','Delete selected':'選択削除','Copy':'コピー','Paste':'貼り付け','Duplicate':'複製',
  'Connect a wire to here':'ここにワイヤを接続','Drag to connect':'ドラッグして接続','true':'真','false':'偽','body':'本体','exit':'終了','next':'次へ',
  'Add to flow':'フローに追加','Drag nodes to arrange':'ノードをドラッグして配置','Find node by name...':'名前でノードを検索...','match':'件一致','matches':'件一致',
  'Back to projects':'プロジェクトに戻る','Project name':'プロジェクト名','Select trial to edit':'編集するTrialを選択','Node manual':'ノードマニュアル','Test run':'テスト実行','More actions':'その他の操作',
  'Unsaved changes':'未保存の変更','Protocol saved':'プロトコル保存済',
  // Builder
  'Experiment → Block → Trial → Step':'実験 → Block → Trial → Step','Step palette':'ステップ一覧','Start building your experiment':'実験の構築を始めましょう',
  'Add a Block below — this is your top-level container':'下にBlockを追加 — これが最上位のコンテナです',
  'Add Trials inside the Block — each Trial is one run-through':'Block内にTrialを追加 — 各Trialが1回の実行です',
  'Choose Step types for each Trial — instruction, video, questionnaire…':'各TrialにStepタイプを選択 — 教示、動画、アンケート…',
  '+ Add Block':'+ Block追加','+ Add trial':'+ Trial追加','+ Add block':'+ Block追加',
  'Block name':'Block名','Trial name':'Trial名','Step name':'Step名','condition':'条件','Repeat count':'繰り返し回数',
  'Export config':'設定出力','Freeze':'凍結',
  // Session setup
  'SESSION SETUP':'セッション設定','SESSION DATA':'セッションデータ',
  'Bind this run to an anonymous participant and an exact protocol version.':'この実行を匿名参加者と正確なプロトコルバージョンに紐付けます。',
  'Trial order preview':'Trial順序プレビュー','Device synchronization (advanced)':'デバイス時刻同期（詳細）',
  'Actual Trial order preview':'実際のTrial順序プレビュー','Protocol integrity':'プロトコル整合性',
  'Draft test run — no frozen hash':'ドラフトテスト — 凍結ハッシュなし','Start session':'セッション開始',
  'Local data folder required':'ローカルデータフォルダが必要','Preview storage':'プレビューストレージ','Select a folder before formal collection':'正式な収集前にフォルダを選択してください',
  'Local data folder active':'ローカルデータフォルダ有効',
  // Runtime
  'Loading uploaded media…':'アップロードメディアを読み込み中…','No media source assigned':'メディアソースが未設定','Invalid YouTube URL':'無効なYouTube URL',
  'No questions configured for this questionnaire.':'このアンケートには質問が設定されていません。',
  'Required / 必填 / 必須':'必須 / Required / 必填',
  'Responses recorded':'回答が記録されました','回答已记录':'回答が記録されました','回答が記録されました':'回答が記録されました',
  'Submit response':'回答を送信','回答を送信':'回答を送信','回答を送信':'回答を送信',
  'Continue':'続行','次へ':'次へ',
  'seconds planned':'予定秒数','seconds':'秒',
  'Pause':'一時停止','Resume':'再開','Skip':'スキップ','Retry':'再試行','Abort':'中止',
  'Ready when you are':'準備ができたら開始','Operator note (required)':'操作者メモ（必須）','Operator note (optional)':'操作者メモ（任意）',
  'Optional note':'任意メモ','Required confirmation note':'必須確認メモ',
  'Confirm event':'イベント確認','Complete device check →':'デバイスチェック完了 →',
  'Block':'Block','Trial':'Trial','Step':'Step',
  'block':'block','trial':'trial','step':'step',
  'session_started':'セッション開始','session_resumed':'セッション再開','session_paused':'セッション一時停止','session_resumed':'セッション再開','session_completed':'セッション完了','session_aborted':'セッション中止',
  'step_entered':'ステップ入り','step_completed':'ステップ完了','step_started':'ステップ開始','step_skipped':'ステップスキップ','step_retried':'ステップ再試行','step_recovered':'ステップ回復',
  'trial_started':'Trial開始','trial_completed':'Trial完了','block_started':'Block開始','block_completed':'Block完了',
  'media_play_started':'メディア再生開始','media_play_requested':'メディア再生要求','media_ended':'メディア終了','media_paused':'メディア一時停止','media_resumed':'メディア再開','media_ready':'メディア準備完了','media_error':'メディアエラー','media_load_requested':'メディア読込要求',
  'questionnaire_submitted':'アンケート送信','response_recorded':'応答記録','response_missed':'応答なし',
  'manual_marker':'手動マーカー','manual_event_confirmed':'手動イベント確認','device_check_completed':'デバイスチェック完了','marker_interval_started':'マーカー区間開始','marker_interval_ended':'マーカー区間終了',
  // Markers
  'cough':'咳','speech':'発話','movement':'動作','device_adjustment':'デバイス調整','device_disconnected':'デバイス切断','distraction':'注意散漫','sync_marker':'同期マーカー','operator_note':'操作者メモ','custom':'カスタム',
  // Integrity
  'valid':'有効','invalid':'無効','attention':'要注意','exclude':'除外','unreviewed':'未確認',
  // Export
  'Session export':'セッション出力','Export complete bundle':'完全データ出力',
  'events.csv':'events.csv','responses.csv':'responses.csv','analysis_windows.csv':'analysis_windows.csv','stimulus_manifest.csv':'stimulus_manifest.csv','integrity_report.json':'integrity_report.json','data_dictionary.csv':'data_dictionary.csv',
  // Misc
  'All':'全て','Search sessions...':'セッション検索...','Clear search':'検索クリア','Close':'閉じる','Back':'戻る',
  'Unsaved':'未保存','Local-first workspace':'ローカル優先ワークスペース',
  'Edit':'編集','Edit draft':'ドラフト編集','Run latest':'最新を実行','New version':'新バージョン','Duplicate project':'プロジェクト複製','Archive project':'プロジェクト保管','Version history':'バージョン履歴',
  'View':'表示','Open folder':'フォルダを開く','Change folder':'フォルダ変更','Select folder':'フォルダ選択',
  'Choose a local data folder':'ローカルデータフォルダを選択','No projects yet':'プロジェクトなし',
  'Create a blank workflow or start from the emotion experiment template.':'空白のワークフローを作成するか、感情実験テンプレートから開始してください。',
  'New protocol':'新規プロトコル','Import protocol':'プロトコル読込','Emotion template':'感情テンプレート','Stroop task':'Stroop課題','Go/No-Go task':'Go/No-Go課題',
  'Design protocols, run sessions, review integrity, and export analysis-ready data from one local-first workspace.':'ローカル優先の1つのワークスペースでプロトコル設計、セッション実行、整合性確認、分析用データ出力ができます。',
  'EXPERIMENT WORKSPACE':'実験ワークスペース','PhysioFlow workspace':'PhysioFlowワークスペース',
  '1. Build':'1. 構築','2. Validate':'2. 検証','3. Run':'3. 実行','4. Review':'4. 確認',
  'Blocks, trials, nodes, media, and questionnaire content.':'Block、Trial、ノード、メディア、アンケート内容。',
  'Readiness checks, protocol freeze, pilot run, and local storage.':'準備チェック、プロトコル凍結、パイロット実行、ローカルストレージ。',
  'Participant setup, sync metadata, recovery, and event logging.':'参加者設定、同期メタデータ、回復、イベント記録。',
  'Session integrity, responses, analysis windows, and export package.':'セッション整合性、回答、分析区間、出力パッケージ。',
  'Lab readiness':'ラボ準備','need review':'要確認','blocked':'ブロック','average':'平均',
  'Fix blocking protocol, media, content, or storage issues before formal collection.':'正式な収集前にブロックしているプロトコル、メディア、コンテンツ、ストレージの問題を修正してください。',
  'Review warnings, freeze versions, and run pilot sessions before handoff.':'引き渡し前に警告を確認し、バージョンを凍結し、パイロットセッションを実行してください。',
  'Workspace is ready for collection and export.':'ワークスペースは収集と出力の準備ができています。',
  // Canvas/Code dual view + presets + empty guide (IC-style editor)
  'Canvas':'キャンバス','Code':'コード','Presets':'プリセット','Stimulus trial':'刺激トライアル','SAM block':'SAM ブロック','Instruction + check':'教示 + チェック','Apply now':'今すぐ適用','Trial JSON':'Trial JSON','Start building your flow':'フローの構築を始めましょう','Drag a step or preset from the palette to place your first node.':'パレットからステップまたはプリセットをドラッグして最初のノードを配置してください。',
  'Search steps…':'ステップを検索…','Drag to canvas, or click to add':'キャンバスにドラッグ、またはクリックで追加','Undo (⌘Z)':'元に戻す (⌘Z)','Redo (⌘⇧Z)':'やり直す (⌘⇧Z)','Fit view':'全体を表示','Duplicate (⌘D)':'複製 (⌘D)','Expand':'展開','Collapse':'折りたたむ','Ungroup':'グループ解除','Group selected':'選択をグループ化','No steps match':'一致するステップなし','… syncing':'… 同期中','✗ Invalid JSON':'✗ 無効な JSON','Baseline → media stimulus → rating response':'ベースライン → 刺激 → 評価応答','Baseline → SAM questionnaire':'ベースライン → SAM アンケート','Instruction → attention check':'教示 → 注意チェック',
});

const LanguageContext = createContext(null);
const translationState = new WeakMap();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem('physioflow.ui-language') || DEFAULT_LANGUAGE);
  const root = useRef(null);
  const setLanguage = next => { localStorage.setItem('physioflow.ui-language', next); setLanguageState(next); };
  useEffect(() => {
    const translate = () => {
      if (!root.current) return;
      const walker = document.createTreeWalker(root.current, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const current=node.nodeValue.trim(),known=translationState.get(node);
        const raw=known&&current===known.rendered?known.raw:current;
        if (!raw || (!dictionaries.zh[raw] && !dictionaries.ja[raw])) continue;
        const leading = node.nodeValue.match(/^\s*/)?.[0] || '';
        const trailing = node.nodeValue.match(/\s*$/)?.[0] || '';
        const rendered=dictionaries[language][raw]||raw,nextValue=leading+rendered+trailing;
        translationState.set(node,{raw,rendered});
        if (node.nodeValue !== nextValue) node.nodeValue = nextValue;
      }
    };
    translate();
    if (root.current) {
      const observer = new MutationObserver(translate);
      observer.observe(root.current, { childList: true, subtree: true, characterData: true });
      return () => observer.disconnect();
    }
  }, [language]);
  return <LanguageContext.Provider value={{ language, setLanguage }}><div ref={root}>{children}</div></LanguageContext.Provider>;
}

export function useLanguage() { return useContext(LanguageContext); }

/** Returns a translate() bound to the current UI language — for attributes,
 *  placeholders, and dynamically-composed strings the DOM walker can't reach. */
export function useT() {
  const { language } = useLanguage();
  return key => translate(key, language);
}

/** Translate a key to the current language. Falls back to the key itself. */
export function translate(key, lang = 'en') {
  if (lang === 'en' || !dictionaries[lang]) return key;
  return dictionaries[lang][key] || key;
}

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  return <div className="language-toggle" aria-label="Language"><button className={language==='zh'?'active':''} onClick={() => setLanguage('zh')}>中文</button><button className={language==='ja'?'active':''} onClick={() => setLanguage('ja')}>日本語</button><button className={language==='en'?'active':''} onClick={() => setLanguage('en')}>EN</button></div>;
}

export function DarkModeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark-mode'));
  const toggle = () => {
    setDark(d => {
      const next = !d;
      document.documentElement.classList.toggle('dark-mode', next);
      document.documentElement.classList.toggle('light-mode', !next);
      localStorage.setItem('physioflow.dark-mode', next ? '1' : '0');
      return next;
    });
  };
  return <button className="dark-mode-btn" onClick={toggle} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? '☀' : '🌙'}</button>;
}

// ── Composer V2 editor (experiment design) ──
Object.assign(dictionaries.zh, {
  'Undo':'撤销','Redo':'重做','Preview run':'试运行','Prepare collection':'准备正式采集','Code':'代码','Editor mode':'编辑模式','Components':'组件','Click to insert into the selected flow.':'点击插入到当前流程。','Inspector':'属性面板','Select a node or connection to configure it.':'选择节点或连线进行配置。','Delete connection':'删除连线','Duplicate node':'复制节点','Delete node':'删除节点','Graph valid':'流程图有效','blocking issues':'个阻塞问题','Connection':'连线','Node group':'节点组','No group':'无分组','Create group from node':'从节点创建分组','Participant interface':'参与者界面','nodes':'节点','connections':'连线','Cancel connection':'取消连线','Variables':'变量','Groups':'分组','Reusable subflows':'可复用子流程','Project component library':'项目组件库','Device connectors':'设备连接器','Collaboration change sets':'协作变更集','Network':'网络','Create instance':'创建实例','Delete template':'删除模板','Publish reusable template':'发布复用模板','Apply changes':'应用修改','Edit the full protocol graph as JSON. Changes apply only when validation passes.':'以 JSON 编辑整个协议图。校验通过后才生效。','Screen content':'界面内容','Completion':'完成方式','manual':'手动','fixed':'固定','Duration (ms)':'时长（毫秒）','Media type':'媒体类型','Source URL':'资源地址','Asset ID':'资源 ID','Minimum':'最小值','Maximum':'最大值','Required':'必填','Placeholder':'占位文字','Multiline':'多行','Operator':'比较符','Expected value':'期望值','Probability of A (0–1)':'A 的概率 (0–1)','Seed salt':'随机盐','Match value':'匹配值','Maximum iterations':'最大循环次数','Shape':'形状','Size (px)':'尺寸（像素）','Color':'颜色','Pulse animation':'脉冲动画','Checklist (one per line)':'检查清单（每行一项）','Confirm label':'确认按钮文字','Require operator note':'要求操作员备注','Prompt':'提示文字','Expected key':'期望按键','Timeout (ms)':'超时（毫秒）','Participant interface':'参与者界面','Label':'名称','Questionnaire':'问卷','Attention check':'注意力检查','Device check':'设备检查','Manual event':'手动事件','Fixation':'注视点','Rating':'量表','Wait':'等待','New text':'新文本','Continue':'继续','Response':'反应','Data columns':'数据列','Show all':'显示全部','Show fewer':'收起',
});
Object.assign(dictionaries.ja, {
  'Undo':'元に戻す','Redo':'やり直し','Preview run':'テスト実行','Prepare collection':'本計測の準備','Code':'コード','Editor mode':'編集モード','Components':'コンポーネント','Click to insert into the selected flow.':'クリックでフローに挿入。','Inspector':'インスペクタ','Select a node or connection to configure it.':'設定するノードまたは接続を選択。','Delete connection':'接続を削除','Duplicate node':'ノードを複製','Delete node':'ノードを削除','Graph valid':'フローは有効です','blocking issues':'件のブロック問題','Connection':'接続','Node group':'ノードグループ','No group':'グループなし','Create group from node':'ノードからグループを作成','Participant interface':'参加者向け画面','nodes':'ノード','connections':'接続','Cancel connection':'接続をキャンセル','Variables':'変数','Groups':'グループ','Reusable subflows':'再利用可能なサブフロー','Project component library':'プロジェクトコンポーネントライブラリ','Device connectors':'デバイスコネクタ','Collaboration change sets':'協働変更セット','Network':'ネットワーク','Create instance':'インスタンスを作成','Delete template':'テンプレートを削除','Publish reusable template':'再利用テンプレートを公開','Apply changes':'変更を適用','Edit the full protocol graph as JSON. Changes apply only when validation passes.':'プロトコルグラフをJSONで編集。検証に合格した場合のみ適用。','Screen content':'画面内容','Completion':'完了方法','manual':'手動','fixed':'固定','Duration (ms)':'時間（ミリ秒）','Media type':'メディア種別','Source URL':'ソースURL','Asset ID':'アセットID','Minimum':'最小値','Maximum':'最大値','Required':'必須','Placeholder':'プレースホルダー','Multiline':'複数行','Operator':'演算子','Expected value':'期待値','Probability of A (0–1)':'Aの確率 (0–1)','Seed salt':'シード','Match value':'マッチ値','Maximum iterations':'最大反復回数','Shape':'形状','Size (px)':'サイズ（px）','Color':'色','Pulse animation':'パルスアニメーション','Checklist (one per line)':'チェックリスト（1行1項目）','Confirm label':'確認ボタン文字','Require operator note':'オペレーターメモ必須','Prompt':'プロンプト','Expected key':'期待キー','Timeout (ms)':'タイムアウト（ms）',  'Participant interface':'参加者向け画面','Label':'名前','Questionnaire':'アンケート','Attention check':'注意チェック','Device check':'デバイス確認','Manual event':'手動イベント','Fixation':'注視点','Rating':'評価','Wait':'待機','New text':'新しいテキスト','Continue':'次へ','Response':'反応','Data columns':'データ列','Show all':'すべて表示','Show fewer':'折りたたむ',
});

// ── W5: dashboard, session manager, onboarding, guide ──
Object.assign(dictionaries.zh, {
  'Local-first':'本地优先','Formal storage needs Chrome, Edge, or the desktop app':'正式存储需要 Chrome、Edge 或桌面应用','Data files stay in a folder you can back up and move.':'数据文件保存在你可以备份和移动的文件夹中。',
  'Design, run, and review behavioral & physiological experiments — one local-first workspace.':'设计、运行和审核行为与生理实验——一个本地优先的工作区。','frozen':'已冻结','Start building':'开始构建','Create a protocol from scratch or a curated template.':'从零创建方案或使用精选模板。','＋ New protocol':'＋ 新建方案','active ·':'活跃 ·','Create a blank workflow or start from a template.':'创建空白工作流或从模板开始。','total':'共','in progress':'进行中','Completed and aborted sessions will appear here.':'已完成和中止的 Session 将显示在这里。','Migrate to Composer V2':'迁移到 Composer V2','blocks ·':'区块 ·','trials':'试次','⚠ missing media':'⚠ 缺少媒体','more':'更多','Composer V2 ·':'Composer V2 ·','version':'个版本','versions':'个版本','Project actions':'项目操作',
  '☷ Manage sessions':'☷ 管理实验记录','Export filtered Sessions':'导出筛选的 Session','Refresh':'刷新','Search participant, protocol...':'搜索参与者、方案...','All validity':'全部有效性','Attention':'需注意','Exclude':'排除','Loading sessions...':'正在加载 Session...','No Sessions match the current filter.':'没有 Session 匹配当前筛选。',
  'BioDB connection settings':'BioDB 连接设置','Connection':'连接','Base URL':'服务器地址','User ID':'用户 ID','Long-term token':'长期令牌','user_id from BioDB admin':'BioDB 管理员签发的 user_id','Test connection':'测试连接','Connection OK':'连接成功','Cancel':'取消','Save':'保存','Experiment / participant mapping':'实验/协作者映射','experiment mapping hint':'在协议编辑器中打开 BioDB 对话框可设置该协议的 experiment_id；推送会话数据时会作为 experiment 标签写入 BioDB。','Protocol BioDB experiment mapping':'协议 BioDB 实验映射','Experiment':'实验','connect BioDB first hint':'请先在 Dashboard → BioDB 中配置连接（user_id + 长期令牌）。','Load BioDB experiments':'加载 BioDB 实验列表','Select an experiment':'选择实验','experiment_id':'experiment_id','Experiment label':'实验标签',
  'Data management':'数据管理','Query':'查询条件','Participant':'参与者','Start time':'开始时间','End time':'结束时间','Last 1h':'最近 1 小时','Last 6h':'最近 6 小时','Last 24h':'最近 24 小时','Read data':'读取数据','Read events':'读取事件','rows':'行','channels':'通道','Series':'通道曲线','No data in this range':'该时间范围暂无数据','Max rows shown':'最多显示行数','Time':'时间','Event list':'事件列表','Description':'描述','Loading participants...':'正在加载参与者...','No participants found':'未找到参与者','No events in this range':'该时间范围暂无事件','Channels':'通道（逗号分隔）','New event':'新建事件','Event name':'事件名称','Delete':'删除',
  'The complete event history and answers are stored in the active local storage backend, separate from the lightweight dashboard index.':'完整的事件历史和回答存储在当前本地存储后端中，与轻量级仪表板索引分开。','session(s) skipped because their protocol snapshot was missing.':'个 Session 因缺少方案快照被跳过。','No selected session has a complete protocol snapshot.':'没有选中的 Session 具有完整的方案快照。','Session list unavailable':'Session 列表不可用','Could not load local sessions.':'无法加载本地 Session。','Session missing':'Session 缺失','The selected session could not be found in local storage.':'在本地存储中找不到所选 Session。','Save failed':'保存失败','Could not save the session review to local storage.':'无法将 Session 审核保存到本地存储。','Nothing to export':'没有可导出的内容','Delete session':'删除 Session','Type participant ID to confirm':'输入参与者 ID 以确认','Mismatch':'不匹配','Participant ID does not match. Deletion cancelled.':'参与者 ID 不匹配，已取消删除。',
  'not checked':'未检查','completed Steps':'已完成的步骤','responses':'回答','✓ No integrity issue detected':'✓ 未检测到完整性问题','The complete bundle includes raw events, responses, derived analysis windows, protocol snapshot, integrity report, and a data dictionary.':'完整数据包包含原始事件、回答、分析窗口、方案快照、完整性报告和数据字典。','Danger zone':'危险区域','Runtime replay':'运行时回放','Inspect the reconstructed state after any immutable event.':'检查任何不可变事件后的重建状态。','Previous':'上一个','Next':'下一个','Status':'状态','Event':'事件','Elapsed':'已耗时','initial state':'初始状态','Latest branch:':'最新分支：','Variables':'变量','Outputs':'输出','Event payload':'事件载荷',
  'Welcome to PhysioFlow':'欢迎使用 PhysioFlow','Start here — create a new experiment protocol, or choose a template to get going quickly.':'从这里开始——创建新的实验方案，或选择模板快速开始。','Four-step workflow':'四步工作流','Build your protocol, validate it, run a session, then review and export your data.':'构建方案、验证、运行 Session，然后审核并导出数据。','Your projects':'你的项目','Each project stores its protocol versions here. Open, edit, or freeze them for formal data collection.':'每个项目在这里保存方案版本。打开、编辑或冻结它们以进行正式数据采集。','Language & theme':'语言与主题','Switch between English, 中文, 日本語 and toggle dark mode anytime.':'随时在 English、中文、日本語 之间切换并切换深色模式。','Skip tour':'跳过引导','Next →':'下一步 →','← Back':'← 返回','✓ 开始使用':'✓ 开始使用',
  // Analytics
  'SESSION REVIEW':'实验记录审核','completed sessions':'个已完成 Session','No completed sessions yet. Run experiments to see data here.':'还没有已完成的 Session。运行实验后数据会显示在这里。','Loading session data...':'正在加载 Session 数据...','Unknown participant':'未知参与者','Export ZIP':'导出 ZIP','Pauses':'暂停','Skips':'跳过','Retries':'重试','Media errors':'媒体错误','Integrity issues':'完整性问题','Analytics views':'分析视图','Timeline':'时间线','Analysis windows':'分析窗口','Responses':'回答','Compare':'对比','Unknown':'未知','No session selected':'未选择 Session','Select a session from the sidebar to view its timeline, analysis windows, and response charts. ':'从侧边栏选择一个 Session 以查看其时间线、分析窗口和回答图表。',' completed sessions available.':'个已完成 Session 可用。','Complete an experiment to see analytics here. Your session data will be visualized with timelines, charts, and integrity reports.':'完成一个实验后即可在此查看分析。你的 Session 数据将以时间线、图表和完整性报告的形式可视化。',
  'Guide':'帮助','Workflow':'工作流','Storage':'存储','Data format':'数据格式','Build':'构建','Readiness':'就绪检查','System flow':'系统流程','Data files':'数据文件',
  // Runtime runners (V2 graph + legacy)
  'RUNTIME V2 READY':'运行时 V2 就绪','Begin experiment':'开始实验','participant components':'个参与者组件','RUNTIME FAILED':'运行时失败','Experiment stopped':'实验已停止','Thank you':'谢谢参与','events ·':'个事件 ·','responses ·':'个回答 ·','device samples ·':'个设备样本 ·','export files':'个导出文件','Saved locally.':'已保存到本地。','Saving…':'正在保存…','Device connected ·':'设备已连接 ·','samples collected':'个样本已采集','Hosted sync complete · revision':'托管同步完成 · 修订 ','Hosted sync failed:':'托管同步失败：','Syncing hosted session…':'正在同步托管 Session…','Recording hosted failure…':'正在记录托管失败…','Retry hosted sync':'重试托管同步','Export complete data package':'导出完整数据包','Return to projects':'返回项目','Paused':'已暂停','Participant view':'参与者视图','completed':'已完成',
  'COMPATIBILITY WARNING':'兼容性警告','Browser Issues':'浏览器问题','Please use a modern browser (Chrome 90+, Firefox 90+, Edge 90+, Safari 15+).':'请使用现代浏览器（Chrome 90+、Firefox 90+、Edge 90+、Safari 15+）。','Cancel & return':'取消并返回','Discard recovery?':'放弃恢复？','This will delete the recovery snapshot.':'这将删除恢复快照。','steps':'步','Retry local save':'重试本地保存','Wait until the completed session is saved locally':'请等待已完成的 Session 保存到本地','Fullscreen':'全屏','Participant fullscreen (F)':'参与者全屏 (F)','Abort session?':'中止 Session？','This will mark the session as aborted. All data so far will be preserved.':'这将把 Session 标记为已中止。目前所有数据都将保留。','Abort':'中止','⏸ Paused':'⏸ 已暂停','Ready when you are':'准备好了就开始','Start':'开始','Continue →':'继续 →','Quick note':'快速备注','Instant markers':'即时标记','Interval marker':'区间标记','Device checklist':'设备检查清单','Complete every checklist item before continuing.':'继续前请完成所有检查项。','Complete device check →':'完成设备检查 →','Runtime state machine':'运行时状态机',
});
Object.assign(dictionaries.ja, {
  'Local-first':'ローカル優先','Formal storage needs Chrome, Edge, or the desktop app':'正式な保存には Chrome、Edge、またはデスクトップアプリが必要です','Data files stay in a folder you can back up and move.':'データファイルはバックアップや移動ができるフォルダに保存されます。',
  'Design, run, and review behavioral & physiological experiments — one local-first workspace.':'行動・生理実験の設計、実行、確認を1つのローカル優先ワークスペースで。','frozen':'凍結','Start building':'構築を始める','Create a protocol from scratch or a curated template.':'ゼロからプロトコルを作成するか、テンプレートから始めます。','＋ New protocol':'＋ 新規プロトコル','active ·':'アクティブ ·','Create a blank workflow or start from a template.':'空のワークフローを作成するか、テンプレートから開始します。','total':'合計','in progress':'進行中','Completed and aborted sessions will appear here.':'完了済み・中止したセッションがここに表示されます。','Migrate to Composer V2':'Composer V2 に移行','blocks ·':'Block ·','trials':'Trial','⚠ missing media':'⚠ メディア不足','more':'件以上','Composer V2 ·':'Composer V2 ·','version':'バージョン','versions':'バージョン','Project actions':'プロジェクト操作',
  '☷ Manage sessions':'☷ セッション管理','Export filtered Sessions':'フィルタ済みセッションを出力','Refresh':'更新','Search participant, protocol...':'参加者、プロトコルを検索...','All validity':'すべての有効性','Attention':'要注意','Exclude':'除外','Loading sessions...':'セッション読み込み中...','No Sessions match the current filter.':'現在のフィルタに一致するセッションはありません。',
  'BioDB connection settings':'BioDB 接続設定','Connection':'接続','Base URL':'ベースURL','User ID':'ユーザーID','Long-term token':'長期トークン','user_id from BioDB admin':'BioDB 管理者発行の user_id','Test connection':'接続テスト','Connection OK':'接続成功','Cancel':'キャンセル','Save':'保存','Experiment / participant mapping':'実験/協力者マッピング','experiment mapping hint':'プロトコルエディタの BioDB ダイアログで各プロトコルの experiment_id を設定できます。セッションのプッシュ時に experiment タグとして BioDB に書き込まれます。','Protocol BioDB experiment mapping':'プロトコルの BioDB 実験マッピング','Experiment':'実験','connect BioDB first hint':'先に Dashboard → BioDB で接続（user_id + 長期トークン）を設定してください。','Load BioDB experiments':'BioDB 実験リストを読み込む','Select an experiment':'実験を選択','experiment_id':'experiment_id','Experiment label':'実験ラベル',
  'Data management':'データ管理','Query':'クエリ','Participant':'参加者','Start time':'開始時刻','End time':'終了時刻','Last 1h':'直近 1 時間','Last 6h':'直近 6 時間','Last 24h':'直近 24 時間','Read data':'データを読み込む','Read events':'イベントを読み込む','rows':'行','channels':'チャンネル','Series':'チャンネル曲線','No data in this range':'この範囲にデータがありません','Max rows shown':'最大表示行数','Time':'時刻','Event list':'イベント一覧','Description':'説明','Loading participants...':'参加者を読み込み中...','No participants found':'参加者が見つかりません','No events in this range':'この範囲にイベントがありません','Channels':'チャンネル（カンマ区切り）','New event':'イベント作成','Event name':'イベント名','Delete':'削除',
  'The complete event history and answers are stored in the active local storage backend, separate from the lightweight dashboard index.':'完全なイベント履歴と回答は、軽量なダッシュボード索引とは別に、アクティブなローカルストレージバックエンドに保存されます。','session(s) skipped because their protocol snapshot was missing.':'件のセッションはプロトコルスナップショットがなくスキップされました。','No selected session has a complete protocol snapshot.':'選択されたセッションに完全なプロトコルスナップショットがありません。','Session list unavailable':'セッション一覧を利用できません','Could not load local sessions.':'ローカルセッションを読み込めませんでした。','Session missing':'セッションがありません','The selected session could not be found in local storage.':'選択したセッションがローカルストレージに見つかりません。','Save failed':'保存に失敗','Could not save the session review to local storage.':'セッション審査をローカルストレージに保存できませんでした。','Nothing to export':'出力できるものがありません','Delete session':'セッションを削除','Type participant ID to confirm':'確認のため参加者IDを入力','Mismatch':'不一致','Participant ID does not match. Deletion cancelled.':'参加者IDが一致しません。削除はキャンセルされました。',
  'not checked':'未チェック','completed Steps':'完了ステップ','responses':'回答','✓ No integrity issue detected':'✓ 整合性の問題は検出されませんでした','The complete bundle includes raw events, responses, derived analysis windows, protocol snapshot, integrity report, and a data dictionary.':'完全なパッケージには、生イベント、回答、分析区間、プロトコルスナップショット、整合性レポート、データ辞書が含まれます。','Danger zone':'危険ゾーン','Runtime replay':'ランタイムリプレイ','Inspect the reconstructed state after any immutable event.':'任意の不変イベント後の再構築状態を確認します。','Previous':'前へ','Next':'次へ','Status':'状態','Event':'イベント','Elapsed':'経過時間','initial state':'初期状態','Latest branch:':'最新ブランチ：','Variables':'変数','Outputs':'出力','Event payload':'イベントペイロード',
  'Welcome to PhysioFlow':'PhysioFlow へようこそ','Start here — create a new experiment protocol, or choose a template to get going quickly.':'ここから始めましょう — 新しい実験プロトコルを作成するか、テンプレートを選択してすぐに開始。','Four-step workflow':'4ステップワークフロー','Build your protocol, validate it, run a session, then review and export your data.':'プロトコルを構築し、検証し、セッションを実行し、データを確認・出力します。','Your projects':'あなたのプロジェクト','Each project stores its protocol versions here. Open, edit, or freeze them for formal data collection.':'各プロジェクトはここにプロトコルバージョンを保存します。正式なデータ収集のために開いたり、編集したり、凍結したりできます。','Language & theme':'言語とテーマ','Switch between English, 中文, 日本語 and toggle dark mode anytime.':'English、中文、日本語 をいつでも切り替え、ダークモードも切り替えられます。','Skip tour':'ツアーをスキップ','Next →':'次へ →','← Back':'← 戻る','✓ 开始使用':'✓ はじめる',
  // Analytics
  'SESSION REVIEW':'セッションレビュー','completed sessions':'件の完了セッション','No completed sessions yet. Run experiments to see data here.':'完了したセッションはまだありません。実験を実行するとデータがここに表示されます。','Loading session data...':'セッションデータ読み込み中...','Unknown participant':'不明な参加者','Export ZIP':'ZIP出力','Pauses':'一時停止','Skips':'スキップ','Retries':'再試行','Media errors':'メディアエラー','Integrity issues':'整合性の問題','Analytics views':'分析ビュー','Timeline':'タイムライン','Analysis windows':'分析区間','Responses':'回答','Compare':'比較','Unknown':'不明','No session selected':'セッション未選択','Select a session from the sidebar to view its timeline, analysis windows, and response charts. ':'サイドバーからセッションを選択して、タイムライン・分析区間・回答グラフを表示します。',' completed sessions available.':'件の完了セッションがあります。','Complete an experiment to see analytics here. Your session data will be visualized with timelines, charts, and integrity reports.':'実験を完了すると分析を確認できます。セッションデータはタイムライン、グラフ、整合性レポートとして可視化されます。',
  'Guide':'ガイド','Workflow':'ワークフロー','Storage':'ストレージ','Data format':'データ形式','Build':'構築','Readiness':'準備チェック','System flow':'システムフロー','Data files':'データファイル',
  // Runtime runners (V2 graph + legacy)
  'RUNTIME V2 READY':'ランタイム V2 準備完了','Begin experiment':'実験を開始','participant components':'個の参加者コンポーネント','RUNTIME FAILED':'ランタイム失敗','Experiment stopped':'実験は停止しました','Thank you':'ありがとうございました','events ·':'件のイベント ·','responses ·':'件の回答 ·','device samples ·':'件のデバイスサンプル ·','export files':'件の出力ファイル','Saved locally.':'ローカルに保存されました。','Saving…':'保存中…','Device connected ·':'デバイス接続済み ·','samples collected':'件のサンプルを収集','Hosted sync complete · revision':'ホステッド同期完了 · リビジョン ','Hosted sync failed:':'ホステッド同期に失敗：','Syncing hosted session…':'ホステッドセッションを同期中…','Recording hosted failure…':'ホステッド障害を記録中…','Retry hosted sync':'ホステッド同期を再試行','Export complete data package':'完全データパッケージを出力','Return to projects':'プロジェクトに戻る','Paused':'一時停止中','Participant view':'参加者ビュー','completed':'完了',
  'COMPATIBILITY WARNING':'互換性の警告','Browser Issues':'ブラウザの問題','Please use a modern browser (Chrome 90+, Firefox 90+, Edge 90+, Safari 15+).':'最新のブラウザを使用してください（Chrome 90+、Firefox 90+、Edge 90+、Safari 15+）。','Cancel & return':'キャンセルして戻る','Discard recovery?':'復元を破棄しますか？','This will delete the recovery snapshot.':'復元スナップショットが削除されます。','steps':'ステップ','Retry local save':'ローカル保存を再試行','Wait until the completed session is saved locally':'完了したセッションがローカルに保存されるまでお待ちください','Fullscreen':'全画面','Participant fullscreen (F)':'参加者ビュー全画面 (F)','Abort session?':'セッションを中止しますか？','This will mark the session as aborted. All data so far will be preserved.':'セッションは中止済みとしてマークされます。これまでのデータはすべて保持されます。','Abort':'中止','⏸ Paused':'⏸ 一時停止中','Ready when you are':'準備ができたら開始','Start':'開始','Continue →':'続行 →','Quick note':'クイックメモ','Instant markers':'即時マーカー','Interval marker':'区間マーカー','Device checklist':'デバイスチェックリスト','Complete every checklist item before continuing.':'続行する前にすべてのチェック項目を完了してください。','Complete device check →':'デバイスチェックを完了 →','Runtime state machine':'ランタイム状態機械',
});

// Composer V2: participant-canvas optimisation, media display presets, stimulus pools
Object.assign(dictionaries.ja, {
  'Flow nodes':'フローノード','Click or drag onto the canvas to insert':'クリックするかキャンバスへドラッグして挿入','Media & stimuli':'メディアと刺激','Asset library and randomized pools':'素材ライブラリとランダム化プール','Variables & structure':'変数と構造','Variables, groups, reusable subflows':'変数・グループ・再利用サブフロー','Advanced':'詳細設定','SDK packages, devices, collaboration, deployment':'SDKパッケージ・デバイス・共同編集・配備',
  'Display':'表示','Element size':'要素サイズ','Fit screen':'画面に合わせる','Fill screen':'画面全体に表示','Fill / fit scale the stimulus to cover the whole screen; element size keeps the width and height set in the participant screen.':'「画面全体」「画面に合わせる」は刺激を画面いっぱいに拡大縮小します。「要素サイズ」は参加者画面で設定した幅・高さを使います。',
  '＋ New pool from media library…':'＋ メディアライブラリからプールを作成…','Edit assets':'素材を編集','assets':'件の素材','No assets yet — use “Edit assets” to pick from the media library.':'素材がまだありません — 「素材を編集」からメディアライブラリで選択してください。',
  'Pool name':'プール名','Stimulus pool':'刺激プール','Selected':'選択中','Search assets…':'素材を検索…','Select all':'すべて選択','· in results':'· 絞り込み結果','Clear':'クリア','Cancel':'キャンセル','Done':'完了',
  'Draws without replacement each cycle; repeats its seeded order once exhausted.':'各サイクルで重複なく抽選し、使い切るとシード順で繰り返します。','No matching assets.':'一致する素材がありません。','No image assets in the media library yet.':'メディアライブラリに画像素材がまだありません。','No audio assets in the media library yet.':'メディアライブラリに音声素材がまだありません。','No video assets in the media library yet.':'メディアライブラリに動画素材がまだありません。',
  'Create a pool in the left panel, then choose it here. Completion or Skip draws the next stimulus; Retry keeps the current one. An exhausted pool repeats its seeded order.':'左パネルでプールを作成し、ここで選択します。完了またはスキップで次の刺激を抽選し、再試行では同じ刺激を保ちます。使い切るとシード順で繰り返します。',
});
Object.assign(dictionaries.zh, {
  'Flow nodes':'流程节点','Click or drag onto the canvas to insert':'点击或拖到画布插入','Media & stimuli':'媒体与刺激','Asset library and randomized pools':'素材库与随机池','Variables & structure':'变量与结构','Variables, groups, reusable subflows':'变量·分组·可复用子流程','Advanced':'高级','SDK packages, devices, collaboration, deployment':'SDK 包·设备·协作·部署',
  'Display':'显示方式','Element size':'元素尺寸','Fit screen':'适应屏幕','Fill screen':'铺满屏幕','Fill / fit scale the stimulus to cover the whole screen; element size keeps the width and height set in the participant screen.':'铺满/适应会让刺激铺满整个屏幕并等比缩放；元素尺寸使用参与者界面里设置的宽高。',
  '＋ New pool from media library…':'＋ 从媒体库新建池…','Edit assets':'编辑资产','assets':'个资产','No assets yet — use “Edit assets” to pick from the media library.':'还没有选择资产 —— 点「编辑资产」从媒体库挑选。',
  'Pool name':'池名称','Stimulus pool':'刺激池','Selected':'已选','Search assets…':'搜索资产…','Select all':'全选','· in results':'· 筛选结果','Clear':'清空','Cancel':'取消','Done':'完成',
  'Draws without replacement each cycle; repeats its seeded order once exhausted.':'每个循环不重复抽取；用完后按种子顺序重复。','No matching assets.':'没有匹配的资产。','No image assets in the media library yet.':'媒体库里还没有图片资产。','No audio assets in the media library yet.':'媒体库里还没有音频资产。','No video assets in the media library yet.':'媒体库里还没有视频资产。',
  'Create a pool in the left panel, then choose it here. Completion or Skip draws the next stimulus; Retry keeps the current one. An exhausted pool repeats its seeded order.':'在左侧面板创建池后在此选择。完成或 Skip 抽取下一个刺激；Retry 保持当前刺激。用完后按种子顺序循环。',
});

// Participant-UI canvas editor (toolbar, tabs, inspector)
Object.assign(dictionaries.ja, {
  'Free edit':'自由編集','Auto layout':'自動配置','Fit to view':'ウィンドウに合わせる','Reset to 100%':'100% に戻す','Zoom presets':'ズーム','Canvas settings':'キャンバス設定','Settings':'設定','Screen size':'画面サイズ','Existing responsive screen':'既存のレスポンシブ画面','Snap to 8px grid':'8pxグリッドに吸着',
  '✎ Edit':'✎ 編集','▶ Preview':'▶ プレビュー','Elements':'要素','Presets':'プリセット','Layers':'レイヤー','Content':'内容','Layout':'レイアウト','Appearance':'外観','Color':'色','Text alignment':'文字揃え','Left':'左','Center':'中央','Right':'右','Bindings and actions':'バインディングと動作','Click action':'クリック時の動作','Variable name':'変数名','Value':'値',
  'Free canvas':'自由キャンバス','Auto arrange':'自動整列','Lock element':'ロック','Unlock element':'ロック解除',
  'Click to insert after the selection (or inside a container) · drag to place precisely · Del to remove':'選択要素の後（またはコンテナ内）に挿入 · ドラッグで正確に配置 · Del で削除',
  'Drag to position; arrow keys nudge 1px, Shift+arrows 10px':'ドラッグで配置。矢印キーで1px、Shift+矢印で10px移動。','Drag to reorder; select the container to change layout mode':'ドラッグで並べ替え。コンテナを選択すると配置モードを変更できます。',"Re-lay this screen's elements as an aligned 8px-grid column":'この画面の要素を8pxグリッドに揃えて整列します',
  'Fixed screen 1280×720: the editor and the run scale identically; content outside the screen is clipped. Change the size under ⚙ Settings.':'固定画面 1280×720：編集時と実行時は同じ比率で拡大縮小され、画面外の内容は切り取られます。サイズは ⚙ 設定で変更できます。',
});
Object.assign(dictionaries.zh, {
  'Free edit':'自由编辑','Auto layout':'自动排版','Fit to view':'适应窗口','Reset to 100%':'实际大小 (1:1)','Zoom presets':'缩放预设','Canvas settings':'画布设置','Settings':'设置','Screen size':'屏幕尺寸','Existing responsive screen':'响应式（现有）','Snap to 8px grid':'吸附 8px 网格',
  '✎ Edit':'✎ 编辑','▶ Preview':'▶ 预览','Elements':'元素','Presets':'预设','Layers':'图层','Content':'内容','Layout':'布局','Appearance':'外观','Color':'颜色','Text alignment':'文字对齐','Left':'左','Center':'居中','Right':'右','Bindings and actions':'绑定与动作','Click action':'点击行为','Variable name':'变量名','Value':'值',
  'Free canvas':'自由画布','Auto arrange':'自动整理','Lock element':'锁定元素','Unlock element':'解锁元素',
  'Click to insert after the selection (or inside a container) · drag to place precisely · Del to remove':'点击插入到选中元素之后（或容器内）· 拖拽可精确放置 · Del 删除',
  'Drag to position; arrow keys nudge 1px, Shift+arrows 10px':'拖动定位；方向键微调 1px，Shift+方向键 10px','Drag to reorder; select the container to change layout mode':'拖动重排；选中容器可切换排版模式',"Re-lay this screen's elements as an aligned 8px-grid column":'把该页元素重新排成对齐的 8px 网格列',
  'Fixed screen 1280×720: the editor and the run scale identically; content outside the screen is clipped. Change the size under ⚙ Settings.':'固定屏幕 1280×720：编辑与运行等比缩放一致，超出屏幕的内容会被裁剪。可在 ⚙ 设置里更换尺寸。',
});

// Pre-run checklist: the formal-run gate, its validation advice catalogue and the
// per-issue fix steps. Titles/summaries/steps are computed in PreRunChecklist.jsx,
// so the walker matches them here by their exact English source text.
Object.assign(dictionaries.ja, {
  'Locate and fix':'位置を修正','Go to trial':'Trialへ移動','View raw message':'元のメッセージを表示','Ready for a test run':'テスト実行できます','Must fix':'必ず修正','Step content issues':'ステップ内容の問題','Suggestions':'推奨事項','Continue to session setup':'セッション設定へ進む',
  '{n} issues must be fixed before running':'実行前に {n} 件の問題を修正してください','{n} suggestions remain, which do not block a test run.':'推奨事項が {n} 件ありますが、テスト実行は妨げません。',
  'Each item below says why it blocks the run and where to change it. Fix the required ones first; suggestions can wait.':'各項目に、実行できない理由と修正すべき場所が書かれています。まず「必ず修正」を片付け、推奨事項は後回しで構いません。',
  'Formal collection must be written to a local folder you choose, not only to browser-managed cache.':'本番収集のデータは、ブラウザ管理のキャッシュではなく、選択したローカルフォルダへ書き込む必要があります。',
  'Press the button below to select your PhysioFlow Data folder.':'下のボタンを押して PhysioFlow Data フォルダを選択してください。','Start the formal session once the folder is selected.':'フォルダを選択してから本番セッションを開始してください。',
  'Questionnaire item has no prompt':'アンケート設問にプロンプトがありません','One question in this questionnaire has an empty prompt in every language, so participants cannot tell what to answer.':'このアンケートには、すべての言語でプロンプトが空の設問があります。参加者は何に答えるべきか分かりません。',
  'Choice question has no options':'選択式の設問に選択肢がありません','A single- or multiple-choice question needs at least one option, otherwise participants cannot answer it.':'単一選択・複数選択の設問には選択肢が最低1つ必要です。ないと参加者は回答できません。',
  'External questionnaire link is missing':'外部アンケートのリンクがありません','External form mode needs a link to Google Forms, Qualtrics or another questionnaire service.':'外部フォームモードには Google Forms や Qualtrics などのアンケートサービスのリンクが必要です。',
  'Step is not placed in the flow':'ステップがフローに配置されていません','This step exists in the trial but has no matching event node in the flow, so it is skipped at run time.':'このステップは Trial にはありますが、フローに対応するイベントノードがないため、実行時はスキップされます。',
  'Media source is missing':'メディアソースがありません','This video, audio or image node has no file or link to play.':'この動画・音声・画像ノードには再生できるファイルやリンクがありません。',
  'End mode must be manual':'終了方法を手動にする必要があります','This node (an external questionnaire, for example) must be finished by the participant or operator, not skipped on a timer.':'このノード（外部アンケートなど）は、タイマーで自動的に進めず、参加者または実験者が終了する必要があります。',
  'Fixed duration is missing':'固定時間が設定されていません','This node uses Fixed time mode but has no duration in milliseconds.':'このノードは固定時間モードですが、ミリ秒の時間が入力されていません。',
  'Response variable name is missing':'Response の変数名がありません','A response step needs a variable name (such as response or rating) so a condition node can reference it.':'Response ステップには、条件ノードから参照するための変数名（response や rating など）が必要です。',
  'Response options are missing':'Response の選択肢がありません','A response step needs at least one option in the value | label | key format.':'Response ステップには value | label | key 形式の選択肢が最低1つ必要です。',
  'Participant content is empty':'参加者向けの内容が空です','Participant content is empty in every language for this step. A test run still works, but participants may see no instructions.':'このステップはすべての言語で参加者向け内容が空です。テスト実行はできますが、参加者に教示が表示されない可能性があります。',
  'No analysis window is set':'分析ウィンドウが設定されていません','No step in this protocol enables Generate analysis window, so the exported analysis_windows.csv will be empty.':'このプロトコルには「分析ウィンドウを生成」を有効にしたステップがないため、書き出される analysis_windows.csv は空になります。',
  'Looping conflicts with the end mode':'ループと終了方法が矛盾しています','This media node loops but its end mode is "When media ends", so playback would never stop.':'このメディアノードはループする設定ですが、終了方法が「メディア終了時」なので再生が止まりません。',
  'Manual start conflicts with hidden controls':'手動開始とコントロール非表示が矛盾しています','Start mode is "Participant click" but the player controls are hidden, so participants cannot start playback.':'開始方法が「参加者がクリック」ですが再生コントロールが非表示のため、参加者が再生を開始できません。',
  'ITI jitter settings are invalid':'ITI ジッターの設定が不正です','The trial\'s ITI jitter value is not valid. Jitter must be a number ≥ 0 and the distribution must be fixed, uniform, normal or exponential.':'Trial の ITI ジッターの値が不正です。ジッターは 0 以上の数値、分布は fixed・uniform・normal・exponential のいずれかである必要があります。',
  'Protocol name is missing':'プロトコル名がありません','Give the protocol a name so it is easy to tell apart in the project list.':'プロジェクト一覧で見分けられるよう、プロトコルに名前を付けてください。',
  'Protocol structure is empty':'プロトコルの構造が空です','This protocol has no blocks yet. Build the Block → Trial → Step hierarchy first.':'このプロトコルには Block がまだありません。まず Block → Trial → Step の階層を作成してください。',
  'Hierarchy is incomplete':'階層が不完全です','A block has no trials, or a trial has no steps.':'Block に Trial がない、または Trial に Step がありません。',
  'This setting needs attention':'この設定を確認してください',
  'Press "Locate and fix" to open the questionnaire node.':'「位置を修正」を押してアンケートノードを開きます。','Find the question in the inspector on the right (Question 1, 2, …).':'右側のインスペクタで該当の設問（Question 1, 2…）を探します。','Fill in the prompt in at least one language (Japanese / English / Chinese).':'プロンプトに少なくとも1つの言語（日本語・英語・中国語）を入力します。',
  'Add at least one option to that question.':'その設問に選択肢を最低1つ追加します。','Paste the full form URL (https://…) into External form URL.':'「External form URL」にフォームの完全な URL（https://…）を貼り付けます。',
  'Add an event node of the matching type from the "Add to flow" panel.':'左側の「フローに追加」パネルから対応する種類のイベントノードを追加します。','Or press Insert in the "Steps outside flow" panel.':'または「フロー外のステップ」パネルで「挿入」を押します。','If the step is not needed, press Remove unused.':'不要なステップなら「未使用を削除」を押します。',
  'Press "Locate and fix" to open the media node.':'「位置を修正」を押してメディアノードを開きます。','Enter a URL under Media source in the inspector, or upload a local file.':'右側のインスペクタの「メディアソース」に URL を入力するか、ローカルファイルをアップロードします。',
  'Press "Locate and fix" to open the node.':'「位置を修正」を押して該当ノードを開きます。','Switch End mode to Manual continue.':'「終了方法」を「手動で続行」に切り替えます。','Enter a duration greater than 0 under Duration (ms).':'「時間（ミリ秒）」に 0 より大きい数値を入力します。',
  'Press "Locate and fix" to open the response node.':'「位置を修正」を押して Response ノードを開きます。','Enter the variable name under Response variable.':'「Response variable」に変数名を入力します。','Add at least one line under Options.':'「Options」に1行以上追加します。',
  'Fill in Participant content in at least one language.':'「参加者向け内容」に少なくとも1つの言語を入力します。',
  'Select a baseline, stimulus, task or recovery node.':'baseline・stimulus・task・recovery のいずれかのノードを選択します。','Tick ↗ analysis and set a suitable Role.':'「↗ analysis」にチェックを入れ、適切な Role を設定します。',
  'Turn Loop off, or change End mode to Fixed time / Manual continue.':'ループをオフにするか、終了方法を「固定時間」または「手動で続行」に変更します。',
  'Turn on Show player controls, or change Start mode to Automatic.':'「プレイヤー操作を表示」をオンにするか、開始方法を「自動」に変更します。',
  'This setting can only be changed in the text editor.':'この設定はテキストエディタでのみ変更できます。','Press "Go to trial" to jump to that trial.':'「Trialへ移動」を押すと該当の Trial に移動します。','Open ⋯ → Advanced settings to switch to the text editor.':'⋯ → 「詳細設定」でテキストエディタに切り替えます。','Find the trial and make sure ITI jitter ms ≥ 0 and the distribution is one of the allowed values.':'該当の Trial を探し、ITI jitter ms が 0 以上で、分布が許可された値であることを確認します。',
  'Enter a name in the title bar at the top of the editor.':'エディタ上部のタイトルバーに名前を入力します。','Press "+ Add block" to create the first block.':'「+ Add block」を押して最初の Block を作成します。','Then add trials and steps inside it.':'その中に Trial と Step を追加します。',
  'Press "Locate and fix" to jump to the right place.':'「位置を修正」を押して該当箇所へ移動します。','Add the missing trial or step.':'不足している Trial または Step を追加します。','Fill in the missing field following the inspector on the right.':'右側のインスペクタの指示に従って不足項目を埋めます。',
});
Object.assign(dictionaries.zh, {
  'Locate and fix':'定位并修改','Go to trial':'跳转到 Trial','View raw message':'查看原始提示','Ready for a test run':'可以开始试运行','Must fix':'必须修复','Step content issues':'节点内容问题','Suggestions':'建议项','Continue to session setup':'继续到 Session 设置',
  '{n} issues must be fixed before running':'有 {n} 个问题需要先修复','{n} suggestions remain, which do not block a test run.':'还有 {n} 个建议项，不影响试运行。',
  'Each item below says why it blocks the run and where to change it. Fix the required ones first; suggestions can wait.':'下面每一项都写了为什么不能运行，以及应该点哪里修改。先处理「必须修复」，建议项可以稍后再看。',
  'Formal collection must be written to a local folder you choose, not only to browser-managed cache.':'正式采集必须写入你选择的本地文件夹，不能只放在浏览器管理的缓存里。',
  'Press the button below to select your PhysioFlow Data folder.':'点击下面的按钮选择 PhysioFlow Data 文件夹。','Start the formal session once the folder is selected.':'选择完成后再开始正式 session。',
  'Questionnaire item has no prompt':'问卷题目缺少标题','One question in this questionnaire has an empty prompt in every language, so participants cannot tell what to answer.':'Questionnaire 中有一道题的 Prompt 在所有语言中都是空的，参与者无法知道该回答什么。',
  'Choice question has no options':'选择题缺少选项','A single- or multiple-choice question needs at least one option, otherwise participants cannot answer it.':'单选题或多选题需要至少一个可选项，否则参与者无法作答。',
  'External questionnaire link is missing':'外部问卷链接缺失','External form mode needs a link to Google Forms, Qualtrics or another questionnaire service.':'外部问卷模式需要 Google Forms、Qualtrics 或其他问卷服务的链接。',
  'Step is not placed in the flow':'步骤未放入流程图','This step exists in the trial but has no matching event node in the flow, so it is skipped at run time.':'这个 Step 在 Trial 中存在，但流程图中没有对应的事件节点，运行时会被跳过。',
  'Media source is missing':'媒体来源缺失','This video, audio or image node has no file or link to play.':'视频、音频或图片节点没有可播放的文件或链接。',
  'End mode must be manual':'结束方式需要设为手动','This node (an external questionnaire, for example) must be finished by the participant or operator, not skipped on a timer.':'外部问卷等节点需要参与者或操作员手动确认完成，不能用定时自动跳过。',
  'Fixed duration is missing':'缺少固定时长','This node uses Fixed time mode but has no duration in milliseconds.':'节点设置为 Fixed time 模式但还没有填写 Duration 毫秒数。',
  'Response variable name is missing':'Response 变量名缺失','A response step needs a variable name (such as response or rating) so a condition node can reference it.':'Response 步骤需要一个变量名（如 response 或 rating），用于在 Condition 节点中引用。',
  'Response options are missing':'Response 选项缺失','A response step needs at least one option in the value | label | key format.':'Response 步骤需要至少一个选项（value | label | key 格式）。',
  'Participant content is empty':'参与者内容为空','Participant content is empty in every language for this step. A test run still works, but participants may see no instructions.':'该步骤的「Participant content」在所有语言中都是空的。这不影响试运行，但参与者可能看不到引导信息。',
  'No analysis window is set':'未设置分析窗口','No step in this protocol enables Generate analysis window, so the exported analysis_windows.csv will be empty.':'整个方案中没有步骤启用 Generate analysis window，导出的 analysis_windows.csv 将为空。',
  'Looping conflicts with the end mode':'循环播放与结束模式冲突','This media node loops but its end mode is "When media ends", so playback would never stop.':'媒体节点开启了循环（Loop）但结束模式设为「When media ends」，这样播放永远不会停止。',
  'Manual start conflicts with hidden controls':'手动开始与播放控件冲突','Start mode is "Participant click" but the player controls are hidden, so participants cannot start playback.':'开始模式设为「Participant click」但播放控件被隐藏了，参与者无法触发播放。',
  'ITI jitter settings are invalid':'ITI 抖动设置无效','The trial\'s ITI jitter value is not valid. Jitter must be a number ≥ 0 and the distribution must be fixed, uniform, normal or exponential.':'Trial 的 ITI jitter（试次间间隔抖动）字段值不合法。jitter 必须是一个 ≥0 的数字，分布类型必须是 fixed、uniform、normal 或 exponential。',
  'Protocol name is missing':'方案名称未填写','Give the protocol a name so it is easy to tell apart in the project list.':'请给方案一个名称，便于在项目列表中区分。',
  'Protocol structure is empty':'方案结构为空','This protocol has no blocks yet. Build the Block → Trial → Step hierarchy first.':'方案中没有任何 Block，需要先创建 Block → Trial → Step 的层级结构。',
  'Hierarchy is incomplete':'层级结构不完整','A block has no trials, or a trial has no steps.':'Block 内缺少 Trial，或 Trial 内缺少 Step。',
  'This setting needs attention':'需要检查配置',
  'Press "Locate and fix" to open the questionnaire node.':'点击「定位并修改」打开对应的 Questionnaire 节点。','Find the question in the inspector on the right (Question 1, 2, …).':'在右侧检查器中找到对应的问题（Question 1, 2...）。','Fill in the prompt in at least one language (Japanese / English / Chinese).':'在 Prompt 中至少填写一种语言（中文/日文/英文）。',
  'Add at least one option to that question.':'在对应问题的 Options 中添加至少一个选项。','Paste the full form URL (https://…) into External form URL.':'在 External form URL 中粘贴完整的问卷链接（https://...）。',
  'Add an event node of the matching type from the "Add to flow" panel.':'从左侧「Add to flow」面板添加对应类型的事件节点。','Or press Insert in the "Steps outside flow" panel.':'或者从「Steps outside flow」面板中点击 Insert 插入。','If the step is not needed, press Remove unused.':'如果不需要这个步骤，可以点击 Remove unused 删除。',
  'Press "Locate and fix" to open the media node.':'点击「定位并修改」打开对应的媒体节点。','Enter a URL under Media source in the inspector, or upload a local file.':'在右侧检查器的 Media source 中填写 URL 或上传本地文件。',
  'Press "Locate and fix" to open the node.':'点击「定位并修改」打开对应节点。','Switch End mode to Manual continue.':'把 End mode 切换为 Manual continue。','Enter a duration greater than 0 under Duration (ms).':'在 Duration (ms) 输入框中填写一个大于 0 的毫秒数。',
  'Press "Locate and fix" to open the response node.':'点击「定位并修改」打开 Response 节点。','Enter the variable name under Response variable.':'在 Response variable 中填写变量名。','Add at least one line under Options.':'在 Options 文本框里添加至少一行选项。',
  'Fill in Participant content in at least one language.':'在 Participant content 中至少填写一种语言的内容。',
  'Select a baseline, stimulus, task or recovery node.':'选择一个 baseline、stimulus、task 或 recovery 节点。','Tick ↗ analysis and set a suitable Role.':'勾选 ↗ analysis 并设置合适的 Role。',
  'Turn Loop off, or change End mode to Fixed time / Manual continue.':'关闭 Loop，或将 End mode 改为 Fixed time / Manual continue。',
  'Turn on Show player controls, or change Start mode to Automatic.':'开启 Show player controls，或将 Start mode 改为 Automatic。',
  'This setting can only be changed in the text editor.':'此设置只能在文本编辑器中修改。','Press "Go to trial" to jump to that trial.':'点击「跳转到 Trial」后会定位到对应 Trial。','Open ⋯ → Advanced settings to switch to the text editor.':'点击 ⋯ → Advanced settings 切换到文本编辑器。','Find the trial and make sure ITI jitter ms ≥ 0 and the distribution is one of the allowed values.':'找到该 Trial，确保 ITI jitter ms ≥ 0，分布类型在可选范围内。',
  'Enter a name in the title bar at the top of the editor.':'在编辑器顶部标题栏输入方案名称。','Press "+ Add block" to create the first block.':'点击「+ Add block」创建第一个 Block。','Then add trials and steps inside it.':'然后在 Block 里添加 Trial 和 Step。',
  'Press "Locate and fix" to jump to the right place.':'点击「定位并修改」跳转到对应位置。','Add the missing trial or step.':'添加缺失的 Trial 或 Step。','Fill in the missing field following the inspector on the right.':'根据右侧检查器的提示补充缺失字段。',
});

// Questionnaire designer (questionnaire library / workspace). Attribute and
// placeholder strings go through useT() because the DOM walker only sees text nodes.
Object.assign(dictionaries.ja, {
  'Shuffle question order':'設問の順序をランダム化','Show progress':'進捗を表示','+ Quick-add a preset question':'+ プリセット設問を追加','+ Batch import (CSV)':'+ 一括インポート (CSV)','No questions yet. Use a preset above, or add one manually.':'設問がまだありません。上のプリセットを使うか、手動で追加してください。','+ Add question':'+ 設問を追加',
  'Format: type, en, options (separated by |), min, max, answer':'形式: type, en, options（| 区切り）, min, max, answer','Import questions':'インポート','Drag to reorder':'ドラッグして並べ替え','Shuffle option order':'選択肢の順序をランダム化',
  'Conditional display · skip logic':'条件表示・スキップ制御','Show when':'表示条件','-- Select question --':'-- 設問を選択 --','+ Add condition':'+ 条件を追加','＋ Translations (optional)':'＋ 多言語翻訳（任意）',
  'Question text':'設問文','Minimum label':'最小ラベル','Maximum label':'最大ラベル','Lowest label':'最小側のラベル','Highest label':'最大側のラベル','One option per line':'1行に1つの選択肢','Correct answer (auto-scored)':'正解（自動採点）','Matching option text':'選択肢の文字列と一致','Time limit (optional)':'回答制限時間（任意）','Seconds; leave blank for no limit':'秒。空欄なら制限なし',
});
Object.assign(dictionaries.zh, {
  'Shuffle question order':'随机题目顺序','Show progress':'显示进度','+ Quick-add a preset question':'+ 快速添加预设问题','+ Batch import (CSV)':'+ 批量导入 (CSV)','No questions yet. Use a preset above, or add one manually.':'暂无问题。使用上方预设或手动添加。','+ Add question':'+ 添加问题',
  'Format: type, en, options (separated by |), min, max, answer':'格式: type, en, options（用 | 分隔）, min, max, answer','Import questions':'导入','Drag to reorder':'拖拽排序','Shuffle option order':'随机选项顺序',
  'Conditional display · skip logic':'条件显示 · 跳题逻辑','Show when':'当','-- Select question --':'-- 选择问题 --','+ Add condition':'+ 添加条件','＋ Translations (optional)':'＋ 多语言翻译（可选）',
  'Question text':'题目文字','Minimum label':'最小标签','Maximum label':'最大标签','Lowest label':'最低标签','Highest label':'最高标签','One option per line':'每行一个选项','Correct answer (auto-scored)':'正确答案 (自动计分)','Matching option text':'匹配选项文字','Time limit (optional)':'答题时限 (可选)','Seconds; leave blank for no limit':'秒，留空=不限时',
});

Object.assign(dictionaries.zh, {
  'Protocol generated; download started. Check your browser downloads.': 'Protocol 已生成并发起下载，请查看浏览器下载列表。',
  'Protocol export failed': 'Protocol 导出失败',
  'The protocol could not be exported. Please try again.': '无法导出 Protocol，请重试。',
});
Object.assign(dictionaries.ja, {
  'Protocol generated; download started. Check your browser downloads.': 'プロトコルを生成し、ダウンロードを開始しました。ブラウザのダウンロード一覧を確認してください。',
  'Protocol export failed': 'プロトコルの書き出しに失敗しました',
  'The protocol could not be exported. Please try again.': 'プロトコルを書き出せませんでした。もう一度お試しください。',
});

Object.assign(dictionaries.zh, {
  'raw response records': '原始响应记录', 'effective response records': '有效响应记录', 'superseded response records': '已替代响应记录', 'Effective response records': '有效响应记录',
});
Object.assign(dictionaries.ja, {
  'raw response records': '元の応答レコード', 'effective response records': '有効な応答レコード', 'superseded response records': '置き換え済み応答レコード', 'Effective response records': '有効な応答レコード',
});
