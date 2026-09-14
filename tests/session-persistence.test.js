import test from 'node:test';
import assert from 'node:assert/strict';
import { persistFinishedSession } from '../src/runtime/sessionPersistence.js';

test('failed final persistence retains the recovery checkpoint', async () => {
  let cleared = false;
  await assert.rejects(persistFinishedSession({}, {
    saveSession: async () => { throw new Error('Disk full'); },
    clearCurrentRun: async () => { cleared = true; },
  }), /Disk full/);
  assert.equal(cleared, false);
});

test('cleanup failure reports saved data separately from the stale checkpoint', async () => {
  const calls = [];
  const result = await persistFinishedSession({ session_id: 's1' }, {
    saveSession: async session => { calls.push(session.session_id); },
    clearCurrentRun: async () => { calls.push('cleanup'); throw new Error('Permission lost'); },
  });
  assert.deepEqual(calls, ['s1', 'cleanup']);
  assert.equal(result.cleanupError, 'Permission lost');
});

test('successful final persistence removes the checkpoint after saving', async () => {
  const calls = [];
  const result = await persistFinishedSession({}, {
    saveSession: async () => { calls.push('save'); },
    clearCurrentRun: async () => { calls.push('cleanup'); },
  });
  assert.deepEqual(calls, ['save', 'cleanup']);
  assert.equal(result.cleanupError, '');
});
