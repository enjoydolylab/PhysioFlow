// Shared by configuration validation and execution: only connected outputs count.
export function randomBranchWeights(protocol, node) {
  const probabilityA = Number(node.config?.probabilityA ?? 0.5);
  const candidates = ['a', 'b', 'c', 'd'].filter(portId => (protocol.graph?.edges || []).some(edge => edge.kind === 'control' && edge.source.nodeId === node.id && edge.source.portId === portId));
  const weighted = candidates.map(portId => {
    const configured = node.config?.[`probability${portId.toUpperCase()}`];
    const weight = configured != null ? Math.max(0, Number(configured)) : portId === 'b' ? Math.max(0, 1 - probabilityA) : 0.5;
    return { portId, weight };
  });
  return { probabilityA, candidates, weighted, totalWeight: weighted.reduce((sum, item) => sum + item.weight, 0) };
}
