import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { parse } from '@babel/parser';
import { messageTemplates, translateMessage } from '../src/i18nMessage.js';
import { buildJointExportFiles } from '../src/data/jointExport.js';
import { HostedRuntimeSync } from '../src/hosted/hostedRuntimeSync.js';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const dictionaries = { zh: {}, ja: {} };
const ast = parse(read('../src/i18n.jsx'), { sourceType: 'module', plugins: ['jsx'] });
for (const node of ast.program.body) {
  const call = node.expression;
  if (call?.callee?.object?.name !== 'Object' || call.callee.property?.name !== 'assign') continue;
  const [target, values] = call.arguments;
  if (target?.object?.name !== 'dictionaries' || !dictionaries[target.property.name] || values?.type !== 'ObjectExpression') continue;
  for (const prop of values.properties) dictionaries[target.property.name][prop.key.value] = prop.value.value;
}

test('E2 covers its display catalog and preserves every interpolated parameter', () => {
  for (const key of JSON.parse(read('./i18n-batch-e2.scope.json'))) {
    for (const lang of ['zh', 'ja']) {
      const dictionary = dictionaries[lang];
      assert.ok(dictionary[key], `${lang}: ${key}`);
      const message = key.replace(/\{(\d+)\}/g, (_, index) => `parameter-${index}`);
      const expected = dictionary[key].replace(/\{(\d+)\}/g, (_, index) => `parameter-${index}`);
      assert.equal(translateMessage(message, dictionary, messageTemplates), expected, `${lang}: ${key}`);
      assert.deepEqual([...dictionary[key].matchAll(/\{\d+\}/g)].map(m => m[0]).sort(), [...key.matchAll(/\{\d+\}/g)].map(m => m[0]).sort(), key);
    }
  }
});

test('E2 localizes hosted runtime errors at display time without changing the error', async () => {
  const sync = new HostedRuntimeSync({ client: {}, session: { sessionId: 'stable-session', revision: 1, nextEventSequence: 1 } });
  await assert.rejects(sync.sync({ events: [{ sequence: 3 }] }), error => {
    assert.equal(error.message, 'Hosted runtime event gap: expected 1, found 3');
    for (const lang of ['zh', 'ja']) assert.equal(translateMessage(error.message, dictionaries[lang], messageTemplates), dictionaries[lang]['Hosted runtime event gap: expected {0}, found {1}'].replace('{0}', '1').replace('{1}', '3'));
    return true;
  });
  assert.equal(sync.status().error, 'Hosted runtime event gap: expected 1, found 3');
});

test('E2 keeps joint export warnings and protocol content authored while translating their display', () => {
  const result = buildJointExportFiles({ sessionFiles: { 'samples.jsonl': '{"channel":"sensor"}\n' } });
  const warning = result.manifest.warnings[0];
  assert.equal(warning, 'No BioDB export was attached; this package contains the PF session only.');
  for (const lang of ['zh', 'ja']) {
    assert.notEqual(translateMessage(warning, dictionaries[lang], messageTemplates), warning);
    for (const content of ['Five-condition emotion physiology experiment', 'Go/No-Go practice', 'Choose the emotion closest to your current feeling']) assert.equal(translateMessage(content, dictionaries[lang], messageTemplates), content);
  }
  assert.deepEqual(JSON.parse(result.files['joint_manifest.json']).warnings, [warning]);
  assert.equal(result.files['samples.jsonl'], '{"channel":"sensor"}\n');
});

test('E2 audit separates allowlisted values and leaves no app or hosted UI backlog', () => {
  const run = spawnSync(process.execPath, ['scripts/audit-i18n.mjs'], { cwd: new URL('../', import.meta.url), encoding: 'utf8', input: '' });
  assert.equal(run.status, 0, run.stderr);
  const summary = JSON.parse(run.stdout);
  assert.equal(summary.appHosted.missing, 0);
  assert.equal(summary.appHosted.allowlisted, 0);
  assert.ok(summary.appHosted.present > 0);
  const report = read('../docs/refactor/I18N_AUDIT.md');
  const missing = report.split('## Missing candidates\n')[1].split('## Present candidates')[0];
  const allowlist = JSON.parse(read('../scripts/i18n-allowlist.json'));
  assert.ok(report.includes('## Allowlisted candidates'));
  for (const { text, reason } of allowlist) {
    assert.ok(['content', 'data', 'multilingual'].includes(reason));
    assert.ok(!missing.includes('`' + text.replaceAll('`', '') + '`'), text);
  }
  for (const text of ['✓ Response detected', '✓ 反応を検出しました', '✓ 已检测到响应', 'Five-condition emotion physiology experiment', 'Go/No-Go practice', 'Choose the emotion closest to your current feeling', '- elapsed_monotonic_ms: monotonic milliseconds since session start for within-session intervals.']) assert.ok(allowlist.some(row => row.text === text), text);
  for (const text of ['Download data package again', 'No instruction text — the response buttons are the primary interface']) assert.ok(!allowlist.some(row => row.text === text), text);
});
