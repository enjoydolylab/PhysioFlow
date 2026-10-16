import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveUiBinding} from '../src/core/participantUi.js';
import {formatUiText} from '../src/core/uiText.js';
test('UI binding paths resolve own values, including false and zero',()=>{
  const variables=JSON.parse('{"score":0,"flag":false,"__proto__":{"value":"literal"}}');
  assert.equal(resolveUiBinding('variables.score',{variables}),0);
  assert.equal(resolveUiBinding('variables.flag',{variables}),false);
  assert.equal(resolveUiBinding('variables.__proto__.value',{variables}),'literal');
  assert.equal(resolveUiBinding('variables.constructor',{variables}),undefined);
  assert.equal(resolveUiBinding('variables.toString',{variables}),undefined);
});
test('text bindings display booleans and structured values without React object errors',()=>{
  assert.equal(formatUiText(false),'false');
  assert.equal(formatUiText(0),'0');
  assert.equal(formatUiText({score:0,flag:false}),'{"score":0,"flag":false}');
  assert.equal(formatUiText([0,false]),'[0,false]');
  assert.equal(formatUiText(null),'');assert.equal(formatUiText(undefined),'');
});
test('text formatting safely handles unsupported cyclic values',()=>{
  const value={};value.self=value;
  assert.equal(formatUiText(value),'');assert.equal(formatUiText(()=>{}),'');
});
