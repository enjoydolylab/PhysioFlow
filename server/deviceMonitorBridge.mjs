/** Trusted server-configured devices; callers cannot choose arbitrary URLs. Read only. */
export function createDeviceMonitorBridge({ sources = [], fetchImpl = globalThis.fetch } = {}) {
  const map = new Map();
  for (const source of sources) {
    if (!source.actorId || !source.tenantId || !source.token?.trim() || !['brainflow', 'koguchi'].includes(source.kind)) throw new Error('Device source requires actorId, tenantId, kind and token');
    const url = new URL(source.baseUrl);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('Device source must be an HTTP origin');
    const key = JSON.stringify([source.tenantId, source.actorId, source.kind]);
    if (map.has(key)) throw new Error('Duplicate device monitor source');
    map.set(key, { ...source, baseUrl: url.origin });
  }
  return async (actor, kind) => {
    const source = map.get(JSON.stringify([actor.tenantId, actor.actorId, kind]));
    if (!source) throw Object.assign(new Error('This device monitor is not configured. Configure a source on the PF server.'), { status: 503 });
    const url = new URL(kind === 'brainflow' ? '/monitor' : '/api/snapshot', source.baseUrl);
    const headers = {};
    if (kind === 'koguchi') url.searchParams.set('token', source.token); // Reference server's documented GET contract.
    else headers.Authorization = `Bearer ${source.token}`;
    try {
      const response = await fetchImpl(url, { headers, signal: globalThis.AbortSignal.timeout(5000), cache: 'no-store', redirect: 'error' });
      if (!response.ok) throw new Error();
      const text = await response.text();
      if (text.length > 2 * 1024 * 1024) throw new Error();
      return { source: kind, receivedAt: new Date().toISOString(), snapshot: JSON.parse(text) };
    } catch { throw Object.assign(new Error('Device monitor is unavailable. Check the acquisition computer and connection.'), { status: 502 }); }
  };
}
