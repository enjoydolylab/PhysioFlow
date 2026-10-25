import test from 'node:test';
import assert from 'node:assert/strict';
import { createCoreComponentRegistry, createProtocolGraph, freezeProtocolGraph } from '../src/core/index.js';
import { componentLabel, fieldLabel, fieldHelp, optionLabel, nodeDisplayLabel } from '../src/composer/catalogLabels.js';
import { unreviewedMigrationIssues } from '../src/core/migrationReview.js';
const definitions = createCoreComponentRegistry().list();
test('composer catalog covers every core component, editor field, help and select option in Japanese and Chinese', () => {
  for (const definition of definitions) {
    assert.equal(componentLabel(definition.type, 'en'), definition.label);
    for (const language of ['ja', 'zh']) {
      assert.match(componentLabel(definition.type, language), /[\u3040-\u30ff\u3400-\u9fff]/, definition.type);
      for (const field of definition.editorFields) {
        assert.equal(fieldLabel(definition.type, field.path, 'en'), field.label);
        assert.match(fieldLabel(definition.type, field.path, language), /[\u3040-\u30ff\u3400-\u9fff]/, `${definition.type}:${field.path}`);
        assert.equal(fieldHelp(definition.type, field.path, 'en'), field.help || '');
        if (field.help) assert.notEqual(fieldHelp(definition.type, field.path, language), field.help);
        for (const option of field.options || []) {
          assert.equal(optionLabel(definition.type, field.path, option, 'en'), option);
          assert.notEqual(optionLabel(definition.type, field.path, option, language), option);
        }
      }
    }
  }
});
test('display localization preserves authored names and technical definitions', () => {
  const node = {component: {type:'stimulus.fixation'}, label:'fixation'};
  assert.equal(nodeDisplayLabel(node,'ja'),'注視点');
  assert.equal(nodeDisplayLabel({...node,label:'My fixation trial'},'ja'),'My fixation trial');
  assert.equal(componentLabel('display.screen','fr'),'Screen');
  assert.equal(fieldLabel('display.screen','completion.mode','fr'),'Completion');
  assert.equal(fieldHelp('display.screen','content','fr'),'Shown as the participant-facing heading.');
  assert.equal(optionLabel('display.screen','completion.mode','other','ja'),'other');
  assert.equal(createCoreComponentRegistry().get('stimulus.fixation').label,'Fixation');
});
test('migration UI and freezing agree for zero, pending, per-issue reviewed and acknowledged reports', async () => {
  let protocol = createProtocolGraph({name:'移行確認'});
  const registry = createCoreComponentRegistry();
  for (const report of [
    {formalRunAllowed:false,issues:[]},
    {formalRunAllowed:false,issues:[{reviewed:true},{reviewedAt:'2026-10-25'}]},
    {formalRunAllowed:true,issues:[{}]},
    {formalRunAllowed:false,reviewedAt:'2026-10-25',issues:[{}]},
  ]) {
    protocol.legacy={migrationReport:report};
    assert.equal(unreviewedMigrationIssues(protocol).length,0);
    assert.equal((await freezeProtocolGraph(protocol,registry)).version.status,'frozen');
  }
  protocol.legacy={migrationReport:{formalRunAllowed:false,issues:[{}, {reviewed:true}]}};
  assert.equal(unreviewedMigrationIssues(protocol).length,1);
  await assert.rejects(()=>freezeProtocolGraph(protocol,registry),/Migration review/);
});
