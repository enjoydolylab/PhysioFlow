import { useEffect, useState } from 'react';
import { useT } from './i18n';
export default function PhysioDBSessionBinding({ client, destination }) {
  const t = useT();
  const [records, setRecords] = useState([]), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState(''), [protocolId, setProtocolId] = useState(''), [version, setVersion] = useState('1');
  useEffect(() => { let active = true; client.bindings().then(rows => { if (active) setRecords(rows); }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, [client]);
  const save = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const binding = await client.bindSession({ sessionId: sessionId.trim(), protocolId: protocolId.trim(), protocolVersion: Number(version), researchId: destination.researchId, experimentId: destination.experimentId, participantId: destination.participantId, streamIds: [destination.streamId] });
      setRecords(rows => [...rows.filter(r => r.sessionId !== binding.sessionId), binding]);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return <details className="pf-panel"><summary>{t('Session database binding')} · {records.length}</summary>
    <p className="pf-muted">{t('Link this PF session to the selected recording. This saves the destination; samples are not uploaded automatically.')}</p>
    <p>{destination.streamName}</p><form onSubmit={save}><fieldset disabled={busy} className="pf-recording-selectors">
      <label>{t('PF session ID')}<input required value={sessionId} onChange={e => setSessionId(e.target.value)} maxLength={200} /></label>
      <label>{t('PF protocol ID')}<input required value={protocolId} onChange={e => setProtocolId(e.target.value)} maxLength={200} /></label>
      <label>{t('Protocol version')}<input type="number" required min="1" step="1" value={version} onChange={e => setVersion(e.target.value)} /></label>
    </fieldset><button className="primary" disabled={busy}>{t(busy ? 'Loading…' : 'Verify and save binding')}</button></form>
    {error && <p className="pf-error" role="alert">{t(error)}</p>}
    {records.length > 0 && <ul className="pf-event-list">{records.map(r => <li key={r.sessionId}><b>{r.sessionId}</b><span>{r.protocolId} · v{r.protocolVersion}</span><small>{t('Destination verified')} · {r.streamIds.length} {t('recordings')} · {new Date(r.verifiedAt).toLocaleString()}</small></li>)}</ul>}
  </details>;
}
