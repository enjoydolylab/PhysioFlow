import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { checksumBlob } from '../src/assetChecksum.js';
import { materializePlaceholderMedia, matchUploadedMedia } from '../src/core/mediaReadiness.js';
import { fullscreenMediaInScreen, mediaPresentationMode } from '../src/core/mediaPresentation.js';

test('placeholder migration preserves order and identity, keeps duplicate basenames separate and never changes frozen content', () => {
  const p = { version: { status: 'draft' }, metadata: { migrationSpecification: { sourcePathsArePlaceholders: true } }, graph: { nodes: ['a/clip.mp4','b/clip.mp4','a/clip.mp4','https://example.test/clip.mp4'].map((sourceUrl, id) => ({ id, component: { type: 'display.media' }, config: { sourceUrl, mediaType: 'video' } })), edges: [{ id: 'keep' }] } };
  const before = structuredClone(p), next = materializePlaceholderMedia(p);
  assert.deepEqual(p, before);
  assert.equal(next.assets.length, 2);
  assert.equal(next.graph.nodes[0].config.assetId, next.graph.nodes[2].config.assetId);
  assert.notEqual(next.graph.nodes[0].config.assetId, next.graph.nodes[1].config.assetId);
  assert.equal(next.graph.nodes[3].config.sourceUrl, p.graph.nodes[3].config.sourceUrl);
  assert.deepEqual(next.graph.edges, p.graph.edges);
  assert.deepEqual(materializePlaceholderMedia(next), next);
  assert.throws(() => matchUploadedMedia(next.assets, { name: 'clip.mp4', type: 'video/mp4' }), /Multiple/);
  assert.equal(matchUploadedMedia(next.assets, { name: 'renamed.mp4', type: 'video/mp4' }, next.assets[0].id).id, next.assets[0].id);
  assert.throws(() => matchUploadedMedia(next.assets, { name: 'clip.mp4', type: 'image/png' }, next.assets[0].id), /Expected video/);
  p.version.status = 'frozen';
  assert.deepEqual(materializePlaceholderMedia(p), p);
});

test('video integrity hashing uses bounded reads and agrees with native SHA-256 across chunk boundaries', async () => {
  for (const size of [0, 55, 64, 4 * 1024 * 1024 + 127, 20 * 1024 * 1024 + 1]) {
    const data = new Uint8Array(size).fill(37);
    const blob = new Blob([data]);
    blob.arrayBuffer = () => { throw new Error('Whole file allocation forbidden'); };
    const slice = blob.slice.bind(blob); let largest = 0;
    blob.slice = (start, end) => { largest = Math.max(largest, end - start); return slice(start, end); };
    assert.equal(await checksumBlob(blob), createHash('sha256').update(data).digest('hex'));
    assert.ok(largest <= 4 * 1024 * 1024);
  }
});

test('viewport presentation is opt-in and applies only to images and videos', () => {
  const video = { id: 'v', type: 'Media', props: { mediaType: 'video', presentationMode: 'fullscreen-contain' } };
  assert.equal(fullscreenMediaInScreen({ type: 'Screen', children: [{ type: 'Layout', children: [video] }] }), video);
  assert.equal(mediaPresentationMode({ ...video, props: { ...video.props, mediaType: 'audio' } }), 'standard');
  assert.equal(mediaPresentationMode({ ...video, props: { mediaType: 'video' } }), 'standard');
});

test('pending placeholders block freeze but remain importable, and unused manifest entries do not block', async () => {
  const { createProtocolGraph, createCoreComponentRegistry, insertNodeOnControlEdge, validateProtocolGraphConfiguration, validateProtocolGraphForFreeze } = await import('../src/core/index.js');
  const registry = createCoreComponentRegistry(); let p = createProtocolGraph();
  p = insertNodeOnControlEdge(p,p.graph.edges[0].id,'display.media',{config:{...registry.get('display.media').defaultConfig,assetId:'pending',mediaType:'video'}}).protocol;
  p.assets=[{id:'pending',fileName:'qa.webm',mediaType:'video',sourceMode:'manifest'}];
  assert.equal(validateProtocolGraphConfiguration(p,registry).valid,true);
  assert.ok(validateProtocolGraphForFreeze(p,registry).errors.some(e=>e.code==='config.media_upload_required'));
  p.assets[0].sourceMode='upload';
  p.assets.push({id:'unused',sourceMode:'manifest'});
  assert.equal(validateProtocolGraphForFreeze(p,registry).valid,true);
});

test('runtime retains only assigned pool item and current nested UI assets', async () => {
  const { presentationAssetReferences } = await import('../src/runtime/mediaResources.js');
  const protocol = { assets: ['one','two','logo'].map(id=>({id})), stimulusPools:[{id:'pool',assetIds:['one','two']}] };
  const node = {config:{assetId:'two',stimulusPoolId:'pool',ui:{root:{type:'Screen',children:[{type:'Media',props:{assetId:'logo'}}]}}}};
  assert.deepEqual(presentationAssetReferences(protocol,node).map(a=>a.asset_id),['two','logo']);
  assert.deepEqual(presentationAssetReferences(protocol,null),[]);
  assert.equal(node.config.stimulusPoolId,'pool');
});
