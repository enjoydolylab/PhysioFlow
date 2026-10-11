import test from 'node:test';
import assert from 'node:assert/strict';
import {protocolSequence,moveSequenceStep} from '../src/composer/sequenceModel.js';
const fixture = () => ({audit:{},graph:{entryNodeId:'start',nodes:['start','a','b','end'].map(id => ({id,component:{type:id==='start'?'core.start':id==='end'?'core.end':'display.screen'}})),edges:[['start','a'],['a','b'],['b','end']].map(([source,target],i) => ({id:`edge-${i}`,kind:'control',source:{nodeId:source,portId:`out-${source}`},target:{nodeId:target,portId:`in-${target}`}}))}});
test('sequence refuses branches, cycles and detached nodes rather than hiding them', () => {
  assert.deepEqual(protocolSequence(fixture()).map(n=>n.id),['start','a','b','end']);
  const branch = fixture(); branch.graph.edges.push({...branch.graph.edges[1],id:'branch',target:{nodeId:'end',portId:'in-end'}});
  assert.equal(protocolSequence(branch),null);
  const detached = fixture(); detached.graph.nodes.push({id:'detached',component:{type:'display.screen'}}); assert.equal(protocolSequence(detached),null);
  const cycle = fixture(); cycle.graph.edges.at(-1).target.nodeId='a'; assert.equal(protocolSequence(cycle),null);
});
test('reorder preserves node configurations, edge identities and each node port', () => {
  const source=fixture(), original=structuredClone(source); source.graph.nodes[1].config={durationMs:700};
  const next=moveSequenceStep(source,'a',1);
  assert.deepEqual(protocolSequence(next).map(n=>n.id),['start','b','a','end']);
  assert.equal(next.graph.nodes[1].config.durationMs,700);
  assert.deepEqual(next.graph.edges.map(e=>e.id),original.graph.edges.map(e=>e.id));
  for(const edge of next.graph.edges) { assert.equal(edge.source.portId,`out-${edge.source.nodeId}`);assert.equal(edge.target.portId,`in-${edge.target.nodeId}`); }
  assert.deepEqual(protocolSequence(source).map(n=>n.id),['start','a','b','end']);
  assert.deepEqual(protocolSequence(moveSequenceStep(next,'a',-1)).map(n=>n.id),['start','a','b','end']);
});
test('reorder rejects a future data dependency and moving protocol boundaries', () => {
  const source=fixture(); source.graph.edges.push({id:'data',kind:'data',source:{nodeId:'a',portId:'value'},target:{nodeId:'b',portId:'input'}});
  assert.throws(()=>moveSequenceStep(source,'a',1),/data source/);
  assert.throws(()=>moveSequenceStep(source,'start',1),/Start and end/);
  assert.deepEqual(protocolSequence(source).map(n=>n.id),['start','a','b','end']);
});

test('frozen sequences cannot be changed', () => {
  const source=fixture(); source.version={status:'frozen'};
  assert.throws(()=>moveSequenceStep(source,'a',1),/editable version/);
});
