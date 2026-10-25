import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { pfUIStrings } from '../src/pfUIStrings.js';

test('batch C covers every scoped record and database message in Chinese and Japanese', () => {
  const scope = JSON.parse(readFileSync(new URL('./i18n-batch-c.scope.json', import.meta.url), 'utf8'));
  const skipped = new Set(['BrainFlow samples.jsonl', '1, EEG1, uV']);
  assert.equal(scope.length, 67);
  for (const { text } of scope) {
    if (skipped.has(text)) continue;
    for (const language of ['zh', 'ja']) {
      const translation = pfUIStrings[language][text];
      assert.ok(translation && translation !== text, `${language}: ${text}`);
      assert.match(translation, /[\u3040-\u30ff\u3400-\u9fff]/u, `${language}: ${text}`);
    }
  }
  const upload = readFileSync(new URL('../src/PhysioDBUpload.jsx', import.meta.url), 'utf8');
  // Reader errors remain stable for callers, and are translated before display.
  assert.ok(upload.includes('${t(failure.message)}'));
  assert.ok(upload.includes("t('Request timed out.')"));
  const inspector = readFileSync(new URL('../src/composer/Inspector.jsx', import.meta.url), 'utf8');
  assert.ok(inspector.includes("<b>{t('Migration review required')}</b>"));
});
