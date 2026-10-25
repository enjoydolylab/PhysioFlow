import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from '@babel/parser';
import { interpolateMessage, messageTemplates, translateMessage } from '../src/i18nMessage.js';
import { pfUIStrings } from '../src/pfUIStrings.js';
import { assessProtocolReadiness } from '../src/readiness.js';

const source = readFileSync(new URL('../src/i18n.jsx', import.meta.url), 'utf8');
const dictionaries = { zh: {}, ja: {} };
const properties = (object, lang) => {
  for (const prop of object?.properties || []) if (prop.key?.type === 'StringLiteral' && prop.value?.type === 'StringLiteral') dictionaries[lang][prop.key.value] = prop.value.value;
};
for (const node of parse(source, { sourceType: 'module', plugins: ['jsx'] }).program.body) {
  const declaration = node.declarations?.find(item => item.id.name === 'dictionaries');
  if (declaration) for (const prop of declaration.init.properties) properties(prop.value, prop.key.name);
  const call = node.expression;
  if (call?.callee?.object?.name !== 'Object' || call.callee.property?.name !== 'assign') continue;
  const [target, values] = call.arguments;
  if (target?.object?.name !== 'dictionaries') continue;
  if (values.type === 'ObjectExpression') properties(values, target.property.name);
  else if (values.object?.name === 'pfUIStrings') Object.assign(dictionaries[target.property.name], pfUIStrings[values.property.name]);
}

test('E3 translates static named templates before inserting counts, including zero', () => {
  const key = '{n} nodes · {n1} connections · configuration checked';
  assert.equal(interpolateMessage(key, { n: 12, n1: 0 }), '12 nodes · 0 connections · configuration checked');
  for (const language of ['ja', 'zh']) {
    const result = interpolateMessage(translateMessage(key, dictionaries[language], messageTemplates), { n: 12, n1: 0 });
    assert.notEqual(result, interpolateMessage(key, { n: 12, n1: 0 }));
    assert.match(result, /12/);
    assert.match(result, /0/);
    assert.doesNotMatch(result, /\{\w+\}/);
  }
  assert.equal(interpolateMessage('{n}/{n1}/{unknown}', { n: '', n1: 0 }), '/0/{unknown}');
});

test('E3 questionnaire English sources have correct Chinese and Japanese values', () => {
  for (const [key, zh, ja] of [['Response recorded', '回答已记录', '回答が記録されました'], ['Submit response', '提交回答', '回答を送信'], ['Next', '下一步', '次へ']]) {
    assert.equal(dictionaries.zh[key], zh);
    assert.equal(dictionaries.ja[key], ja);
    assert.equal(translateMessage(key, dictionaries.zh, messageTemplates), zh);
  }
  assert.equal(dictionaries.zh.version, '版本');
  for (const [key, value] of Object.entries(dictionaries.zh)) assert.ok(!(/[\u3040-\u30ff]/.test(key) && key === value), key);
});

test('E3 readiness diagnostics preserve English model values and translate captured numbers', () => {
  const protocol = { blocks: [], stimuli: [], questionnaires: [], status: 'draft' };
  const assessment = assessProtocolReadiness(protocol);
  const message = assessment.items.find(item => item.id === 'structure').detail;
  assert.equal(message, '0 blocks, 0 trials, 0 steps.');
  for (const language of ['ja', 'zh']) {
    const translated = translateMessage(message, dictionaries[language], messageTemplates);
    assert.notEqual(translated, message);
    assert.equal((translated.match(/0/g) || []).length, 3);
  }
  assert.equal(assessment.items[0].detail, message);
});
