// Runtime device-sampling support for PhysioFlow. Drives a DeviceConnectorSession at a
// channel's declared sample rate, emitting device_sample_received events into the buffer.

export function resolveDeviceConnector(protocol, node) {
  const id = node?.config?.deviceConnectorId;
  if (!id) return null;
  const version = node.config?.deviceConnectorVersion;
  const connector = (protocol.deviceConnectors || []).find(item => item.connectorId === id && (!version || item.version === version));
  return connector ? { connector, node } : null;
}

export function maxInputSampleRateHz(connector) {
  const rates = (connector?.channels || [])
    .filter(channel => channel.direction === 'input')
    .map(channel => Number(channel.sampleRateHz))
    .filter(Number.isFinite);
  return rates.length ? Math.max(...rates) : 10;
}

// Drift-corrected recursive setTimeout sampler (setInterval would drift when read() is
// slow; requestAnimationFrame is capped ~60 Hz and cannot hit the 100 Hz simulated signal).
export function createDeviceSampler({ session, channels, sampleRateHz = 10, onError }) {
  const batch = typeof session.adapter?.readBatch === 'function';
  const periodMs = batch ? 250 : Math.max(1, Math.round(1000 / Math.max(1, Number(sampleRateHz))));
  let timer = null;
  let running = false;
  let pending = Promise.resolve();
  const tick = async () => {
    const started = performance.now();
    if (batch) await session.readBatch().catch(error => { running = false; onError?.('batch', error); });
    else await Promise.all(channels.map(channel => session.read(channel.id).catch(error => { running = false; onError?.(channel.id, error); })));
    if (!running) return;
    const elapsed = performance.now() - started;
    timer = setTimeout(() => { pending = tick(); }, Math.max(0, periodMs - elapsed));
  };
  return {
    start() { if (running) return; running = true; pending = tick(); },
    stop() { running = false; if (timer) { clearTimeout(timer); timer = null; } return pending; },
    isRunning: () => running,
  };
}
