// PhysioDB /api/v1 contract; independent of the legacy BioDB JWT gateway.
export function createPhysioDBClient({ baseUrl, token, timeoutMs = 30000 }, fetchImpl = fetch) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('PhysioDB request timeout must be positive');
  const base = new URL(baseUrl);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) throw new Error('Invalid PhysioDB URL');
  base.search = ''; base.hash = '';
  base.pathname = `${base.pathname.replace(/\/+$/, '').replace(/\/api\/v1$/, '')}/api/v1/`;
  if (!token?.trim()) throw new Error('PhysioDB API token is required');
  const auth = `Bearer ${token.trim()}`;
  const id = value => {
    if (!value) throw new Error('PhysioDB identifier is required');
    return encodeURIComponent(value);
  };
  async function request(path, { method = 'GET', body, signal } = {}) {
    const controller = new AbortController();
    const abort = () => controller.abort(signal.reason);
    if (signal?.aborted) abort();
    else signal?.addEventListener('abort', abort, { once: true });
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    try {
    const response = await fetchImpl(new URL(path, base).href, {
      method, signal: controller.signal, headers: { Authorization: auth, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      // Do not expose server validation bodies that may echo samples or secrets.
      const error = new Error(`PhysioDB request failed (HTTP ${response.status})`);
      error.status = response.status;
      throw error;
    }
    return response.status === 204 ? null : await response.json();
    } catch (cause) {
      if (timedOut) {
        const error = new Error('PhysioDB request timed out. A write may already have been stored; verify the server before retrying.');
        error.name = 'TimeoutError';
        throw error;
      }
      throw cause;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    }
  }
  const participantPath = (experimentId, participantId) => `experiments/${id(experimentId)}/participants/${id(participantId)}`;
  // Server-Sent Events. `EventSource` cannot send an Authorization header, so the
  // stream is opened with fetch and the frames are parsed here. The request timeout
  // does not apply: a follow connection stays open until the caller aborts.
  // CR is stripped first, so frame splitting only has to look for LF.
  const CR = /\x0d/g;
  const LF = '\x0a';
  const SEP = '\x0a\x0a';
  async function* frames(path, { signal } = {}) {
    const controller = new AbortController();
    const abort = () => controller.abort(signal.reason);
    if (signal?.aborted) abort();
    else signal?.addEventListener('abort', abort, { once: true });
    try {
      const response = await fetchImpl(new URL(path, base).href, {
        headers: { Authorization: auth, Accept: 'text/event-stream' },
        signal: controller.signal,
      });
      if (!response.ok) {
        const error = new Error(`PhysioDB stream failed (HTTP ${response.status})`);
        error.status = response.status;
        throw error;
      }
      if (!response.body) throw new Error('PhysioDB stream has no body');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) return;
        buffer += decoder.decode(value, { stream: true }).replace(CR, '');
        let cut = buffer.indexOf(SEP);
        while (cut >= 0) {
          const block = buffer.slice(0, cut);
          buffer = buffer.slice(cut + SEP.length);
          let event = 'message';
          const data = [];
          for (const line of block.split(LF)) {
            if (line.startsWith('event:')) event = line.slice(6).trim();
            else if (line.startsWith('data:')) data.push(line.slice(5).trim());
          }
          if (data.length) yield { event, data: data.join(LF) };
          cut = buffer.indexOf(SEP);
        }
      }
    } finally {
      signal?.removeEventListener('abort', abort);
    }
  }
  return {
    me: () => request('me'),
    researches: () => request('researches'),
    experiments: researchId => request(`researches/${id(researchId)}/experiments`),
    participants: researchId => request(`researches/${id(researchId)}/participants`),
    streams: (experimentId, participantId) => request(`${participantPath(experimentId, participantId)}/streams`),
    stream: streamId => request(`streams/${id(streamId)}`),
    createStream: (experimentId, participantId, stream) => request(`${participantPath(experimentId, participantId)}/streams`, { method: 'POST', body: stream }),
    appendSamples: (streamId, samples) => request(`streams/${id(streamId)}/samples`, { method: 'POST', body: samples }),
    samples: (streamId, { start, end, signal }) => {
      if (!Number.isFinite(Date.parse(start)) || !Number.isFinite(Date.parse(end)) || Date.parse(start) >= Date.parse(end)) throw new Error('A valid start/end time range is required');
      return request(`streams/${id(streamId)}/samples?${new URLSearchParams({ start, end })}`, { signal });
    },
    createEvent: (experimentId, participantId, event) => request(`${participantPath(experimentId, participantId)}/events`, { method: 'POST', body: event }),
    events: (experimentId, participantId) => request(`${participantPath(experimentId, participantId)}/events`),
    // Yields each sample individually. The server sends one `samples-created`
    // frame per write request, and that frame's data is an array of samples.
    followSamples: async function* (streamId, options = {}) {
      for await (const frame of frames(`streams/${id(streamId)}/samples?follow=true`, options)) {
        if (frame.event !== 'samples-created') continue;
        for (const sample of JSON.parse(frame.data)) yield sample;
      }
    },
    // Yields each event object carried by an `event-created` frame.
    followEvents: async function* (experimentId, participantId, options = {}) {
      for await (const frame of frames(`${participantPath(experimentId, participantId)}/events?follow=true`, options)) {
        if (frame.event !== 'event-created') continue;
        yield JSON.parse(frame.data);
      }
    },
  };
}
