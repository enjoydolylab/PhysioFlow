import { addNode, connect } from './graphCommands.js';

export function inspectRepeatSegment(protocol, nodeIds, registry) {
  const ids = new Set(nodeIds);
  const nodes = protocol.graph.nodes;
  const edges = protocol.graph.edges.filter(edge => edge.kind === 'control');
  const fail = message => ({ valid: false, message, ordered: [] });
  if (!ids.size) return fail('Choose the steps to repeat.');
  if ([...ids].some(id => {
    const node = nodes.find(item => item.id === id);
    return !node || registry.get(node.component.type, node.component.version)?.runtime?.kind !== 'participant';
  })) return fail('Choose presentation or response steps. Branches and loop controls need manual configuration.');
  for (const id of ids) {
    if (edges.filter(edge => edge.target.nodeId === id).length !== 1 || edges.filter(edge => edge.source.nodeId === id).length !== 1) return fail('Each selected step must have one incoming and one outgoing connection.');
  }
  const incoming = edges.filter(edge => !ids.has(edge.source.nodeId) && ids.has(edge.target.nodeId));
  const outgoing = edges.filter(edge => ids.has(edge.source.nodeId) && !ids.has(edge.target.nodeId));
  if (incoming.length !== 1 || outgoing.length !== 1) return fail('Select one continuous sequence with a single entry and exit.');
  const ordered = [];
  let id = incoming[0].target.nodeId;
  while (ids.has(id) && !ordered.includes(id)) {
    ordered.push(id);
    id = edges.find(edge => edge.source.nodeId === id).target.nodeId;
  }
  if (ordered.length !== ids.size || ids.has(id)) return fail('Selected steps must form a continuous sequence without a cycle.');
  // This shortcut only wraps a simple linear segment. Keep existing repeating
  // paths explicit in the graph editor instead of guessing the user's nesting.
  const pending = [outgoing[0].target.nodeId], visited = new Set();
  while (pending.length) {
    const next = pending.pop();
    if (ids.has(next)) return fail('These steps already belong to a repeating path. Edit its existing Loop instead.');
    if (visited.has(next)) continue;
    visited.add(next);
    edges.filter(edge => edge.source.nodeId === next).forEach(edge => pending.push(edge.target.nodeId));
  }
  return { valid: true, ordered, incoming: incoming[0], outgoing: outgoing[0], message: '' };
}

export function wrapRepeatSegment(protocol, nodeIds, count, registry) {
  if (protocol.version?.status === 'frozen') throw new Error('Create a draft version before editing.');
  if (!Number.isInteger(count) || count < 1 || count > 10000) throw new Error('Enter a whole number of repetitions from 1 to 10,000.');
  const segment = inspectRepeatSegment(protocol, nodeIds, registry);
  if (!segment.valid) throw new Error(segment.message);
  const first = protocol.graph.nodes.find(node => node.id === segment.ordered[0]);
  let { protocol: next, node } = addNode(protocol, 'logic.loop', {
    label: 'Repeat sequence', config: { maxIterations: count, untilRule: null },
    layout: { x: first.layout.x, y: Math.max(0, first.layout.y - 180) },
  });
  next.graph.edges = next.graph.edges.filter(edge => ![segment.incoming.id, segment.outgoing.id].includes(edge.id));
  for (const [source, target] of [
    [segment.incoming.source, { nodeId: node.id, portId: 'in' }],
    [{ nodeId: node.id, portId: 'body' }, segment.incoming.target],
    [segment.outgoing.source, { nodeId: node.id, portId: 'in' }],
    [{ nodeId: node.id, portId: 'exit' }, segment.outgoing.target],
  ]) next = connect(next, 'control', source, target).protocol;
  return { protocol: next, node, ordered: segment.ordered };
}
