import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHostedNodeServer } from '../server/createHostedNodeServer.mjs';
import { createPhysioDBBridge } from '../server/physioDBBridge.mjs';
import { createPhysioDBServiceClient } from '../src/physioDBServiceClient.js';

test('SDK bridge is owner-only, actor/tenant scoped and never exposes DB credentials', async t => {
  const root = await mkdtemp(join(tmpdir(), 'pf-sdk-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'dist'));
  await writeFile(join(root, 'dist', 'index.html'), '<main>PF entry</main>');
  const calls = [];
  const bridge = createPhysioDBBridge({ credentials: [{ actorId: 'owner', tenantId: 'default', baseUrl: 'https://physiodb.test', token: 'db-private-secret' }], execute: async rpc => { calls.push(rpc); return { result: [{ id: 'research' }] }; } });
  const hosted = await createHostedNodeServer({
    actors: [
      { actorId: 'owner', role: 'owner', accessToken: 'pf-owner' },
      { actorId: 'viewer', role: 'viewer', accessToken: 'pf-viewer' },
      { actorId: 'owner', role: 'owner', tenantId: 'other', accessToken: 'pf-other' },
    ], credentialKeys: [{ keyId: 'test', secret: 'test-credential-secret-at-least-32-characters' }],
    stateFile: join(root, 'state.json'), staticDirectory: join(root, 'dist'), physioDBBridge: bridge,
  });
  const { baseUrl } = await hosted.listen(0);
  t.after(() => hosted.close());
  for (const [token, status] of [['unknown', 403], ['pf-viewer', 403], ['pf-other', 503]]) {
    await assert.rejects(createPhysioDBServiceClient({ baseUrl, accessToken: token }).researches(), error => error.status === status);
  }
  assert.equal(calls.length, 0);
  assert.deepEqual(await createPhysioDBServiceClient({ baseUrl, accessToken: 'pf-owner' }).researches(), [{ id: 'research' }]);
  assert.equal(calls[0].token, 'db-private-secret');
  assert.equal(calls[0].apiUrl, 'https://physiodb.test/api/v1');
  const invalid = await fetch(`${baseUrl}/v1/physiodb/rpc`, { method: 'POST', headers: { Authorization: 'Bearer pf-owner', 'Content-Type': 'application/json' }, body: JSON.stringify({ operation: 'deleteResearch', args: {} }) });
  assert.equal(invalid.status, 400);
  assert.equal(calls.length, 1);
  for (const route of ['/admin', '/admin/', '/participant']) assert.equal((await fetch(`${baseUrl}${route}`)).status, 200);
});
