import test from 'node:test';
import assert from 'node:assert/strict';
import { previewResourceIds } from '../src/composer/mediaPerformance.js';
test('preview loads selected and fullscreen node references, including nested UI and shared pools', () => {
  const protocol = { stimulusPools: [{ id: 'used', assetIds: ['p1','p2'] }, { id: 'unused', assetIds: ['unused'] }] };
  const selected = { component: { type: 'display.media' }, config: { stimulusPoolId: 'used', ui: { root: { type: 'Screen', children: [{ type: 'Stack', children: [{ type: 'Media', props: { assetId: 'nested' } }] }] } } } };
  const fullscreen = { component: { type: 'display.media' }, config: { assetId: 'direct', stimulusPool: { enabled: true, assetIds: ['inline'] } } };
  assert.deepEqual([...previewResourceIds(protocol, [selected, fullscreen])].sort(), ['direct','inline','nested','p1','p2']);
  assert.deepEqual([...previewResourceIds(protocol, [null])], []);
  assert.deepEqual([...previewResourceIds(protocol, [fullscreen])].sort(), ['direct','inline']);
});
