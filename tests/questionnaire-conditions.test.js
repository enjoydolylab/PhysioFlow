import test from 'node:test';
import assert from 'node:assert/strict';
import { visibleQuestionnaireQuestions } from '../src/core/questionnaireModel.js';
const gate = { question_id: 'gate' };
const child = { question_id: 'child', show_if: { question_id: 'gate', operator: 'equals', value: 'yes' } };
const grandchild = { question_id: 'grandchild', show_if: { question_id: 'child', operator: 'equals', value: 'show' } };
test('hiding a branch also hides descendants even when old answers remain', () => {
  const qs = [gate, child, grandchild];
  assert.equal(visibleQuestionnaireQuestions(qs, { gate: 'yes', child: 'show' }).length, 3);
  assert.deepEqual(visibleQuestionnaireQuestions(qs, { gate: 'no', child: 'show' }).map(q => q.question_id), ['gate']);
});
test('unanswered predecessor does not satisfy not-equals; zero remains a valid answer', () => {
  const q = { question_id: 'next', show_if: { question_id: 'gate', operator: 'not_equals', value: 'yes' } };
  assert.equal(visibleQuestionnaireQuestions([gate, q], {}).length, 1);
  assert.equal(visibleQuestionnaireQuestions([gate, q], { gate: 0 }).length, 2);
});
