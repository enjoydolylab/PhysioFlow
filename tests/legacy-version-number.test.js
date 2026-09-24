import test from 'node:test';
import assert from 'node:assert/strict';
import { protocol, createNextProtocolVersion } from '../src/domain.js';

test('legacy history allocates a new version after archived and graph versions of the same project', () => {
  const source = protocol();
  source.version = 1;
  source.status = 'frozen';
  const existingProtocols = [
    { ...structuredClone(source), version: 2, status: 'draft' },
    { ...structuredClone(source), version: 4, archived_at: '2026-09-23' },
    { projectId: source.project_id, version: { number: 5, status: 'draft' } },
    { project_id: 'other', version: 99 },
  ];
  const original = structuredClone({ source, existingProtocols });
  const next = createNextProtocolVersion(source, { existingProtocols });
  assert.equal(next.version, 6);
  assert.equal(next.status, 'draft');
  assert.notEqual(next.protocol_id, source.protocol_id);
  assert.deepEqual(next.blocks, source.blocks);
  assert.deepEqual({ source, existingProtocols }, original);
  assert.equal(createNextProtocolVersion(source).version, 2);
});
