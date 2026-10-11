import { useEffect, useRef, useState } from 'react';
import { setPhysioDBConnection } from './physioDBConnection.js';
import { createPhysioDBServiceClient } from './physioDBServiceClient.js';
import { LanguageToggle, DarkModeToggle, useT } from './i18n';
import DeviceMonitorPanel from './DeviceMonitorPanel.jsx';
import PhysioDBSessionBinding from './PhysioDBSessionBinding.jsx';
import PhysioDBAnalysis from './PhysioDBAnalysis.jsx';
import PhysioDBUpload from './PhysioDBUpload.jsx';
import './admin-monitor.css';

export default function AdminMonitorPage() {
  const t = useT();
  const [baseUrl, setBaseUrl] = useState(window.location.origin);
  const [token, setToken] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('access') || '');
  const [client, setClient] = useState(null);
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState('prepare');
  const [researches, setResearches] = useState([]), [researchId, setResearchId] = useState('');
  const [experiments, setExperiments] = useState([]), [participants, setParticipants] = useState([]);
  const [experimentId, setExperimentId] = useState(''), [participantId, setParticipantId] = useState('');
  const [streams, setStreams] = useState([]), [events, setEvents] = useState([]);
  const [streamId, setStreamId] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [updated, setUpdated] = useState('');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const generation = useRef(0);
  useEffect(() => { if (window.location.hash) window.history.replaceState(null, '', window.location.pathname + window.location.search); return () => { generation.current += 1; }; }, []);
  const run = async action => {
    const current = ++generation.current; setBusy(true); setError('');
    try { await action(() => current === generation.current); }
    catch (failure) { if (current === generation.current) setError(failure.message); }
    finally { if (current === generation.current) setBusy(false); }
  };
  const resetRecords = () => { setStreams([]); setEvents([]); setStreamId(''); setUploadOpen(false); setUpdated(''); };
  const disconnect = () => { setPhysioDBConnection(null); generation.current += 1; setClient(null); setMe(null); setToken(''); setResearches([]); setResearchId(''); setExperiments([]); setParticipants([]); setExperimentId(''); setParticipantId(''); resetRecords(); setError(''); setBusy(false); };
  const connect = () => run(async active => {
    const next = createPhysioDBServiceClient({ baseUrl, accessToken: token });
    await next.status();
    if (!active()) return;
    setPhysioDBConnection({ baseUrl, accessToken: token });
    setClient(next); setToken('');
    // Device monitoring is usable even when the separate database is unavailable.
    const [user, list] = await Promise.all([next.me(), next.researches()]);
    if (active()) { setMe(user); setResearches(list); }
  });
  const selectResearch = id => {
    setResearchId(id); setExperimentId(''); setParticipantId(''); setExperiments([]); setParticipants([]); resetRecords();
    if (id) run(async active => { const [a, b] = await Promise.all([client.experiments(id), client.participants(id)]); if (active()) { setExperiments(a); setParticipants(b); } });
  };
  useEffect(() => {
    if (!client || !experimentId || !participantId) return undefined;
    let stopped = false;
    setBusy(true); setError('');
    const load = async () => {
      try { const [a, b] = await Promise.all([client.streams(experimentId, participantId), client.events(experimentId, participantId)]); if (!stopped) { setStreams(a); setEvents(b); setUpdated(new Date().toLocaleString()); } }
      catch (failure) { if (!stopped) setError(failure.message); }
      finally { if (!stopped) setBusy(false); }
    };
    load(); return () => { stopped = true; };
  }, [client, experimentId, participantId]);
  const refresh = () => run(async active => { const [a, b] = await Promise.all([client.streams(experimentId, participantId), client.events(experimentId, participantId)]); if (active()) { setStreams(a); setEvents(b); setUpdated(new Date().toLocaleString()); } });
  const stream = streams.find(s => s.id === streamId);
  return <main className="admin-monitor"><section>
    <header className="pf-admin-header"><a href="/">pf. <span>PhysioFlow</span></a><div><DarkModeToggle /><LanguageToggle /></div></header>
    <div className="pf-admin-title"><div><span className="eyebrow">EXPERIMENT DESK</span><h1>{t('Run your study, simply.')}</h1><p className="pf-muted">{t('Prepare the experiment. Check signals. Review your data.')}</p></div>{client && <div className="pf-connection"><span className="pf-tag ready">{t('Connected')}</span><small>{me?.name || t('PF administrator')}</small><button onClick={disconnect}>{t('Disconnect')}</button></div>}</div>
    {!client ? <section className="pf-panel pf-login"><h2>{t('Connect to your workspace')}</h2><p className="pf-muted">{t('Use your PF operator access key. Database and device credentials stay on the server.')}</p><form onSubmit={e => { e.preventDefault(); connect(); }}><label>{t('Operator access key')}<input type="password" autoComplete="off" required value={token} onChange={e => setToken(e.target.value)} disabled={busy} /></label><details><summary>{t('Server settings')}</summary><label>{t('PF server URL')}<input type="url" required value={baseUrl} onChange={e => setBaseUrl(e.target.value)} disabled={busy} /></label></details><button className="primary" disabled={busy}>{busy ? t('Connecting…') : t('Connect')}</button></form></section> : <>
      <nav className="pf-tabs" aria-label={t('Experiment desk navigation')}>{[['prepare', 'Preparation'], ['signals', 'Signal check'], ['data', 'Data & analysis']].map(([id, label], i) => <button key={id} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}><span>0{i + 1}</span>{t(label)}</button>)}</nav>
      {tab === 'prepare' && <div className="pf-workflow-grid">{[
        ['01', 'Prepare your experiment', 'Design or select a protocol, check media, and prepare the participant session.', '/'],
        ['02', 'Check your signals', 'Confirm live EEG and heart rate before presenting any stimuli.', null],
        ['03', 'Review your recording', 'Read a time window from PhysioDB, inspect it, and export analysis.', null],
      ].map(([n, title, description, url], i) => <article className="pf-panel" key={n}><span className="eyebrow">{n}</span><h2>{t(title)}</h2><p className="pf-muted">{t(description)}</p>{url ? <a className="pf-monitor-link" href={url}>{t('Open experiments')} ↗</a> : <button onClick={() => setTab(i === 1 ? 'signals' : 'data')}>{t(i === 1 ? 'Check signals' : 'View data')} →</button>}</article>)}</div>}
      {tab === 'prepare' && <div className="pf-note"><b>{t('Two displays. One experiment.')}</b><p>{t('Open the operator monitor from session preparation on this browser. Move the experiment window to the participant display; the operator window shows progress and signals separately.')}</p></div>}
      {tab === 'signals' && <DeviceMonitorPanel client={client} />}
      {tab === 'data' && <>
        <section className="pf-panel"><div className="pf-section-heading"><h2>{t('Choose a recording')}</h2><a className="pf-muted" href="https://physiodb.jmessk.net" target="_blank" rel="noreferrer">PhysioDB Console ↗</a></div>
          <fieldset disabled={busy} className="pf-recording-selectors"><label>{t('Research')}<select value={researchId} onChange={e => selectResearch(e.target.value)}><option value="">{t('Select research')}</option>{researches.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label><label>{t('Experiment')}<select value={experimentId} onChange={e => { setExperimentId(e.target.value); resetRecords(); }}><option value="">{t('Select experiment')}</option>{experiments.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label><label>{t('Participant')}<select value={participantId} onChange={e => { setParticipantId(e.target.value); resetRecords(); }}><option value="">{t('Select participant')}</option>{participants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label></fieldset>
          <div className="pf-analysis-toolbar"><span className="pf-muted">{busy ? t('Loading…') : updated ? `${t('Updated')} ${updated}` : t('Select an experiment and participant to see recordings.')}</span><button disabled={busy || !experimentId || !participantId} onClick={refresh}>{t('Refresh')}</button></div>
          <div className="pf-stream-list">{streams.filter(s => !s.deleted_at).map(s => <button key={s.id} className={streamId === s.id ? 'selected' : ''} onClick={() => { setStreamId(s.id); setUploadOpen(false); }}><div><b>{s.name}</b><small>{s.fields.length} {t('fields')}</small></div><span>{s.sample_count.toLocaleString()} {t('samples')} →</span></button>)}</div>
          {updated && !streams.length && <p className="pf-empty">{t('No recordings for this participant yet.')}</p>}
        </section>
        {stream && <PhysioDBSessionBinding client={client} destination={{ researchId, experimentId, participantId, streamId, streamName: stream.name }} />}
        {stream && <PhysioDBAnalysis key={stream.id} stream={stream} client={client} />}
        {!!events.length && <details className="pf-panel"><summary>{t('Experiment events')} · {events.length}</summary><ul className="pf-event-list">{[...events].sort((a, b) => Date.parse(a.started_at) - Date.parse(b.started_at)).slice(-50).map(e => <li key={e.id}><time>{new Date(e.started_at).toLocaleString()}</time><b>{e.event_type}</b><span>{e.description}</span></li>)}</ul></details>}
        {stream && <section className="pf-panel"><button onClick={() => setUploadOpen(!uploadOpen)}>{t(uploadOpen ? 'Close upload' : 'Upload raw recording')} {uploadOpen ? '−' : '+'}</button>{uploadOpen && <PhysioDBUpload key={`${experimentId}:${participantId}:${streamId}`} client={client} destination={{ experimentId, participantId, streamId }} />}</section>}
      </>}
    </>}
    {error && <div className="pf-note pf-error" role="alert">{t(error)}{client && <button disabled={busy} onClick={() => run(async active => { const [user, list] = await Promise.all([client.me(), client.researches()]); if (active()) { setMe(user); setResearches(list); } })}>{t('Retry database connection')}</button>}</div>}
    <footer className="pf-admin-footer"><span>PhysioFlow</span><a href="/">{t('Experiments')} ↗</a><span>{t('Participant display')} · /participant</span></footer>
  </section></main>;
}
