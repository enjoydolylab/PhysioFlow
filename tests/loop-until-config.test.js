import test from 'node:test';
import assert from 'node:assert/strict';
import {createProtocolGraph,addNode,createCoreComponentRegistry,validateProtocolGraphConfiguration} from '../src/core/index.js';
const registry=createCoreComponentRegistry();
function check(type,operator,expected,bound=true) {
 let protocol=createProtocolGraph();protocol.variables=[{name:'untilValue',type,defaultValue:type==='boolean'?false:0}];
 const added=addNode(protocol,'logic.loop',{config:{maxIterations:2,untilRule:{operator,expected}},bindings:bound?{until:{kind:'variable',variable:'untilValue'}}:{}});
 return validateProtocolGraphConfiguration(added.protocol,registry).errors.filter(e=>e.path.endsWith('.untilRule.expected'));
}
test('active loop until rules validate typed expected values without changing inactive rules',()=>{
 assert.equal(check('number','less_than','').length,1);
 assert.equal(check('number','less_than',0).length,0);
 assert.equal(check('number','less_than',-2).length,0);
 assert.equal(check('boolean','equals','').length,1);
 assert.equal(check('boolean','equals',false).length,0);
 assert.equal(check('boolean','greater_than',0)[0].code,'config.condition_numeric_boolean');
 assert.equal(check('boolean','is_truthy','').length,0);
 assert.equal(check('number','less_than','',false).length,0);
});
