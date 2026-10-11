/** Explicitly marked transport probe, or actual device preview, plus runtime events. */
export function buildTestRunPayload({ events, deviceEvents, protocol, startedAt }) {
  const input = deviceEvents.filter(e => e.eventType === 'device_sample_received');
  if (input.some(e => !Number.isFinite(e.timestampEpochMs) || !Number.isFinite(e.payload?.value))) throw new Error('Non-numeric or invalid device samples cannot be silently omitted. Local data is preserved.');
  const sampleTime = e => e.connector?.id === 'org.physioflow.brainflow' && Number.isFinite(e.payload.deviceTimestamp) ? e.payload.deviceTimestamp * 1000 : e.timestampEpochMs;
  const streams = [];
  const channels = [...new Set(input.map(e => JSON.stringify([e.connector?.id, e.payload.channelId])))];
  for (const [index, key] of channels.entries()) {
    const [connectorId, channelId] = JSON.parse(key);
    const channel = protocol.deviceConnectors?.find(c => c.connectorId === connectorId)?.channels.find(c => c.id === channelId);
    const rows = input.filter(e => e.connector?.id === connectorId && e.payload.channelId === channelId).sort((a, b) => sampleTime(a) - sampleTime(b));
    const samples = []; let previous = -Infinity;
    for (const row of rows) {
      const time = Math.round(sampleTime(row));
      if (time <= previous) throw new Error('Device timestamps collide at millisecond precision. Local data is preserved; this preview cannot be verified without losing samples.');
      previous = time; samples.push({ time: new Date(time).toISOString(), values: [row.payload.value] });
    }
    streams.push({ key: `device_${index}`, fields: [{ name: `${connectorId}:${channelId}`, type: 'float', unit: channel?.unit || null }], samples });
  }
  if (!streams.length) {
    const start = Date.parse(startedAt);
    if (!Number.isFinite(start)) throw new Error('Test start time is unavailable');
    streams.push({ key: 'synthetic_probe', fields: [{ name: 'test_signal', type: 'float', unit: 'arbitrary' }], samples: Array.from({ length: 500 }, (_, i) => ({ time: new Date(start + i * 4).toISOString(), values: [Math.round(Math.sin(2 * Math.PI * 10 * i / 250) * 1000000) / 1000000] })) });
  }
  return { source: input.length ? 'device_preview' : 'synthetic_probe', streams, events: events.map(e => ({ eventId: e.eventId, eventType: e.eventType, nodeId: e.nodeId ?? null, timestampEpochMs: e.timestampEpochMs, payload: e.payload || {} })) };
}
