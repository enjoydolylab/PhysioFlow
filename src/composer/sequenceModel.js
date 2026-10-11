/** A sequence view is available only for a complete, unbranched control path. */
export function protocolSequence(protocol) {
  const nodes = new Map(protocol.graph.nodes.map(node => [node.id,node]));
  const control = protocol.graph.edges.filter(edge => edge.kind === 'control');
  if (control.length !== nodes.size - 1 || control.some(edge => !nodes.has(edge.source.nodeId) || !nodes.has(edge.target.nodeId))) return null;
  if (protocol.graph.nodes.some(node => node.component.type.startsWith('logic.'))) return null;
  const outgoing = new Map(), incoming = new Map();
  for (const edge of control) {
    if (outgoing.has(edge.source.nodeId) || incoming.has(edge.target.nodeId)) return null;
    outgoing.set(edge.source.nodeId,edge); incoming.set(edge.target.nodeId,edge);
  }
  const ordered = [], seen = new Set();
  let id = protocol.graph.entryNodeId;
  if (incoming.has(id)) return null;
  while (id) {
    if (seen.has(id) || !nodes.has(id)) return null;
    seen.add(id); ordered.push(nodes.get(id)); id = outgoing.get(id)?.target.nodeId;
  }
  if (ordered.length !== nodes.size || ordered[0]?.component.type !== 'core.start' || ordered.at(-1)?.component.type !== 'core.end') return null;
  return ordered;
}

export function moveSequenceStep(protocol,nodeId,direction) {
  if (protocol.version?.status === 'frozen') throw new Error('Create an editable version before changing the sequence.');
  const ordered = protocolSequence(protocol);
  if (!ordered) throw new Error('Use the flow graph to edit branches or loops.');
  const index = ordered.findIndex(node => node.id === nodeId), target = index + direction;
  if (![1,-1].includes(direction) || index < 1 || index >= ordered.length - 1 || target < 1 || target >= ordered.length - 1) throw new Error('Start and end stay in place.');
  [ordered[index],ordered[target]] = [ordered[target],ordered[index]];
  const rank = new Map(ordered.map((node,i) => [node.id,i]));
  if (protocol.graph.edges.some(edge => edge.kind === 'data' && rank.get(edge.source.nodeId) >= rank.get(edge.target.nodeId))) throw new Error('This order would place a data source after its consumer.');
  const next = structuredClone(protocol);
  const control = protocol.graph.edges.filter(edge => edge.kind === 'control');
  const outgoing = new Map(control.map(edge => [edge.source.nodeId,edge]));
  const incoming = new Map(control.map(edge => [edge.target.nodeId,edge]));
  const replacements = new Map(ordered.slice(0,-1).map((node,i) => {
    const old = outgoing.get(node.id), destination = ordered[i + 1];
    return [old.id,{...old,target:{...incoming.get(destination.id).target}}];
  }));
  next.graph.edges = next.graph.edges.map(edge => replacements.get(edge.id) || edge);
  next.audit = {...next.audit,updatedAt:new Date().toISOString()};
  return next;
}
