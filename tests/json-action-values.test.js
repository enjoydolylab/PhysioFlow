import test from 'node:test';
import assert from 'node:assert/strict';
import {isJsonValue} from '../src/core/jsonValue.js';
import {participantUiTemplate,validateParticipantUi} from '../src/core/participantUi.js';
import {createProtocolGraph,insertNodeOnControlEdge,validateProtocolGraphConfiguration,createCoreComponentRegistry} from '../src/core/index.js';
import {parseScreenTemplate} from '../src/participantUi/screenTemplateFile.js';

test('action values preserve JSON primitives, mixed containers and shared data',()=>{
 const shared={zero:0,flag:false};for(const value of [null,0,false,'0',[0,false,'0'],{a:shared,b:shared},JSON.parse('{"__proto__":{"x":0}}')])assert.equal(isJsonValue(value),true);
});
test('action values reject silent JSON data loss and cycles',()=>{
 const cycle={};cycle.self=cycle;
 for(const value of [undefined,Infinity,-Infinity,NaN,{nested:[1,Infinity]},[undefined],{missing:undefined},new Date(),new Map(),1n,Array(1),cycle])assert.equal(isJsonValue(value),false);
});
test('invalid action values have a repairable path while explicit null is valid',()=>{
 const schema=participantUiTemplate('instruction');const button=schema.root.children.find(e=>e.type==='Button');button.actions=[{event:'click',action:'setVariable',name:'answer',value:Infinity}];
 const issue=validateParticipantUi(schema).errors.find(e=>e.code==='ui.action_value_invalid');assert.equal(issue.elementId,button.id);assert.match(issue.path,/\.actions\.0\.value$/);button.actions[0].value=null;assert.equal(validateParticipantUi(schema).valid,true);
});
test('screen template import rejects overflowing JSON numbers instead of saving null',()=>{
 const schema=participantUiTemplate('instruction');schema.root.children.find(e=>e.type==='Button').actions=[{event:'click',action:'setVariable',name:'answer',value:0}];
 const source=JSON.stringify(schema).replace('"name":"answer","value":0','"name":"answer","value":1e309');
 assert.throws(()=>parseScreenTemplate(source),error=>error.issues?.some(i=>i.code==='ui.action_value_invalid'));
 const graph=createProtocolGraph();const configured=insertNodeOnControlEdge(graph,graph.graph.edges[0].id,'display.screen',{config:{ui:JSON.parse(source),completion:{mode:'manual'}}}).protocol;assert.equal(validateProtocolGraphConfiguration(configured,createCoreComponentRegistry()).valid,false,'protocol imports and code edits also reject the overflowing value');
});
