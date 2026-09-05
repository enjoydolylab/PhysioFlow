import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyGraphProtocolAssets } from '../src/assetStore.js';

test('media preflight detects modified bytes even when saved metadata checksum matches', async () => {
  const checksum = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('original'))).toString('hex');
  const protocol = { assets: [{ id: 'image', checksum }], graph: { nodes: [{ config: { assetId: 'image' } }] } };
  const valid = await verifyGraphProtocolAssets(protocol, async () => ({ checksum, file: new Blob(['original']) }));
  assert.equal(valid.valid, true);
  const invalid = await verifyGraphProtocolAssets(protocol, async () => ({ checksum, file: new Blob(['corrupted']) }));
  assert.equal(invalid.issues[0].type, 'checksum_mismatch');
});
