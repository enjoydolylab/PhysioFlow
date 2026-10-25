import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from './i18n';
import { analysePhysioDBWindow, physioDBWindowCSV, validateDBWindow } from './analysis/physioDBWindow.js';
import SignalWaveform from './analysis/SignalWaveform.jsx';
import { assessRecording, verdictLabel } from './analysis/signal/quality.js';
import { powerSpectralDensity } from './analysis/signal/spectrum.js';

function localTime(date) { return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 19); }
function download(contents, filename, type) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const number = value => value == null ? '—' : Number(value).toLocaleString(undefined, { maximumFractionDigits: 4 });
export default function PhysioDBAnalysis({ client, stream }) {
  const t = useT();
  const [initialTime] = useState(() => Number.isFinite(Date.parse(stream.created_at)) ? Date.parse(stream.created_at) : Date.now() - 60000);
  const [start, setStart] = useState(() => localTime(new Date(initialTime)));
  const [end, setEnd] = useState(() => localTime(new Date(initialTime + 60000)));
  const [loaded, setLoaded] = useState(null);
  const [processing, setProcessing] = useState('raw');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  const analysis = useMemo(() => loaded ? analysePhysioDBWindow(stream, loaded.samples, { processing }) : null, [loaded, stream, processing]);
  // Quality is assessed separately from the statistics: a window can be
  // numerically valid and still unusable (stuck electrode, mains hum, gaps).
  // The spectrum is computed only for channels that can support one, and is kept
  // out of `analysis` so exports do not carry the frequency/power arrays.
  const quality = useMemo(() => {
    if (!analysis?.count) return null;
    return assessRecording({
      times: analysis.times,
      sampleRateHz: analysis.sampleRateHz,
      channels: analysis.channels.map(channel => ({
        name: channel.name,
        values: channel.values,
        psd: analysis.sampleRateHz && channel.values.length >= 64 && channel.values.every(Number.isFinite)
          ? powerSpectralDensity(channel.values.slice(-8192), analysis.sampleRateHz)
          : undefined,
      })),
    });
  }, [analysis]);
  const read = async () => {
    setError('');
    try {
      const range = validateDBWindow(start, end);
      const controller = new AbortController(); request.current = controller;
      setBusy(true); setLoaded(null);
      const samples = await client.samples(stream.id, { ...range, signal: controller.signal });
      analysePhysioDBWindow(stream, samples);
      if (!controller.signal.aborted) setLoaded({ samples, range });
    } catch (failure) { setError(t(failure.message)); }
    finally { setBusy(false); }
  };
  return <section className="pf-panel" aria-label="PhysioDB analysis"><div className="pf-section-heading"><div><span className="eyebrow">PHYSIODB</span><h2>{stream.name}</h2></div><span className="pf-tag">{t('Read only')}</span></div>
    <p className="pf-muted">{t('Choose a time window to view signals, calculate statistics and export data.')}</p>
    <form className="pf-window-form" onSubmit={e => { e.preventDefault(); read(); }}>
      <label>{t('From')}<input type="datetime-local" step="1" required disabled={busy} value={start} onChange={e => setStart(e.target.value)} /></label>
      <label>{t('To')}<input type="datetime-local" step="1" required disabled={busy} value={end} onChange={e => setEnd(e.target.value)} /></label>
      <button className="primary" disabled={busy}>{busy ? t('Loading…') : t('Read signals')}</button>
      {busy && <button type="button" onClick={() => request.current?.abort()}>{t('Cancel')}</button>}
    </form><small className="pf-muted">{t('Local timezone')} · {Intl.DateTimeFormat().resolvedOptions().timeZone} · {t('Up to five minutes per request')}</small>
    {error && <p className="pf-error" role="alert">{error}</p>}
    {analysis && <>
      <div className="pf-analysis-toolbar"><span>{analysis.count.toLocaleString()} {t('samples')} · {analysis.sampleRateHz ? `${number(analysis.sampleRateHz)} Hz` : t('Irregular or insufficient timestamps')}{quality && quality.verdict !== 'good' && <> · <b className={quality.verdict === 'unusable' ? 'pf-error' : undefined} title={quality.issues.map(item => item.title).join('; ')}>{verdictLabel(quality)}</b></>}</span>
        <label>{t('Processing')}<select value={processing} onChange={e => setProcessing(e.target.value)}><option value="raw">{t('Original values')}</option><option value="demean">{t('Remove mean')}</option></select></label>
        <button disabled={!analysis.count} onClick={() => download(physioDBWindowCSV(analysis), 'physiodb-window.csv', 'text/csv;charset=utf-8')}>{t('Export CSV')}</button>
        <button disabled={!analysis.count} onClick={() => download(JSON.stringify({ schemaVersion: '1.0.0', source: 'PhysioDB official SDK', streamId: stream.id, experimentId: stream.experiment_id, participantId: stream.participant_id, requestedWindow: loaded.range, processing, retrievedAt: new Date().toISOString(), ...analysis, channels: analysis.channels.map(({ values: _values, ...channel }) => channel), times: undefined }, null, 2), 'physiodb-analysis.json', 'application/json')}>{t('Export summary')}</button>
      </div>
      {!analysis.count ? <div className="pf-empty">{t('No samples in this window. Choose the time of your recording.')}</div> : <>
        {analysis.channels.slice(0, 8).map(channel => <SignalWaveform key={channel.index} times={analysis.times} values={channel.values} label={channel.name} unit={channel.unit} />)}
        {!analysis.channels.length && <p>{t('This stream has no numeric fields.')}</p>}
        <div className="admin-monitor-table"><table><thead><tr>{['Channel', 'Valid samples', 'Missing', 'Mean', 'SD', 'RMS', 'Min', 'Max', 'Peak frequency'].map(label => <th key={label}>{t(label)}</th>)}</tr></thead><tbody>{analysis.channels.map(c => <tr key={c.index}><td>{c.name} {c.unit && <small>({c.unit})</small>}</td><td>{c.n}</td><td>{c.missing}</td><td>{number(c.mean)}</td><td>{number(c.sd)}</td><td>{number(c.rms)}</td><td>{number(c.min)}</td><td>{number(c.max)}</td><td>{c.dominantFrequencyHz == null ? '—' : `${number(c.dominantFrequencyHz)} Hz`}</td></tr>)}</tbody></table></div>
        {quality && quality.issues.length > 0 && <div className="pf-note"><b>{t('Signal quality')}: {quality.verdict}</b><ul>{quality.issues.map((item, index) => <li key={`${item.code}-${index}`}>{item.channel ? `${item.channel}: ` : ''}{item.title}<br /><small className="pf-muted">{item.detail}</small></li>)}</ul></div>}
        <p className="pf-muted">{t('Missing values remain gaps. Frequency is calculated only for complete, regularly spaced signals. Original database values are unchanged.')}</p>
      </>}
    </>}
  </section>;
}
