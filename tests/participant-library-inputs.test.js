import test from 'node:test';
import assert from 'node:assert/strict';
import {createLibraryElement} from '../src/participantUi/libraryElement.js';
import {participantUiTemplate,validateParticipantUi} from '../src/core/participantUi.js';
import {withUniqueResponseNames} from '../src/participantUi/tree.js';
test('input library shortcuts create ordinary valid Input schemas with independent options',()=>{
 const schema=participantUiTemplate('instruction');
 for(const [kind,inputType] of [['NumberInput','number'],['SingleChoice','choice'],['MultipleChoice','multi_choice']]) {
  const element=withUniqueResponseNames(createLibraryElement(kind,{x:32,y:48}),schema.root);schema.root.children.push(element);
  assert.equal(element.type,'Input');assert.equal(element.props.inputType,inputType);assert.equal(element.props.x,32);
 }
 assert.equal(validateParticipantUi(schema).valid,true);
 assert.equal(new Set(schema.root.children.filter(e=>e.type==='Input').map(e=>e.props.name)).size,3);
 const a=createLibraryElement('SingleChoice'),b=createLibraryElement('SingleChoice');a.props.options[0].value='changed';assert.equal(b.props.options[0].value,'1');
 assert.throws(()=>createLibraryElement('toString'),/Unknown participant UI element/);
 assert.equal(createLibraryElement('Button').actions[0].action,'submit');
});
