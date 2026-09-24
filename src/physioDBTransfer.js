import { toPhysioDBSamples } from './physioDBMapping.js';

/** Upload an async sequence of full raw records to an existing, mapped stream.
 * A failed request may have reached the server: never automatically retry it.
 * The caller must verify the stream's field order before invoking this function.
 */
export async function transferBrainFlowSamples({ records, channels, streamId, client, batchSize = 500, signal, onProgress }) {
  if (!streamId || typeof client?.appendSamples !== 'function') throw new Error('A destination stream and client are required');
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 10000) throw new Error('Batch size must be between 1 and 10000');
  // Validate the mapping even for an empty recording.
  toPhysioDBSamples([], channels);
  let confirmedSamples = 0;
  let confirmedThroughSequence = null;
  let pending = [];
  let previous = null;
  let inFlight = false;
  const checkAbort = () => { if (signal?.aborted) throw new Error('Transfer cancelled'); };
  const flush = async () => {
    if (!pending.length) return;
    checkAbort();
    const payload = toPhysioDBSamples(pending, channels);
    inFlight = true;
    await client.appendSamples(streamId, payload);
    inFlight = false;
    confirmedSamples += pending.length;
    confirmedThroughSequence = pending.at(-1).sequence;
    pending = [];
    onProgress?.({ confirmedSamples, confirmedThroughSequence });
  };
  try {
    for await (const record of records) {
      checkAbort();
      // Include the previous record to validate continuity across batch boundaries.
      toPhysioDBSamples(previous ? [previous, record] : [record], channels);
      previous = record;
      pending.push(record);
      if (pending.length === batchSize) await flush();
    }
    await flush();
    return { confirmedSamples, confirmedThroughSequence };
  } catch (cause) {
    const error = new Error(inFlight ? 'Sample transfer stopped; the last request may have been stored. Verify the server before retrying.' : 'Sample transfer stopped before the next request.');
    error.cause = cause;
    error.progress = { confirmedSamples, confirmedThroughSequence, uncertainBatch: inFlight ? { fromSequence: pending[0].sequence, throughSequence: pending.at(-1).sequence } : null };
    throw error;
  }
}

/** Verify the server-owned schema and participant before sending any samples. */
export async function transferVerifiedBrainFlowRecording(options) {
  const { client, streamId, experimentId, participantId, channels, signal } = options;
  if (!experimentId || !participantId || typeof client?.stream !== 'function') throw new Error('An experiment, participant and stream lookup client are required');
  toPhysioDBSamples([], channels);
  if (signal?.aborted) throw new Error('Transfer cancelled');
  const stream = await client.stream(streamId);
  if (stream?.id !== streamId || stream.experiment_id !== experimentId || stream.participant_id !== participantId || stream.deleted_at) throw new Error('Destination stream does not match the selected experiment and participant');
  if (!Array.isArray(stream.fields) || stream.fields.length !== channels.length || stream.fields.some((field, index) => field.name !== channels[index].name || field.type !== 'float' || (field.unit ?? null) !== (channels[index].unit ?? null))) throw new Error('Destination field order, float type or units do not match the channel mapping');
  if (signal?.aborted) throw new Error('Transfer cancelled');
  return transferBrainFlowSamples(options);
}
