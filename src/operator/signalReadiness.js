/** Transport-neutral receiving checks; this does not certify electrode quality. */
export function signalReadiness(samples, channels, now = Date.now(), { staleMs = 3000, minimumSamples = 5 } = {}) {
  return channels.map(channel => {
    const tail = samples.filter(event => event.eventType === 'device_sample_received' && event.payload?.channelId === channel.id && event.connector?.id === channel.connectorId).slice(-1000);
    const finite = tail.filter(event => Number.isFinite(event.payload.value));
    const recent = finite.filter(event => Number.isFinite(event.timestampEpochMs) && now - event.timestampEpochMs <= staleMs && now >= event.timestampEpochMs);
    const values = recent.map(event => event.payload.value);
    const scalar = channel.unit?.toLowerCase() === 'bpm';
    const requiredSamples = scalar ? 1 : minimumSamples;
    const range = values.length ? Math.max(...values) - Math.min(...values) : null;
    const status = !tail.length ? 'waiting' : !recent.length ? 'stale' : recent.length < requiredSamples ? 'collecting' : !scalar && range === 0 ? 'flat' : 'receiving';
    return { id: channel.id, connectorId: channel.connectorId, name: channel.name || channel.id, unit: channel.unit || null, status, count: recent.length, value: finite.at(-1)?.payload.value ?? null, required: channel.required !== false, ready: status === 'receiving', values };
  });
}

export function canStartWithSignals(checks) { return checks.every(check => !check.required || check.ready); }
