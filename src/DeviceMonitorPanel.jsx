import { useEffect, useState } from 'react';
import { normalizeDeviceSnapshot } from './operator/deviceSnapshot.js';
import SignalWaveform from './analysis/SignalWaveform.jsx';
import { useT } from './i18n';

export default function DeviceMonitorPanel({ client }) {
  const t = useT();
  const [source, setSource] = useState('brainflow');
  const [active, setActive] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!active) return undefined;
    let stopped = false, timer;
    const controller = new AbortController();
    const poll = async () => {
      try {
        const next = normalizeDeviceSnapshot(await client.deviceMonitor(source, controller.signal));
        if (!stopped) { setSnapshot(next); setError(''); }
      } catch (failure) { if (!stopped) { setError(failure.message); setSnapshot(null); } }
      if (!stopped) timer = setTimeout(poll, 1000);
    };
    poll();
    return () => { stopped = true; controller.abort(); clearTimeout(timer); };
  }, [active, source, client]);
  const ready = snapshot?.signals?.length && snapshot.signals.every(s => s.ready) && !snapshot.synthetic && !snapshot.warning;
  return <section className="pf-panel" aria-label="Device signal check">
    <div className="pf-section-heading"><div><span className="eyebrow">SIGNALS</span><h2>{t('Signal check')}</h2></div><span className={`pf-tag ${ready ? 'ready' : 'warning'}`}>{snapshot?.synthetic ? t('Simulated data') : ready ? t('Receiving') : t('Needs attention')}</span></div>
    <p className="pf-muted">{t('Check that every required signal is fresh and changing before starting. Monitoring does not take over the device.')}</p>
    <div className="pf-analysis-toolbar"><label>{t('Acquisition source')}<select value={source} onChange={e => { setSource(e.target.value); setSnapshot(null); }}><option value="brainflow">BrainFlow</option><option value="koguchi">OpenBCI GUI + myBeat</option></select></label><button className={active ? '' : 'primary'} onClick={() => { setActive(!active); setSnapshot(null); setError(''); }}>{t(active ? 'Stop monitoring' : 'Check signals')}</button></div>
    {error && <p className="pf-error" role="alert">{t(error)}</p>}{snapshot?.warning && <p role="alert">{snapshot.warning}</p>}
    {!active && <div className="pf-empty">{t('Start the acquisition software, then check signals here.')}</div>}
    {snapshot && <><div className="pf-signal-grid">{snapshot.signals.map(s => <article key={s.id} className="pf-signal-item"><b>{t(s.name)}</b><span className={`pf-tag ${s.ready ? 'ready' : 'warning'}`}>{t(s.status)}</span><strong>{Number.isFinite(s.value) ? s.value.toFixed(2) : '—'} <small>{s.unit}</small></strong></article>)}</div>{snapshot.signals.filter(s => s.times.length > 0).map(s => <SignalWaveform key={s.id} label={s.name} times={s.times} values={s.values} unit={s.unit} />)}<p className="pf-muted">{t('Receiving checks do not measure electrode impedance or prove research signal quality.')}</p></>}
  </section>;
}
