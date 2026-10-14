import test from 'node:test';
import assert from 'node:assert/strict';
import {validationIssueTarget} from '../src/composer/validationNavigation.js';
test('validation navigation targets existing nodes, connections and groups without retaining another selection',()=>{
 const protocol={graph:{nodes:[{id:'n'}],edges:[{id:'e'}],groups:[{id:'g',entryNodeId:'n',nodeIds:['n']}]}};
 assert.deepEqual(validationIssueTarget(protocol,{nodeId:'n'}),{nodeId:'n',edgeId:null});
 assert.deepEqual(validationIssueTarget(protocol,{edgeId:'e'}),{nodeId:null,edgeId:'e'});
 assert.deepEqual(validationIssueTarget(protocol,{groupId:'g'}),{nodeId:'n',edgeId:null});
 assert.equal(validationIssueTarget(protocol,{nodeId:'deleted'}),null);
 assert.equal(validationIssueTarget(protocol,{code:'PROTOCOL_ERROR'}),null);
});
