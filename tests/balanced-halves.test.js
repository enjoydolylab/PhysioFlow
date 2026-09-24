import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveStimulusAssignments } from '../src/core/stimulusRandomization.js';

function fixture() {
  const assets = Array.from({ length: 40 }, (_, i) => ({ id: `a${i}`, category: `c${Math.floor(i / 5)}` }));
  return { assets, stimulusPools: [{ id: 'pool', randomizationMode: 'balanced-halves', assetIds: assets.map(a => a.id) }], graph: { nodes: assets.map((a, i) => ({ id: `n${i}`, component: { type: 'display.media' }, config: { stimulusPoolId: 'pool' }, metadata: { half: i < 20 ? 1 : 2, trialIndex: i + 1 } })) } };
}
test('balanced halves preserve every asset and categorical 2/3 allocation across session seeds', () => {
  const p = fixture();
  for (let seed = 0; seed < 100; seed++) {
    const history = [], schedule = [], counts = [{}, {}];
    for (const [index, node] of p.graph.nodes.entries()) {
      const a = resolveStimulusAssignments(p, seed, history).get(node.id);
      assert.deepEqual(resolveStimulusAssignments(p, seed, [...history]).get(node.id), a, 'retry and restored history preserve assignment');
      schedule.push(a.assetId);
      const half = counts[index < 20 ? 0 : 1]; half[a.category] = (half[a.category] || 0) + 1;
      history.push(node.id);
    }
    assert.equal(new Set(schedule).size, 40);
    for (const half of counts) { assert.equal(Object.keys(half).length, 8); for (const count of Object.values(half)) assert.ok(count === 2 || count === 3); }
  }
});
test('invalid balanced-half metadata and missing category fail explicitly', () => {
  const p = fixture(); delete p.graph.nodes[0].metadata.half;
  assert.throws(() => resolveStimulusAssignments(p, 'seed'), /metadata.half/);
  const q = fixture(); delete q.assets[0].category;
  assert.throws(() => resolveStimulusAssignments(q, 'seed'), /category/);
});
