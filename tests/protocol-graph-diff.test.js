import test from 'node:test';
import assert from 'node:assert/strict';
import { protocolGraphDiff } from '../src/core/protocolGraphDiff.js';

test('import comparison detects configuration outside the graph and future fields', () => {
  const before = { graph: { nodes: [] }, stimulusPools: [], deviceConnectors: [], participantUi: { theme: 'light' } };
  for (const [key, value] of Object.entries({ stimulusPools: [{ id: 'pool' }], deviceConnectors: [{ id: 'sensor' }], participantUi: { theme: 'dark' }, customExtension: { enabled: true } })) {
    assert.deepEqual(protocolGraphDiff(before, { ...before, [key]: value }), { identical: false, changes: [`${key}: configuration changed`] });
  }
});
test('import comparison ignores version bookkeeping and object key order, but preserves array order', () => {
  const before = { protocolId: 'old', version: { number: 1 }, audit: {}, graph: { a: 1, b: [1, 2] } };
  const after = { protocolId: 'new', version: { number: 2 }, audit: { updatedAt: 'later' }, graph: { b: [1, 2], a: 1 } };
  assert.equal(protocolGraphDiff(before, after).identical, true);
  after.graph.b.reverse();
  assert.equal(protocolGraphDiff(before, after).identical, false);
});
