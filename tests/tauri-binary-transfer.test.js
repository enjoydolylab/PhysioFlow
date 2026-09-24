import test from 'node:test';
import assert from 'node:assert/strict';
import { readBlob, writeBlob } from '../src/tauriStorage.js';

test('desktop blob transfer uses bounded IPC chunks and commits only the last chunk', async t => {
  const original = globalThis.window; t.after(() => { if (original === undefined) delete globalThis.window; else globalThis.window = original; });
  const calls = [], data = new Uint8Array(2 * 1024 * 1024 + 19).fill(53);
  globalThis.window = { __TAURI_INTERNALS__: { invoke: async (command, args) => {
    calls.push({command, ...args});
    if (command === 'binary_size') return data.length;
    if (command === 'read_binary_chunk') return Array.from(data.slice(args.offset, args.offset + args.length));
    return true;
  } } };
  const blob = new Blob([data]); blob.arrayBuffer = () => { throw new Error('Whole-blob IPC forbidden'); };
  assert.equal(await writeBlob('assets/test.bin', blob), true);
  const writes = calls.filter(c => c.command === 'write_binary_chunk');
  assert.deepEqual(writes.map(c => c.bytes.length), [1048576,1048576,19]);
  assert.deepEqual(writes.map(c => c.finalChunk), [false,false,true]);
  assert.equal(new Set(writes.map(c => c.uploadId)).size,1);
  const read = await readBlob('assets/test.bin');
  assert.deepEqual(new Uint8Array(await read.arrayBuffer()),data);
});

test('desktop failed chunk aborts the upload and propagates the original failure', async t => {
  const original = globalThis.window; t.after(() => { if (original === undefined) delete globalThis.window; else globalThis.window = original; });
  const calls = [], failure = new Error('Disk full');
  globalThis.window = { __TAURI_INTERNALS__: { invoke: async (command,args) => {calls.push({command,...args});if(command==='write_binary_chunk')throw failure;return true;} } };
  await assert.rejects(writeBlob('assets/test.bin',new Blob(['abc'])),e=>e===failure);
  assert.deepEqual(calls.map(c=>c.command),['write_binary_chunk','abort_binary_upload']);
  assert.equal(calls[0].uploadId,calls[1].uploadId);
});
