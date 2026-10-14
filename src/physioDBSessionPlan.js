export function buildPhysioDBSessionPlan(session, destination) {
  if (session?.status !== 'completed' || !session.protocol_snapshot || !Array.isArray(session.events) || !session.events.length) throw new Error('A completed graph session with its design snapshot is required');
  const protocol = session.protocol_snapshot;
  const events = structuredClone(session.events);
  const responses = session.responses || [];
  for (const response of responses) {
    if (!response.responseId || !response.timestampIso) throw new Error('Response identity and timestamp are required');
    events.push({ eventId: `response:${response.responseId}`, eventType: 'physioflow.response_recorded', sessionId: session.session_id, protocolId: protocol.protocolId, protocolVersion: protocol.version.number, sequence: events.length + 1, timestampIso: response.timestampIso, nodeId: response.nodeId ?? null, componentType: response.componentType ?? null, payload: { response: structuredClone(response) } });
  }
  return { sessionId: session.session_id, protocol: structuredClone(protocol), destination: { ...destination }, streams: [], events };
}
