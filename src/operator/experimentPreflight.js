/** Required connectors must be resolvable, receiving, and recording where supported. */
export function experimentPreflight(protocol, checks, connections, { formal = false } = {}) {
  const ids = [...new Set(protocol.graph.nodes.filter(n => n.config?.deviceConnectorId && n.config.deviceRequired !== false).map(n => n.config.deviceConnectorId))];
  return ids.map(connectorId => {
    const connector = protocol.deviceConnectors?.find(c => c.connectorId === connectorId);
    const connection = connections.find(c => c.session.connector.connectorId === connectorId);
    const signals = checks.filter(c => c.connectorId === connectorId && c.required);
    const descriptor = connection?.session.deviceDescriptor;
    const synthetic = connector?.transport === 'simulated' || connector?.brainflow?.boardId < 0 || descriptor?.boardId < 0;
    let reason = !connector ? 'Device connector is missing.' : formal && synthetic ? 'Simulated devices cannot start a formal experiment. Select real hardware or use a test run.' : connection?.session.status !== 'connected' ? 'Connect the required device and check signals.' : !signals.length || signals.some(c => !c.ready) ? 'Wait for fresh, changing samples on every required channel before starting.' : '';
    if (!reason && connector.connectorId === 'org.physioflow.brainflow') {
      const rates = connector.channels.filter(c => c.direction === 'input').map(c => c.sampleRateHz);
      if (!Number.isFinite(descriptor?.sampleRateHz) || rates.some(rate => rate !== descriptor.sampleRateHz)) reason = 'Device sampling rate does not match the protocol. Import the connector again.';
      else if (formal && descriptor.recordingActive !== true) reason = 'Raw recording is not confirmed. Check the acquisition agent before starting.';
    }
    return { connectorId, ready: !reason, reason, synthetic, channels: signals.length, sampleRateHz: descriptor?.sampleRateHz || null, recordingActive: descriptor?.recordingActive === true };
  });
}
