import test from 'node:test';
import assert from 'node:assert/strict';
import { createCoreComponentRegistry, createProtocolGraph, insertNodeOnControlEdge, createUiElement, validateProtocolGraphConfiguration } from '../src/core/index.js';
import { schemaForNode } from '../src/runtime/nodeSchema.js';

function mediaProtocol() {
  const registry = createCoreComponentRegistry();
  const p = createProtocolGraph();
  const definition = registry.get('display.media');
  const { protocol } = insertNodeOnControlEdge(p, p.graph.edges[0].id, definition.type, { config: structuredClone(definition.defaultConfig) });
  const node = protocol.graph.nodes.find(n => n.component.type === definition.type);
  return { registry, definition, protocol, node };
}

test('node media sources suppress only the primary element warning, retaining missing extra media and invalid pool errors', () => {
  const { protocol, registry, node } = mediaProtocol();
  node.config.stimulusPoolId = 'images';
  protocol.assets = [{ id: 'a', mediaType: 'image', sourceUrl: 'https://example.test/a.png' }];
  protocol.stimulusPools = [{ id: 'images', name: 'Images', mediaType: 'image', assetIds: ['a'] }];
  let result = validateProtocolGraphConfiguration(protocol, registry);
  assert.equal(result.warnings.some(x => x.code === 'config.ui.media_source_missing'), false);
  const extra = createUiElement('Media');
  node.config.ui.root.children.push(extra);
  result = validateProtocolGraphConfiguration(protocol, registry);
  assert.deepEqual(result.warnings.filter(x => x.code === 'config.ui.media_source_missing').map(x => x.elementId), [extra.id]);
  protocol.stimulusPools = [];
  assert.ok(validateProtocolGraphConfiguration(protocol, registry).errors.some(x => x.code === 'config.stimulus_pool_missing'));
});

test('playback-ended completion rejects images and accepts audio/video', () => {
  const { protocol, registry, node } = mediaProtocol();
  node.config.sourceUrl = 'https://example.test/media';
  node.config.completion.mode = 'media-ended';
  for (const mediaType of ['image', 'audio', 'video']) {
    node.config.mediaType = mediaType;
    const errors = validateProtocolGraphConfiguration(protocol, registry).errors;
    assert.equal(errors.some(x => x.code === 'config.media_end_requires_playback'), mediaType === 'image');
  }
});

test('playback-ended removes nested advance actions without changing stored UI or unrelated controls', () => {
  const { node, definition } = mediaProtocol();
  node.config.mediaType = 'video';
  node.config.completion.mode = 'media-ended';
  const nested = createUiElement('Layout', { actions: [{ event: 'click', action: 'next' }], children: [
    createUiElement('Button', { actions: [{ event: 'click', action: 'submit' }] }),
    createUiElement('Button', { props: { label: 'Other control' }, actions: [] }),
  ] });
  node.config.ui.root.children.push(nested);
  const before = structuredClone(node.config.ui);
  const resolved = schemaForNode(node, definition, []);
  const layout = resolved.root.children.find(x => x.id === nested.id);
  assert.deepEqual(layout.actions, []);
  assert.equal(layout.children.length, 1);
  assert.equal(layout.children[0].props.label, 'Other control');
  assert.deepEqual(node.config.ui, before);
});

test('balanced pool configuration blocks malformed schedules before setup or freeze', () => {
  const { protocol, registry, node } = mediaProtocol();
  const second = structuredClone(node);
  second.id = 'second-balanced-slot';
  protocol.graph.nodes.push(second);
  for (const [index, slot] of [node, second].entries()) {
    slot.config.stimulusPoolId = 'balanced';
    slot.metadata = { half: index + 1, trialIndex: index + 1 };
  }
  protocol.assets = ['a', 'b'].map(id => ({ id, category: 'calm', mediaType: 'image', sourceUrl: `https://example.test/${id}.png` }));
  protocol.stimulusPools = [{ id: 'balanced', name: 'Balanced', mediaType: 'image', randomizationMode: 'balanced-halves', assetIds: ['a', 'b'] }];
  const errors = () => validateProtocolGraphConfiguration(protocol, registry).errors.filter(e => e.code.startsWith('config.stimulus_pool'));
  assert.deepEqual(errors(), []);
  delete second.metadata.half;
  assert.ok(errors().some(e => e.code === 'config.stimulus_pool_balance_invalid' && /metadata.half/.test(e.message)));
  second.metadata.half = 2;
  delete protocol.assets[0].category;
  assert.ok(errors().some(e => /category/.test(e.message)));
  protocol.assets[0].category = 'calm';
  second.metadata.half = 1;
  assert.ok(errors().some(e => /half sizes/.test(e.message)));
  second.metadata.half = 2;
  protocol.stimulusPools[0].randomizationMode = 'typo';
  assert.ok(errors().some(e => e.code === 'config.stimulus_pool_mode_invalid'));
});
