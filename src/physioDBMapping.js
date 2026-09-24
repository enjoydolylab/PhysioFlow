// Preserve the original event identity when adapting the PhysioDB v1 schema.
// This conversion is local; callers decide which server and participant receive it.
export function toPhysioDBEvent(event) {
  if (!event || typeof event.eventType !== 'string' || !event.eventType.trim() || event.eventType.length > 100) throw new Error('Invalid event type');
  if (!event.eventId || !event.sessionId || !Number.isInteger(event.sequence) || event.sequence < 1) throw new Error('An identified, sequenced session event is required');
  if (typeof event.timestampIso !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/.test(event.timestampIso) || !Number.isFinite(Date.parse(event.timestampIso))) throw new Error('An event timestamp with a timezone is required');
  return {
    event_type: event.eventType,
    started_at: event.timestampIso,
    data: {
      source: 'PhysioFlow',
      eventId: event.eventId,
      sessionId: event.sessionId,
      sequence: event.sequence,
      protocolId: event.protocolId ?? null,
      nodeId: event.nodeId ?? null,
      payload: structuredClone(event.payload || {}),
    },
  };
}

/** Convert agent samples.jsonl rows using an explicitly ordered stream mapping.
 * No interpolation, unit conversion, sorting, or timestamp repair is performed.
 * Caller must also check continuity across upload batches.
 */
export function toPhysioDBSamples(samples, channels) {
  if (!Array.isArray(samples) || !Array.isArray(channels) || !channels.length) throw new Error('Raw samples and ordered channels are required');
  const rows = channels.map(channel => channel.row);
  const names = channels.map(channel => channel.name);
  if (rows.some(row => !Number.isInteger(row) || row < 0) || new Set(rows).size !== rows.length || names.some(name => typeof name !== 'string' || !name.trim() || name.length > 100) || new Set(names).size !== names.length) throw new Error('Channel rows and names must be valid and unique');
  let previousTime = -Infinity;
  let previousSequence = null;
  return samples.map(sample => {
    if (!Number.isInteger(sample?.sequence) || sample.sequence < 1 || (previousSequence !== null && sample.sequence !== previousSequence + 1)) throw new Error('Raw sample sequences must be contiguous');
    if (!Number.isFinite(sample.timestamp)) throw new Error('Invalid sample timestamp');
    const micros = Math.round(sample.timestamp * 1e6);
    if (!Number.isSafeInteger(micros) || micros <= previousTime) throw new Error('Sample timestamps must be increasing and unique at microsecond precision');
    if (!Array.isArray(sample.rows)) throw new Error('Full raw sample rows are required; browser previews are not raw recordings');
    const missingRow = rows.find(row => row >= sample.rows.length);
    if (missingRow !== undefined) throw new Error(`Channel row ${missingRow} is missing from sample sequence ${sample.sequence}`);
    const values = rows.map(row => sample.rows[row]);
    if (values.some(value => !Number.isFinite(value))) throw new Error('Mapped sample values must be finite numbers');
    const seconds = Math.floor(micros / 1e6);
    const date = new Date(seconds * 1000);
    if (!Number.isFinite(date.getTime())) throw new Error('Invalid sample timestamp');
    previousTime = micros;
    previousSequence = sample.sequence;
    return { time: date.toISOString().replace('.000Z', `.${String(micros - seconds * 1e6).padStart(6, '0')}Z`), values };
  });
}
