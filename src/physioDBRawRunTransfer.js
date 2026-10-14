import { checksumBlob } from './assetChecksum.js';
import { readBrainFlowRecording } from './brainFlowRecording.js';
import { toPhysioDBSamples } from './physioDBMapping.js';
export async function uploadRawRunRecording({ file, channels, sessionId, recordingId, client, signal, onProgress }) {
  toPhysioDBSamples([], channels);
  const check = () => { if (signal?.aborted) throw new Error('Recording transfer cancelled; confirmed data is retained'); };
  let previous = null, sampleCount = 0, firstTime, lastTime;
  for await (const row of readBrainFlowRecording(file, { signal })) {
    check(); const mapped = toPhysioDBSamples(previous ? [previous, row] : [row], channels); firstTime ??= mapped[0].time; lastTime = mapped.at(-1).time; previous = row; sampleCount++;
  }
  if (!sampleCount) throw new Error('Raw recording is empty');
  check(); const sourceSha256 = await checksumBlob(file); check();
  const state = await client.beginRecording({ sessionId, recordingId, sourceSha256, sampleCount, firstTime, lastTime, fields: channels.map(c => ({ name: c.name, type: 'float', unit: c.unit ?? null })) });
  let offset = 0, batch = [];
  const flush = async () => {
    if (!batch.length) return; check();
    const samples = toPhysioDBSamples(batch, channels);
    // Reconcile the pending batch; skip batches already confirmed for this exact source.
    if (offset + samples.length > state.confirmedSamples) {
      const result = await client.appendRecording({ sessionId, recordingId, offset, samples }); onProgress?.(result);
    }
    offset += samples.length; batch = [];
  };
  for await (const row of readBrainFlowRecording(file, { signal })) { check(); batch.push(row); if (batch.length === 500) await flush(); }
  await flush(); check(); return client.finishRecording({ sessionId, recordingId });
}
