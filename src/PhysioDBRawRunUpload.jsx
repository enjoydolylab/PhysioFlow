import { useEffect, useRef, useState } from 'react';
import { uploadRawRunRecording } from './physioDBRawRunTransfer.js';
import { useT } from './i18n';
export default function PhysioDBRawRunUpload({ client, runs, onUploaded }) {
  const t = useT(), controller = useRef(null), mounted = useRef(true);
  const [sessionId, setSessionId] = useState(''), [recordingId, setRecordingId] = useState('brainflow-raw'), [file, setFile] = useState(null), [mapping, setMapping] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [progress, setProgress] = useState(null), [recordings, setRecordings] = useState([]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);
  useEffect(() => { let active = true; client.recordings().then(rows => { if (active) setRecordings(rows); }).catch(() => {}); return () => { active = false; }; }, [client]);
  const upload = async () => {
    setBusy(true); setError(''); setProgress(null); const abort = new AbortController(); controller.current = abort;
    try {
      const channels = mapping.trim().split('\n').filter(Boolean).map(line => { const parts = line.split(',').map(x => x.trim()); if (parts.length !== 3 || !/^\d+$/.test(parts[0])) throw new Error('Each mapping line must be: row number, field name, unit (leave unit empty if unknown).'); return { row: Number(parts[0]), name: parts[1], unit: parts[2] || null }; });
      const result = await uploadRawRunRecording({ client, file, channels, sessionId, recordingId: recordingId.trim(), signal: abort.signal, onProgress: next => { if (mounted.current) setProgress(next); } });
      if (mounted.current) { setProgress(result); setRecordings(await client.recordings()); await onUploaded(); }
    } catch (e) { if (mounted.current) { setError(e.message); try { const next = await client.recordings(); if (mounted.current) setRecordings(next); } catch { /* Preserve the original upload failure. */ } } } finally { if (mounted.current) setBusy(false); }
  };
  return <details className="pf-panel"><summary>{t('Attach the complete raw recording')}</summary>
    <p className="pf-muted">{t('Choose the original samples.jsonl file. Confirmed batches are retained; selecting the same file and mapping resumes verification without duplicating samples.')}</p>
    <fieldset disabled={busy} className="pf-run-selectors"><label>{t('Saved run')}<select value={sessionId} onChange={e => { setSessionId(e.target.value); setProgress(null); }}><option value="">{t('Select a completed run')}</option>{runs.filter(r => r.status === 'verified').map(r => <option key={r.sessionId} value={r.sessionId}>{r.sessionId}</option>)}</select></label>
      <label>{t('Recording name')}<input required maxLength={100} value={recordingId} onChange={e => setRecordingId(e.target.value)} /></label>
      <label>{t('Raw recording file')}<input type="file" accept=".jsonl" onChange={e => setFile(e.target.files?.[0] || null)} /></label>
      <label>{t('Channel mapping: row, field, unit')}<textarea required value={mapping} placeholder="1,C3,uV" onChange={e => setMapping(e.target.value)} /></label>
    </fieldset>
    <button className="primary" disabled={busy || !sessionId || !file || !mapping.trim() || !recordingId.trim()} onClick={upload}>{t(busy ? 'Checking and uploading recording…' : 'Upload and verify raw recording')}</button>
    {busy && <button onClick={() => controller.current?.abort()}>{t('Stop after the current batch')}</button>}
    {progress && <p role="status">{progress.confirmedSamples} / {progress.expectedSamples} {t('samples')} · {t(progress.status === 'verified' ? 'Readback verified' : 'Upload incomplete')}</p>}
    {recordings.filter(r => runs.some(run => run.sessionId === r.sessionId)).map(r => <p key={`${r.sessionId}:${r.recordingId}`}>{r.recordingId} · {r.confirmedSamples} / {r.expectedSamples} {t('samples')} · {t(r.status === 'verified' ? 'Readback verified' : 'Upload incomplete')}</p>)}
    {error && <p className="pf-error" role="alert">{t(error)}</p>}
  </details>;
}
