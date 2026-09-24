export const BRAINFLOW_CONNECTOR_ID = 'org.physioflow.brainflow';

export function createBrainFlowAdapter({ endpoint = 'http://127.0.0.1:8765', token, session, connector, fetchImpl = fetch }) {
  const url = new URL(endpoint);
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('BrainFlow agent must use http://127.0.0.1:<port>');
  if (!token?.trim()) throw new Error('Enter the BrainFlow agent token');
  const base = url.origin;
  let cursor = 0, runId = null, connected = false;
  async function request(path, body) {
    const response = await fetchImpl(base + path, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: globalThis.AbortSignal.timeout(5000), cache: 'no-store' });
    const value = await response.json();
    if (!response.ok) throw new Error(value.error || `BrainFlow HTTP ${response.status}`);
    return value;
  }
  return {
    async connect() {
      const status = await request('/status');
      if (status.error) throw new Error(status.error);
      if (JSON.stringify(status.manifest.channels) !== JSON.stringify(connector.channels) || status.boardId !== connector.brainflow?.boardId) throw new Error('Board metadata changed; import the agent connector.json again');
      const attached = await request('/attach', session);
      cursor = attached.cursor; runId = attached.runId; connected = true;
      return { deviceId: runId, manufacturer: 'BrainFlow', boardId: attached.boardId, sampleRateHz: attached.sampleRateHz, timestampUnit: 'Unix seconds (BrainFlow)', rawRecording: 'acquisition agent samples.jsonl', previewOnly: true };
    },
    async readBatch() {
      if (!connected) throw new Error('BrainFlow is disconnected');
      const batch = await request(`/samples?sessionId=${encodeURIComponent(session.sessionId)}&after=${cursor}`);
      if (batch.runId !== runId) throw new Error('BrainFlow agent restarted; reconnect to start a new segment');
      if (batch.gap) throw new Error(`BrainFlow preview gap: ${batch.gap} samples; raw recording remains at agent`);
      if (!Array.isArray(batch.samples) || !Number.isInteger(batch.cursor) || batch.cursor < cursor) throw new Error('Invalid BrainFlow batch');
      let expected = cursor;
      for (const sample of batch.samples) {
        if (sample.sequence !== ++expected || !Number.isFinite(sample.timestamp)) throw new Error('Invalid BrainFlow sample sequence or timestamp');
        for (const channel of connector.channels.filter(c => c.direction === 'input')) if (!Number.isFinite(sample.values?.[channel.id])) throw new Error(`Invalid BrainFlow value: ${channel.id}`);
      }
      if (batch.cursor !== expected) throw new Error('BrainFlow cursor does not match samples');
      cursor = batch.cursor;
      return batch.samples.flatMap(sample => Object.entries(sample.values).map(([channelId, value]) => ({ channelId, value, timestamp: sample.timestamp, sampleSequence: sample.sequence, runId })));
    },
    async write(channelId, value) {
      if (!connected || channelId !== 'marker') throw new Error('BrainFlow marker channel is unavailable');
      const event = JSON.parse(value);
      return request('/marker', { sessionId: session.sessionId, markerId: event.sequence, label: value, clientEpochMs: event.timestampEpochMs });
    },
    async disconnect() {
      if (!connected) return;
      connected = false;
      await request('/detach', { sessionId: session.sessionId });
    },
  };
}

// The acquisition agent owns the complete recording. Bound only browser preview
// samples, retaining every connection/marker/failure event for audit.
export function trimBrainFlowPreview(events, maximum = 20000) {
  const isPreview = event => event.connector?.id === BRAINFLOW_CONNECTOR_ID && event.eventType === 'device_sample_received';
  const count = events.reduce((sum, event) => sum + Number(isPreview(event)), 0);
  let remaining = Math.max(0, count - maximum);
  const dropped = remaining;
  return { dropped, events: remaining ? events.filter(event => !(isPreview(event) && remaining-- > 0)) : events };
}
