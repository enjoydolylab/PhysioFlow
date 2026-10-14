import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { toPhysioDBEvent } from './physioDBMapping.js';

// Canonical JSON makes an identical saved design retain its fingerprint.
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
export function createPhysioDBRunMapping({ sessionId, protocol }) {
  if (typeof sessionId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(sessionId)) throw new Error('A valid run session ID is required');
  if (!protocol?.protocolId || !Number.isSafeInteger(protocol.version?.number) || protocol.version.number < 1) throw new Error('A saved protocol version is required');
  const snapshot = structuredClone(protocol);
  const protocolHash = bytesToHex(sha256(new TextEncoder().encode(JSON.stringify(canonical(snapshot)))));
  const provenance = Object.freeze({ schema_version: 1, run_id: sessionId, protocol_id: protocol.protocolId, protocol_version: protocol.version.number, protocol_sha256: protocolHash });
  return {
    provenance,
    // Store snapshots locally with the run; large graphs do not belong in DB metadata.
    protocolSnapshot: snapshot,
    stream({ name, fields, metadata = {} }) {
      if (typeof name !== 'string' || !name.trim() || !Array.isArray(fields) || !fields.length) throw new Error('Stream name and fields are required');
      const streamName = `${name} · ${sessionId}`;
      if (streamName.length > 200) throw new Error('Run stream name exceeds the DB limit');
      return { name: streamName, fields: structuredClone(fields), metadata: { ...structuredClone(metadata), physioflow: { ...provenance } } };
    },
    event(event) {
      if (event?.sessionId !== sessionId || event.protocolId !== provenance.protocol_id || event.protocolVersion !== provenance.protocol_version) throw new Error('Event does not belong to this run and design version');
      const mapped = toPhysioDBEvent(event);
      mapped.data.physioflow = { ...provenance, event_id: event.eventId, sequence: event.sequence, node_id: event.nodeId ?? null, attempt: event.payload?.attempt ?? null, component_type: event.componentType ?? null, component_version: event.componentVersion ?? null };
      return mapped;
    },
  };
}
