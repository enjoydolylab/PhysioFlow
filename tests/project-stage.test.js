import test from 'node:test';
import assert from 'node:assert/strict';
import { createProtocolGraph, createCoreComponentRegistry, insertNodeOnControlEdge, freezeProtocolGraph } from '../src/core/index.js';
import { projectStage } from '../src/projectStage.js';
import { assessProtocolReadiness } from '../src/readiness.js';

const storageInfo = { selected: true, permission: 'granted' };
function fixture() {
  const protocol = createProtocolGraph();
  const component = createCoreComponentRegistry().get('timing.wait');
  return insertNodeOnControlEdge(protocol, protocol.graph.edges[0].id, component.type, {
    config: { ...component.defaultConfig, isAnalysisWindow: true },
  }).protocol;
}
const completed = (p, run_mode = 'preview') => ({ protocol_id: p.protocolId, status: 'completed', run_mode });
test('draft project is preparing with a reason', () => {
  const p = fixture();
  const result = projectStage(p, { storageInfo });
  assert.equal(result.stage, 'preparing');
  assert.ok(result.reason?.label);
  assert.equal(result.sessions, 0);
});
test('frozen blocked project reports its first error before warnings', async () => {
  const p = await freezeProtocolGraph(fixture(), createCoreComponentRegistry());
  const result = projectStage(p);
  assert.equal(result.stage, 'preparing');
  const first = assessProtocolReadiness(p).items.find(item => !item.passed && item.severity === 'error');
  assert.deepEqual(result.reason, { label: first.label, detail: first.detail });
});
test('frozen ready project has no reason', async () => {
  const p = await freezeProtocolGraph(fixture(), createCoreComponentRegistry());
  const result = projectStage(p, { sessions: [completed(p)], storageInfo });
  assert.equal(assessProtocolReadiness(p, { sessions: [completed(p)], storageInfo }).status, 'ready');
  assert.equal(result.stage, 'ready');
  assert.equal(result.reason, null);
});
test('completed formal session makes a project recorded', () => {
  const p = fixture();
  const result = projectStage(p, { sessions: [completed(p, 'formal'), { ...completed(p, 'formal'), protocol_id: 'other' }] });
  assert.equal(result.stage, 'recorded');
  assert.equal(result.reason, null);
  assert.equal(result.sessions, 1);
});


test('completed preview counts as a record while the project remains ready', async () => {
 const p = await freezeProtocolGraph(fixture(), createCoreComponentRegistry());
 const result = projectStage(p, { sessions: [completed(p)], storageInfo });
 assert.equal(result.stage, 'ready');
 assert.equal(result.sessions, 1);
 assert.equal(result.reason, null);
});
