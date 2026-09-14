import test from 'node:test';
import assert from 'node:assert/strict';
import { createParticipantScreen, createUiElement, validateParticipantUi } from '../src/core/index.js';
import { freezeLayout, restoreFlow } from '../src/participantUi/layoutGeometry.js';
import { createScreenPreset, SCREEN_PRESETS } from '../src/participantUi/screenPresets.js';

test('switching layout preserves measured positions and restores original responsive sizing', () => {
  const root = createParticipantScreen({children:[createUiElement('Text', {id:'a', props:{text:'Instructions'}}), createUiElement('Layout', {id:'b', props:{width:200}})]}).root;
  const frozen = freezeLayout(root, {height:720, children:{a:{x:32,y:40,width:600,height:40}, b:{x:32,y:120,width:200,height:100}}});
  assert.equal(frozen.children[0].props.height, undefined, 'editing longer text remains possible');
  assert.equal(frozen.children[1].props.height, 100, 'nested container keeps its occupied space');
  frozen.children[0].props.text = 'Edited instructions';
  const restored = restoreFlow(frozen);
  assert.equal(restored.props.free, false);
  assert.equal(restored.props.height, undefined);
  assert.deepEqual(restored.children[0].props, {text:'Edited instructions'});
  assert.deepEqual(restored.children[1].props, {width:200});
});

test('experiment presets are valid screens with independent element identities', () => {
  for (const {id} of SCREEN_PRESETS) {
    const screen = createScreenPreset(id);
    assert.equal(validateParticipantUi(screen).valid, true, id);
    assert.equal(screen.root.props.screenWidth, 1280);
    assert.equal(screen.root.props.screenHeight, 720);
    assert.notEqual(screen.root.children[0].id, createScreenPreset(id).root.children[0].id);
  }
});

test('fixation bounding box is centered on the design screen without paragraph margins', () => {
  const {root} = createScreenPreset('fixation');
  const {props} = root.children[0];
  assert.equal(props.x + props.width / 2, root.props.screenWidth / 2);
  assert.equal(props.y + props.height / 2, root.props.screenHeight / 2);
  assert.equal(props.zeroMargin, true);
});
