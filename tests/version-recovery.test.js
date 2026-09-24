import test from 'node:test';
import assert from 'node:assert/strict';
import { archiveProtocol, createProtocolGraph, createCoreComponentRegistry, freezeProtocolGraph, hashProtocolGraph } from '../src/core/index.js';

test('removing and restoring a frozen graph preserves identity, configuration and frozen hash', async () => {
  const frozen = await freezeProtocolGraph(createProtocolGraph({ name: 'Recovery acceptance' }), createCoreComponentRegistry());
  const original = structuredClone(frozen);
  const archived = archiveProtocol(frozen, '2026-09-23T12:00:00.000Z');
  const restored = archiveProtocol(archived, null);
  assert.equal(archived.audit.archivedAt, '2026-09-23T12:00:00.000Z');
  assert.equal(restored.audit.archivedAt, null);
  assert.ok(Number.isFinite(Date.parse(restored.audit.updatedAt)));
  for (const version of [archived, restored]) {
    assert.equal(version.protocolId, frozen.protocolId);
    assert.equal(version.projectId, frozen.projectId);
    assert.deepEqual(version.version, frozen.version);
    assert.deepEqual(version.graph, frozen.graph);
    assert.deepEqual(version.freeze, frozen.freeze);
    assert.equal(await hashProtocolGraph(version), frozen.freeze.configHash);
  }
  assert.deepEqual(frozen, original);
});
