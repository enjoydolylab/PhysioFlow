import test from 'node:test';
import assert from 'node:assert/strict';
import { complexGroupFixture } from './fixtures/complex-groups.js';
import { createCoreComponentRegistry, freezeProtocolGraph, hashProtocolGraph } from '../src/core/index.js';
import { createGroupExecutionSnapshot, restoreGroupExecutionSnapshot, prepareGroupSequence } from '../src/core/groupSequence.js';
import { createRuntimeState, startRuntime, completeCurrentNode, pauseRuntime, resumeRuntime, snapshotRuntime, restoreRuntime } from '../src/runtime/index.js';

const registry = createCoreComponentRegistry();
test('nested loops and random branches move intact, execute bounded counts, and replay after checkpoint recovery', async () => {
  const source = await freezeProtocolGraph(complexGroupFixture(),registry);
  const original = structuredClone(source), orders = new Set();
  for(let i=0;i<20;i++) {
    const seed=`complex-${i}`;
    const snapshot=createGroupExecutionSnapshot(source,source.groupRandomization.groupIds,seed,registry);
    const {protocol,plan}=restoreGroupExecutionSnapshot(JSON.parse(JSON.stringify(snapshot)),registry);
    orders.add(plan.groupOrder.join(','));
    const execute = recover => {
      let n=0;const services={idFactory:p=>p+ ++n,clock:{now:()=>({epochMs:1000+ ++n,monotonicMs:n,iso:new Date(1000+n).toISOString()})}};
      let {state}=startRuntime(createRuntimeState(protocol,{sessionId:seed,randomSeed:seed,startedAtEpochMs:1000,startedAtMonotonicMs:0}),protocol,registry,services);
      const visits=[];
      while(state.status==='waiting' && visits.length<30) {
        if(recover && visits.length===3) {
          state=pauseRuntime(state,protocol,services).state;
          state=restoreRuntime(JSON.parse(JSON.stringify(snapshotRuntime(state))),protocol);
          state=resumeRuntime(state,protocol,services).state;
        }
        visits.push(state.currentNodeId);
        state=completeCurrentNode(state,protocol,registry,services,{}).state;
      }
      assert.equal(state.status,'completed');
      return visits;
    };
    const visits=execute(false);assert.deepEqual(execute(true),visits);
    assert.equal(visits.filter(id=>['left','right'].includes(id)).length,6);
    assert.equal(visits.filter(id=>id==='other').length,2);
    assert.equal(visits.filter(id=>id==='last').length,1);
    const owners=visits.map(id=>source.graph.groups.find(g=>g.nodeIds.includes(id)).id);
    assert.deepEqual(owners.filter((id,index)=>index===0||owners[index-1]!==id),plan.groupOrder);
    const owner=new Map(source.graph.groups.flatMap(g=>g.nodeIds.map(id=>[id,g.id])));
    const internal=edges=>edges.filter(e=>owner.has(e.source.nodeId)&&owner.get(e.source.nodeId)===owner.get(e.target.nodeId));
    assert.deepEqual(internal(protocol.graph.edges),internal(source.graph.edges));
  }
  assert.ok(orders.size>1);assert.deepEqual(source,original);
  assert.equal(await hashProtocolGraph(source),source.freeze.configHash);
});

test('incomplete loops, disconnected members, unbounded cycles and cross-group data cannot be randomized', () => {
  const prepare=p=>prepareGroupSequence(p,p.groupRandomization.groupIds,'reject',registry);
  let p=complexGroupFixture();p.graph.groups[0].nodeIds=p.graph.groups[0].nodeIds.filter(id=>id!=='outer');assert.throws(()=>prepare(p),/enclosing loop|single entry/);
  p=complexGroupFixture();p.graph.nodes.find(n=>n.id==='inner').config.maxIterations=Infinity;assert.throws(()=>prepare(p),/finite maximum/);
  p=complexGroupFixture();p.graph.edges.find(e=>e.source.nodeId==='left').target.nodeId='choice';assert.throws(()=>prepare(p),/Cycles/);
  p=complexGroupFixture();p.graph.edges=p.graph.edges.filter(e=>e.source.nodeId!=='choice');assert.throws(()=>prepare(p),/reachable/);
  p=complexGroupFixture();p.graph.edges.find(e=>e.source.nodeId==='inner'&&e.source.portId==='exit').target.nodeId='choice';assert.throws(()=>prepare(p),/exit must leave/);
  p=complexGroupFixture();p.graph.edges.push({id:'dependency',kind:'data',source:{nodeId:'left',portId:'value'},target:{nodeId:'other',portId:'input'}});assert.throws(()=>prepare(p),/data connections/);
});
