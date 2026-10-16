import test from 'node:test';
import assert from 'node:assert/strict';
import {numericBoundsError,responseValueError} from '../src/core/inputValidation.js';
import {participantUiTemplate,validateParticipantUi} from '../src/core/participantUi.js';
test('number input optional bounds preserve zero and decimal ranges and reject malformed bounds',()=>{
 for(const [min,max] of [[null,null],[undefined,2.5],[-2.5,2.5],[0,0]])assert.equal(numericBoundsError(min,max),null);
 for(const [min,max] of [[3,2],['',2],[false,2],[[],2],[0,Infinity]])assert.ok(numericBoundsError(min,max));
 assert.equal(responseValueError(0,{type:'number',min:-2.5,max:2.5,required:true}),null);
 assert.ok(responseValueError(3,{type:'number',min:-2.5,max:2.5}));
});
test('invalid participant number bounds locate the input element',()=>{
 const schema=participantUiTemplate('rating');const input=schema.root.children.find(e=>e.type==='Input');input.props={...input.props,inputType:'number',min:3,max:2};
 const issue=validateParticipantUi(schema).errors.find(e=>e.code==='ui.number_range_invalid');assert.equal(issue.elementId,input.id);
 input.props.min=null;assert.ok(!validateParticipantUi(schema).errors.some(e=>e.code==='ui.number_range_invalid'));
});
