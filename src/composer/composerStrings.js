// Composer chrome, separate from experiment-authored content.
export const composerCopy = `
Quick|快速|クイック
Design|设计|デザイン
Advanced|高级|詳細設定
Quick mode: build the execution flow and set essential properties.|快速模式：构建执行流程并设置基本属性。|クイックモード：実行の流れと基本設定を編集します。
Design mode: manage media, random stimulus pools, variables, and participant screens.|设计模式：管理媒体、随机刺激池、变量和参与者画面。|デザインモード：メディア、刺激プール、変数、参加者画面を編集します。
Advanced mode: SDK packages, devices, collaboration, deployment, and raw configuration.|高级模式：SDK 包、设备、协作、部署和原始配置。|詳細設定：SDK パッケージ、デバイス、共同編集、配布、構成を編集します。
Build the flow and edit essential node settings.|构建流程并编辑基本节点设置。|実行の流れと手順の基本設定を編集します。
Add media, stimulus pools, variables, groups, and participant screens.|添加媒体、刺激池、变量、组和参与者画面。|メディア、刺激プール、変数、グループ、参加者画面を追加します。
Configure SDK packages, devices, collaboration, deployment, and raw node details.|配置 SDK 包、设备、协作、部署和节点详细信息。|SDK パッケージ、デバイス、共同編集、配布、ノードの詳細を設定します。
Flow nodes|流程组件|フローの要素
Click or drag onto the canvas to insert|点击或拖入画布以插入|クリックまたはキャンバスにドラッグして挿入
Drag onto the canvas|拖入画布|キャンバスにドラッグ
Media & stimuli|媒体与刺激|メディアと刺激
Asset library and randomized pools|资源库和随机刺激池|メディアライブラリと刺激プール
Variables & structure|变量与结构|変数と構造
Variables, groups, reusable subflows|变量、组、可复用子流程|変数、グループ、再利用するサブフロー
SDK packages, devices, collaboration, deployment|SDK 包、设备、协作、部署|SDK パッケージ、デバイス、共同編集、配布
presentation|呈现|提示
interaction|交互|応答
setup|准备|準備
timing|时间|時間
control|流程控制|フロー制御
stimulus|刺激|刺激
utility|工具|補助
logic|逻辑|条件と分岐
experiment|实验|実験
legacy|旧版|旧形式
custom|自定义|カスタム
Migration review required|需要检查迁移的设置|移行した設定の確認が必要です
Review {n} migration issues before freezing this draft.|冻结此草稿前请检查 {n} 项。|この下書きを凍結する前に {n} 件を確認してください。
Mark migration reviewed|标记迁移已检查|移行した設定の確認を完了
blocking issues|阻止运行的问题|実行を妨げる問題
More actions|更多操作|その他の操作
Editor mode|编辑模式|編集モード
Content|内容|内容
General|常规|基本設定
Timing|时间|時間
Display|显示|表示
Response|反应|反応
Scoring|评分|採点
Appearance|外观|見た目
Logic|逻辑|条件
Until rule|循环条件|反復条件
Task|任务|課題
Generate analysis window|生成分析窗口|分析区間を生成
Window label|窗口标签|区間のラベル
Measures component presentation time, including pauses; it does not measure physical stimulus onset.|测量含暂停的组件呈现时间，不测量物理刺激开始时间。|一時停止を含む要素の提示時間を測定します。物理的な刺激開始時刻は測定しません。
Edit participant screen|编辑参与者画面|参加者画面を編集
Element size|元素大小|要素サイズ
Fit screen|完整显示|全体を表示
Fill screen|填满屏幕|画面を埋める
Fill / fit scale the stimulus to cover the whole screen; element size keeps the width and height set in the participant screen.|填满或适应按屏幕缩放；元素大小保留参与者画面设置的宽高。|画面を埋める・全体表示では刺激を画面に合わせて拡大縮小します。要素サイズでは参加者画面で設定した幅と高さを保ちます。
Stimulus randomization|刺激随机化|刺激のランダム化
Stimulus pool|刺激池|刺激プール
— fixed stimulus —|— 固定刺激 —|— 固定の刺激 —
Completion or Skip draws the next stimulus; Retry keeps the current one. An exhausted pool repeats its seeded order.|完成或跳过抽取下一个刺激，重试保留当前刺激。池耗尽后重复种子顺序。|完了またはスキップで次の刺激を選び、再試行では現在の刺激を保ちます。一巡すると同じシードの順序で繰り返します。
＋ New pool from media library…|＋ 从媒体库新建刺激池…|＋ メディアライブラリからプールを作成…
Media type|媒体类型|メディアの種類
Asset|资源|メディア資源
Placeholder|占位文本|入力例
Multiline|多行|複数行
image|图片|画像
audio|音频|音声
video|视频|動画
Input variable|输入变量|入力変数
Choose a variable…|选择变量…|変数を選択…
Compare with variable|比较变量|比較する変数
— none (use Expected value) —|— 无（使用预期值）—|— なし（比較する値を使用）—
Until variable|循环条件变量|反復条件の変数
— none (iterate by maxIterations) —|— 无（按最大次数循环）—|— なし（最大反復回数まで繰り返す）—
Protocol variables|方案变量|プロトコルの変数
Node outputs (upstream)|上游节点输出|前のノードの出力
Live participant preview ·|参与者实时预览 ·|参加者画面のプレビュー ·
Analysis & recovery|分析与恢复|分析と復旧
Recovery after interruption|中断后恢复|中断後の復旧
Device connection|设备连接|デバイス接続
Require this device before the session starts|开始前必须连接此设备|セッション開始前にこのデバイスの接続を必須にする
When enabled, connection or adapter errors block the run instead of silently collecting without device data.|启用时，连接或适配器错误会阻止运行。|有効にすると、接続やアダプターのエラー時に実行を止めます。
Records|记录|記録
Events:|事件：|イベント：
Data columns:|数据列：|データ列：
Node ID:|节点 ID：|ノード ID：
— none —|— 无 —|— なし —
— choose —|— 请选择 —|— 選択してください —
— none / direct URL —|— 无 / 直接 URL —|— なし / 直接 URL —
choose…|请选择…|選択してください…
true|真|真
false|假|偽
none|无|なし
None|无|なし
default|默认|既定
Add a source URL, pick an asset, or enable a stimulus pool below.|输入来源 URL、选择资源或启用刺激池。|ソース URL の入力、メディア資源の選択、刺激プールの指定のいずれかを行ってください。
Open the Questionnaire editor to add questions.|打开问卷编辑器添加问题。|アンケート編集で質問を追加してください。
Paste an HTML fragment below.|在下方粘贴 HTML 片段。|下に HTML 断片を貼り付けてください。
Invalid URL — fix it or pick an asset instead.|URL 无效，请修正或选择资源。|URL を修正するか、メディア資源を選択してください。
Conditional repetition|条件循环|条件による反復
Fixed repetition|固定次数循环|回数を指定した反復
Enter a positive whole number for Maximum iterations before running this protocol.|运行前请输入正整数作为最大循环次数。|実行前に最大反復回数を正の整数で入力してください。
The condition can end repetition early. Maximum iterations is the upper limit.|条件可提前结束循环，最大次数是上限。|条件によって反復を途中で終了できます。最大反復回数が上限です。
Body starts the repeated sequence. Its last step returns to this Loop. Exit continues after repetition.|本体开始重复序列，最后一步返回循环，出口在重复后继续。|本体から反復する手順を開始し、最後の手順からこのループに戻ります。反復後は出口から次へ進みます。
Repeat a sequence|重复一组步骤|手順を繰り返す
Repeat these steps in execution order. The count includes the first pass.|按执行顺序重复，次数包含第一次。|実行順に手順を繰り返します。回数には最初の実行を含みます。
Repeat through|重复至|繰り返す最後の手順
Total repetitions|总重复次数|合計の反復回数
This keeps the step order. Media pools draw on each completed or skipped visit; a retry keeps its stimulus. Operator actions can change the actual visit count.|保留步骤顺序。完成或跳过时抽取刺激，重试保留刺激。实验员操作可能改变实际次数。|手順の順序を保ちます。完了またはスキップごとに刺激を選び、再試行では同じ刺激を保ちます。実験者の操作により実際の実行回数は変わることがあります。
Create repeat sequence|创建重复序列|反復する手順を作成
Enter a whole number from 1 to 10,000.|请输入 1 到 10,000 的整数。|1 から 10,000 の整数を入力してください。
Set what participants see, what is saved, and the response key. Leave the list empty to accept free-form keys.|设置显示内容、记录值和按键。留空接受任意按键。|参加者に見せる内容、保存する値、応答キーを設定します。空のリストでは任意のキーを受け付けます。
Option|选项|選択肢
Recorded value|记录值|記録する値
Key (optional)|按键（可选）|キー（任意）
Remove option|删除选项|選択肢を削除
Recorded values are duplicated. Use distinct values to distinguish responses in exported data.|记录值重复，请使用不同值。|記録する値が重複しています。書き出す応答を区別できるよう異なる値を使ってください。
Response keys are duplicated. The same key cannot uniquely select these options.|按键重复，无法唯一选择选项。|応答キーが重複しています。同じキーでは選択肢を区別できません。
Enter a recorded value for every option.|请为每个选项输入记录值。|すべての選択肢に記録する値を入力してください。
Add response option|添加反应选项|応答の選択肢を追加
e.g. f, j, space|例如 f、j、space|例：f、j、space
Media library (|媒体库 (|メディアライブラリ (
Bind file|关联文件|ファイルを関連付け
Add|添加|追加
Upload local media|上传本地媒体|ローカルのメディアをアップロード
Stimulus pools|刺激池|刺激プール
Create a pool once, then select it from a Media node. Each cycle draws without replacement; when exhausted, the pool repeats its seeded order. Use a flow loop to repeat presentation.|创建刺激池后在媒体节点选择。每轮不放回抽取，耗尽后重复种子顺序。使用流程循环重复呈现。|プールを作成してメディアの手順で選択します。一巡するまで重複せずに選び、その後は同じシードの順序で繰り返します。提示を繰り返すにはフローのループを使います。
assets|个资源|件の資源
Edit assets|编辑资源|メディア資源を編集
No assets yet — use “Edit assets” to pick from the media library.|尚无资源，请从媒体库选择。|資源がありません。「メディア資源を編集」でライブラリから選択してください。
Create pool|创建刺激池|プールを作成
Group randomization|组随机化|グループのランダム化
Shuffle selected groups once per session|每次实验打乱所选组|セッションごとに選択したグループを並べ替える
Keep the internal flow of each group unchanged. Select at least two adjacent groups.|保留组内顺序，选择至少两个相邻组。|各グループ内の順序を保ちます。隣接するグループを 2 つ以上選択してください。
The preparation page shows the session order. Include complete branches and bounded loops inside each group. Each group needs one entry and one exit connection. Cross-group data connections are not supported.|准备页显示实验顺序。组内应包含完整分支和有上限循环。每组需一个入口和出口，不支持跨组数据连接。|準備画面にセッションの順序を表示します。分岐と上限のあるループはグループ内に収めてください。各グループには入口と出口が 1 つずつ必要です。グループ間のデータ接続には対応していません。
Protocol JSON|方案 JSON|プロトコル JSON
Format JSON|格式化 JSON|JSON を整形
Apply changes|应用更改|変更を適用
● Unapplied changes|● 未应用更改|● 未適用の変更
Edit the full protocol graph. Changes apply only after validation.|编辑完整方案图，通过验证后应用更改。|プロトコル全体を編集します。検証後に変更を適用します。

Visual angle calculator|视角计算器|視角の計算
Width (px)|宽度 (px)|幅 (px)
Width (cm)|宽度 (cm)|幅 (cm)
Distance (cm)|距离 (cm)|距離 (cm)
Enter a screen width to compute.|输入屏幕宽度以计算。|画面の幅を入力して計算してください。
Apply content within group|在组内应用内容|グループ内に内容を適用
Other groups are unchanged. Undo restores the whole batch.|其他组不变，可撤销整批操作。|他のグループは変更しません。「元に戻す」で一括変更全体を戻せます。
Apply to|应用于|適用先：
nodes in this group|个组内节点|件（このグループ内）
Visual containers organize related nodes without creating a second execution model.|使用容器组织相关节点。|グループで関連するノードを整理します。実行の仕組みは共通です。
No groups yet. Select a node and create one from its Inspector.|尚无组，请选择节点并在检查器中创建。|グループがありません。ノードを選択して設定パネルから作成してください。
container|容器|コンテナ
subflow|子流程|サブフロー
node(s) ·|个节点 ·|ノード ·
Entry|入口|入口
Exits|出口|出口
input|输入|入力
output|输出|出力
Select port|选择端口|ポートを選択
Add parameter|添加参数|パラメーターを追加
Publish reusable template|发布可复用模板|再利用するテンプレートを作成
Instances are expanded into the same executable graph and keep their template provenance.|实例展开为同一执行图并保留模板来源。|インスタンスは共通の実行フローに展開し、元のテンプレート情報を保持します。
Select variable|选择变量|変数を選択
Add compatible protocol variables before instantiating.|创建实例前请添加兼容变量。|インスタンスの作成前に対応する型のプロトコル変数を追加してください。
Create instance|创建实例|インスタンスを作成
Delete template|删除模板|テンプレートを削除
Exchange auditable protocol changes without requiring a server. Independent fields merge automatically; same-field edits require an explicit choice.|无需服务器交换可审计的方案更改。独立字段自动合并，同字段需选择。|サーバーを使わずに変更履歴を交換できます。異なる項目の変更は自動で統合し、同じ項目の変更は選択して解決します。
Author ID|作者 ID|作成者 ID
Summary|摘要|変更の概要
Baseline: v|基准：v|基準：v
Use current as baseline|将当前版本设为基准|現在の状態を基準にする
Export changes|导出更改|変更を書き出す
Import change set|导入更改集|変更セットを読み込む
operation(s)|项操作|件の操作
ready ·|就绪 ·|準備完了 ·
already applied ·|已应用 ·|適用済み ·
conflict(s)|项冲突|件の競合
Local:|本地：|ローカル：
Incoming:|传入：|読み込み：
Resolve…|解决…|解決方法…
Keep local|保留本地|ローカルを保持
Use incoming|使用传入内容|読み込んだ内容を使用
Apply change set|应用更改集|変更セットを適用
Applied history (|应用记录 (|適用履歴 (
applied ·|已应用 ·|適用済み ·
Portable deployment|可移植部署|配布パッケージ
Package one frozen protocol, its dependency manifest, execution policy, and integrity hashes for a compatible local or remote execution provider.|打包冻结方案、依赖清单、执行策略和完整性哈希以供兼容服务执行。|凍結したプロトコル、依存関係、実行方針、整合性ハッシュを対応する実行サービス向けにまとめます。
Provider ID|服务 ID|実行サービス ID
Environment|环境|環境
Session quota|实验次数上限|セッションの上限
Export deployment bundle|导出部署包|配布パッケージを書き出す
Publish to local hosted sandbox|发布到本地测试环境|ローカルのテスト環境に配布
Freeze this protocol version before deployment.|部署前请冻结此方案版本。|配布前にこのプロトコルを凍結してください。
Inspect deployment bundle|检查部署包|配布パッケージを確認
Hosted sandbox ·|托管测试环境 ·|ホスト型テスト環境 ·
· revision|· 修订|· リビジョン
sessions|次实验|セッション
Create sandbox session|创建测试实验|テストセッションを作成
Create one-use launch token|创建一次性启动令牌|1 回限りの起動トークンを作成
Launch|启动|起動
uses|次使用|回使用
Redeem launch token|兑换启动令牌|起動トークンを使用
Revoke launch token|撤销启动令牌|起動トークンを無効にする
Deactivate deployment|停用部署|配布を停止
Session|实验记录|セッション
Bootstrap verified ·|启动验证完成 ·|起動情報を検証済み ·
resources ready|资源就绪|件の資源を準備済み
Run hosted session|运行托管实验|ホスト型セッションを実行
SDK packages are declarative, versioned, permission-gated, and cannot inject JavaScript into Runtime V2.|SDK 包采用声明式、版本化和权限控制，无法注入 JavaScript。|SDK パッケージは宣言形式で、バージョンと権限を管理します。ランタイムに JavaScript を挿入できません。
Install Reaction Button example|安装反应按钮示例|反応ボタンのサンプルを追加
Import SDK package|导入 SDK 包|SDK パッケージを読み込む
Approve every requested capability before installation:|安装前批准所有请求权限：|追加する前に要求された権限をすべて確認してください：
No permissions requested.|未请求权限。|要求された権限はありません。
Approve and install|批准并安装|承認して追加
component(s)|个组件|件の要素
Uninstall|卸载|削除
Versioned adapters expose typed I/O channels with explicit connect/read/write permissions and provenance events.|版本化适配器提供类型化通道、明确权限及来源事件。|バージョン管理されたアダプターで、型のある入出力、接続・読み取り・書き込みの権限、由来の記録を提供します。
Install simulated sensor|安装模拟传感器|模擬センサーを追加
Import connector manifest|导入连接器清单|接続定義を読み込む
Approve every requested device capability:|批准所有请求的设备权限：|要求されたデバイスの権限をすべて確認してください：
Permissions:|权限：|権限：
Typed values available to conditions and participant UI bindings.|可用于条件和参与者画面绑定的类型化值。|条件や参加者画面への接続に使える、型のある変数です。
participant|参与者|参加者
component|组件|要素
computed|计算值|計算値
include|包含|含める
exclude|排除|除外
hash|哈希|ハッシュ
Add variable|添加变量|変数を追加
Default|默认值|既定値
Name|名称|名前
Pool name|刺激池名称|プール名
Asset name|资源名称|資源名
URL|URL|URL
Response options|反应选项|応答の選択肢
Protocol name|方案名称|プロトコル名
Last step to repeat|重复的最后一步|繰り返す最後の手順
{steps} steps × {count} passes = {visits} step visits, then continue to the next step.|{steps} 步 × {count} 次 = 执行 {visits} 步，然后继续。|{steps} 手順 × {count} 回 = 計 {visits} 手順を実行し、次へ進みます。
The body runs {n} time(s) in total, including the first pass, then follows Exit.|本体共执行 {n} 次（含首次），然后从出口继续。|本体を最初の実行を含めて計 {n} 回実行し、出口から次へ進みます。
Added {name}|已添加 {name}|{name} を追加しました
Inserted {name} after {source}|已在 {source} 后插入 {name}|{source} の後に {name} を挿入しました
Uploading {n}/{total}: {name}|正在上传 {n}/{total}：{name}|アップロード中 {n}/{total}：{name}
{n} file(s) ready|{n} 个文件已就绪|{n} 件のファイルを準備しました
 · Upload required| · 需要上传| · アップロードが必要

Choose the steps to repeat.|选择要重复的步骤。|繰り返す手順を選択してください。
Choose presentation or response steps. Branches and loop controls need manual configuration.|请选择呈现或反应步骤，分支和循环需手动设置。|提示または応答の手順を選択してください。分岐とループは個別の設定が必要です。
Each selected step must have one incoming and one outgoing connection.|每步必须各有一个入站和出站连接。|各手順には入力と出力の接続が 1 つずつ必要です。
Select one continuous sequence with a single entry and exit.|请选择一个入口和出口的连续序列。|入口と出口が 1 つずつある連続した手順を選択してください。
Selected steps must form a continuous sequence without a cycle.|所选步骤必须连续且无循环。|循環を含まない連続した手順を選択してください。
These steps already belong to a repeating path. Edit its existing Loop instead.|这些步骤已处于循环路径，请编辑现有循环。|この手順はすでに反復の経路にあります。既存のループを編集してください。
Only the wait duration is copied. Display content is preserved.|仅复制等待时间，保留显示内容。|待機時間だけをコピーし、表示内容は保持します。
Question IDs remain specific to each target. Only matching questionnaire kinds are included.|保留每个目标的问题 ID，仅包含同类问卷。|各対象の質問 ID を保持し、同じ種類のアンケートだけを対象にします。
Each target keeps its own stimulus, timing and pool.|各目标保留刺激、时间和刺激池。|各対象の刺激、時間設定、プールを保持します。
Copy {content} from {source} to {n} compatible nodes in {group}.|将 {source} 的{content}复制到 {group} 中 {n} 个兼容节点。|{source} の{content}を、{group} 内の対応する {n} 件のノードにコピーします。
wait duration ({n} ms)|等待时间 ({n} ms)|待機時間 ({n} ms)
questionnaire content|问卷内容|アンケートの内容
screen appearance|画面外观|画面の見た目
Updated {n} nodes in this group|已更新组内 {n} 个节点|グループ内の {n} 件のノードを更新しました
Repeat sequence created. Edit Maximum iterations to change its total passes.|已创建重复序列，编辑最大循环次数以更改次数。|反復する手順を作成しました。最大反復回数で合計回数を変更できます。
Duplicate node|复制节点|ノードを複製
Delete {n} node(s)? You can undo this change.|删除 {n} 个节点？此操作可撤销。|{n} 件のノードを削除しますか？この変更は元に戻せます。
✎ Edit|✎ 编辑|✎ 編集
✕ Done|✕ 完成|✕ 完了
Search nodes|搜索节点|ノードを検索
Search nodes… (Ctrl+F)|搜索节点… (Ctrl+F)|ノードを検索… (Ctrl+F)
Toggle snap to grid|切换网格吸附|グリッドへの吸着を切り替える
Snapshots|快照|スナップショット
Snapshot name|快照名称|スナップショット名
Rename snapshot|重命名快照|スナップショットの名前を変更
No snapshots yet. Save one to preserve the current graph state.|尚无快照，保存以保留当前流程图状态。|スナップショットがありません。現在のフローを保存できます。
Zoom out|缩小|縮小
Zoom in|放大|拡大
Reset view|重置视图|表示をリセット
Graph connections|流程图连接|フローの接続
{nodes} nodes · {edges} connections|{nodes} 个节点 · {edges} 条连接|{nodes} ノード · {edges} 接続
{n} matches|{n} 个匹配项|{n} 件の一致
{n} nodes|{n} 个节点|{n} ノード
{n} outputs|{n} 个输出|{n} 出力
Remove this asset from its stimulus pool first|请先从刺激池移除此资源|先に刺激プールからこの資源を外してください
Delete asset|删除资源|メディア資源を削除
This pool is assigned to a Media node|此刺激池已分配给媒体节点|このプールはメディアの手順で使われています
Delete pool|删除刺激池|プールを削除
Asset type|资源类型|資源の種類
Asset URL|资源 URL|資源の URL
Stimulus pool name|刺激池名称|刺激プール名
manual|手动|手動
baseline|基线|ベースライン
recovery|恢复|回復
task|任务|課題
resume|继续|再開
restart|重新开始|最初から再開
wait-operator|等待实验员|実験者の操作を待つ
Display label|显示标签|表示ラベル
Media display|媒体显示|メディアの表示
string|字符串|文字列
number|数值|数値
boolean|布尔值|真偽値
enum|枚举|選択式
object|对象|オブジェクト
array|数组|配列
unknown|未知|未指定
session|实验记录|セッション
trial|试次|試行
project|项目|プロジェクト
New variable name|新变量名称|新しい変数名
New variable type|新变量类型|新しい変数の型
New variable scope|新变量作用域|新しい変数の範囲
New variable default|新变量默认值|新しい変数の既定値
variable_name|变量名|変数名
Ln|行|行
, Col|，列|、列
characters|个字符|文字
connection|连接|接続
`.trim().split('\n').filter(Boolean).map(line => line.split('|'));
export const composerStrings = Object.fromEntries(['zh', 'ja'].map((language, index) => [language, Object.fromEntries(composerCopy.map(row => [row[0], row[index + 1]]))]));


Object.assign(composerStrings.ja, {
  "Settings": "設定",
  "Screen": "画面",
  "Previous step": "前のステップ",
  "Recovery behavior": "復帰の挙動",
  "Next step": "次のステップ",
  "Node editor": "ノード編集",
  "Unsaved changes": "未保存の変更",
  "✕ Done": "✕ 完了",
  "This screen is generated automatically; edit its settings in the Settings tab.": "このステップの画面は自動生成です（設定は「設定」タブ）",
  "View": "表示",
  "✎ Edit": "✎ 編集",
  "Edit": "編集",
  "Content": "内容",
  "Form": "フォーム",
  "Layout": "グループ",
  "Layout group": "レイアウト",
  "Shapes": "図形",
  "Text": "テキスト",
  "Media": "画像・音声・動画",
  "Html": "HTML",
  "Input": "入力欄",
  "Button": "ボタン",
  "Progress": "進捗バー",
  "Rectangle": "矩形",
  "Ellipse": "楕円",
  "Divider": "区切り線",
  "Element": "要素",
  "Group children in a row or column": "要素を横または縦にまとめます。",
  "Heading or body copy": "見出しや本文を表示します。",
  "Image, audio or video": "画像・音声・動画を表示します。",
  "Response field": "回答を入力する欄です。",
  "Continue / action button": "次へ進む操作ボタンです。",
  "Progress indicator": "進み具合を表示します。",
  "Custom HTML fragment": "HTMLを表示します。",
  "Horizontal or vertical separator line": "縦または横の区切り線です。",
  "Filled rectangle shape": "塗りつぶした矩形です。",
  "Filled ellipse / circle shape": "塗りつぶした円や楕円です。",
  "Duplicate": "複製",
  "Copy": "コピー",
  "Paste": "貼り付け",
  "Move up": "上へ移動",
  "Move down": "下へ移動",
  "Bring to front": "前面へ",
  "Send to back": "背面へ",
  "Edit style": "スタイルを編集",
  "Delete": "削除",
  "Free canvas": "自由配置",
  "Free edit": "自由配置",
  "Auto layout": "自動整列",
  "⚙ Settings": "⚙ 設定",
  "▶ Preview": "▶ プレビュー",
  "Appearance": "外観",
  "Bindings and actions": "バインディングとアクション",
  "Elements": "要素",
  "Presets": "プリセット",
  "Layers": "レイヤー",
  "Auto arrange": "自動整列",
  "Color": "色",
  "Text alignment": "文字揃え",
  "Left": "左",
  "Center": "中央",
  "Right": "右",
  "Screen size": "画面サイズ",
  "Existing responsive screen": "既存の可変サイズ画面",
  "Snap to 8px grid": "8pxのグリッドに吸着",
  "Fit to view": "全体を表示",
  "Reset to 100%": "100%に戻す",
  "Canvas settings": "キャンバス設定",
  "Click to insert after the selection (or inside a container) · drag to place precisely · Del to remove": "クリックで追加、ドラッグで配置、Delで削除します。",
  "Template": "テンプレート",
  "instruction": "説明",
  "media": "メディア",
  "form": "フォーム",
  "text": "テキスト",
  "rating": "評価",
  "fixation": "注視点",
  "attention": "注意",
  "device": "デバイス",
  "manual": "手動",
  "html": "HTML",
  "calibration": "較正",
  "Technical information": "技術情報",
  "Continue": "続ける",
  "New text": "新しいテキスト",
  "Response": "回答",
  "Click action": "クリック時の動作",
  "submit": "送信",
  "next": "次へ",
  "setVariable": "変数を設定",
  "Variable name": "変数名",
  "Value": "値",
  "Text content": "本文",
  "Label": "ラベル",
  "Variant": "種類",
  "Source URL": "参照URL",
  "Media source URL": "メディアのURL",
  "Input type": "入力形式",
  "Name": "名前",
  "Required": "必須",
  "Maximum": "最大値",
  "Minimum": "最小値",
  "Min": "最小値",
  "Max": "最大値",
  "Direction": "方向",
  "Gap": "間隔",
  "Padding": "余白",
  "Width": "幅",
  "Height": "高さ",
  "Free positioning": "自由配置",
  "HTML fragment": "HTMLの内容",
  "Orientation": "方向",
  "Thickness": "太さ",
  "horizontal": "横",
  "vertical": "縦",
  "row": "横並び",
  "column": "縦並び",
  "primary": "標準",
  "secondary": "補助",
  "body": "本文",
  "heading": "見出し",
  "caption": "注釈",
  "image": "画像",
  "audio": "音声",
  "video": "動画",
  "literal": "直接指定"
});

Object.assign(composerStrings.ja, {
  "Canvas editing mode": "配置モード",
  "Reset to this template": "このテンプレートに戻す",
  "Undo (Ctrl+Z)": "元に戻す（Ctrl+Z）",
  "Redo (Ctrl+Shift+Z)": "やり直す（Ctrl+Shift+Z）",
  "Canvas zoom": "表示倍率",
  "Zoom out (Ctrl+wheel)": "縮小（Ctrl+ホイール）",
  "Zoom in (Ctrl+wheel)": "拡大（Ctrl+ホイール）",
  "Zoom presets": "表示倍率の選択",
  "Snap to the 8px grid while dragging": "ドラッグ中に8pxのグリッドに吸着します。",
  "Library panels": "ライブラリー",
  "Duplicate (Ctrl+D)": "複製（Ctrl+D）",
  "Delete (Del)": "削除（Del）",
  "Re-lay this screen's elements as an aligned 8px-grid column": "要素を8pxのグリッドに沿って縦に整列します。",
  "e.g. variables.score": "例: variables.score",
  "Position & size": "位置とサイズ",
  "Enter or leave the field to apply. Escape cancels.": "Enterまたは欄を離れて適用、Escで取消します。",
  "This is a responsive screen. Choose a Screen size above so the editor and the run share the same fixed resolution.": "画面サイズを選ぶと編集時と実行時の解像度が揃います。",
  "These out-of-bounds results come from the last edit. Locate returns to the editor so you can fix them.": "前回編集時の結果です。「場所を確認」で編集に戻ります。",
  "Part of this element sits outside the screen. Check its position or size.": "要素が画面外にはみ出しています。位置やサイズを確認してください。",
  "Locate and fix": "場所を確認して修正",
  "No image, audio or video source is configured yet.": "画像・音声・動画が未設定です。",
  "Configure": "設定する",
  "No out-of-bounds elements or missing media sources were found. Still preview to confirm the actual content; this check does not verify that media links load or that the timing is correct.": "はみ出しや未設定メディアはありません。プレビューで内容・読み込み・タイミングも確認してください。",
  "Shift-click to add or remove an element. Dragging moves selected siblings together.": "Shiftを押しながらクリックで選択を変更し、ドラッグで同じ階層の要素をまとめて移動します。",
  "Align selection": "選択要素を整列",
  "Alignment needs unlocked elements in the same free-layout container.": "同じ自由配置グループ内のロックされていない要素を選んでください。",
  "Deselect": "選択解除",
  "Add style": "スタイルを追加",
  "Dynamic bindings (variables.*) win over static style for color and background.": "文字色と背景色は変数のバインディングが優先されます。",
  "Colors": "配色",
  "Fonts": "書体",
  "Spacing": "間隔",
  "Reset to defaults": "初期値に戻す",
  "Layout mode": "配置モード",
  "Auto layout · reorder": "自動整列・並べ替え",
  "Free canvas · position": "自由配置・位置指定",
  "Max width": "最大幅",
  "Background": "背景",
  "Text color": "文字色",
  "Font size": "文字サイズ",
  "e.g. 20px": "例: 20px",
  "Media type": "メディアの種類",
  "Alt text": "代替テキスト",
  "Presentation": "表示方法",
  "Media presentation": "メディアの表示方法",
  "Standard layout": "標準配置",
  "Fit participant viewport (preserve aspect ratio)": "参加者画面に合わせる（縦横比を維持）",
  "Fit": "拡大縮小",
  "contain": "全体を収める",
  "cover": "領域を覆う",
  "fill": "引き伸ばす",
  "Response name": "回答の名前",
  "textarea": "複数行",
  "number": "数値",
  "checkbox": "チェックボックス",
  "Placeholder": "入力例",
  "Theme": "テーマ",
  "custom": "カスタム",
  "defaults": "初期値",
  "Advanced appearance": "外観の詳細設定",
  "Choose style": "スタイルを選択",
  "Show controls": "操作ボタンを表示",
  "Auto-play": "自動再生",
  "Screen checks": "画面の確認",
  "outside screen": "画面外",
  "missing media": "メディア未設定",
  "Outside screen": "画面外",
  "Missing media": "メディア未設定",
  "Elements to check": "確認が必要な要素",
  "Basic checks passed": "基本確認済み",
  "Back to editing": "編集に戻る",
  "Preview participant screen": "参加者画面をプレビュー",
  "elements selected": "要素を選択中",
  "Top": "上",
  "Middle": "中央",
  "Bottom": "下",
  "Untitled": "無題",
  "Locked": "ロック中",
  "Lock": "ロック",
  "Unlock": "ロック解除",
  "Lock element": "要素をロック",
  "Unlock element": "要素のロック解除",
  "Drag to position; arrow keys nudge 1px, Shift+arrows 10px": "ドラッグで配置、矢印で1px、Shift+矢印で10px移動します。",
  "Drag to reorder; select the container to change layout mode": "ドラッグで並べ替え、グループを選んで配置モードを変更します。",
  "Replace the current participant screen with this template? You can still undo this change.": "画面をこのテンプレートに置き換えますか？元に戻せます。",
  "Fixed screen": "固定サイズ",
  "Outside content is clipped. Change the size in Settings.": "画面外は切り取られます。設定からサイズを変更できます。",
  "elements · schema valid": "要素・構造は有効",
  "Runtime binding": "実行時のバインディング",
  "Centered fixation": "中央の注視点",
  "Image and instructions": "画像と説明",
  "Left / right stimuli": "左右の刺激",
  "Question and rating": "質問と評価",
  "A centered cross for rest or fixation.": "中央に注視用の十字を表示します。",
  "A stimulus area with a short instruction.": "刺激と短い説明を表示します。",
  "Two equally sized stimulus areas.": "同じ大きさの刺激を左右に表示します。",
  "A prompt, rating response and submit button.": "質問・評価欄・送信ボタンを表示します。"
});

Object.assign(composerStrings.ja, {
  "ink": "文字",
  "green": "緑",
  "greenStrong": "濃い緑",
  "lime": "黄緑",
  "mint": "薄緑",
  "blue": "青",
  "amber": "琥珀色",
  "paper": "背景",
  "paperSoft": "薄い背景",
  "surface": "パネル背景",
  "line": "罫線",
  "lineStrong": "濃い罫線",
  "danger": "危険",
  "warning": "警告",
  "muted": "補助文字",
  "mutedStrong": "濃い補助文字",
  "fontFamily": "本文の書体",
  "headingFamily": "見出しの書体",
  "fontSizeBase": "基本文字サイズ",
  "spacingUnit": "基本間隔",
  "radius": "角の丸み",
  "maxWidth": "最大幅",
  "Physio Green": "フィジオ・グリーン",
  "Ocean Blue": "オーシャン・ブルー",
  "Warm Amber": "ウォーム・アンバー",
  "High Contrast": "高コントラスト",
  "Minimal Mono": "モノトーン"
});
