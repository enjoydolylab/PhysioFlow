import test from 'node:test';
import assert from 'node:assert/strict';
import {createCoreComponentRegistry,createProtocolGraph,insertNodeOnControlEdge,validateProtocolGraphForFreeze} from '../src/core/index.js';
test('empty duration is blocked while explicit zero remains valid for wait and fixed fixation',()=>{
 const registry=createCoreComponentRegistry();
 for(const type of ['timing.wait','stimulus.fixation'])for(const value of ['',null,undefined,'  ',false,[],{},0,750,'750']){
 const protocol=createProtocolGraph();const config=structuredClone(registry.get(type).defaultConfig);
 if(type==='timing.wait')config.durationMs=value;else config.completion={mode:'fixed',durationMs:value};
 const next=insertNodeOnControlEdge(protocol,protocol.graph.edges[0].id,type,{config}).protocol;
 const errors=validateProtocolGraphForFreeze(next,registry).errors.filter(e=>['config.duration_invalid','config.wait_duration_invalid'].includes(e.code));
 assert.equal(errors.length,[0,750,'750'].includes(value)?0:1);
 }
});
