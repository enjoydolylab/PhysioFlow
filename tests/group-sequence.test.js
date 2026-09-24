import test from 'node:test';
import assert from 'node:assert/strict';
import { planGroupSequence, prepareGroupSequence, createGroupExecutionSnapshot, restoreGroupExecutionSnapshot } from '../src/core/groupSequence.js';

const registry = { get: () => ({ runtime: { kind: 'participant' } }) };
function fixture() {
  const ids = ['start', 'a1', 'a2', 'b1', 'b2', 'c1', 'c2', 'end'];
  return { graph: {
    nodes: ids.map(id => ({ id, component: { type: 'test', version: '1' } })),
    edges: ids.slice(1).map((id, i) => ({ id: `e${i}`, kind: 'control', source: { nodeId: ids[i] }, target: { nodeId: id } })),
    groups: ['a', 'b', 'c'].map(id => ({ id, name: id, nodeIds: [`${id}2`, `${id}1`] })),
  } };
}
test('group schedules preserve execution order within groups, visit each once and replay from seed', () => {
  const p = fixture(), original = structuredClone(p), orders = new Set();
  for (let i = 0; i < 100; i++) {
    const result = planGroupSequence(p, ['a', 'b', 'c'], `trial-${i}`, registry);
    assert.deepEqual(result, planGroupSequence(p, ['a', 'b', 'c'], `trial-${i}`, registry));
    assert.deepEqual([...result.groupOrder].sort(), ['a', 'b', 'c']);
    assert.deepEqual(result.nodeOrder, result.groupOrder.flatMap(id => [`${id}1`, `${id}2`]));
    orders.add(result.groupOrder.join(''));
  }
  assert.equal(orders.size, 6);
  assert.deepEqual(p, original);
});
test('group schedules reject gaps, overlapping membership and missing seeds', () => {
  const p = fixture();
  assert.throws(() => planGroupSequence(p, ['a', 'c'], 'seed', registry), /continuous/);
  assert.throws(() => planGroupSequence(p, ['a', 'b'], '', registry), /seed/);
  p.graph.groups[1].nodeIds.push('a1');
  assert.throws(() => planGroupSequence(p, ['a', 'b'], 'seed', registry), /overlap/);
});

test('prepared graphs execute the planned group order and preserve every internal node and source', () => {
  const source = fixture(), original = structuredClone(source);
  for (let i = 0; i < 30; i++) {
    const { protocol, plan } = prepareGroupSequence(source, ['a', 'b', 'c'], `run-${i}`, registry);
    const visits = []; let node = 'start';
    while (node !== 'end') {
      assert.ok(visits.length < 8, 'no introduced cycle');
      node = protocol.graph.edges.find(edge => edge.source.nodeId === node).target.nodeId;
      if (node !== 'end') visits.push(node);
    }
    assert.deepEqual(visits, plan.nodeOrder);
    assert.deepEqual(protocol.graph.nodes, source.graph.nodes);
    assert.deepEqual(protocol.graph.groups, source.graph.groups);
    assert.equal(protocol.graph.edges.length, source.graph.edges.length);
  }
  assert.deepEqual(source, original);
});

test('cross-group data dependencies are rejected instead of silently changing their meaning', () => {
  const source = fixture();
  source.graph.edges.push({ id: 'dependency', kind: 'data', source: { nodeId: 'a2', portId: 'value' }, target: { nodeId: 'b1', portId: 'input' } });
  assert.throws(() => prepareGroupSequence(source, ['a', 'b', 'c'], 'seed', registry), /data connections/);
});

test('stored group plans restore independently of the editor and reject mismatched execution edges', () => {
  const source = fixture();
  const saved = JSON.parse(JSON.stringify(createGroupExecutionSnapshot(source, ['a', 'b', 'c'], 'saved-seed', registry)));
  source.graph.groups.length = 0;
  const restored = restoreGroupExecutionSnapshot(saved, registry);
  assert.equal(restored.sourceProtocol.graph.groups.length, 3);
  assert.deepEqual(restored.plan, saved.plan);
  assert.deepEqual(restored.protocol.graph, saved.executionGraph);
  const badPlan = structuredClone(saved); badPlan.plan.nodeOrder.reverse();
  assert.throws(() => restoreGroupExecutionSnapshot(badPlan, registry), /does not match/);
  const badGraph = structuredClone(saved); badGraph.executionGraph.edges[0].target.nodeId = 'end';
  assert.throws(() => restoreGroupExecutionSnapshot(badGraph, registry), /does not match/);
  assert.throws(() => restoreGroupExecutionSnapshot({ ...saved, schemaVersion: 'future' }, registry), /Unsupported/);
});
