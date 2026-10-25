import { createCoreComponentRegistry } from '../core/componentRegistry.js';

// Display copy only. Registry labels, option values and protocol content stay intact.
export const catalogCopy = [
  ['Start', '开始', '開始'], ['End', '结束', '終了'], ['Screen', '屏幕', 'スクリーン'],
  ['Media', '媒体', 'メディア'], ['Rating', '评分', '評価'], ['Text Input', '文本输入', 'テキスト入力'],
  ['Response', '反应', '反応'], ['Questionnaire', '问卷', 'アンケート'], ['Wait', '等待', '待機'],
  ['Fixation', '注视点', '注視点'], ['Attention check', '注意力检查', '注意確認'],
  ['Device check', '设备检查', 'デバイス確認'], ['Manual event', '手动事件', '手動イベント'],
  ['Screen calibration', '屏幕校准', '画面校正'], ['Custom HTML', '自定义 HTML', 'カスタム HTML'],
  ['Note', '备注', 'メモ'], ['Junction', '连接点', '接続点'], ['Condition', '条件', '条件'],
  ['Random split', '随机分支', 'ランダム分岐'], ['Value switch', '值分支', '値による分岐'],
  ['Loop', '循环', 'ループ'], ['Cognitive task', '认知任务', '認知課題'], ['Legacy Step', '旧版步骤', '旧形式の手順'],
  ['Screen content', '屏幕内容', '画面の内容'], ['Completion', '完成方式', '完了方法'],
  ['Duration (ms)', '时长 (ms)', '所要時間 (ms)'], ['Display', '显示', '表示'],
  ['Response variable', '反应变量', '応答変数'], ['Prompt', '提示语', '提示文'],
  ['Response options', '反应选项', '応答の選択肢'], ['Correct value (optional)', '正确值（可选）', '正解の値（任意）'],
  ['Feedback', '反馈', 'フィードバック'], ['Timeout (ms)', '超时 (ms)', 'タイムアウト (ms)'],
  ['Auto-advance on key press', '按键后自动继续', 'キー入力で自動的に進む'], ['Response required', '必须回答', '応答必須'],
  ['Shape', '形状', '図形'], ['Size (px)', '大小 (px)', 'サイズ (px)'], ['Color', '颜色', '色'],
  ['Pulse animation', '闪烁', '点滅'], ['Expected key', '预期按键', '期待するキー'],
  ['Checklist (one per line)', '检查项（每行一项）', 'チェック項目（1 行に 1 つ）'],
  ['Confirm label', '确认按钮文字', '確認ボタンのラベル'], ['Require operator note', '必须填写实验员备注', '実験者のメモを必須にする'],
  ['Viewing distance (cm)', '观看距离 (cm)', '視距離 (cm)'], ['Screen width (cm)', '屏幕宽度 (cm)', '画面の幅 (cm)'],
  ['Screen height (cm)', '屏幕高度 (cm)', '画面の高さ (cm)'],
  ['HTML fragment (whitelisted, no scripts)', 'HTML 片段（仅允许安全元素，无脚本）', 'HTML 断片（許可された要素のみ、スクリプト不可）'],
  ['Note text', '备注内容', 'メモの内容'], ['Operator', '比较方式', '比較方法'], ['Expected value', '预期值', '比較する値'],
  ['Probability of A', 'A 的概率', 'A の確率'], ['Probability of B', 'B 的概率', 'B の確率'],
  ['Probability of C', 'C 的概率', 'C の確率'], ['Probability of D', 'D 的概率', 'D の確率'],
  ['Seed salt', '随机种子附加值', '乱数シードの追加値'], ['Match value', '匹配值', '一致させる値'],
  ['Maximum iterations', '最大循环次数', '最大反復回数'], ['Until rule operator', '循环条件比较方式', '反復条件の比較方法'],
  ['Until rule value', '循环条件值', '反復条件の値'], ['Paradigm', '任务范式', '課題の種類'],
  ['Randomization seed', '随机种子', 'ランダム化のシード'], ['Go ratio (%)', 'Go 比例 (%)', 'Go の割合 (%)'],
  ['Step name', '步骤名称', '手順名'], ['Step content', '步骤内容', '手順の内容'],
  ['Shown as the participant-facing heading.', '显示为参与者看到的标题。', '参加者向けの見出しとして表示します。'],
  ['Fill covers the screen (cropping overflow), Fit shows the whole stimulus, Element size uses the width/height set in the participant screen.', '填满会裁剪超出部分，适应会显示完整刺激，元素大小使用参与者画面中设置的宽高。', '画面を埋める場合ははみ出す部分を切り取り、全体表示では刺激全体を表示します。要素サイズでは参加者画面で設定した幅と高さを使います。'],
  ['How this stimulus advances: a click, a fixed duration, or when playback ends.', '通过点击、固定时长或播放结束继续。', 'クリック、指定時間の経過、再生終了のいずれかで次に進みます。'],
  ['Variable name used in exports and Condition nodes.', '导出和条件节点使用的变量名。', '書き出しと条件ノードで使う変数名です。'],
  ['Stimulus text shown while awaiting a response.', '等待回答时显示的刺激文本。', '応答を待つ間に表示する刺激の文章です。'],
  ['One per line: value=label,key=1  (key is optional; empty means free-form keys are accepted).', '每行一项：value=label,key=1（按键可选；留空接受任意按键）。', '1 行に 1 つ、value=label,key=1 の形式で指定します。キーは任意です。空欄では任意のキーを受け付けます。'],
  ['When set, each response is marked correct/incorrect in the export.', '设置后，导出时会标记回答是否正确。', '設定すると、書き出す各応答に正誤を記録します。'],
  ['none = no feedback; correct_incorrect = show correct/incorrect; always = show the pressed key and value.', '无：不显示反馈；正误：显示是否正确；始终：显示按键和值。', 'なし：表示しません。正誤：正解・不正解を表示します。常に表示：押したキーと値を表示します。'],
  ['0 = wait indefinitely for a response.', '0 表示无限等待回答。', '0 の場合は応答があるまで待ち続けます。'],
  ['Advance immediately after a valid key press.', '有效按键后立即继续。', '有効なキー入力の直後に次へ進みます。'],
  ['How long the participant waits before continuing.', '参与者继续前的等待时间。', '次に進むまで参加者が待機する時間です。'],
  ['How this stimulus advances: a click, or a fixed duration.', '通过点击或固定时长继续。', 'クリックまたは指定時間の経過で次に進みます。'],
  ['How the input value is compared.', '输入值的比较方式。', '入力値の比較方法です。'],
  ['Compared against the input. Ignored when a compare variable or port is bound.', '与输入比较。绑定比较变量或端口后忽略此项。', '入力と比較する値です。比較用の変数やポートを接続した場合は使いません。'],
  ['Relative weight for branch A. Probabilities are normalized across the branches actually connected.', '分支 A 的相对权重。概率按实际连接的分支归一化。', '分岐 A の相対的な重みです。実際に接続した分岐の間で確率を調整します。'],
  ['Defaults to 1 − A when connected and left empty.', '连接后留空时默认使用 1 − A。', '接続されていて空欄の場合は 1 − A を使います。'],
  ['Only used when branch C is connected.', '仅在连接分支 C 时使用。', '分岐 C が接続されている場合だけ使います。'],
  ['Only used when branch D is connected.', '仅在连接分支 D 时使用。', '分岐 D が接続されている場合だけ使います。'],
  ['Vary this to change the deterministic draw sequence.', '修改此值可改变可复现的抽取顺序。', 'この値を変えると、再現可能な抽選順序を変更できます。'],
  ['Loop body repeats while this rule holds for the bound until variable; the loop exits when it fails. Ignored without an until variable.', '绑定的循环变量满足条件时重复，否则退出。未绑定变量时忽略。', '接続した反復条件の変数が条件を満たす間は繰り返し、満たさなくなると終了します。変数を指定しない場合は使いません。'],
  ['Plain-text content from the migrated legacy step.', '从旧版步骤迁移的纯文本内容。', '旧形式の手順から移行したプレーンテキストです。'],
  ['manual', '手动', '手動'], ['fixed', '固定时间', '指定時間'], ['media-ended', '播放结束时', '再生終了時'],
  ['auto', '元素大小', '要素サイズ'], ['fill', '填满屏幕', '画面を埋める'], ['fit', '完整显示', '全体を表示'],
  ['cross', '十字', '十字'], ['dot', '圆点', '点'], ['diamond', '菱形', 'ひし形'],
  ['none', '无', 'なし'], ['correct_incorrect', '正误', '正誤'], ['always', '始终显示', '常に表示'],
  ['equals', '等于', '等しい'], ['not_equals', '不等于', '等しくない'], ['contains', '包含', '含む'],
  ['greater_than', '大于', 'より大きい'], ['greater_than_or_equal', '大于等于', '以上'],
  ['less_than', '小于', 'より小さい'], ['less_than_or_equal', '小于等于', '以下'],
  ['is_truthy', '为真', '真である'], ['is_falsy', '为假', '偽である'],
  ['stroop', '斯特鲁普任务', 'ストループ課題'], ['gonogo', 'Go / No-Go 任务', 'Go / No-Go 課題'],
];
const copy = new Map(catalogCopy.map(([en, zh, ja]) => [en, { en, zh, ja }]));
const definitions = createCoreComponentRegistry().list();
const components = new Map(definitions.map(definition => [definition.type, definition]));
const fields = new Map(definitions.flatMap(definition => definition.editorFields.map(field => [`${definition.type}:${field.path}`, field])));
const localize = (value, language) => copy.get(value)?.[language] ?? value;
export function componentLabel(type, language) {
  return localize(components.get(type)?.label ?? type, language);
}
export function fieldLabel(componentType, path, language) {
  return localize(fields.get(`${componentType}:${path}`)?.label ?? path, language);
}
export function fieldHelp(componentType, path, language) {
  return localize(fields.get(`${componentType}:${path}`)?.help ?? '', language);
}
export function optionLabel(componentType, path, option, language) {
  const field = fields.get(`${componentType}:${path}`);
  return field?.options?.includes(option) ? localize(option, language) : option;
}
// Recognize built-in defaults without rewriting researcher-authored names.
export function nodeDisplayLabel(node, language) {
  const definition = components.get(node.component.type);
  return !node.label || node.label === definition?.label || node.label === node.component.type || node.label === node.component.type.split('.').at(-1)
    ? componentLabel(node.component.type, language) : node.label;
}
