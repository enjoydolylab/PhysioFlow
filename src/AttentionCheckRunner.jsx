import { translate } from './i18n.jsx';
import { useEffect, useRef, useState } from 'react';


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
  const t = key => translate(key, language);
  const prompt = config?.prompt || t('Press the key when you see the target');
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

  if (phase === 'ready') return <div className="attention-check"><span className="eyebrow">{t('Attention check')}</span><p>{prompt}</p><button type="button" className="participant-ui-button primary" disabled={disabled} onClick={() => { startAt.current = performance.now(); timeoutRemaining.current = timeoutMs; setPhase('showing'); }}>{t('Begin attention check')}</button></div>;
  if (phase === 'showing') return <div className="attention-check showing"><div className="attention-stimulus">{prompt}</div></div>;
  return <div className="attention-check result">{result?.passed ? <><h1>✓</h1><p>{t('Passed')}</p></> : <><h1>✕</h1><p>{t('Missed / too slow')}</p></>}{result?.reactionTimeMs != null && <small>{result.reactionTimeMs} ms</small>}</div>;
}
