import { useEffect, useRef, useState } from 'react';

const MSG = { en: 'Attention check', zh: '注意力检查', ja: '注意チェック' };
const START = { en: 'Start', zh: '开始', ja: '開始' };
const PASSED = { en: 'Passed', zh: '通过', ja: '合格' };
const MISSED = { en: 'Missed / too slow', zh: '未通过 / 超时', ja: '不合格 / 遅すぎ' };

// True attention-check runner: shows the prompt, listens for the expected key with a
// reaction-time measurement and a timeout, then submits passed / RT / outcome.
export default function AttentionCheckRunner({ config, language = 'en', disabled = false, onSubmit }) {
  const [phase, setPhase] = useState('ready');
  const [result, setResult] = useState(null);
  const startAt = useRef(0);
  const resolved = useRef(false);
  const pausedAt = useRef(null);
  const timeoutRemaining = useRef(0);
  const feedbackRemaining = useRef(1200);
  const msg = value => value?.[language] || value?.en || value?.zh || '';
  const prompt = config?.prompt || 'Press the key when you see the target';
  const expectedKey = String(config?.expectedKey || 'space').toLowerCase();
  const timeoutMs = Math.max(250, Number(config?.timeoutMs || 3000));

  const finish = resultValue => {
    if (resolved.current) return;
    resolved.current = true;
    setResult(resultValue);
    setPhase('done');
  };

  useEffect(() => {
    if (phase !== 'showing') return;
    if (disabled) pausedAt.current = performance.now();
    else if (pausedAt.current != null) { startAt.current += performance.now() - pausedAt.current; pausedAt.current = null; }
  }, [disabled, phase]);

  useEffect(() => {
    if (phase !== 'done' || disabled || !result) return undefined;
    const since = performance.now();
    const timer = setTimeout(() => {
      const resultValue = result;
      const values = {
        attention_passed: resultValue.passed,
        attention_key_pressed: resultValue.keyPressed,
        attention_expected_key: resultValue.expectedKey,
        attention_reaction_time_ms: resultValue.reactionTimeMs,
        attention_outcome: resultValue.outcome,
      };
      onSubmit?.({
        reactionTimeMs: resultValue.reactionTimeMs,
        values,
        outputs: values,
        variables: { last_attention_passed: resultValue.passed, last_attention_rt_ms: resultValue.reactionTimeMs },
        metadata: { attentionCheck: resultValue },
      });
    }, feedbackRemaining.current);
    return () => { clearTimeout(timer); feedbackRemaining.current = Math.max(0, feedbackRemaining.current - (performance.now() - since)); };
  }, [disabled, phase, result, onSubmit]);

  useEffect(() => {
    if (phase !== 'showing' || disabled) return undefined;
    const keydown = event => {
      if (event.repeat || resolved.current) return;
      event.preventDefault();
      const key = event.code === 'Space' ? 'space' : event.key.toLowerCase();
      const passed = key === expectedKey;
      finish({ passed, keyPressed: key, expectedKey, reactionTimeMs: Math.max(0, Math.round(performance.now() - startAt.current)), outcome: passed ? 'correct' : 'incorrect' });
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [disabled, expectedKey, phase]);

  useEffect(() => {
    if (phase !== 'showing' || disabled) return undefined;
    const since = performance.now();
    const timer = setTimeout(() => {
      if (resolved.current) return;
      finish({ passed: false, keyPressed: null, expectedKey, reactionTimeMs: null, outcome: 'omission' });
    }, timeoutRemaining.current);
    return () => { clearTimeout(timer); timeoutRemaining.current = Math.max(0, timeoutRemaining.current - (performance.now() - since)); };
  }, [disabled, phase, timeoutMs, expectedKey]);

  if (phase === 'ready') return <div className="attention-check"><span className="eyebrow">{msg(MSG)}</span><p>{prompt}</p><button type="button" className="participant-ui-button primary" disabled={disabled} onClick={() => { startAt.current = performance.now(); timeoutRemaining.current = timeoutMs; setPhase('showing'); }}>{msg(START)}</button></div>;
  if (phase === 'showing') return <div className="attention-check showing"><div className="attention-stimulus">{prompt}</div></div>;
  return <div className="attention-check result">{result?.passed ? <><h1>✓</h1><p>{msg(PASSED)}</p></> : <><h1>✕</h1><p>{msg(MISSED)}</p></>}{result?.reactionTimeMs != null && <small>{result.reactionTimeMs} ms</small>}</div>;
}
