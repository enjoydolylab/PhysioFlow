import { useEffect, useRef, useState } from 'react';
import { createPhysioDBServiceClient } from './physioDBServiceClient.js';
import { getPhysioDBConnection } from './physioDBConnection.js';
import { buildTestRunPayload } from './analysis/testRunPayload.js';
import SignalWaveform from './analysis/SignalWaveform.jsx';
import './admin-monitor.css';
import { useT } from './i18n';
export default function PhysioDBTestResult({ session, protocol, events, deviceEvents, onReport }) {
  const t = useT(), input = useRef(null), flight = useRef(false);
  const [result, setResult] = useState(session.db_test_report || null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const verify = async () => {
    if (flight.current) return;
    flight.current = true; setBusy(true); setError('');
    try {
      const connection = getPhysioDBConnection();
      if (!connection) throw new Error('Connect your PF operator key in the test run settings to verify this saved session.');
      input.current ||= { sessionId: session.session_id, payload: buildTestRunPayload({ events, deviceEvents, protocol, startedAt: session.started_at }) };
      const response = await createPhysioDBServiceClient(connection).completeTestRun(input.current);
      setResult(response); await onReport?.(response);
    } catch (e) { setError(e.message); } finally { flight.current = false; setBusy(false); }
  };
  useEffect(() => { if (!session.db_test_report) verify(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <section className="setup-note" aria-label="PhysioDB test result"><b>{t('PhysioDB test result')}</b>
    <p role="status">{t(busy ? 'Uploading and reading back test data…' : result?.status === 'verified' ? 'Database read-back verified' : 'Database verification needs attention')}</p>
    <p>{t('Test records are retained separately from formal experiments. Local data is preserved.')}</p>
    {error && <p role="alert">{t(error)}</p>}{!busy && result?.status !== 'verified' && <button onClick={verify}>{t('Recheck database')}</button>}
    {result?.report && <><p>{t(result.source === 'synthetic_probe' ? 'Synthetic signal · real database' : 'Device preview · real database')}</p><p>{result.report.actualEvents} / {result.report.expectedEvents} {t('events')} · {t(result.report.eventsMatched ? 'Matched' : 'Mismatch')}</p>
      {result.report.streams.map(s => <div key={s.streamId}><p>{s.key} · {s.actual} / {s.expected} {t('samples')} · {t(s.matched ? 'Matched' : 'Mismatch')}</p><SignalWaveform label={s.fields[0].name} unit={s.fields[0].unit} times={s.preview.map(row => Date.parse(row.time))} values={s.preview.map(row => row.values[0])} /></div>)}
      <details><summary>{t('Database record IDs')}</summary><p>{result.researchId} / {result.experimentId} / {result.participantId}</p></details></>}
  </section>;
}
