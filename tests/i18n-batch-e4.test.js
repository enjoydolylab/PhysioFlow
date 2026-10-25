import test from 'node:test';
import assert from 'node:assert/strict';
import { messageTemplates, translateMessage, interpolateMessage } from '../src/i18nMessage.js';
import { pfUIStrings } from '../src/pfUIStrings.js';
import { readFileSync } from 'node:fs';
import { parse } from '@babel/parser';

test('E4 assembled diagnostics translate captured researcher values without changing the source', () => {
  const source = Object.freeze({ message: 'Node trial.alpha requires exactly one next control connection; found 0' });
  for (const language of ['ja', 'zh']) {
    const result = translateMessage(source.message, pfUIStrings[language], messageTemplates);
    assert.notEqual(result, source.message);
    assert.match(result, /trial\.alpha/);
    assert.match(result, /next/);
    assert.match(result, /0/);
    assert.doesNotMatch(result, /\{\d+\}/);
  }
  assert.equal(source.message, 'Node trial.alpha requires exactly one next control connection; found 0');
});

test('E4 diagnostic matching escapes punctuation and chooses a specific message over generic suffixes', () => {
  for (const language of ['ja', 'zh']) {
    const dictionary = pfUIStrings[language];
    assert.equal(translateMessage('PhysioDB request failed (HTTP 503)', dictionary, messageTemplates), interpolateMessage(dictionary['PhysioDB request failed (HTTP {0})'], [503]));
    assert.equal(translateMessage('PhysioDB request failed [HTTP 503]', dictionary, messageTemplates), 'PhysioDB request failed [HTTP 503]');
    assert.equal(translateMessage('Junction branch.alpha needs a next connection', dictionary, messageTemplates), interpolateMessage(dictionary['Junction {0} needs a next connection'], ['branch.alpha']));
  }
});

test('E4 removes non-English response aliases while retaining their English sources', () => {
  const ast = parse(readFileSync(new URL('../src/i18n.jsx', import.meta.url), 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
  const declaration = ast.program.body.flatMap(node => node.declarations || []).find(node => node.id.name === 'dictionaries');
  for (const language of declaration.init.properties.filter(prop => ['ja', 'zh'].includes(prop.key.name))) {
    assert.ok(!language.value.properties.some(prop => prop.key.value === '回答已记录'));
    const assignments = ast.program.body.map(node => node.expression).filter(call => call?.callee?.property?.name === 'assign' && call.arguments[0]?.object?.name === 'dictionaries' && call.arguments[0]?.property?.name === language.key.name && call.arguments[1]?.type === 'ObjectExpression');
    assert.ok(assignments.some(call => call.arguments[1].properties.some(prop => prop.key?.value === 'Responses recorded')));
    assert.ok(assignments.every(call => !call.arguments[1].properties.some(prop => prop.key?.value === '回答已记录')));
  }
});

