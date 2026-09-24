import test from 'node:test';
import assert from 'node:assert/strict';
import { createParticipantScreen, createUiElement, validateParticipantUi } from '../src/core/participantUi.js';
import { duplicateElementTree, withUniqueResponseNames, flatten } from '../src/participantUi/tree.js';
const input = name => createUiElement('Input', { props: { name, inputType: 'text' } });

test('duplicate response names across nested containers are invalid', () => {
  const ui = createParticipantScreen({ children: [input('answer'), createUiElement('Layout', { children: [input('answer')] })] });
  assert.equal(validateParticipantUi(ui).valid, false);
  assert.ok(validateParticipantUi(ui).errors.some(x => x.code === 'ui.input_name_duplicate'));
});

test('insertion and nested copies use distinct names without changing originals', () => {
  const root = createParticipantScreen({ children: [input('answer'), input('answer_2')] }).root;
  const added = withUniqueResponseNames(input('answer'), root);
  assert.equal(added.props.name, 'answer_3');
  const group = createUiElement('Layout', { children: [input('answer'), input('answer_3')] });
  const before = structuredClone(group);
  const copy = duplicateElementTree(group, root);
  const names = flatten(copy).filter(x => x.element.type === 'Input').map(x => x.element.props.name);
  assert.deepEqual(names, ['answer_3', 'answer_3_2']);
  assert.deepEqual(group, before);
  assert.notEqual(copy.children[0].id, group.children[0].id);
  assert.equal(validateParticipantUi(createParticipantScreen({ children: [...root.children, copy] })).valid, true);
});
