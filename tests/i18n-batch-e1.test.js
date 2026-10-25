import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from '@babel/parser';
import { translateMessage, messageTemplates } from '../src/i18nMessage.js';
import { validateQuestionnaire } from '../src/core/questionnaireModel.js';

test('E1 translates pure questionnaire diagnostics at display time and preserves identifiers', () => {
  const ast = parse(readFileSync(new URL('../src/i18n.jsx', import.meta.url), 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
  const dictionaries = { zh: {}, ja: {} };
  for (const node of ast.program.body) {
    const call = node.expression;
    if (call?.callee?.object?.name !== 'Object' || call.callee.property?.name !== 'assign') continue;
    const [target, values] = call.arguments;
    if (!dictionaries[target?.property?.name] || values?.type !== 'ObjectExpression') continue;
    for (const prop of values.properties) dictionaries[target.property.name][prop.key.value] = prop.value.value;
  }
  const result = validateQuestionnaire({ questionnaire_id: 'q', name: 'Q', questions: [{ question_id: 'stable-id', type: 'unsupported', prompt_i18n: { en: 'Authored content' } }] });
  const issue = result.errors.find(item => item.code === 'questionnaire.type_invalid');
  assert.equal(issue.message, 'Question 1 has unsupported type unsupported');
  for (const lang of ['zh', 'ja']) {
    const displayed = translateMessage(issue.message, dictionaries[lang], messageTemplates);
    assert.notEqual(displayed, issue.message);
    assert.ok(displayed.includes('unsupported'));
    assert.equal(translateMessage('Authored content', dictionaries[lang], messageTemplates), 'Authored content');
    assert.equal(translateMessage('CSV row 3 has unsupported type custom-type', dictionaries[lang], messageTemplates).includes('custom-type'), true);
    assert.notEqual(translateMessage('Questionnaire needs a name', dictionaries[lang], messageTemplates), 'Questionnaire needs a name');
  }
  assert.equal(issue.code, 'questionnaire.type_invalid');
  assert.equal(issue.path, 'questions.0.type');
});
