import test from 'node:test';
import assert from 'node:assert/strict';
import { createProtocolGraph, createCoreComponentRegistry, insertNodeOnControlEdge, validateProtocolGraphConfiguration } from '../src/core/index.js';
import { inspectRepeatSegment, wrapRepeatSegment } from '../src/core/repeatSegment.js';
import { createRuntimeState, startRuntime, completeCurrentNode } from '../src/runtime/index.js';

const registry = createCoreComponentRegistry();
function fixture() {
  let protocol = createProtocolGraph();
  const ids = [];
  for (const label of ['Stimulus', 'Response', 'Rest']) {
    const edge = protocol.graph.edges.find(edge => protocol.graph.nodes.find(node => node.id === edge.target.nodeId)?.component.type === 'core.end');
    const result = insertNodeOnControlEdge(protocol, edge.id, 'display.screen', { label, config: registry.get('display.screen').defaultConfig });
    protocol = result.protocol;
    ids.push(result.node.id);
  }
  return { protocol, ids };
}

test('repeat command preserves source and executes the chosen sequence exactly three times', () => {
  const { protocol, ids } = fixture();
  const original = JSON.stringify(protocol);
  const result = wrapRepeatSegment(protocol, [ids[1], ids[0]], 3, registry);
  assert.equal(JSON.stringify(protocol), original);
  assert.deepEqual(result.ordered, ids.slice(0, 2));
  assert.equal(validateProtocolGraphConfiguration(result.protocol, registry).valid, true);
  let tick = 0;
  const services = { idFactory: prefix => prefix + ++tick, clock: { now: () => ({ epochMs: 1000 + ++tick, monotonicMs: tick, iso: new Date(1000 + tick).toISOString() }) } };
  let runtime = startRuntime(createRuntimeState(result.protocol, { sessionId: 'repeat', startedAtEpochMs: 1000, startedAtMonotonicMs: 0 }), result.protocol, registry, services).state;
  const visits = [];
  while (runtime.status === 'waiting' && visits.length < 20) {
    visits.push(runtime.currentNodeId);
    runtime = completeCurrentNode(runtime, result.protocol, registry, services, {}).state;
  }
  assert.equal(runtime.status, 'completed');
  assert.deepEqual(visits, [ids[0], ids[1], ids[0], ids[1], ids[0], ids[1], ids[2]]);
});

test('reject disconnected selections, nested repeating paths and invalid counts without mutation', () => {
  const { protocol, ids } = fixture();
  assert.equal(inspectRepeatSegment(protocol, [ids[0], ids[2]], registry).valid, false);
  for (const count of [0, 1.5, NaN, 10001]) assert.throws(() => wrapRepeatSegment(protocol, [ids[0]], count, registry), /whole number/);
  const wrapped = wrapRepeatSegment(protocol, ids.slice(0, 2), 2, registry).protocol;
  assert.match(inspectRepeatSegment(wrapped, [ids[0]], registry).message, /already belong/);
  const frozen = structuredClone(protocol);
  frozen.version.status = 'frozen';
  assert.throws(() => wrapRepeatSegment(frozen, [ids[0]], 3, registry), /draft/);
});
