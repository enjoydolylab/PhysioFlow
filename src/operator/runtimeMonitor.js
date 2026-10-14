export const OPERATOR_PROTOCOL = 'physioflow.operator.v1';
export function operatorMonitorUrl(origin, sessionId, key) {
  const url = new URL('/operator', origin); url.hash = new URLSearchParams({ session: sessionId, key }).toString(); return url.href;
}
export function openRuntimeMonitor({ sessionId, getSnapshot, onCommand, origin = globalThis.location?.origin, channelFactory = name => new globalThis.BroadcastChannel(name), key = globalThis.crypto.randomUUID() }) {
  const channel = channelFactory(`${OPERATOR_PROTOCOL}:${sessionId}:${key}`);
  let revision = 0;
  const results = new Map();
  const publish = () => channel.postMessage({ protocol: OPERATOR_PROTOCOL, type: 'snapshot', revision: ++revision, sentAt: Date.now(), ...getSnapshot() });
  channel.onmessage = event => {
    const message = event.data;
    if (message?.protocol === OPERATOR_PROTOCOL && message.type === 'command-status' && typeof message.id === 'string') {
      const result = results.get(message.id);
      channel.postMessage(result || { protocol: OPERATOR_PROTOCOL, type: 'command-status-result', id: message.id, found: false });
      publish(); return;
    }
    if (message?.protocol !== OPERATOR_PROTOCOL || message.type !== 'command' || !['pause', 'resume', 'retry', 'skip', 'note'].includes(message.command) || typeof message.id !== 'string' || message.id.length > 100) return;
    if (results.has(message.id)) { channel.postMessage(results.get(message.id)); return; }
    if (!Number.isFinite(message.sentAt) || Math.abs(Date.now() - message.sentAt) > 5000) return;
    const respond = (ok, error = '') => {
      const result = { protocol: OPERATOR_PROTOCOL, type: 'command-result', id: message.id, ok, error };
      results.set(message.id, result); if (results.size > 100) results.delete(results.keys().next().value);
      channel.postMessage(result);
    };
    try {
      if (['retry', 'skip', 'note'].includes(message.command) && (typeof message.text !== 'string' || !message.text.trim() || message.text.length > 1000)) throw new Error('Enter a reason or note (up to 1,000 characters).');
      const current = getSnapshot();
      if (Object.hasOwn(current, 'nodeId') && (message.nodeId !== current.nodeId || message.attempt !== (current.attempt || 0))) throw new Error('The experiment step has changed. Check the current step before trying again.');
      const result = onCommand(message.command, { text: message.text?.trim(), nodeId: message.nodeId, attempt: message.attempt });
      respond(result !== false, result === false ? 'This action is unavailable for the current experiment state.' : '');
    } catch (error) { respond(false, error.message || String(error)); }
    publish();
  };
  return { url: operatorMonitorUrl(origin, sessionId, key), publish, close: () => channel.close() };
}
