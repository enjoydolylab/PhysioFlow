import test from 'node:test';
import assert from 'node:assert/strict';
import { applyGroupWaitDuration } from '../src/core/sharedNodeEdits.js';
const fixture = () => ({ graph: { groups: [{ id: 'g', nodeIds: ['a', 'b'] }], nodes: ['a', 'b', 'c'].map((id, i) => ({ id, component: { type: 'timing.wait' }, config: { durationMs: i * 1000, content: id } })) } });
test('group wait duration preserves zero, content and out-of-group waits', () => {
  const p = fixture(), original = structuredClone(p);
  const result = applyGroupWaitDuration(p, 'a');
  assert.equal(result.count, 1);
  assert.deepEqual(result.protocol.graph.nodes[1].config, { durationMs: 0, content: 'b' });
  assert.deepEqual(result.protocol.graph.nodes[2], p.graph.nodes[2]);
  assert.deepEqual(p, original);
  assert.throws(() => applyGroupWaitDuration(p, 'a', { targetNodeIds: ['c'] }), /incompatible/);
});
test('invalid duration and frozen protocol cannot be batch modified', () => {
  const p = fixture(); p.graph.nodes[0].config.durationMs = NaN;
  assert.throws(() => applyGroupWaitDuration(p, 'a'), /finite/);
  assert.throws(() => applyGroupWaitDuration({ ...fixture(), version: { status: 'frozen' } }, 'a'), /Frozen/);
});
