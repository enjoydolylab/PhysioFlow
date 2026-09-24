import test from 'node:test';
import assert from 'node:assert/strict';
import { recordTestVisit, previousTestVisit } from '../src/runtime/testNavigation.js';
const state = (node, sequence) => ({ sessionId: 'session', protocolId: 'protocol', status: 'waiting', currentNodeId: node, eventSequence: sequence, startedAtEpochMs: 100, startedAtMonotonicMs: 10, attempts: { a: 1, b: 1 }, variables: { answer: node }, outputs: {}, loopCounts: { loop: sequence }, randomState: sequence, completedNodeIds: sequence === 2 ? [] : ['a'] });
const protocol = { protocolId: 'protocol', graph: { nodes: ['a', 'b'].map(id => ({ id, component: { type: 'display.screen', version: '1' } })) } };
let id = 0;
const services = { clock: { now: () => ({ iso: '2026-09-23T00:00:00Z', epochMs: 1000, monotonicMs: 100 }) }, idFactory: () => `e${++id}` };
test('return restores variables, loop/random state while events and attempts remain monotonic', () => {
  const a = state('a', 2), b = state('b', 5);
  const history = recordTestVisit(recordTestVisit([], a, 'preview'), b, 'preview');
  const result = previousTestVisit({ history, state: b, protocol, services, mode: 'preview' });
  assert.equal(result.state.currentNodeId, 'a');
  assert.deepEqual(result.state.variables, a.variables);
  assert.deepEqual(result.state.loopCounts, a.loopCounts);
  assert.equal(result.state.randomState, 2);
  assert.equal(result.state.eventSequence, 7);
  assert.equal(result.state.attempts.a, 2);
  assert.equal(result.history.length, 1);
  assert.deepEqual(result.events.map(e => e.sequence), [6, 7]);
  assert.equal(result.events[0].payload.supersededFromSequence, 2);
  assert.equal(history.length, 2);
  assert.equal(b.currentNodeId, 'b');
});
test('formal/hosted/unknown modes and first or finished pages reject previous', () => {
  const args = { history: [state('a', 2), state('b', 5)], state: state('b', 5), protocol, services };
  for (const mode of ['formal', 'hosted', undefined]) assert.throws(() => previousTestVisit({ ...args, mode }), /only in Test Run/);
  assert.throws(() => previousTestVisit({ ...args, mode: 'preview', history: [state('a', 2)] }), /no previous/);
  assert.throws(() => previousTestVisit({ ...args, mode: 'preview', state: { ...args.state, status: 'completed' } }), /finished/);
});
test('repeated visits to the same loop node remain distinct and history cannot cross sessions', () => {
  const a = state('a', 2), a2 = state('a', 5);
  const history = recordTestVisit(recordTestVisit([], a, 'preview'), a2, 'preview');
  assert.equal(history.length, 2);
  assert.equal(recordTestVisit(history, a2, 'preview'), history);
  assert.throws(() => previousTestVisit({ history, state: { ...a2, sessionId: 'other' }, protocol, services, mode: 'preview' }), /another run/);
});

test('back navigation supersedes only matching-session response sequences without deleting raw answers', async () => {
  const { supersedeTestResponses } = await import('../src/runtime/testNavigation.js');
  const rows = [{ sessionId: 'session', eventSequence: 3, value: 5 }, { sessionId: 'session', eventSequence: 8, value: 9 }, { sessionId: 'other', eventSequence: 3, value: 7 }, { sessionId: 'session', value: 'legacy' }];
  const event = { eventType: 'test_navigation_back', sessionId: 'session', eventId: 'back1', payload: { supersededFromSequence: 2, supersededThroughSequence: 5 } };
  const result = supersedeTestResponses(rows, event);
  assert.equal(result.length, 4);
  assert.equal(result[0].supersededByEventId, 'back1');
  assert.equal(rows[0].supersededByEventId, undefined);
  assert.deepEqual(result.slice(1), rows.slice(1));
});

test('restored history rejects stale visits and invalid ranges without changing runtime or answers', () => {
  const a = state('a', 2), b = state('b', 5);
  const args = { state: { ...b, eventSequence: 8 }, protocol, services, mode: 'preview' };
  const before = structuredClone(args.state);
  for (const history of [null, {}, [a, null], [a, { ...b, sessionId: 'other' }], [{ ...a, status: 'completed' }, b], [{ ...a, eventSequence: 0 }, b], [a, { ...b, eventSequence: 2 }], [a, { ...b, eventSequence: 9 }], [a, { ...b, currentNodeId: 'a' }], [a, { ...b, attempts: { b: 2 } }]]) {
    assert.throws(() => previousTestVisit({ ...args, history }));
    assert.deepEqual(args.state, before);
  }
  // Pause, marker and other events can advance the sequence during the same visit.
  const result = previousTestVisit({ ...args, history: [a, b] });
  assert.deepEqual(result.events.map(event => event.sequence), [9, 10]);
  assert.equal(result.events[0].payload.supersededThroughSequence, 8);
});
