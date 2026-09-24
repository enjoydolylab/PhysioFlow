import test from 'node:test';
import assert from 'node:assert/strict';
import { applyVideoScreenToAll } from '../src/core/sharedNodeEdits.js';
const node = (id, bindings) => ({ id, component: { type: 'display.media' }, config: { mediaType: 'video', sourceUrl: `${id}.mp4`, completion: { mode: 'fixed', durationMs: id === 'a' ? 1000 : 2000 }, ui: { root: { type: 'Screen', props: { background: id }, children: [{ type: 'Media', props: { sourceUrl: `${id}.mp4`, fit: 'contain' }, bindings }] } } } });
test('media batch retains target identity bindings and timing while copying appearance', () => {
  const p = { graph: { nodes: [node('a', { sourceUrl: 'variables.source', fit: 'variables.fit' }), node('b', { sourceUrl: 'variables.target' }), node('c', {})] } };
  const original = structuredClone(p);
  const { protocol: result } = applyVideoScreenToAll(p, 'a', { targetNodeIds: ['b', 'c'] });
  assert.equal(result.graph.nodes[1].config.ui.root.children[0].bindings.sourceUrl, 'variables.target');
  assert.equal(result.graph.nodes[2].config.ui.root.children[0].bindings.sourceUrl, undefined);
  assert.equal(result.graph.nodes[2].config.ui.root.children[0].props.sourceUrl, 'c.mp4');
  assert.equal(result.graph.nodes[1].config.ui.root.props.background, 'a');
  assert.equal(result.graph.nodes[1].config.completion.durationMs, 2000);
  assert.deepEqual(p, original);
});
