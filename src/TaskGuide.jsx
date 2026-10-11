import { useState } from 'react';
import { useLanguage } from './i18n';

export const guideCopy = {
  zh: { title:'使用指南', intro:'选择你要完成的任务，按步骤操作。', welcome:'开始你的第一个实验', path:'设计 → 检查 → 运行 → 查看结果', create:'创建空白实验', example:'打开情绪实验示例', later:'先浏览工作区', help:'使用指南', reference:'高级参考', hint:'先添加一个步骤，设置内容，然后测试运行。正式采集前再冻结版本。', tasks:[
    ['创建与编辑实验', ['从首页创建空白实验，或使用情绪、Stroop、Go/No-Go 模板。','在实验步骤中选中一项，点击左侧组件添加下一步。','在右侧设置刺激、时长和回答方式；复杂分支使用流程图。','保存后点击“测试运行”，先以测试参与者检查内容。'], '测试可使用草稿。冻结版本用于正式采集；需要修改时创建可编辑版本。'],
    ['准备参与者与设备', ['从编辑器测试运行，或从冻结版本进入准备采集。','填写参与者编号与语言，确认媒体及数据保存位置。','有设备时先启动采集服务，再检查所有必需通道的实时信号。','打开操作员监控放在管理员屏幕，实验窗口放在参与者屏幕。'], '信号缺失时检查设备、电极、采集服务和连接地址。正式采集要求真实设备及可写的数据文件夹。'],
    ['运行与数据库验证', ['准备信息确认后检查信号，再点击“开始实验”。','参与者完成刺激与回答；管理员在独立监控中查看状态及暂停/恢复。','结束后先确认“会话数据已保存”，再导出完整数据包。','启用 PhysioDB 测试验证时，等待上传和数据库回读核对完成。'], '本地保存成功和数据库核对成功是两件事。无设备测试会明确使用合成信号；正式原始录制目前需显式上传。'],
    ['查看记录与分析', ['首页打开“实验记录”，选择本次参与者记录。','查看保存状态、运行事件和 PhysioDB 核对结果。','点击“分析这次实验”查看时间线与回答，返回时保留同一记录。','设备与连接 → 数据与分析，可选择数据库录制时间窗、查看波形与统计并导出 CSV。'], '记录可添加研究者备注和有效性评定。自动完整性检查不替代研究者判断。'],
  ]},
  ja: { title:'使い方', intro:'行いたい作業を選び、手順に沿って操作してください。', welcome:'最初の実験を始めましょう', path:'設計 → 確認 → 実行 → 結果確認', create:'空の実験を作成', example:'感情実験のサンプルを開く', later:'ワークスペースを見る', help:'使い方', reference:'詳細リファレンス', hint:'手順を追加し、内容を設定してテストしてください。本番の前にバージョンを凍結します。', tasks:[
    ['実験を作成・編集', ['ホームで空の実験、または感情・Stroop・Go/No-Go テンプレートを選びます。','手順を選択し、左の要素をクリックして次の手順を追加します。','右で刺激、時間、回答方法を設定します。分岐はフロー図を使います。','保存後にテスト実行し、テスト用の参加者で内容を確認します。'], 'テストにはドラフトを使えます。本番には凍結版を使い、修正には編集可能な版を作成します。'],
    ['参加者と機器を準備', ['編集画面でテスト実行、または凍結版から収集を準備します。','参加者 ID、言語、メディア、保存先を確認します。','計測サービスを起動し、必要な全チャンネルの信号を確認します。','管理者モニターを管理者画面、実験ウィンドウを参加者画面に置きます。'], '欠損時は機器、電極、計測サービス、接続先を確認してください。本番には実機と書込可能な保存先が必要です。'],
    ['実行と DB 検証', ['実行情報と信号を確認して実験を開始します。','参加者は刺激と質問に回答し、管理者は別画面で監視・一時停止します。','終了後に保存成功を確認し、完全なデータパッケージを出力します。','PhysioDB テスト検証を有効にした場合、送信と読戻しの完了を待ちます。'], 'ローカル保存と DB 検証は別の状態です。機器なしのテスト信号は合成と表示されます。本番の生データは明示的にアップロードします。'],
    ['記録と分析', ['ホームの実験記録で対象の参加者を選びます。','保存状態、イベント、PhysioDB 検証結果を確認します。','この実験記録を分析し、時間線や回答を確認します。戻ると同じ記録を開きます。','機器と接続 → データと分析で DB の時間窓を読み、波形・統計・CSV を確認します。'], '研究者のメモと有効性評価を保存できます。自動チェックは研究者の判断を置き換えません。'],
  ]},
  en: { title:'User guide', intro:'Choose what you want to do, then follow the steps.', welcome:'Start your first experiment', path:'Design → Check → Run → Review', create:'Create a blank experiment', example:'Open an emotion example', later:'Explore the workspace', help:'User guide', reference:'Advanced reference', hint:'Add a step, set its content, then run a test. Freeze a version before formal collection.', tasks:[
    ['Create and edit', ['Create a blank protocol or choose an Emotion, Stroop or Go/No-Go template.','Select a step, then click a component on the left to add the next step.','Set content, duration and responses on the right. Use the flow graph for branches.','Save, then choose Preview run with a test participant to check the content.'], 'Drafts can run tests. Freeze for formal collection; create an editable version to make changes.'],
    ['Prepare participants and devices', ['Choose Preview run in the editor or prepare collection from a frozen version.','Enter participant ID and language, then check media and the data destination.','Start the acquisition service and check fresh signals on every required channel.','Keep the operator monitor on the operator display and the experiment on the participant display.'], 'For missing signals, check devices, electrodes, the acquisition service and connection address. Formal collection needs real devices and writable storage.'],
    ['Run and verify', ['Confirm the run details and signals, then begin the experiment.','Participants see stimuli and questions; operators monitor and pause or resume separately.','At completion, confirm that session data was saved, then export the complete package.','When PhysioDB test verification is enabled, wait for upload and database read-back checks.'], 'Local saving and database verification are separate. Tests without devices explicitly use a synthetic signal. Formal raw recordings currently require explicit upload.'],
    ['Review and analyze', ['Open Sessions in the workspace and select the participant record.','Review saving, events and the PhysioDB verification report.','Analyze this session to inspect the timeline and answers; return to the same saved record.','Devices & connections → Data & analysis reads database time windows, displays waveforms and statistics, and exports CSV.'], 'Save researcher notes and validity reviews. Automatic integrity checks do not replace researcher judgment.'],
  ]},
};
export function useGuideCopy() { const { language } = useLanguage(); return guideCopy[language] || guideCopy.en; }
export default function TaskGuide({ initialTask = 0 }) {
  const copy = useGuideCopy();
  const [task, setTask] = useState(initialTask);
  const current = copy.tasks[task];
  return <div className="task-guide"><p>{copy.intro}</p><nav aria-label={copy.title}>{copy.tasks.map(([title], index) => <button key={index} aria-pressed={task === index} onClick={() => setTask(index)}>{title}</button>)}</nav><section aria-live="polite"><h3>{current[0]}</h3><ol>{current[1].map(step => <li key={step}>{step}</li>)}</ol><p className="guide-note">{current[2]}</p></section></div>;
}
