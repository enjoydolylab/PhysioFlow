import PhysioDBRawRunUpload from './PhysioDBRawRunUpload.jsx';
import { useEffect, useState } from 'react';
import { loadSession, loadSessions } from './storage.js';
import { buildPhysioDBSessionPlan } from './physioDBSessionPlan.js';
import { useT } from './i18n';
export default function PhysioDBRunSync({ client, destination, onUploaded }) {
  const t = useT();
  const [sessions, setSessions] = useState([]), [selected, setSelected] = useState(''), [plan, setPlan] = useState(null), [runs, setRuns] = useState([]), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const refresh = async () => { setRuns(await client.runs()); };
  useEffect(() => { let active = true; Promise.all([loadSessions(), client.runs()]).then(([local, remote]) => { if (active) { setSessions(local.filter(s => s.status === 'completed')); setRuns(remote); } }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, [client]);
  useEffect(() => {
    if (!busy) return undefined;
    let active = true;
    const timer = setInterval(() => { client.runs().then(next => { if (active) setRuns(next); }).catch(() => {}); }, 2000);
    return () => { active = false; clearInterval(timer); };
  }, [busy, client]);
  const choose = async id => { setSelected(id); setPlan(null); setError(''); if (!id) return; setBusy(true); try { setPlan(buildPhysioDBSessionPlan(await loadSession(id), destination)); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const importPlan = async file => { setPlan(null); setSelected(''); setError(''); try { if (!file || file.size > 9 * 1024 * 1024) throw new Error('Upload plan is missing or too large'); const imported = JSON.parse(await file.text()); if (!Array.isArray(imported.events) || !Array.isArray(imported.streams) || !imported.protocol) throw new Error('Invalid run upload plan'); setPlan({ ...imported, destination: { ...destination } }); } catch (e) { setError(e.message); } };
  const upload = async () => { setBusy(true); setError(''); try { await client.syncRun({ ...plan, destination }); await refresh(); await onUploaded(); } catch (e) { setError(e.message); try { await refresh(); } catch { /* Preserve the upload failure if the status read also fails. */ } } finally { setBusy(false); } };
  return <section className="pf-panel"><h2>{t('Save a completed run to PhysioDB')}</h2>
    <p className="pf-muted">{t('Choose a saved run to upload its events and answers, then attach the complete raw recording below.')}</p>
    <fieldset disabled={busy} className="pf-run-selectors"><label>{t('Saved run')}<select value={selected} onChange={e => choose(e.target.value)}><option value="">{t('Select a completed run')}</option>{sessions.map(s => <option value={s.session_id} key={s.session_id}>{s.participant_id} · {s.protocol_name} · {s.session_id}</option>)}</select></label>
      <label>{t('Run upload plan')}<input type="file" accept=".json,application/json" onChange={e => importPlan(e.target.files?.[0])} /></label>
    </fieldset>
    {plan && <p>{plan.sessionId} · {plan.events.length} {t('events')} · {plan.streams.reduce((sum, s) => sum + (s.samples?.length || 0), 0)} {t('samples')}</p>}
    <button className="primary" disabled={busy || !plan} onClick={upload}>{t(busy ? 'Uploading and verifying…' : 'Upload and verify run')}</button>
    {error && <p role="alert" className="pf-error">{t(error)}</p>}
    {!!runs.length && <ul className="pf-event-list">{runs.filter(r => r.destination.experimentId === destination.experimentId && r.destination.participantId === destination.participantId).map(r => <li key={r.sessionId}><b>{r.sessionId}</b><span>{t(r.status === 'verified' ? 'Readback verified' : r.status === 'mismatch' ? 'Readback mismatch' : 'Upload incomplete')}</span><small>v{r.provenance.protocol_version} · {r.report?.actualEvents ?? 0} {t('events')} · {r.confirmedOperations} {t('Confirmed writes')}</small>{!!r.uncertainOperations.length && <small>{t('Write outcome uncertain. Keep local data and recheck using the same upload plan.')}</small>}</li>)}</ul>}
    <PhysioDBRawRunUpload client={client} runs={runs.filter(r => r.destination.experimentId === destination.experimentId && r.destination.participantId === destination.participantId)} onUploaded={onUploaded} />
  </section>;
}
