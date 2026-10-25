import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parse } from '@babel/parser';

test('batch A2 covers all 18 English source strings in Japanese and Chinese', () => {
  const source = readFileSync(new URL('../src/i18n.jsx', import.meta.url), 'utf8');
  const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
  const dictionaries = { ja: {}, zh: {} };
  for (const statement of ast.program.body) {
    const call = statement.expression;
    if (call?.callee?.object?.name !== 'Object' || call.callee.property?.name !== 'assign') continue;
    const [target, values] = call.arguments;
    if (target?.object?.name !== 'dictionaries' || !dictionaries[target.property?.name]) continue;
    for (const property of values.properties || []) {
      if (property.key?.type === 'StringLiteral' && property.value?.type === 'StringLiteral') {
        dictionaries[target.property.name][property.key.value] = property.value.value;
      }
    }
  }
  const keys = [
    'Awaiting operator', 'Equipment check', 'Experiment stimulus', 'How do you feel?',
    'Please rate', 'Please read the instructions carefully.', 'Verify the setup, then continue.',
    'Verify viewing distance and screen dimensions before continuing.', 'Choose a stimulus image',
    'Compare the two images.', 'Observe the image.', 'Element X', 'Final session save failed:',
    "Device samples are kept in this browser's session package; runtime synchronization does not upload the device sample stream.",
    'Hosted runtime sync requires a client and hosted session metadata',
    'Control handler ID must use lowercase dot/dash notation',
    'Control handler needs an execute function', 'Control handler version must use semantic versioning',
  ];
  for (const language of ['ja', 'zh']) {
    for (const key of keys) {
      const value = dictionaries[language][key];
      assert.ok(value && value !== key, `${language}: ${key}`);
      assert.match(value, /[\u3040-\u30ff\u3400-\u9fff]/u, `${language}: ${key}`);
      assert.deepEqual(value.match(/\{[^}]+\}/g) || [], key.match(/\{[^}]+\}/g) || []);
    }
  }
});
