import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parse } from '@babel/parser';

test('batch D translates every retained source and replaces localized guide literals', () => {
  const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
  const ast = parse(read('../src/i18n.jsx'), { sourceType: 'module', plugins: ['jsx'] });
  const dictionaries = { zh: {}, ja: {} };
  for (const node of ast.program.body) {
    const call = node.expression;
    if (call?.type !== 'CallExpression' || call.callee?.object?.name !== 'Object' || call.callee?.property?.name !== 'assign') continue;
    const [target, values] = call.arguments;
    if (target?.object?.name !== 'dictionaries' || !dictionaries[target.property.name] || values?.type !== 'ObjectExpression') continue;
    for (const prop of values.properties) dictionaries[target.property.name][prop.key.value] = prop.value.value;
  }
  const guide = read('../src/TaskGuide.jsx');
  const report = read('../docs/refactor/I18N_BATCH_D.md');
  for (const { text } of JSON.parse(read('./i18n-batch-d.scope.json'))) {
    if (['~/Documents/PhysioFlow Data', 'opacity .3s'].includes(text)) continue;
    if (/[\u3040-\u30ff\u3400-\u9fff]/u.test(text)) {
      assert.ok(!guide.includes(JSON.stringify(text)), text);
      assert.ok(report.includes(text + ' → '), text);
    } else {
      for (const lang of ['zh', 'ja']) assert.ok(dictionaries[lang][text], `${lang}: ${text}`);
    }
  }
  assert.ok(guide.includes('return t(value)'));
});
