import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateExpression,createRuntimeState,startRuntime} from '../src/runtime/index.js';
import {conditionExpectedError} from '../src/core/conditionConfig.js';
import {createProtocolGraph,addNode,connect,createCoreComponentRegistry} from '../src/core/index.js';
test('accepted numeric expected strings compare numerically against numeric values',()=>{
 for(const [actual,expected] of [[2,'2.0'],[0,'-0'],[-2,'-2.00'],[100,'1e2'],[2,' 2 ']]) {
  assert.equal(conditionExpectedError({operator:'equals',expected},'number'),null);
  assert.equal(evaluateExpression({operator:'equals',expected},actual),true);
  assert.equal(evaluateExpression({operator:'not_equals',expected},actual),false);
 }
 for(const expected of ['',null,false,[],{},Infinity])assert.equal(evaluateExpression({operator:'equals',expected},0),false);
 assert.equal(evaluateExpression({operator:'equals',expected:99},2,'2.0'),true);
});
test('text and boolean equality retain existing interpretation',()=>{
 assert.equal(evaluateExpression({operator:'equals',expected:'2.0'},'2'),false);
 assert.equal(evaluateExpression({operator:'equals',expected:'02'},'2'),false);
 assert.equal(evaluateExpression({operator:'equals',expected:'false'},false),true);
 assert.equal(evaluateExpression({operator:'contains',expected:'2'},'12'),true);
});
test('numeric condition executes the true branch with a decimal string expected value',()=>{
 let protocol=createProtocolGraph();const start=protocol.graph.nodes.find(n=>n.component.type==='core.start');const end=protocol.graph.nodes.find(n=>n.component.type==='core.end');protocol.graph.edges=[];protocol.variables=[{name:'score',type:'number',scope:'session',defaultValue:2}];
 let added=addNode(protocol,'logic.condition',{id:'condition',config:{operator:'equals',expected:'2.0'}});protocol=added.protocol;protocol.graph.nodes.find(n=>n.id==='condition').bindings={value:{kind:'variable',variable:'score'}};
 added=addNode(protocol,'display.screen',{id:'true_branch'});protocol=added.protocol;
 for(const [source,port,target] of [[start.id,'next','condition'],['condition','true','true_branch'],['condition','false',end.id],['true_branch','next',end.id]])protocol=connect(protocol,'control',{nodeId:source,portId:port},{nodeId:target,portId:'in'}).protocol;
 const run=startRuntime(createRuntimeState(protocol,{sessionId:'numeric-condition',startedAtEpochMs:1,startedAtMonotonicMs:1}),protocol,createCoreComponentRegistry(),{idFactory:()=>crypto.randomUUID(),clock:{now:()=>({epochMs:1,monotonicMs:1,iso:'2026-10-15T00:00:00.000Z'})}});
 assert.equal(run.state.currentNodeId,'true_branch');assert.equal(run.events.find(e=>e.eventType==='condition_evaluated').payload.result,true);
});

test('numeric ordering rejects missing and coerced operands while keeping zero and numeric strings',()=>{
 for(const operator of ['greater_than','greater_than_or_equal','less_than','less_than_or_equal']) {
  for(const invalid of [null,undefined,'',' ',false,true,[],{},Infinity,NaN,'wrong']) {
   assert.throws(()=>evaluateExpression({operator,expected:1},invalid),/actual comparison value/);
   assert.throws(()=>evaluateExpression({operator,expected:invalid},0),/expected comparison value/);
  }
 }
 assert.equal(evaluateExpression({operator:'less_than',expected:'2.0'},0),true);
 assert.equal(evaluateExpression({operator:'greater_than_or_equal',expected:'-2'},-2),true);
});

test('invalid dynamic numeric input records failure and does not enter either branch',()=>{
 let protocol=createProtocolGraph();const start=protocol.graph.nodes.find(n=>n.component.type==='core.start');const end=protocol.graph.nodes.find(n=>n.component.type==='core.end');protocol.graph.edges=[];protocol.variables=[{name:'score',type:'number',scope:'session',defaultValue:null}];
 let added=addNode(protocol,'logic.condition',{id:'condition',config:{operator:'less_than',expected:1}});protocol=added.protocol;protocol.graph.nodes.find(n=>n.id==='condition').bindings={value:{kind:'variable',variable:'score'}};
 added=addNode(protocol,'display.screen',{id:'true_branch'});protocol=added.protocol;
 for(const [source,port,target] of [[start.id,'next','condition'],['condition','true','true_branch'],['condition','false',end.id],['true_branch','next',end.id]])protocol=connect(protocol,'control',{nodeId:source,portId:port},{nodeId:target,portId:'in'}).protocol;
 const run=startRuntime(createRuntimeState(protocol,{sessionId:'numeric-condition',startedAtEpochMs:1,startedAtMonotonicMs:1}),protocol,createCoreComponentRegistry(),{idFactory:()=>crypto.randomUUID(),clock:{now:()=>({epochMs:1,monotonicMs:1,iso:'2026-10-15T00:00:00.000Z'})}});
 assert.equal(run.state.status,'failed');assert.ok(!run.events.some(e=>e.eventType==='condition_evaluated'));assert.ok(run.events.some(e=>e.eventType==='runtime_failed'));assert.match(run.state.error,/actual comparison value/);
});
