import test from 'node:test';
import assert from 'node:assert/strict';
import { createPhysioDBRunMapping } from '../src/physioDBRunMapping.js';
const protocol = { protocolId: 'p1', version: { number: 2 }, graph: { nodes: [{ id: 'n1', component: { type: 'questionnaire' } }], edges: [] } };
const event = { sessionId: 's1', protocolId: 'p1', protocolVersion: 2, eventId: 'e1', sequence: 1, eventType: 'component_completed', timestampIso: '2026-10-14T01:00:00Z', nodeId: 'n1', payload: { attempt: 2, outputs: { answer: 7 } } };
test('repeat runs isolate stream identity while preserving design fingerprint and answers', () => {
  const a = createPhysioDBRunMapping({ sessionId: 's1', protocol });
  const b = createPhysioDBRunMapping({ sessionId: 's2', protocol });
  const stream = { name: 'EEG', fields: [{ name: 'C3', type: 'float', unit: 'uV' }] };
  assert.notEqual(a.stream(stream).name, b.stream(stream).name);
  assert.equal(a.provenance.protocol_sha256, b.provenance.protocol_sha256);
  const mapped = a.event(event);
  assert.equal(mapped.data.physioflow.attempt, 2);
  assert.deepEqual(mapped.data.payload.outputs, { answer: 7 });
  assert.throws(() => b.event(event), /does not belong/);
  assert.throws(() => a.event({ ...event, protocolVersion: 3 }), /does not belong/);
});
test('snapshot is detached, canonical, and detects changed content with the same version', () => {
  const a = createPhysioDBRunMapping({ sessionId: 's1', protocol });
  const reordered = { graph: protocol.graph, version: protocol.version, protocolId: protocol.protocolId };
  assert.equal(a.provenance.protocol_sha256, createPhysioDBRunMapping({ sessionId: 's1', protocol: reordered }).provenance.protocol_sha256);
  const changed = structuredClone(protocol); changed.graph.nodes[0].id = 'different';
  assert.notEqual(a.provenance.protocol_sha256, createPhysioDBRunMapping({ sessionId: 's1', protocol: changed }).provenance.protocol_sha256);
  a.protocolSnapshot.graph.nodes[0].id = 'local'; assert.equal(protocol.graph.nodes[0].id, 'n1');
  assert.throws(() => createPhysioDBRunMapping({ sessionId: 's1', protocol: { ...protocol, version: { number: null } } }), /saved protocol/);
});
