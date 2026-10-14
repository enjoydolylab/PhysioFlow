/** PF credentials authenticate to PF only. PhysioDB credentials stay on the server. */
export function createPhysioDBServiceClient({ baseUrl = globalThis.location?.origin, accessToken }, fetchImpl = fetch) {
  const base = new URL(baseUrl);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || !accessToken?.trim()) throw new Error('PF server URL and administrator token are required');
  async function rpc(operation, args = {}, signal) {
    const response = await fetchImpl(new URL('/v1/physiodb/rpc', base), {
      method: 'POST', cache: 'no-store', signal,
      headers: { Authorization: `Bearer ${accessToken.trim()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation, args }),
    });
    const body = await response.json();
    if (!response.ok) throw Object.assign(new Error(body.error?.message || 'PF database request failed'), { status: response.status });
    return body.result;
  }
  async function get(path, signal) {
    const response = await fetchImpl(new URL(path, base), { cache: 'no-store', signal, headers: { Authorization: `Bearer ${accessToken.trim()}` } });
    const body = await response.json();
    if (!response.ok) throw Object.assign(new Error(body.error?.message || 'PF server request failed'), { status: response.status });
    return body;
  }
  const testRequest = async (action, input) => {
    const response = await fetchImpl(new URL(`/v1/physiodb/test-runs/${action}`, base), { method: 'POST', cache: 'no-store', headers: { Authorization: `Bearer ${accessToken.trim()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    const body = await response.json();
    if (!response.ok) throw Object.assign(new Error(body.error?.message || 'Database test failed'), { status: response.status });
    return body.result;
  };
  const recordingRequest = async (action, input) => {
    const response = await fetchImpl(new URL(`/v1/physiodb/recordings/${action}`, base), { method: 'POST', cache: 'no-store', headers: { Authorization: `Bearer ${accessToken.trim()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    const body = await response.json();
    if (!response.ok) throw Object.assign(new Error(body.error?.message || 'Recording synchronization failed'), { status: response.status });
    return body.recording;
  };
  return {
    recordings: async () => (await get('/v1/physiodb/recordings')).recordings,
    beginRecording: input => recordingRequest('begin', input),
    appendRecording: input => recordingRequest('append', input),
    finishRecording: input => recordingRequest('finish', input),
    runSnapshot: async sessionId => (await get(`/v1/physiodb/runs/${encodeURIComponent(sessionId)}`)).run,
    runs: async () => (await get('/v1/physiodb/runs')).runs,
    syncRun: async input => {
      const response = await fetchImpl(new URL('/v1/physiodb/runs', base), { method: 'POST', cache: 'no-store', headers: { Authorization: `Bearer ${accessToken.trim()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      const body = await response.json();
      if (!response.ok) throw Object.assign(new Error(body.error?.message || 'Run synchronization failed'), { status: response.status });
      return body.run;
    },
    prepareTestRun: input => testRequest('prepare', input),
    completeTestRun: input => testRequest('complete', input),
    bindings: async () => (await get('/v1/physiodb/bindings')).bindings,
    bindSession: async binding => {
      const response = await fetchImpl(new URL('/v1/physiodb/bindings', base), { method: 'PUT', cache: 'no-store', headers: { Authorization: `Bearer ${accessToken.trim()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(binding) });
      const body = await response.json();
      if (!response.ok) throw Object.assign(new Error(body.error?.message || 'Session binding failed'), { status: response.status });
      return body.binding;
    },
    status: () => get('/metrics'),
    deviceMonitor: (source, signal) => get(`/v1/devices/monitor?source=${encodeURIComponent(source)}`, signal),
    me: () => rpc('me'), researches: () => rpc('researches'),
    experiments: researchId => rpc('experiments', { researchId }),
    participants: researchId => rpc('participants', { researchId }),
    streams: (experimentId, participantId) => rpc('streams', { experimentId, participantId }),
    events: (experimentId, participantId) => rpc('events', { experimentId, participantId }),
    stream: streamId => rpc('stream', { streamId }),
    createStream: (experimentId, participantId, stream) => rpc('createStream', { experimentId, participantId, stream }),
    appendSamples: (streamId, samples) => rpc('appendSamples', { streamId, samples }),
    samples: (streamId, { start, end, signal }) => rpc('samples', { streamId, start, end }, signal),
    createEvent: (experimentId, participantId, event) => rpc('createEvent', { experimentId, participantId, event }),
  };
}
