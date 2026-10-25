import { useEffect, useState } from 'react';
import { LanguageToggle, useT } from './i18n';
import { OPERATOR_PROTOCOL } from './operator/runtimeMonitor.js';
import SignalWaveform from './analysis/SignalWaveform.jsx';
import SignalQualityNotice from './analysis/SignalQualityNotice.jsx';
import './admin-monitor.css';

export default function OperatorMonitorPage() {
  const t = useT();
  const [launch] = useState(() => Object.fromEntries(new URLSearchParams(window.location.hash.slice(1))));
  const [snapshot, setSnapshot] = useState(null);
  const [channel, setChannel] = useState(null);
  const [stale, setStale] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const { session, key } = launch;
    if (!session || !key || !globalThis.BroadcastChannel) { setError('Open this monitor from experiment preparation on the same browser.'); return undefined; }
    const connection = new globalThis.BroadcastChannel(`${OPERATOR_PROTOCOL}:${session}:${key}`);
    let last = 0, revision = 0;
    connection.onmessage = event => {
      const next = event.data;
      if (next?.protocol !== OPERATOR_PROTOCOL || next.type !== 'snapshot' || !Number.isSafeInteger(next.revision) || next.revision <= revision) return;
      revision = next.revision; last = Date.now(); setSnapshot(next); setStale(false);
    };
    setChannel(connection);
    const timer = setInterval(() => setStale(Date.now() - last > 3000), 1000);
    return () => { clearInterval(timer); connection.close(); };
  }, [launch]);
  const send = command => channel?.postMessage({ protocol: OPERATOR_PROTOCOL, type: 'command', command, id: crypto.randomUUID(), sentAt: Date.now() });
  return <main className="admin-monitor"><section>
    <header className="pf-admin-header"><a href="/">pf. <span>PhysioFlow</span></a><LanguageToggle /></header>
    <span className="eyebrow">OPERATOR</span><h1>{t('Experiment monitor')}</h1>
    <p className="pf-muted">{t('This window stays with the operator. Keep the experiment window on the participant display.')}</p>
    {error && <p role="alert">{t(error)}</p>}
    <div className="pf-section-heading"><h2>{snapshot?.protocolName || t('Waiting for experiment')}</h2><span className={`pf-tag ${stale ? 'warning' : 'ready'}`}>{stale ? t('Disconnected') : t(snapshot?.status || 'ready')}</span></div>
    {snapshot && <>
      <div className="pf-metric-grid"><div><span>{t('Current step')}</span><b>{snapshot.nodeLabel || '—'}</b></div><div><span>{t('Progress')}</span><b>{snapshot.completed} / {snapshot.total}</b></div><div><span>{t('Checkpoint')}</span><b>{t(snapshot.saveStatus || 'idle')}</b></div></div>
      <div className="pf-analysis-toolbar"><button className="primary" disabled={stale || !['waiting', 'paused'].includes(snapshot.status)} onClick={() => send(snapshot.status === 'paused' ? 'resume' : 'pause')}>{t(snapshot.status === 'paused' ? 'Resume' : 'Pause')}</button><span className="pf-muted">{t('The participant only sees the experiment and pause message.')}</span></div>
      {snapshot.deviceError && <p className="pf-error" role="alert">{snapshot.deviceError}</p>}
      <div className="pf-signal-grid">{(snapshot.signals || []).map(signal => <article key={`${signal.connectorId}:${signal.id}`} className="pf-panel"><div className="pf-section-heading"><h3>{signal.name}</h3><span className={`pf-tag ${signal.ready && !stale ? 'ready' : 'warning'}`}>{t(stale ? 'stale' : signal.status)}</span></div><b>{Number.isFinite(signal.value) ? signal.value.toFixed(2) : '—'} <small>{signal.unit}</small></b></article>)}</div>
      {snapshot.preview?.times?.length > 0 && Object.entries(snapshot.preview.values || {}).map(([id, values]) => <SignalWaveform key={id} times={snapshot.preview.times} values={values} label={id} />)}
      <SignalQualityNotice assessment={snapshot.quality} />
      {['completed', 'failed'].includes(snapshot.status) && <p role="status">{t('The experiment has ended. This monitor remains open for review.')}</p>}
    </>}
    {!snapshot && !error && <div className="pf-empty">{t('Waiting for experiment')}</div>}
  </section></main>;
}
