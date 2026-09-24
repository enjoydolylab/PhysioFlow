import test from 'node:test';
import assert from 'node:assert/strict';
import { computeWindows } from '../src/analysis/windowData.js';
test('back navigation invalidates old windows and closes abandoned visits before later re-entry', () => {
  const protocol = { graph: { nodes: ['a', 'b'].map(id => ({ id, label: id, component: { type: 'display.screen' }, config: { isAnalysisWindow: true } })) } };
  const event = (sequence, eventType, nodeId, time, payload = {}) => ({ eventId: `e${sequence}`, sequence, eventType, nodeId, sessionId: 's', elapsedMonotonicMs: time, payload });
  const events = [event(1, 'component_entered', 'a', 0), event(2, 'component_completed', 'a', 10), event(3, 'component_entered', 'b', 10), event(4, 'test_navigation_back', 'a', 20, { supersededFromSequence: 1, supersededThroughSequence: 3 }), event(5, 'component_entered', 'a', 20), event(6, 'component_completed', 'a', 30), event(7, 'component_entered', 'b', 30), event(8, 'component_completed', 'b', 50)];
  const windows = computeWindows(events, protocol);
  assert.deepEqual(windows.map(w => w.validity), ['invalid', 'invalid', 'valid', 'valid']);
  assert.equal(windows[1].endEventId, 'e4');
  assert.equal(windows[3].durationMs, 20);
  assert.equal(windows[0].reason, 'Superseded by test navigation');
});
