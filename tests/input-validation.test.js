import test from 'node:test';
import assert from 'node:assert/strict';
import { responseValueError } from '../src/core/inputValidation.js';
test('zero is accepted, empty required values and nonfinite numbers are rejected',()=>{
  const config={required:true,type:'number',min:0,max:5};
  assert.equal(responseValueError(0,config),null);
  for(const value of ['',null,undefined])assert.equal(responseValueError(value,config),'Required');
  for(const value of [NaN,Infinity,'abc',-1,6])assert.ok(responseValueError(value,config));
  assert.equal(responseValueError('',{...config,required:false}),null);
});
test('required text, checkbox and multiple selection cannot be blank',()=>{
  assert.equal(responseValueError('  ',{required:true}),'Required');
  assert.equal(responseValueError([],{required:true}),'Required');
  assert.equal(responseValueError(false,{required:true,type:'checkbox'}),'Required');
  assert.equal(responseValueError(['A'],{required:true}),null);
});

test('discrete scales include zero and reject fractional, reversed, unsafe or oversized ranges', async () => {
  const { discreteScaleValues } = await import('../src/core/inputValidation.js');
  assert.deepEqual(discreteScaleValues(0, 2), [0, 1, 2]);
  assert.deepEqual(discreteScaleValues(-1, 1), [-1, 0, 1]);
  for (const pair of [[1.5, 7], [7, 1], [1, 1], [0, 1e12], [0, Infinity], ['', 7], [0, Number.MAX_SAFE_INTEGER + 1]]) assert.equal(discreteScaleValues(...pair), null);
  assert.equal(discreteScaleValues(0, 21, 21), null);
});
