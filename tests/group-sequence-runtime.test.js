import test from 'node:test';
import assert from 'node:assert/strict';
import { createProtocolGraph, createCoreComponentRegistry, insertNodeOnControlEdge, validateProtocolGraphConfiguration } from '../src/core/index.js';
import { prepareGroupSequence } from '../src/core/groupSequence.js';
import { createRuntimeState, startRuntime, completeCurrentNode, pauseRuntime, resumeRuntime, snapshotRuntime, restoreRuntime } from '../src/runtime/index.js';

test('prepared group sequence executes through the runtime and survives a serialized pause checkpoint', () => {
  const registry = createCoreComponentRegistry();
  let source = createProtocolGraph();
  const ids = [];
  for (const label of ['A quiet', 'A response', 'B quiet', 'B response', 'C quiet', 'C response']) {
    const edge = source.graph.edges.find(item => source.graph.nodes.find(node => node.id === item.target.nodeId)?.component.type === 'core.end');
    const added = insertNodeOnControlEdge(source, edge.id, 'display.screen', { label, config: registry.get('display.screen').defaultConfig });
    source = added.protocol; ids.push(added.node.id);
  }
  source.graph.groups = ['A', 'B', 'C'].map((id, i) => ({ id, name: id, kind: 'container', nodeIds: ids.slice(i * 2, i * 2 + 2), parameters: [], metadata: {} }));
  const original = structuredClone(source);
  for (const seed of ['acceptance-1', 'acceptance-2', 'acceptance-3']) {
    const prepared = prepareGroupSequence(source, ['A', 'B', 'C'], seed, registry);
    assert.equal(validateProtocolGraphConfiguration(prepared.protocol, registry).valid, true);
    let tick = 0;
    const services = { idFactory: prefix => prefix + ++tick, clock: { now: () => ({ epochMs: 1000 + ++tick, monotonicMs: tick, iso: new Date(1000 + tick).toISOString() }) } };
    let protocol = prepared.protocol;
    let step = startRuntime(createRuntimeState(protocol, { sessionId: seed, startedAtEpochMs: 1000, startedAtMonotonicMs: 0, randomSeed: seed }), protocol, registry, services);
    let state = step.state; const events = [...step.events], visits = [];
    while (state.status === 'waiting' && visits.length < 10) {
      if (visits.length === 3) {
        step = pauseRuntime(state, protocol, services); events.push(...step.events);
        const checkpoint = JSON.parse(JSON.stringify({ source, executionProtocol: protocol, plan: prepared.plan, runtime: snapshotRuntime(step.state) }));
        protocol = checkpoint.executionProtocol;
        state = restoreRuntime(checkpoint.runtime, protocol);
        assert.deepEqual(checkpoint.plan, prepared.plan);
        step = resumeRuntime(state, protocol, services); state = step.state; events.push(...step.events);
      }
      visits.push(state.currentNodeId);
      step = completeCurrentNode(state, protocol, registry, services, {}); state = step.state; events.push(...step.events);
    }
    assert.equal(state.status, 'completed');
    assert.deepEqual(visits, prepared.plan.nodeOrder);
    assert.deepEqual(state.completedNodeIds, prepared.plan.nodeOrder);
    assert.ok(events.every((event, i) => event.sequence === i + 1));
    assert.equal(events.filter(event => event.eventType === 'session_paused').length, 1);
    assert.equal(events.filter(event => event.eventType === 'session_resumed').length, 1);
  }
  assert.deepEqual(source, original);
});

test('randomized group exports retain the original frozen hash and a separately verifiable execution plan', async () => {
  const { freezeProtocolGraph, hashProtocolGraph } = await import('../src/core/index.js');
  const { createGroupExecutionSnapshot, restoreGroupExecutionSnapshot } = await import('../src/core/groupSequence.js');
  const { buildGraphSessionFiles } = await import('../src/data/graphExport.js');
  const registry = createCoreComponentRegistry();
  let source = createProtocolGraph();
  const ids = [];
  for (const label of ['first', 'second']) {
    const edge = source.graph.edges.find(item => source.graph.nodes.find(node => node.id === item.target.nodeId)?.component.type === 'core.end');
    const added = insertNodeOnControlEdge(source, edge.id, 'display.screen', { label, config: registry.get('display.screen').defaultConfig });
    source = added.protocol; ids.push(added.node.id);
  }
  source.graph.groups = ids.map((nodeId, i) => ({ id: `g${i}`, name: `Group ${i}`, kind: 'container', nodeIds: [nodeId], parameters: [], metadata: {} }));
  source.groupRandomization = { enabled: true, groupIds: ['g0', 'g1'] };
  const frozen = await freezeProtocolGraph(source, registry);
  const snapshot = createGroupExecutionSnapshot(frozen, ['g0', 'g1'], 'export-check', registry);
  const execution = restoreGroupExecutionSnapshot(snapshot, registry).protocol;
  const session = { session_id: 'frozen-export', participant_id: 'QA', protocol_hash: frozen.freeze.configHash, group_execution_snapshot: snapshot };
  for (const protocol of [frozen, execution]) {
    const files = buildGraphSessionFiles(session, protocol, [], []);
    const exportedSource = JSON.parse(files['protocol_snapshot.json']);
    assert.equal(await hashProtocolGraph(exportedSource), frozen.freeze.configHash);
    assert.deepEqual(exportedSource, frozen);
    assert.deepEqual(JSON.parse(files['group_execution_snapshot.json']), snapshot);
    assert.equal(JSON.parse(files['session.json']).protocol_hash, frozen.freeze.configHash);
  }
});
