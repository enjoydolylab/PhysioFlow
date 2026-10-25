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

const sseResponse = chunks => new Response(new ReadableStream({
 start(controller) {
  const encoder = new TextEncoder();
  for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
  controller.close();
 }
}), { status: 200, headers: { 'Content-Type': 'text/event-stream' } });

test('followSamples sends bearer auth to the follow endpoint and yields one sample per element', async () => {
 const calls = [];
 const chunks = [
  'event: samples-created\ndata: [{"time":"2026-01-01T00:00:00Z","values":[1,2]}]\n\n',
  'event: samples-created\ndata: [{"time":"2026-01-01T00:00:04Z","values":[3,4]}]\n\n'
 ];
 const client = createPhysioDBClient({ baseUrl: 'http://localhost:8000', token: 'test-token' }, async (url, options) => {
  calls.push({ url, options });
  return sseResponse(chunks);
 });
 const received = [];
 for await (const sample of client.followSamples('stream-1')) received.push(sample);
 assert.equal(received.length, 2);
 assert.deepEqual(received[0], { time: '2026-01-01T00:00:00Z', values: [1, 2] });
 assert.deepEqual(received[1], { time: '2026-01-01T00:00:04Z', values: [3, 4] });
 assert.equal(calls[0].options.headers.Authorization, 'Bearer test-token');
 assert.equal(calls[0].options.headers.Accept, 'text/event-stream');
 assert.equal(new URL(calls[0].url).searchParams.get('follow'), 'true');
});

test('followSamples reassembles a frame split across chunk boundaries', async () => {
 const chunks = [
  'event: samples-created\ndata: [{"time":"2026-01-01T00:00:04Z","values":[3',
  ',4]}]\n\n'
 ];
 const client = createPhysioDBClient({ baseUrl: 'http://localhost:8000', token: 't' }, async () => sseResponse(chunks));
 const received = [];
 for await (const sample of client.followSamples('s')) received.push(sample);
 assert.equal(received.length, 1);
 assert.deepEqual(received[0].values, [3, 4]);
});

test('followSamples accepts CRLF frame separators', async () => {
 const chunks = ['event: samples-created\r\ndata: [{"time":"2026-01-01T00:00:00Z","values":[9]}]\r\n\r\n'];
 const client = createPhysioDBClient({ baseUrl: 'http://localhost:8000', token: 't' }, async () => sseResponse(chunks));
 const received = [];
 for await (const sample of client.followSamples('s')) received.push(sample);
 assert.equal(received.length, 1);
 assert.deepEqual(received[0].values, [9]);
});

test('followEvents yields event-created payloads and ignores sample frames', async () => {
 const chunks = [
  'event: samples-created\ndata: [{"time":"2026-01-01T00:00:00Z","values":[1]}]\n\n',
  'event: event-created\ndata: {"id":"e1","event_type":"stimulus","data":{"valence":3}}\n\n'
 ];
 const client = createPhysioDBClient({ baseUrl: 'http://localhost:8000', token: 't' }, async () => sseResponse(chunks));
 const received = [];
 for await (const event of client.followEvents('exp-1', 'par-1')) received.push(event);
 assert.equal(received.length, 1);
 assert.equal(received[0].id, 'e1');
 assert.deepEqual(received[0].data, { valence: 3 });
});

test('a rejected follow request reports its status and does not retry', async () => {
 let calls = 0;
 const client = createPhysioDBClient({ baseUrl: 'http://localhost:8000', token: 't' }, async () => {
  calls++;
  return new Response('denied', { status: 403 });
 });
 await assert.rejects(async () => {
  for await (const sample of client.followSamples('s')) void sample;
 }, error => error.status === 403);
 assert.equal(calls, 1);
});

test('aborting a follow subscription stops the stream without reporting an error', async () => {
 const controller = new AbortController();
 const client = createPhysioDBClient({ baseUrl: 'http://localhost:8000', token: 't' }, async (_url, { signal }) => {
  const body = new ReadableStream({
   start(c) {
    c.enqueue(new TextEncoder().encode('event: samples-created\ndata: [{"time":"2026-01-01T00:00:00Z","values":[1]}]\n\n'));
    signal.addEventListener('abort', () => c.error(new DOMException('Aborted', 'AbortError')), { once: true });
   }
  });
  return new Response(body, { status: 200 });
 });
 const received = [];
 await assert.rejects(async () => {
  for await (const sample of client.followSamples('s', { signal: controller.signal })) {
   received.push(sample);
   controller.abort();
  }
 }, { name: 'AbortError' });
 assert.equal(received.length, 1);
});
