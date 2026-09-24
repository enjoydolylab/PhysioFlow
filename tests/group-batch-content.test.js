import test from 'node:test';
import assert from 'node:assert/strict';
import { applyQuestionnaireToKind } from '../src/core/sharedNodeEdits.js';
const node = i => ({ id: `n${i}`, component: { type: 'input.questionnaire' }, metadata: { questionnaireKind: 'sam' }, config: { questionnaire: { questionnaire_id: `q${i}`, name: `trial ${i}`, questions: [{ question_id: `t${i}_gate`, type: 'number', prompt_i18n: { en: `prompt ${i}` } }, { question_id: `t${i}_child`, show_if: { question_id: `t${i}_gate`, value: '1' } }] } } });
test('selected questionnaire batch keeps target IDs, remaps conditions and leaves other nodes intact', () => {
  const p = { graph: { nodes: [node(1), node(2), node(3)] } };
  const original = structuredClone(p);
  const { protocol: result, count } = applyQuestionnaireToKind(p, 'n1', null, { targetNodeIds: ['n2'] });
  assert.equal(count, 1);
  const q = result.graph.nodes[1].config.questionnaire;
  assert.equal(q.questionnaire_id, 'q2');
  assert.equal(q.questions[0].question_id, 't2_gate');
  assert.equal(q.questions[0].prompt_i18n.en, 'prompt 1');
  assert.equal(q.questions[1].show_if.question_id, 't2_gate');
  assert.deepEqual(result.graph.nodes[2], original.graph.nodes[2]);
  assert.deepEqual(p, original);
  q.questions[0].prompt_i18n.en = 'changed';
  assert.equal(result.graph.nodes[0].config.questionnaire.questions[0].prompt_i18n.en, 'prompt 1');
});
test('incompatible batch target is rejected without a partial mutation', () => {
  const p = { graph: { nodes: [node(1), { ...node(2), metadata: { questionnaireKind: 'qa1' } }] } };
  const original = structuredClone(p);
  assert.throws(() => applyQuestionnaireToKind(p, 'n1', null, { targetNodeIds: ['n2'] }), /incompatible/);
  assert.deepEqual(p, original);
});

test('frozen questionnaires reject edits at the command boundary', () => {
  assert.throws(() => applyQuestionnaireToKind({ version: { status: 'frozen' }, graph: { nodes: [node(1), node(2)] } }, 'n1'), /Frozen/);
});
