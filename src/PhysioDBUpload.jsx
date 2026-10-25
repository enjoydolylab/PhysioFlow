import { useT } from './i18n';
import { useEffect, useRef, useState } from 'react';
import { readBrainFlowRecording } from './brainFlowRecording.js';
import { toPhysioDBSamples } from './physioDBMapping.js';
import { transferVerifiedBrainFlowRecording } from './physioDBTransfer.js';

export default function PhysioDBUpload({ client, destination }) {
  const t = useT();
  const [experimentId, setExperimentId] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [streamId, setStreamId] = useState('');
  const [mapping, setMapping] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const controller = useRef(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);
  useEffect(() => { if (destination) { setExperimentId(destination.experimentId || ''); setParticipantId(destination.participantId || ''); setStreamId(destination.streamId || ''); } }, [destination]);
  const run = async upload => {
    if (busy) return;
    setBusy(true); setCancelling(false); setError(''); setMessage(t("Checking the complete recording…"));
    const abort = new AbortController(); controller.current = abort;
    try {
      const channels = mapping.trim().split('\n').filter(line => line.trim()).map(line => {
        const parts = line.split(',').map(value => value.trim());
        if (parts.length !== 3 || !/^\d+$/.test(parts[0])) throw new Error(t("Each mapping line must be: row number, field name, unit (leave unit empty if unknown)."));
        return { row: Number(parts[0]), name: parts[1], unit: parts[2] || null };
      });
      toPhysioDBSamples([], channels);
      let previous = null, count = 0;
      for await (const record of readBrainFlowRecording(file, { signal: abort.signal })) {
        toPhysioDBSamples(previous ? [previous, record] : [record], channels);
        previous = record; count += 1;
      }
      if (!count) throw new Error(t("The recording contains no samples."));
      if (upload) {
        if (mounted.current) setMessage(t("Checking the destination and uploading the recording…"));
        await transferVerifiedBrainFlowRecording({ client, streamId, experimentId, participantId, channels, records: readBrainFlowRecording(file, { signal: abort.signal }), signal: abort.signal, onProgress: progress => { if (mounted.current) setMessage(`${progress.confirmedSamples} / ${count} samples confirmed by server`); } });
      }
      if (mounted.current) setMessage(upload ? `${count} samples uploaded successfully.` : `${count} raw samples checked. No data was sent.`);
    } catch (failure) {
      if (mounted.current) {
        const progress = failure.progress;
        setError(`${t(failure.message)}${failure.cause?.name === 'TimeoutError' ? ' ' + t('Request timed out.') : ''}${Number.isInteger(failure.cause?.status) ? ` HTTP ${failure.cause.status}.` : ''}${progress ? ` Confirmed: ${progress.confirmedSamples} samples through sequence ${progress.confirmedThroughSequence ?? 'none'}.` : ''}${progress?.uncertainBatch ? ` Verify sequences ${progress.uncertainBatch.fromSequence}–${progress.uncertainBatch.throughSequence} on the server before retrying.` : ''}`);
        setMessage('Stopped.');
      }
    } finally { if (mounted.current) setBusy(false); }
  };
  return <section className="setup-note" aria-label={t("PhysioDB raw recording upload")}>
    <h2>{t("PhysioDB · BrainFlow recording")}</h2>
    <p>Upload a complete samples.jsonl recording to an existing PhysioDB stream. The server uses the official Python SDK. The destination must have matching float fields in the order below.</p>
    <fieldset disabled={busy} style={{ display: 'grid', gap: 12, border: 0, padding: 0 }}>
      <label>{t("Experiment UUID")}<input value={experimentId} onChange={e => setExperimentId(e.target.value)} /></label>
      <label>{t("Participant UUID")}<input value={participantId} onChange={e => setParticipantId(e.target.value)} /></label>
      <label>{t("Stream UUID")}<input value={streamId} onChange={e => setStreamId(e.target.value)} /></label>
      <label>{t("Channel mapping")}<textarea rows={4} value={mapping} onChange={e => setMapping(e.target.value)} placeholder="1, EEG1, uV" /></label>
      <p>{t("One line per destination field: zero-based BrainFlow row, field name, unit. Use the recording metadata to identify rows; no unit conversion is performed.")}</p>
      <label>BrainFlow samples.jsonl<input type="file" accept=".jsonl" onChange={e => { setFile(e.target.files?.[0] || null); setMessage(''); setError(''); }} /></label>
      <div><button disabled={!file || !mapping.trim()} onClick={() => run(false)}>{t("Check recording locally")}</button><button disabled={!file || !mapping.trim() || !client || !experimentId || !participantId || !streamId} onClick={() => run(true)}>{t("Upload recording to PhysioDB")}</button></div>
    </fieldset>
    {busy && <button disabled={cancelling} onClick={() => { controller.current?.abort(); setCancelling(true); setMessage(t("Cancellation requested. Waiting for any current request to finish; no further batches will be sent.")); }}>{cancelling ? t("Cancelling…") : t("Cancel transfer")}</button>}
    {message && <p role="status">{message}</p>}{error && <p role="alert">{error}</p>}
  </section>;
}
