import test from 'node:test';
import assert from 'node:assert/strict';
import { saveFile } from '../src/app/uiHelpers.js';

test('failed download dispatch releases its blob and propagates failure to the export alert', t => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'document');
  t.after(() => { if (original) Object.defineProperty(globalThis, 'document', original); else delete globalThis.document; });
  const failure = new Error('Download unavailable');
  globalThis.document = { createElement: () => ({ click() { throw failure; } }) };
  t.mock.method(URL, 'createObjectURL', () => 'blob:failed-download');
  const revoke = t.mock.method(URL, 'revokeObjectURL', () => {});
  assert.throws(() => saveFile('protocol.json', '{}'), error => error === failure);
  assert.deepEqual(revoke.mock.calls.map(call => call.arguments), [['blob:failed-download']]);
});

test('consecutive successful downloads keep independent data, filenames and delayed cleanup', async t => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'document');
  t.after(() => { if (original) Object.defineProperty(globalThis, 'document', original); else delete globalThis.document; });
  const anchors = [], blobs = [], timers = [];
  globalThis.document = { createElement: () => { const a = { click() { anchors.push({ href: this.href, name: this.download }); } }; return a; } };
  t.mock.method(URL, 'createObjectURL', blob => { blobs.push(blob); return `blob:${blobs.length}`; });
  const revoke = t.mock.method(URL, 'revokeObjectURL', () => {});
  t.mock.method(globalThis, 'setTimeout', (fn, delay) => { timers.push({ fn, delay }); });
  saveFile('first.json', '{"version":1}');
  saveFile('second.json', '{"version":2}');
  assert.deepEqual(anchors, [{ href: 'blob:1', name: 'first.json' }, { href: 'blob:2', name: 'second.json' }]);
  assert.deepEqual(await Promise.all(blobs.map(blob => blob.text())), ['{"version":1}', '{"version":2}']);
  assert.equal(revoke.mock.callCount(), 0);
  for (const timer of timers) { assert.equal(timer.delay, 30000); timer.fn(); }
  assert.deepEqual(revoke.mock.calls.map(call => call.arguments), [['blob:1'], ['blob:2']]);
});
