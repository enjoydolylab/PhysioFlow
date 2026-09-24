import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntimeReplay } from '../src/runtime/replayRuntime.js';
test('replay rolls back logical state at navigation and keeps raw frames intact', () => {
  const protocol = { protocolId: 'p', graph: { nodes: [] }, variables: [{ name: 'answer', defaultValue: 0 }] };
  const e = (sequence, eventType, nodeId, payload = {}) => ({ sequence, eventType, nodeId, payload, protocolId: 'p', sessionId: 's' });
  const events = [e(1,'protocol_started',null),e(2,'component_entered','a',{attempt:1}),e(3,'component_completed','a',{variables:{answer:3},outputs:{answer:3}}),e(4,'component_entered','b',{attempt:1}),e(5,'test_navigation_back','a',{supersededFromSequence:2,supersededThroughSequence:4}),e(6,'component_entered','a',{attempt:2}),e(7,'component_completed','a',{variables:{answer:8},outputs:{answer:8}})];
  const replay = createRuntimeReplay(protocol, events);
  assert.equal(replay.frames[4].state.variables.answer, 3);
  assert.equal(replay.frames[5].state.variables.answer, 0);
  assert.deepEqual(replay.frames[5].state.completedNodeIds, []);
  assert.equal(replay.finalState.variables.answer, 8);
  assert.deepEqual(replay.finalState.completedNodeIds, ['a']);
  assert.equal(replay.finalState.attempts.a, 2);
  assert.throws(()=>createRuntimeReplay(protocol,[...events.slice(0,4),e(5,'test_navigation_back','a',{supersededFromSequence:4,supersededThroughSequence:4})]),/invalid test navigation/);
});
