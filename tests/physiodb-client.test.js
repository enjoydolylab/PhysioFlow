import test from 'node:test';
import assert from 'node:assert/strict';
import { createPhysioDBClient } from '../src/physioDBClient.js';
test('PhysioDB uses direct bearer auth, v1 paths and raw sample arrays with 204 support',async()=>{
 const calls=[];const client=createPhysioDBClient({baseUrl:'http://localhost:8000/api/v1/',token:'test-token'},async(url,options)=>{calls.push({url,options});return new Response(null,{status:204});});
 await client.appendSamples('stream-id',[{time:'2026-09-23T00:00:00Z',values:[0,1]}]);
 assert.equal(calls[0].url,'http://localhost:8000/api/v1/streams/stream-id/samples');
 assert.equal(calls[0].options.headers.Authorization,'Bearer test-token');
 assert.deepEqual(JSON.parse(calls[0].options.body),[{time:'2026-09-23T00:00:00Z',values:[0,1]}]);
 await client.samples('stream-id',{start:'2026-09-23T00:00:00Z',end:'2026-09-23T00:01:00Z'});
 assert.equal(new URL(calls[1].url).searchParams.get('end'),'2026-09-23T00:01:00Z');
});
test('PhysioDB failures expose status without echoing data and are never retried automatically',async()=>{
 let calls=0;const client=createPhysioDBClient({baseUrl:'http://localhost:8000',token:'test-token'},async()=>{calls++;return new Response(JSON.stringify({detail:'private sample'}),{status:409});});
 await assert.rejects(client.appendSamples('s',[]),error=>error.status===409&&!error.message.includes('private'));
 assert.equal(calls,1);
});
test('PhysioDB times out stalled response bodies without retrying writes', async () => {
 let calls = 0;
 const client = createPhysioDBClient({ baseUrl: 'http://localhost:8000', token: 'test-token', timeoutMs: 20 }, async (_url, { signal }) => {
  calls++;
  return { ok: true, status: 200, json: () => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })) };
 });
 await assert.rejects(client.appendSamples('s', []), error => error.name === 'TimeoutError' && error.message.includes('may already have been stored'));
 assert.equal(calls, 1);
});
test('PhysioDB forwards caller cancellation to the request', async () => {
 const controller = new AbortController();
 const client = createPhysioDBClient({ baseUrl: 'http://localhost:8000', token: 'test-token' }, async (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })));
 const result = client.samples('s', { start: '2026-01-01', end: '2026-01-02', signal: controller.signal });
 controller.abort();
 await assert.rejects(result, { name: 'AbortError' });
});
