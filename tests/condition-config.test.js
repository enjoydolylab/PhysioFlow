import test from 'node:test';
import assert from 'node:assert/strict';
import {conditionExpectedError,conditionInputType} from '../src/core/conditionConfig.js';
import {createCoreComponentRegistry,createProtocolGraph,addNode,validateProtocolGraphConfiguration} from '../src/core/index.js';
test('numeric comparisons reject empty, boolean and nonfinite expected values but keep zero and signed numbers',()=>{
 for(const expected of ['',null,false,[],Infinity,' '])assert.equal(conditionExpectedError({operator:'greater_than',expected},'number'),'config.condition_expected_number');
 for(const expected of [0,-2,'0','-2.5'])assert.equal(conditionExpectedError({operator:'greater_than',expected},'number'),null);
 assert.equal(conditionExpectedError({operator:'is_truthy',expected:''},'number'),null);
 assert.equal(conditionExpectedError({operator:'equals',expected:null},'boolean'),'config.condition_expected_boolean');
 assert.equal(conditionExpectedError({operator:'equals',expected:false},'boolean'),null);
 assert.equal(conditionExpectedError({operator:'greater_than',expected:1},'boolean'),'config.condition_numeric_boolean');
});
test('configuration validation resolves variable and output input types and locates invalid comparison nodes',()=>{
 const registry=createCoreComponentRegistry();let protocol=createProtocolGraph();protocol.variables=[{name:'score',type:'number',defaultValue:0}];
 const result=addNode(protocol,'logic.condition',{config:{operator:'equals',expected:''},bindings:{value:{kind:'variable',variable:'score'}}});protocol=result.protocol;
 assert.equal(conditionInputType(protocol,result.node,registry),'number');
 assert.ok(validateProtocolGraphConfiguration(protocol,registry).errors.some(e=>e.code==='config.condition_expected_number'&&e.nodeId===result.node.id));
});
test('bound compare input does not require the unused authored expected value',()=>{
 assert.equal(conditionExpectedError({operator:'greater_than',expected:''},'number',{hasCompare:true}),null);
 assert.equal(conditionExpectedError({operator:'equals',expected:''},'boolean',{hasCompare:true}),null);
 assert.equal(conditionExpectedError({operator:'greater_than',expected:0},'boolean',{hasCompare:true}),'config.condition_numeric_boolean');
});
