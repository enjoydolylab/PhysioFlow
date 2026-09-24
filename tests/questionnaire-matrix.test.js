import test from 'node:test';
import assert from 'node:assert/strict';
import { canUseMatrix, canUseSamMatrix, orderSamMatrixQuestions } from '../src/questionnaireMatrix.js';
const likert = id => ({ question_id: id, type: 'likert', scale_min: 0, scale_max: 5 });
test('matrix requires explicit layout and uniform scales without timers or conditional visibility', () => {
  const q = { display_mode: 'matrix', questions: [likert('a'), likert('b')] };
  assert.equal(canUseMatrix(q), true);
  assert.equal(canUseMatrix({ ...q, display_mode: 'single' }), false);
  for (const patch of [{ scale_max: 7 }, { time_limit_sec: 1 }, { show_if: { question_id: 'a' } }, { type: 'number' }]) {
    assert.equal(canUseMatrix({ ...q, questions: [q.questions[0], { ...q.questions[1], ...patch }] }), false);
  }
});
test('SAM matrix requires all three unique 1–9 dimensions and preserves question identities', () => {
  const q = { display_mode: 'sam-matrix', questions: ['sam_dominance','sam_valence','sam_arousal'].map((type,i) => ({ question_id: String(i), type, scale_min: 1, scale_max: 9 })) };
  assert.equal(canUseSamMatrix(q), true);
  assert.deepEqual(orderSamMatrixQuestions(q.questions).map(x => x.question_id), ['2','1','0']);
  assert.equal(canUseSamMatrix({ ...q, shuffle_questions: true }), false);
  assert.equal(canUseSamMatrix({ ...q, questions: [q.questions[0],q.questions[0],q.questions[2]] }), false);
  assert.equal(canUseSamMatrix({ ...q, questions: q.questions.map(x => ({...x, time_limit_sec: 2})) }), false);
});
