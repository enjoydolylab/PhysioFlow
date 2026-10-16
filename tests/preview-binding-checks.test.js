import test from 'node:test';
import assert from 'node:assert/strict';
import {bindingProperties,previewBindingChecks} from '../src/participantUi/runtimeBindings.js';
const schema=bindings=>({root:{id:'root',type:'Screen',children:[{id:'text',type:'Text',bindings,children:[]}]}});
test('binding checks distinguish missing paths from explicit false, zero and null',()=>{
 const value=schema({text:'variables.score',color:'variables.flag',background:'variables.blank'});
 assert.deepEqual(previewBindingChecks(value,{variables:{score:0,flag:false,blank:null}}),[]);
 const issues=previewBindingChecks(schema({text:'variables.constructor'}),{variables:{}});assert.equal(issues[0].kind,'missing');assert.equal(issues[0].field,'Runtime binding text');
});
test('binding checks keep independent paths and distinguish unused properties',()=>{
 const issues=previewBindingChecks(schema({text:'variables.message',color:'variables.ink',label:'variables.caption'}),{});
 assert.deepEqual(issues.map(i=>[i.elementId,i.property,i.kind]),[['text','text','missing'],['text','color','missing'],['text','label','unused']]);assert.equal(issues[2].field,'Runtime bindings');
});
test('binding properties follow renderer content and supported appearance targets',()=>{
 assert.ok(bindingProperties('Progress').includes('max'));assert.ok(bindingProperties('Html').includes('html'));assert.deepEqual(bindingProperties('Media'),['sourceUrl']);assert.ok(bindingProperties('Text').includes('background'));
});
