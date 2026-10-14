import test from 'node:test';
import assert from 'node:assert/strict';
import {createProtocolGraph,createCoreComponentRegistry,addNode,validateProtocolGraphConfiguration,createStroopGraphTemplate} from '../src/core/index.js';
const registry=createCoreComponentRegistry();
test('random weights reject coerced empty and boolean values while retaining explicit zero and optional null',()=>{
 for(const value of ['', ' ',false,true,[],{},Infinity]) {
  const {protocol,node}=addNode(createProtocolGraph(),'logic.random',{config:{probabilityA:value}});
  assert.ok(validateProtocolGraphConfiguration(protocol,registry).errors.some(e=>e.code==='config.random_probability_invalid'&&e.nodeId===node.id));
 }
 for(const value of [0,'0',0.5,1,null]) {
  const {protocol}=addNode(createProtocolGraph(),'logic.random',{config:{probabilityA:value,probabilityB:null}});
  assert.ok(!validateProtocolGraphConfiguration(protocol,registry).errors.some(e=>e.code==='config.random_probability_invalid'));
 }
 for(const field of registry.get('logic.random','1.0.0').editorFields.filter(f=>['probabilityB','probabilityC','probabilityD'].includes(f.path)))assert.equal(field.emptyValue,null);
});
test('loop iteration limits reject boolean and array coercion',()=>{
 for(const value of [true,[1],false,'',null,1.5]) {
  const {protocol}=addNode(createProtocolGraph(),'logic.loop',{config:{maxIterations:value}});
  assert.ok(validateProtocolGraphConfiguration(protocol,registry).errors.some(e=>e.code==='config.loop_limit_invalid'));
 }
 for(const value of [1,'2',100]) {
  const {protocol}=addNode(createProtocolGraph(),'logic.loop',{config:{maxIterations:value}});
  assert.ok(!validateProtocolGraphConfiguration(protocol,registry).errors.some(e=>e.code==='config.loop_limit_invalid'));
 }
});
test('cognitive task timing rejects missing and coerced values and malformed IDs without crashing',()=>{
 for(const value of ['',null,true,[],undefined]) {
  const protocol=createStroopGraphTemplate();const node=protocol.graph.nodes.find(n=>n.component.type==='experiment.cognitive-task');
  node.config.trials[0].fixationMs=value;
  assert.ok(validateProtocolGraphConfiguration(protocol,registry).errors.some(e=>e.code==='config.cognitive_task_timing_invalid'));
 }
 const protocol=createStroopGraphTemplate();const node=protocol.graph.nodes.find(n=>n.component.type==='experiment.cognitive-task');node.config.trials[0].trialId=42;node.config.trials[0].fixationMs=0;node.config.trials[0].itiMs=0;
 const result=validateProtocolGraphConfiguration(protocol,registry);
 assert.ok(result.errors.some(e=>e.code==='config.cognitive_task_trial_id_invalid'));
 assert.ok(!result.errors.some(e=>e.code==='config.cognitive_task_timing_invalid'));
});
