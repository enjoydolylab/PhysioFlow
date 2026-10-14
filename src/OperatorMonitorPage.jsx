import { useEffect, useRef, useState } from 'react';
import { LanguageToggle, useT } from './i18n';
import { OPERATOR_PROTOCOL } from './operator/runtimeMonitor.js';
import SignalWaveform from './analysis/SignalWaveform.jsx';
import './admin-monitor.css';

export default function OperatorMonitorPage() {
  const t = useT();
  const [launch] = useState(() => Object.fromEntries(new URLSearchParams(window.location.hash.slice(1))));
  const [snapshot, setSnapshot] = useState(null);
  const [channel, setChannel] = useState(null);
  const [stale, setStale] = useState(true);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [pending, setPending] = useState(null);
  const pendingRef = useRef(null);
  const [result, setResult] = useState(null);
  useEffect(() => {
    if (!pending) return undefined;
    const timer = setTimeout(() => { setResult({ ok: false, error: 'No acknowledgement received. Check the experiment before trying again.' }); }, 5000);
    return () => clearTimeout(timer);
  }, [pending]);
  useEffect(() => {
    const { session, key } = launch;
    if (!session || !key || !globalThis.BroadcastChannel) { setError('Open this monitor from experiment preparation on the same browser.'); return undefined; }
    const connection = new globalThis.BroadcastChannel(`${OPERATOR_PROTOCOL}:${session}:${key}`);
    let last = 0, revision = 0;
    connection.onmessage = event => {
      const next = event.data;
      if (next?.protocol === OPERATOR_PROTOCOL && next.type === 'command-status-result' && pendingRef.current?.id === next.id) {
        setResult({ ok: false, error: 'The experiment has no recorded acknowledgement. Check the experiment window before continuing.' }); return;
      }
      if (next?.protocol === OPERATOR_PROTOCOL && next.type === 'command-result') {
        const current = pendingRef.current;
        if (current?.id === next.id) {
          setResult(next);
          if (next.ok && ['note', 'retry', 'skip'].includes(current.command)) setText('');
          pendingRef.current = null; setPending(null);
        }
        return;
      }
      if (next?.protocol !== OPERATOR_PROTOCOL || next.type !== 'snapshot' || !Number.isSafeInteger(next.revision) || next.revision <= revision) return;
      revision = next.revision; last = Date.now(); setSnapshot(next); setStale(false);
    };
    setChannel(connection);
    const timer = setInterval(() => setStale(Date.now() - last > 3000), 1000);
    return () => { clearInterval(timer); connection.close(); };
  }, [launch]);
  const send = command => {
    if (!channel || stale || pendingRef.current) return;
    const id = crypto.randomUUID();
    pendingRef.current = { id, command };
    setResult(null); setPending(pendingRef.current);
    channel.postMessage({ protocol: OPERATOR_PROTOCOL, type: 'command', command, id, sentAt: Date.now(), text, nodeId: snapshot?.nodeId, attempt: snapshot?.attempt });
  };
  const connectionLabel = error ? 'Disconnected' : !snapshot ? 'Waiting for experiment' : stale ? 'Disconnected' : snapshot.status || 'ready';
  return <main className="admin-monitor operator-monitor"><section>
    <header className="pf-admin-header"><a href="/">pf. <span>PhysioFlow</span></a><LanguageToggle /></header>
    <span className="eyebrow">OPERATOR</span><h1>{t('Experiment monitor')}</h1>
    <p className="pf-muted">{t('This window stays with the operator. Keep the experiment window on the participant display.')}</p>
    {error && <p role="alert">{t(error)}</p>}
    <div className="pf-section-heading"><h2>{snapshot?.protocolName || t('Waiting for experiment')}</h2><span role="status" aria-live="polite" className={`pf-tag ${stale ? 'warning' : 'ready'}`}>{t(connectionLabel)}</span></div>
    {snapshot && stale && <p role="status" className="pf-operator-notice">{t('The displayed values are the last received update. Keep the experiment window open in this browser; actions will unlock when updates resume.')}</p>}
    {snapshot && <>
      <div className="pf-metric-grid"><div><span>{t('Current step')}</span><b>{snapshot.nodeLabel || '—'}</b></div><div><span>{t('Defined steps')}</span><b>{snapshot.total}</b></div><div><span>{t('Completed visits')}</span><b>{snapshot.completed}</b></div><div><span>{t('Skipped visits')}</span><b>{snapshot.skipped ?? 0}</b></div><div><span>{t('Checkpoint')}</span><b>{t(snapshot.saveStatus || 'idle')}</b></div></div>
      <div className="pf-analysis-toolbar"><button className="primary" disabled={stale || Boolean(pending) || !['waiting', 'paused'].includes(snapshot.status)} onClick={() => send(snapshot.status === 'paused' ? 'resume' : 'pause')}>{t(snapshot.status === 'paused' ? 'Resume' : 'Pause')}</button><span className="pf-muted">{t('The participant only sees the experiment and pause message.')}</span></div>
      <section className="pf-panel" aria-label={t('In-session actions')}>
        <h2>{t('In-session actions')}</h2>
        <p className="pf-muted">{t('Retry restarts the current step. Skip advances without a response. Record a reason before either action.')}</p>
        <label>{t('Reason or observation')}<textarea disabled={Boolean(pending)} rows={3} maxLength={1000} value={text} onChange={event => setText(event.target.value)} /></label>
        {!pending && !stale && snapshot.status === 'waiting' && !text.trim() && <p className="pf-muted">{t('Enter a reason or observation to enable retry, skip or save.')}</p>}
        <div className="pf-analysis-toolbar">
          <button disabled={stale || Boolean(pending) || snapshot.status !== 'waiting' || !text.trim()} onClick={() => send('retry')}>{t('Retry current step')}</button>
          <button disabled={stale || Boolean(pending) || snapshot.status !== 'waiting' || !text.trim()} onClick={() => send('skip')}>{t('Skip current step')}</button>
          <button disabled={stale || Boolean(pending) || !['waiting', 'paused'].includes(snapshot.status) || !text.trim()} onClick={() => send('note')}>{t('Save observation')}</button>
        </div>
        {pending && <><p role="status">{t('Waiting for acknowledgement…')}</p>{result && <button disabled={stale} onClick={() => channel.postMessage({ protocol: OPERATOR_PROTOCOL, type: 'command-status', id: pending.id })}>{t('Check action result')}</button>}{result && <button onClick={() => { pendingRef.current = null; setPending(null); setResult(null); }}>{t('I checked the experiment; clear waiting')}</button>}</>}
        {result && <p role={result.ok ? 'status' : 'alert'}>{t(result.ok ? 'Action recorded.' : result.error)}</p>}
        {snapshot.recentNotes?.length > 0 && <><h3>{t('Recent observations')}</h3><ul className="pf-event-list">{snapshot.recentNotes.map(note => <li key={note.id}><b>{note.nodeLabel}</b><span>{note.text}</span><small>{new Date(note.timestamp).toLocaleTimeString()}</small></li>)}</ul></>}
      </section>
      {snapshot.saveError && <p role="alert" className="pf-error">{t('Saving needs attention. Keep the experiment window open and retry saving there.')} {snapshot.saveError}</p>}
      {snapshot.hostedSaveStatus && <p>{t('Server save')}: {t(snapshot.hostedSaveStatus)}</p>}
      {snapshot.hostedSaveError && <p role="alert" className="pf-error">{t('Server saving needs attention. Check the experiment window and retry synchronization there.')} {snapshot.hostedSaveError}</p>}
      {snapshot.deviceError && <p className="pf-error" role="alert">{snapshot.deviceError}</p>}
      <div className="pf-signal-grid">{(snapshot.signals || []).map(signal => <article key={`${signal.connectorId}:${signal.id}`} className="pf-panel"><div className="pf-section-heading"><h3>{signal.name}</h3><span className={`pf-tag ${signal.ready && !stale ? 'ready' : 'warning'}`}>{t(stale ? 'stale' : signal.status)}</span></div><b>{Number.isFinite(signal.value) ? signal.value.toFixed(2) : '—'} <small>{signal.unit}</small></b></article>)}</div>
      {snapshot.preview?.times?.length > 0 && Object.entries(snapshot.preview.values || {}).map(([id, values]) => <SignalWaveform key={id} times={snapshot.preview.times} values={values} label={id} />)}
      {['completed', 'failed'].includes(snapshot.status) && <p role="status">{t('The experiment has ended. This monitor remains open for review.')}</p>}
    </>}
    {!snapshot && !error && <div className="pf-empty">{t('Waiting for experiment')}<p>{t('Start the prepared experiment in the other window on this browser. Its current step will appear here.')}</p></div>}
  </section></main>;
}
