import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCoreComponentRegistry,
  createProtocolGraph,
  createStimulusPool,
  participantUiTemplate,
  resolveStimulusAssignments,
  validateProtocolGraphConfiguration,
  withStimulusAssignment,
} from '../src/core/index.js';
import { localResourceManifest, schemaForNode } from '../src/runtime/nodeSchema.js';

function fixture() {
  const protocol = createProtocolGraph({ name: 'Stimulus pool test' });
  protocol.assets = ['a', 'b', 'c'].map(id => ({ id, name: id.toUpperCase(), mediaType: 'image', sourceUrl: `https://example.test/${id}.png` }));
  protocol.stimulusPools = [{ id: 'main', name: 'Main stimuli', mediaType: 'image', assetIds: ['a', 'b', 'c'] }];
  const mediaConfig = id => ({
    mediaType: 'image',
    assetId: null,
    sourceUrl: '',
    stimulusPoolId: 'main',
    ui: participantUiTemplate('media'),
    completion: { mode: 'fixed', durationMs: 1000 },
    id,
  });
  protocol.graph.nodes.push(
    { id: 'slot-1', component: { type: 'display.media', version: '1.0.0' }, label: 'Slot 1', config: mediaConfig('slot-1'), bindings: {}, layout: { x: 0, y: 0 }, metadata: {} },
    { id: 'slot-2', component: { type: 'display.media', version: '1.0.0' }, label: 'Slot 2', config: mediaConfig('slot-2'), bindings: {}, layout: { x: 0, y: 0 }, metadata: {} },
    { id: 'slot-3', component: { type: 'display.media', version: '1.0.0' }, label: 'Slot 3', config: mediaConfig('slot-3'), bindings: {}, layout: { x: 0, y: 0 }, metadata: {} },
  );
  return protocol;
}

test('execution history consumes the complete pool with uneven sibling visits and stable retries', () => {
  const protocol = fixture();
  const history = [];
  const seen = [];
  for (const id of ['slot-1', 'slot-1', 'slot-2']) {
    const first = resolveStimulusAssignments(protocol, 'session', history).get(id);
    assert.deepEqual(resolveStimulusAssignments(protocol, 'session', history).get(id), first);
    seen.push(first.assetId);
    history.push(id);
  }
  assert.equal(new Set(seen).size, 3);
  assert.equal(resolveStimulusAssignments(protocol, 'session', history).get('slot-3').assetId, seen[0]);
});

test('stimulus pools keep fixed slots and assign assets reproducibly without replacement', () => {
  const protocol = fixture();
  const first = resolveStimulusAssignments(protocol, 'session-seed');
  const repeated = resolveStimulusAssignments(protocol, 'session-seed');
  assert.deepEqual([...first], [...repeated]);
  assert.deepEqual([...first.keys()], ['slot-1', 'slot-2', 'slot-3']);
  assert.equal(new Set([...first.values()].map(value => value.assetId)).size, 3);

  const repeatedSlotProtocol = fixture();
  repeatedSlotProtocol.graph.nodes = repeatedSlotProtocol.graph.nodes.filter(node => node.id === 'slot-1' || node.component.type !== 'display.media');
  const draws = [0, 1, 2].map(prior => resolveStimulusAssignments(repeatedSlotProtocol, 'session-seed', { 'slot-1': prior }).get('slot-1').assetId);
  assert.equal(new Set(draws).size, 3, 'a looped media node draws the whole pool without replacement before it repeats');
  const recycled = resolveStimulusAssignments(repeatedSlotProtocol, 'session-seed', { 'slot-1': 3 }).get('slot-1').assetId;
  assert.equal(recycled, draws[0], 'the pool cycles again in the same order after exhaustion');
});

test('a retry re-presents the same stimulus; a completed forward re-entry draws the next', () => {
  // A single media node repeated by a loop: its k-th forward presentation is the k-th
  // pool item, and a retry of an un-completed occurrence must not advance to another.
  const protocol = fixture();
  protocol.graph.nodes = protocol.graph.nodes.filter(node => node.id === 'slot-1' || node.component.type !== 'display.media');
  const slot = 'slot-1';
  const first = resolveStimulusAssignments(protocol, 'seed', { [slot]: 0 }).get(slot);
  const retried = resolveStimulusAssignments(protocol, 'seed', { [slot]: 0 }).get(slot);
  assert.equal(retried.assetId, first.assetId, 'an operator retry (un-completed occurrence) keeps the same stimulus');
  assert.equal(retried.attempt, 1, 'the presentation ordinal does not advance on retry');
  const advanced = resolveStimulusAssignments(protocol, 'seed', { [slot]: 1 }).get(slot);
  assert.notEqual(advanced.assetId, first.assetId, 'completing and re-entering draws the next stimulus');
  assert.equal(advanced.attempt, 2, 'the completed re-entry is the second presentation');
});

test('session preview equals the runtime first-pass assignment (all occurrences ordinal 1)', () => {
  const protocol = fixture();
  const preview = resolveStimulusAssignments(protocol, 'session-seed');
  const firstPass = resolveStimulusAssignments(protocol, 'session-seed', { 'slot-1': 0, 'slot-2': 0, 'slot-3': 0 });
  assert.deepEqual(
    [...preview.entries()].map(([nodeId, assignment]) => [nodeId, assignment.assetId]),
    [...firstPass.entries()].map(([nodeId, assignment]) => [nodeId, assignment.assetId]),
    'the setup preview shows exactly what the runtime will present on the first pass',
  );
});

test('assigned media schema renders the selected asset and validation rejects undersized pools', () => {
  const protocol = fixture();
  const assignment = resolveStimulusAssignments(protocol, 'session-seed').get('slot-1');
  const node = withStimulusAssignment(protocol.graph.nodes.find(item => item.id === 'slot-1'), assignment);
  const schema = schemaForNode(node, createCoreComponentRegistry().get('display.media'), localResourceManifest(protocol.assets));
  const media = schema.root.children.find(item => item.type === 'Media');
  assert.equal(media.props.assetId, assignment.assetId);
  assert.equal(media.props.sourceUrl, assignment.sourceUrl);

  protocol.stimulusPools[0].assetIds = ['a', 'b'];
  const check = validateProtocolGraphConfiguration(protocol, createCoreComponentRegistry());
  assert.ok(check.errors.some(error => error.code === 'config.stimulus_pool_too_small'));
});

test('createStimulusPool creates and binds a pool in one step', () => {
  const protocol = createProtocolGraph({ name: 'Pool creation' });
  protocol.graph.nodes.push({ id: 'media_1', label: 'Stimulus', component: { type: 'display.media', version: '1.0.0' }, config: { mediaType: 'image', ui: participantUiTemplate('media') } });
  const result = createStimulusPool(protocol, { name: 'Stroop stimuli', mediaType: 'image', assetIds: ['a2', 'a1', 'a2'], bindNodeId: 'media_1' });
  assert.equal(result.protocol.stimulusPools.length, 1);
  assert.deepEqual(result.pool.assetIds, ['a2', 'a1'], 'duplicate assets collapse');
  assert.equal(result.poolId, result.pool.id);
  const bound = result.protocol.graph.nodes.find(node => node.id === 'media_1');
  assert.equal(bound.config.stimulusPoolId, result.poolId);
  assert.equal(bound.config.mediaType, 'image');
});

test('media display presets resolve to plain element geometry', () => {
  const registry = createCoreComponentRegistry();
  const definition = registry.get('display.media');
  const mediaProps = config => {
    const node = { id: 'm', label: 'M', component: { type: 'display.media', version: '1.0.0' }, config: { ...structuredClone(definition.defaultConfig), ...config } };
    const schema = schemaForNode(node, definition, localResourceManifest([]));
    const walk = element => {
      if (element.type === 'Media') return element.props;
      for (const child of element.children || []) { const found = walk(child); if (found) return found; }
      return null;
    };
    return walk(schema.root);
  };
  const fill = mediaProps({ display: { preset: 'fill' } });
  assert.deepEqual({ x: fill.x, y: fill.y, width: fill.width, height: fill.height, fit: fill.fit }, { x: 0, y: 0, width: '100%', height: '100%', fit: 'cover' });
  const fit = mediaProps({ display: { preset: 'fit' } });
  assert.equal(fit.fit, 'contain');
  assert.equal(fit.width, '100%');
  const auto = mediaProps({});
  assert.equal(auto.width, undefined, 'auto preset leaves element geometry untouched');
  assert.equal(auto.x, undefined);
  assert.equal(auto.height, undefined);
});
