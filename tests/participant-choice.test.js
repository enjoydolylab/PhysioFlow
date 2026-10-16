import test from 'node:test';
import assert from 'node:assert/strict';
import {choiceOptionsError} from '../src/core/choiceInput.js';
import {responseValueError} from '../src/core/inputValidation.js';
import {participantUiTemplate,validateParticipantUi} from '../src/core/participantUi.js';
test('choice configuration requires distinct nonempty recorded values and labels',()=>{
 for(const options of [[],[{value:'',label:'A'}],[{value:'a',label:''}],[{value:'a',label:'A'},{value:'a',label:'B'}]])assert.ok(choiceOptionsError(options));
 const many=Array.from({length:1000},(_,i)=>({value:String(i),label:String(i)}));assert.equal(choiceOptionsError(many),null);assert.ok(choiceOptionsError([...many,{value:'1000',label:'1000'}]));
 const options=[{value:'0',label:'None, = zero'},{value:'yes',label:'Yes'}];assert.equal(choiceOptionsError(options),null);
 assert.equal(responseValueError('0',{type:'choice',required:true,options}),null);
 assert.equal(responseValueError('',{type:'choice',required:false,options}),null);
 assert.ok(responseValueError('',{type:'choice',required:true,options}));assert.ok(responseValueError('unknown',{type:'choice',options}));assert.ok(responseValueError(0,{type:'choice',options}));
});
test('choice errors identify their input element for editor location',()=>{
 const schema=participantUiTemplate('rating');const input=schema.root.children.find(e=>e.type==='Input');input.props.inputType='choice';input.props.options=[];
 assert.equal(validateParticipantUi(schema).errors.find(e=>e.code==='ui.choice_options_invalid').elementId,input.id);
 input.props.options=[{value:'0',label:'Zero'}];assert.equal(validateParticipantUi(schema).valid,true);
});
