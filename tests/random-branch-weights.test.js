import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBranchWeights} from '../src/core/randomBranchWeights.js';
import {createProtocolGraph,createCoreComponentRegistry,addNode,connect,validateProtocolGraphConfiguration} from '../src/core/index.js';
import {createRuntimeState,startRuntime} from '../src/runtime/index.js';
function fixture(config) {
 let protocol=createProtocolGraph();const start=protocol.graph.nodes.find(n=>n.component.type==='core.start');const end=protocol.graph.nodes.find(n=>n.component.type==='core.end');protocol.graph.edges=[];
 const added=addNode(protocol,'logic.random',{id:'random',config});protocol=added.protocol;
 protocol=connect(protocol,'control',{nodeId:start.id,portId:'next'},{nodeId:'random',portId:'in'}).protocol;
 for(const branch of ['a','b'])protocol=connect(protocol,'control',{nodeId:'random',portId:branch},{nodeId:end.id,portId:'in'}).protocol;
 return {protocol,node:protocol.graph.nodes.find(n=>n.id==='random')};
}
test('only connected branch weights count; optional defaults agree with execution',()=>{
 const {protocol,node}=fixture({probabilityA:0.6,probabilityB:null,probabilityC:1});
 const result=randomBranchWeights(protocol,node);assert.deepEqual(result.weighted,[{portId:'a',weight:0.6},{portId:'b',weight:0.4}]);assert.equal(result.totalWeight,1);
 const registry=createCoreComponentRegistry();
 assert.ok(!validateProtocolGraphConfiguration(protocol,registry).errors.some(e=>e.code==='config.random_weight_total_invalid'));
 const run=startRuntime(createRuntimeState(protocol,{sessionId:'weight-test',randomSeed:'weights',startedAtEpochMs:1,startedAtMonotonicMs:1}),protocol,registry,{idFactory:()=>crypto.randomUUID(),clock:{now:()=>({epochMs:1,monotonicMs:1,iso:'2026-10-15T00:00:00.000Z'})}});
 assert.equal(run.state.status,'completed');assert.deepEqual(run.events.find(e=>e.eventType==='randomization_evaluated').payload.branchWeights,{a:0.6,b:0.4});
});
test('zero connected total is blocked even when an unconnected branch has positive weight',()=>{
 const {protocol,node}=fixture({probabilityA:0,probabilityB:0,probabilityC:1});
 assert.equal(randomBranchWeights(protocol,node).totalWeight,0);
 const check=validateProtocolGraphConfiguration(protocol,createCoreComponentRegistry());assert.ok(check.errors.some(e=>e.code==='config.random_weight_total_invalid'&&e.nodeId===node.id));
});
test('explicit zero for one branch remains valid when another connected branch is positive',()=>{
 const {protocol}=fixture({probabilityA:0,probabilityB:1});
 assert.ok(!validateProtocolGraphConfiguration(protocol,createCoreComponentRegistry()).errors.some(e=>e.code==='config.random_weight_total_invalid'));
});
