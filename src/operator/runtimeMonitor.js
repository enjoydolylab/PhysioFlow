export const OPERATOR_PROTOCOL = 'physioflow.operator.v1';
export function operatorMonitorUrl(origin, sessionId, key) {
  const url = new URL('/operator', origin); url.hash = new URLSearchParams({ session: sessionId, key }).toString(); return url.href;
}
export function openRuntimeMonitor({ sessionId, getSnapshot, onCommand, origin = globalThis.location?.origin, channelFactory = name => new globalThis.BroadcastChannel(name), key = globalThis.crypto.randomUUID() }) {
  const channel = channelFactory(`${OPERATOR_PROTOCOL}:${sessionId}:${key}`);
  let revision = 0;
  const seen = new Set();
  const publish = () => channel.postMessage({ protocol: OPERATOR_PROTOCOL, type: 'snapshot', revision: ++revision, sentAt: Date.now(), ...getSnapshot() });
  channel.onmessage = event => {
    const message = event.data;
    if (message?.protocol !== OPERATOR_PROTOCOL || message.type !== 'command' || !['pause', 'resume', 'retry', 'skip', 'note'].includes(message.command) || typeof message.id !== 'string' || message.id.length > 100 || seen.has(message.id)) return;
    if (!Number.isFinite(message.sentAt) || Math.abs(Date.now() - message.sentAt) > 5000) return;
    seen.add(message.id); if (seen.size > 100) seen.delete(seen.values().next().value);
    const respond = (ok, error = '') => channel.postMessage({ protocol: OPERATOR_PROTOCOL, type: 'command-result', id: message.id, ok, error });
    try {
      if (['retry', 'skip', 'note'].includes(message.command) && (typeof message.text !== 'string' || !message.text.trim() || message.text.length > 1000)) throw new Error('Enter a reason or note (up to 1,000 characters).');
      const result = onCommand(message.command, { text: message.text?.trim(), nodeId: message.nodeId, attempt: message.attempt });
      respond(result !== false, result === false ? 'This action is unavailable for the current experiment state.' : '');
    } catch (error) { respond(false, error.message || String(error)); }
    publish();
  };
  return { url: operatorMonitorUrl(origin, sessionId, key), publish, close: () => channel.close() };
}
