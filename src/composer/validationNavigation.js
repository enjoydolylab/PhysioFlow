export function validationIssueTarget(protocol, issue) {
 if (issue.nodeId && protocol.graph.nodes.some(n => n.id === issue.nodeId)) return { nodeId: issue.nodeId, edgeId: null };
 const edge = protocol.graph.edges.find(e => e.id === issue.edgeId);
 if (edge) return { nodeId: null, edgeId: edge.id };
 const group = (protocol.graph.groups || []).find(g => g.id === issue.groupId);
 const nodeId = group?.entryNodeId || group?.nodeIds?.[0];
 return nodeId && protocol.graph.nodes.some(n => n.id === nodeId) ? { nodeId, edgeId: null } : null;
}
