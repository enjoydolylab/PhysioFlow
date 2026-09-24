// PhysioDB /api/v1 contract; independent of the legacy BioDB JWT gateway.
export function createPhysioDBClient({ baseUrl, token, timeoutMs = 30000 }, fetchImpl = fetch) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('PhysioDB request timeout must be positive');
  const base = new URL(baseUrl);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) throw new Error('Invalid PhysioDB URL');
  base.search = ''; base.hash = '';
  base.pathname = `${base.pathname.replace(/\/+$/, '').replace(/\/api\/v1$/, '')}/api/v1/`;
  if (!token?.trim()) throw new Error('PhysioDB API token is required');
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
      method, signal: controller.signal, headers: { Authorization: `Bearer ${token.trim()}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
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
  };
}
