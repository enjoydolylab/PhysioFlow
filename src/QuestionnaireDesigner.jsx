import { useState, useCallback, useMemo } from 'react';
import { createId } from './core/ids.js';
import { COMPARISON_OPS, LANGS, newQuestion, PRESETS, QUESTION_TYPES, createQuestionnaire } from './core/questionnaireModel.js';
import { useT } from './i18n.jsx';

export { COMPARISON_OPS, LANGS, newQuestion, PRESETS, QUESTION_TYPES, createQuestionnaire } from './core/questionnaireModel.js';

export default function QuestionnaireDesigner({ value, onChange, disabled }) {
  const questionnaire = useMemo(() => value || createQuestionnaire(), [value]);
  const qs = useMemo(() => questionnaire.questions || [], [questionnaire.questions]);

  const updateQuestion = (index, key, next) => onChange({ ...questionnaire, questions: qs.map((q, i) => i === index ? { ...q, [key]: next } : q) });
  const removeQuestion = index => onChange({ ...questionnaire, questions: qs.filter((_, i) => i !== index) });
  const moveQuestion = useCallback((from, to) => {
    const next = [...qs]; [next[from], next[to]] = [next[to], next[from]];
    onChange({ ...questionnaire, questions: next });
  }, [qs, onChange, questionnaire]);
  const addPreset = useCallback((key) => {
    const q = (PRESETS[key] || newQuestion)();
    onChange({ ...questionnaire, questions: [...qs, q] });
  }, [qs, onChange, questionnaire]);

  return <details className="questionnaire-designer" open>
    <summary>问卷设计器 · Questionnaire designer · アンケート設計</summary>

    {/* Questionnaire-level settings */}
    <div className="q-settings-row">
      <label>Questionnaire name <input value={questionnaire.name} disabled={disabled} onChange={e => onChange({ ...questionnaire, name: e.target.value })} /></label>
      <label className="q-check"><input type="checkbox" checked={questionnaire.shuffle_questions || false} disabled={disabled} onChange={e => onChange({ ...questionnaire, shuffle_questions: e.target.checked })} /> Shuffle question order</label>
      <label className="q-check"><input type="checkbox" checked={questionnaire.show_progress !== false} disabled={disabled} onChange={e => onChange({ ...questionnaire, show_progress: e.target.checked })} /> Show progress</label>
    </div>

    {/* Question presets */}
    <details className="q-presets"><summary>+ Quick-add a preset question</summary>
      <div className="q-preset-grid">
        {Object.entries(PRESETS).map(([key, fn]) => {
          const q = fn();
          return <button key={key} type="button" disabled={disabled} onClick={() => addPreset(key)} title={q.prompt_i18n?.en || key}>
            <b>{key}</b><span>{q.prompt_i18n?.en || ''}</span>
          </button>;
        })}
      </div>
    </details>

    {/* Batch import */}
    <details className="q-import"><summary>+ Batch import (CSV)</summary>
      <BatchImport disabled={disabled} onImport={rows => {
        const imported = rows.map(row => ({
          question_id: createId('question'),
          type: row.type || 'likert',
          required: row.required !== 'false',
          prompt_i18n: { zh: row.zh || row.en || '', ja: row.ja || row.en || '', en: row.en || '' },
          options_i18n: row.options ? { zh: row.options.split('|'), ja: row.options.split('|'), en: row.options.split('|') } : undefined,
          scale_min: row.min ? Number(row.min) : 1,
          scale_max: row.max ? Number(row.max) : 5,
          correct_answer: row.answer || '',
        }));
        onChange({ ...questionnaire, questions: [...qs, ...imported] });
      }} />
    </details>

    {/* Question list */}
    {qs.length === 0 && <p style={{ color: 'var(--muted)', fontSize: '.8rem', padding: '.5rem' }}>No questions yet. Use a preset above, or add one manually.</p>}
    {qs.map((q, index) => (
      <QuestionEditor key={q.question_id} question={q} index={index} total={qs.length}
        disabled={disabled} updateQuestion={updateQuestion} removeQuestion={removeQuestion}
        moveQuestion={moveQuestion} allQuestions={qs}
      />
    ))}
    <button type="button" disabled={disabled} onClick={() => onChange({ ...questionnaire, questions: [...qs, newQuestion()] })}>+ Add question</button>
  </details>;
}

// ── Batch import ──
export function BatchImport({ disabled, onImport }) {
  const [text, setText] = useState('');
  const parse = () => {
    const lines = text.trim().split('\n').filter(Boolean);
    if (lines.length < 2) return;
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim());
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] || '']));
    });
    onImport(rows);
    setText('');
  };
  return <div className="batch-import">
    <textarea rows={4} value={text} disabled={disabled}
      placeholder="type,en,options,min,max,answer&#10;likert,How satisfied?,Very dissatisfied|Neutral|Very satisfied,1,5,3&#10;single_choice,Choose one,Yes|No|Maybe,,,Yes"
      onChange={e => setText(e.target.value)} />
    <small>Format: type, en, options (separated by |), min, max, answer</small>
    <button type="button" disabled={disabled || !text.trim()} onClick={parse}>Import questions</button>
  </div>;
}

// ── Question Editor ──
function QuestionEditor({ question: q, index, total, disabled, updateQuestion, removeQuestion, moveQuestion, allQuestions }) {
  const t = useT();
  const [lang, setLang] = useState('en');
  const [multiLang, setMultiLang] = useState(false);
  const [dragOver, setDragOver] = useState(null);

  return <article className={`q-card${dragOver === 'top' ? ' drag-over-top' : dragOver === 'bottom' ? ' drag-over-bottom' : ''}`}>
    {/* Drag handle */}
    {!disabled && <span className="q-drag-handle" draggable
      onDragStart={e => { e.dataTransfer.setData('text/plain', String(index)); e.dataTransfer.effectAllowed = 'move'; }}
      onDragOver={e => { e.preventDefault(); const rect = e.currentTarget.closest('article').getBoundingClientRect(); setDragOver(e.clientY < rect.top + rect.height/2 ? 'top' : 'bottom'); }}
      onDragLeave={() => setDragOver(null)}
      onDrop={e => { e.preventDefault(); const from = Number(e.dataTransfer.getData('text/plain')); setDragOver(null); if (from !== index && from >= 0 && from < total) moveQuestion(from, index); }}
      title={t('Drag to reorder')}>⠿</span>}

    <div className="q-head">
      <b>Q{index + 1}</b>
      <select value={q.type} disabled={disabled} onChange={e => updateQuestion(index, 'type', e.target.value)}>
        {QUESTION_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
      </select>
      <label className="q-check"><input type="checkbox" checked={q.required} disabled={disabled} onChange={e => updateQuestion(index, 'required', e.target.checked)} /> Required</label>
      <label className="q-check"><input type="checkbox" checked={q.shuffle || false} disabled={disabled} onChange={e => updateQuestion(index, 'shuffle', e.target.checked)} title={t('Shuffle option order')} /> ⇄</label>
      <button type="button" disabled={disabled} onClick={() => removeQuestion(index)} className="q-remove">×</button>
    </div>

    {/* Conditional logic */}
    <details className="q-conditional"><summary>Conditional display · skip logic</summary>
      {q.show_if ? <div className="q-cond-row">
        <span>Show when</span>
        <select value={q.show_if.question_id} disabled={disabled} onChange={e => updateQuestion(index, 'show_if', { ...q.show_if, question_id: e.target.value })}>
          <option value="">-- Select question --</option>
          {allQuestions.filter(oq => oq.question_id !== q.question_id).map(oq => <option key={oq.question_id} value={oq.question_id}>Q{allQuestions.indexOf(oq)+1}: {(oq.prompt_i18n?.en || oq.prompt_i18n?.zh || '').slice(0, 30)}</option>)}
        </select>
        <select value={q.show_if.operator || 'equals'} disabled={disabled} onChange={e => updateQuestion(index, 'show_if', { ...q.show_if, operator: e.target.value })}>
          {COMPARISON_OPS.map(op => <option key={op} value={op}>{op}</option>)}
        </select>
        <input value={q.show_if.value || ''} disabled={disabled} placeholder={t('Value')} onChange={e => updateQuestion(index, 'show_if', { ...q.show_if, value: e.target.value })} style={{ width: 80 }} />
        <button type="button" disabled={disabled} onClick={() => updateQuestion(index, 'show_if', null)}>×</button>
      </div> : <button type="button" disabled={disabled} onClick={() => updateQuestion(index, 'show_if', { question_id: '', operator: 'equals', value: '' })}>+ Add condition</button>}
    </details>

    {/* Language — single by default, translations optional */}
    {multiLang ? (
      <div className="q-lang-tabs">
        {LANGS.map(([code, label]) => (
          <button type="button" key={code} disabled={disabled}
            className={`q-lang-btn${lang === code ? ' active' : ''}`}
            onClick={() => setLang(code)}
          >{label}</button>
        ))}
      </div>
    ) : (
      <button type="button" className="q-add-lang" disabled={disabled} onClick={() => setMultiLang(true)}>＋ Translations (optional)</button>
    )}

    {/* Prompt */}
    <textarea className="q-prompt" placeholder={multiLang ? `${t('Question text')} (${lang})` : t('Question text')}
      value={q.prompt_i18n?.[lang] || ''} disabled={disabled}
      onChange={e => updateQuestion(index, 'prompt_i18n', { ...q.prompt_i18n, [lang]: e.target.value })}
      rows={2} />

    {/* Scale settings */}
    {['likert','sam_valence','sam_arousal','number','vas_slider'].includes(q.type) && (
      <div className="q-scale">
        <label>Minimum <input type="number" value={q.scale_min ?? 1} disabled={disabled} onChange={e => updateQuestion(index, 'scale_min', Number(e.target.value))} /></label>
        <label>Maximum <input type="number" value={q.scale_max ?? 5} disabled={disabled} onChange={e => updateQuestion(index, 'scale_max', Number(e.target.value))} /></label>
        {q.type !== 'number' && <>
          <label>Minimum label <input value={q.min_label_i18n?.[lang] || ''} disabled={disabled} onChange={e => updateQuestion(index, 'min_label_i18n', { ...q.min_label_i18n, [lang]: e.target.value })} placeholder={t('Lowest label')} /></label>
          <label>Maximum label <input value={q.max_label_i18n?.[lang] || ''} disabled={disabled} onChange={e => updateQuestion(index, 'max_label_i18n', { ...q.max_label_i18n, [lang]: e.target.value })} placeholder={t('Highest label')} /></label>
        </>}
      </div>
    )}

    {/* Choice options */}
    {['single_choice','multiple_choice'].includes(q.type) && (
      <div className="q-options">
        <textarea disabled={disabled}
          value={(q.options_i18n?.[lang] || []).join('\n')}
          onChange={e => updateQuestion(index, 'options_i18n', { ...q.options_i18n, [lang]: e.target.value.split('\n') })}
          placeholder={multiLang ? `${t('One option per line')} (${lang})` : t('One option per line')} rows={3} />
      </div>
    )}

    {/* Correct answer / scoring */}
    {['single_choice','number','likert'].includes(q.type) && (
      <label className="q-answer">
        <span>Correct answer (auto-scored)</span>
        <input value={q.correct_answer || ''} disabled={disabled} placeholder={q.type==='likert'||q.type==='number'?'e.g. 5':t('Matching option text')}
          onChange={e => updateQuestion(index, 'correct_answer', e.target.value)} />
      </label>
    )}

    {/* Time limit */}
    <label className="q-time">
      <span>Time limit (optional)</span>
      <input type="number" min={0} max={600} value={q.time_limit_sec || ''} disabled={disabled} placeholder={t('Seconds; leave blank for no limit')}
        onChange={e => updateQuestion(index, 'time_limit_sec', e.target.value === '' ? null : Number(e.target.value))} />
    </label>
  </article>;
}
