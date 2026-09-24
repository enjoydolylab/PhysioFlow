import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRuntimeEvent, createEventSchemaRegistry } from '../src/data/eventSchemaRegistry.js';
const event = { schemaVersion: '1.0.0', eventId: 'back', eventType: 'test_navigation_back', sequence: 5, sessionId: 's', protocolId: 'p', timestampEpochMs: 100, elapsedMonotonicMs: 10, payload: { fromNodeId: 'b', supersededFromSequence: 2, supersededThroughSequence: 4 } };
test('navigation schema accepts a prior range and rejects incomplete, future and inverted ranges', () => {
  const registry = createEventSchemaRegistry();
  assert.equal(validateRuntimeEvent(event, registry).valid, true);
  for (const payload of [{}, { ...event.payload, supersededFromSequence: 0 }, { ...event.payload, supersededFromSequence: 6 }, { ...event.payload, supersededThroughSequence: 5 }, { ...event.payload, supersededThroughSequence: 3 }]) {
    assert.equal(validateRuntimeEvent({ ...event, payload }, registry).valid, false);
  }
});
