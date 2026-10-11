/** Inspect a movable control-flow region without changing its internal edges. */
export function inspectGroupSegment(protocol, nodeIds, registry) {
  const ids = new Set(nodeIds);
  const nodes = new Map(protocol.graph.nodes.map(node => [node.id, node]));
  const edges = protocol.graph.edges.filter(edge => edge.kind === 'control');
  const fail = message => ({ valid: false, message, ordered: [] });
  if (!ids.size || ids.size !== nodeIds.length) return fail('Choose a non-empty group with distinct nodes.');
  for (const id of ids) {
    const node = nodes.get(id);
    const kind = node && registry.get(node.component.type, node.component.version)?.runtime?.kind;
    if (!['participant', 'condition', 'random', 'loop'].includes(kind)) return fail('Groups may contain presentation, response, condition, random split and loop nodes.');
    if (kind === 'loop' && (!Number.isInteger(node.config?.maxIterations) || node.config.maxIterations < 1 || node.config.maxIterations > 10000)) return fail('Loops need a finite maximum from 1 to 10,000 iterations.');
  }
  const incoming = edges.filter(edge => !ids.has(edge.source.nodeId) && ids.has(edge.target.nodeId));
  const outgoing = edges.filter(edge => ids.has(edge.source.nodeId) && !ids.has(edge.target.nodeId));
  if (incoming.length !== 1 || outgoing.length !== 1) return fail('Select a continuous region with a single entry and exit connection, including its complete branches and loops.');
  const internal = edges.filter(edge => ids.has(edge.source.nodeId) && ids.has(edge.target.nodeId));
  const adjacency = new Map([...ids].map(id => [id, internal.filter(edge => edge.source.nodeId === id)]));
  const ordered = [], visited = new Set(), active = new Set();
  let invalidCycle = false;
  const backEdges = [];
  const visit = id => {
    if (active.has(id)) {
      if (nodes.get(id).component.type !== 'logic.loop') invalidCycle = true;
      return;
    }
    if (visited.has(id)) return;
    visited.add(id); active.add(id); ordered.push(id);
    for (const edge of adjacency.get(id)) {
      if (active.has(edge.target.nodeId)) backEdges.push(edge);
      visit(edge.target.nodeId);
    }
    active.delete(id);
  };
  visit(incoming[0].target.nodeId);
  if (visited.size !== ids.size) return fail('Every group node must be reachable from its entry.');
  if (invalidCycle) return fail('Cycles must return to a bounded Loop node.');
  // A loop must dominate all of its return paths. Otherwise re-entering an
  // inner loop can reset its activation and turn a finite count into a cycle.
  const entry = incoming[0].target.nodeId;
  const dominators = new Map([...ids].map(id => [id, new Set(id === entry ? [id] : ids)]));
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of ids) {
      if (id === entry) continue;
      const predecessors = internal.filter(edge => edge.target.nodeId === id).map(edge => edge.source.nodeId);
      const common = new Set([...dominators.get(predecessors[0])].filter(candidate => predecessors.every(parent => dominators.get(parent).has(candidate))));
      common.add(id);
      if (common.size !== dominators.get(id).size || [...common].some(item => !dominators.get(id).has(item))) { dominators.set(id, common); changed = true; }
    }
  }
  for (const edge of backEdges) {
    const header = edge.target.nodeId;
    if (!dominators.get(edge.source.nodeId).has(header)) return fail('Loop return paths must stay within their enclosing loop.');
    const body = new Set([header]), queue = [edge.source.nodeId];
    while (queue.length) {
      const id = queue.pop();
      if (body.has(id)) continue;
      body.add(id);
      for (const parent of internal) if (parent.target.nodeId === id) queue.push(parent.source.nodeId);
    }
    if (edges.some(item => item.source.nodeId === header && item.source.portId === 'exit' && body.has(item.target.nodeId))) return fail('A Loop exit must leave its body.');
  }
  // Reject dead ends, including closed branches that cannot reach the exit.
  const reachesExit = new Set(), pending = [outgoing[0].source.nodeId];
  while (pending.length) {
    const id = pending.pop();
    if (reachesExit.has(id)) continue;
    reachesExit.add(id);
    for (const edge of internal) if (edge.target.nodeId === id) pending.push(edge.source.nodeId);
  }
  if (reachesExit.size !== ids.size) return fail('Every group node must have a path to its exit.');
  // A selected region inside an enclosing loop is not an independent block.
  const external = [outgoing[0].target.nodeId], outsideVisited = new Set();
  while (external.length) {
    const id = external.pop();
    if (ids.has(id)) return fail('Include the enclosing loop in the group before randomizing it.');
    if (outsideVisited.has(id)) continue;
    outsideVisited.add(id);
    for (const edge of edges) if (edge.source.nodeId === id) external.push(edge.target.nodeId);
  }
  return { valid: true, ordered, incoming: incoming[0], outgoing: outgoing[0], message: '' };
}
