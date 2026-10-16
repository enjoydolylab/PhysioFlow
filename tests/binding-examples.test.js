import test from 'node:test';
import assert from 'node:assert/strict';
import {bindingSuggestions,previewExampleContext} from '../src/participantUi/bindingExamples.js';
import {createProtocolGraph} from '../src/core/index.js';
import {createRuntimeState} from '../src/runtime/index.js';
test('binding suggestions use declared literal variable paths and standard runtime fields',()=>{
 const paths=bindingSuggestions([{name:'false'},{name:'score'},{name:'false'},{name:'bad.path'}]);assert.deepEqual(paths,['variables.false','variables.score','participant.participant_id','progress.percent','timer.elapsedMs']);
});
test('preview defaults preserve types and isolate nested values from the protocol',()=>{
 const variables=[{name:'score',defaultValue:0},{name:'flag',defaultValue:false},{name:'payload',defaultValue:{count:0}},{name:'__proto__',defaultValue:{literal:true}}];const context=previewExampleContext(variables);assert.equal(context.variables.score,0);assert.equal(context.variables.flag,false);assert.equal(Object.hasOwn(context.variables,'__proto__'),true);context.variables.payload.count=7;assert.equal(variables[2].defaultValue.count,0);assert.equal(context.participant.participant_id,'PREVIEW');
});
test('a project with no declared variables gets no invented variable defaults',()=>{assert.deepEqual(previewExampleContext([]).variables,{});assert.deepEqual(previewExampleContext().variables,{score:0});});
test('runtime initialization preserves literal declared names and explicit overrides',()=>{
 const protocol=createProtocolGraph();protocol.variables=[{name:'__proto__',defaultValue:{literal:true}},{name:'flag',defaultValue:false}];const state=createRuntimeState(protocol,{sessionId:'test',startedAtEpochMs:0,startedAtMonotonicMs:0});assert.equal(Object.hasOwn(state.variables,'__proto__'),true);assert.deepEqual(state.variables.__proto__,{literal:true});assert.equal(state.variables.flag,false);
 const changed=createRuntimeState(protocol,{sessionId:'test',startedAtEpochMs:0,startedAtMonotonicMs:0,variables:JSON.parse('{"__proto__":0}')});assert.equal(changed.variables.__proto__,0);
});
