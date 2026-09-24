import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeline } from '../src/analysis/timelineData.js';
test('timeline marks replaced visits and pairs the new visit with its own completion', () => {
  const e = (sequence, eventType, nodeId, elapsedMonotonicMs, payload) => ({ eventId: `e${sequence}`, sessionId: 's', sequence, eventType, nodeId, elapsedMonotonicMs, payload });
  const events = [e(1,'component_entered','a',0),e(2,'component_completed','a',10),e(3,'component_entered','b',10),e(4,'test_navigation_back','a',20,{supersededFromSequence:1,supersededThroughSequence:3}),e(5,'component_entered','a',20),e(6,'component_completed','a',30),e(7,'component_entered','b',30),e(8,'component_completed','b',50)];
  const original = structuredClone(events);
  const { items } = buildTimeline(events, {});
  assert.deepEqual(items.map(i=>[i.stepId,i.startMs,i.endMs,i.status]),[['a',0,10,'superseded'],['b',10,20,'superseded'],['a',20,30,'completed'],['b',30,50,'completed']]);
  assert.deepEqual(events, original);
});
