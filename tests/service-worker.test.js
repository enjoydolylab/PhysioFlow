import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
test('worker loads fresh online navigation and never intercepts authenticated or API requests', async () => {
  const listeners = {}, saved = []; let online = true;
  runInNewContext(await readFile(new URL('../public/sw.js', import.meta.url), 'utf8'), { URL, Response, self: { location: { origin: 'https://pf.test' }, addEventListener: (name, fn) => { listeners[name] = fn; } }, caches: { match: async () => new Response('old shell'), open: async () => ({ put: async (request) => saved.push(request.url) }) }, fetch: async () => { if (!online) throw new Error('offline'); return new Response('new shell', { headers: { 'content-type': 'text/html' } }); } });
  const navigate = () => { let response; listeners.fetch({ request: { method: 'GET', mode: 'navigate', url: 'https://pf.test/admin', headers: new Headers() }, respondWith: value => { response = value; } }); return response; };
  assert.equal(await (await navigate()).text(), 'new shell');
  online = false; assert.equal(await (await navigate()).text(), 'old shell');
  for (const [url, headers] of [['https://pf.test/v1/physiodb/bindings', {}], ['https://pf.test/metrics', {}], ['https://pf.test/admin', { authorization: 'Bearer private' }], ['https://db.test/api/data', {}]]) {
    listeners.fetch({ request: { method: 'GET', mode: 'cors', url, headers: new Headers(headers) }, respondWith: () => assert.fail('private request must bypass worker') });
  }
  assert.deepEqual(saved, ['https://pf.test/admin']);
});
