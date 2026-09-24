import { inspectRepeatSegment } from './repeatSegment.js';
import { shuffle } from './stimulusRandomization.js';

/** Build an explicit, reproducible schedule; does not mutate a protocol or run it. */
export function planGroupSequence(protocol, groupIds, seed, registry) {
  if (typeof seed !== 'string' || !seed.length) throw new Error('A non-empty group randomization seed is required');
  if (!Array.isArray(groupIds) || groupIds.length < 2 || new Set(groupIds).size !== groupIds.length) throw new Error('Choose at least two distinct groups');
  const seen = new Set();
  const segments = groupIds.map(groupId => {
    const group = protocol.graph.groups?.find(item => item.id === groupId);
    if (!group) throw new Error(`Unknown group: ${groupId}`);
    if (group.nodeIds.some(id => seen.has(id))) throw new Error('Randomized groups cannot overlap');
    group.nodeIds.forEach(id => seen.add(id));
    const segment = inspectRepeatSegment(protocol, group.nodeIds, registry);
    if (!segment.valid) throw new Error(`${group.name}: ${segment.message}`);
    return { groupId, nodeIds: segment.ordered };
  });
  const combined = inspectRepeatSegment(protocol, [...seen], registry);
  if (!combined.valid) throw new Error('The groups must form one continuous sequence with no intervening steps');
  const ordered = shuffle(segments, seed);
  return {
    algorithm: 'group-fisher-yates-mulberry32-v1', seed,
    groupOrder: ordered.map(item => item.groupId),
    nodeOrder: ordered.flatMap(item => item.nodeIds),
    groups: ordered,
  };
}

/** Create a session execution copy. Persist both this plan and the source snapshot. */
export function prepareGroupSequence(protocol, groupIds, seed, registry) {
  const plan = planGroupSequence(protocol, groupIds, seed, registry);
  const owner = new Map(plan.groups.flatMap(group => group.nodeIds.map(id => [id, group.groupId])));
  if (protocol.graph.edges.some(edge => edge.kind === 'data' && owner.has(edge.source.nodeId) && owner.has(edge.target.nodeId) && owner.get(edge.source.nodeId) !== owner.get(edge.target.nodeId))) {
    throw new Error('Groups linked by data connections cannot be reordered independently');
  }
  const whole = inspectRepeatSegment(protocol, plan.nodeOrder, registry);
  const segments = plan.groups.map(group => inspectRepeatSegment(protocol, group.nodeIds, registry));
  const next = structuredClone(protocol);
  const edges = new Map(next.graph.edges.map(edge => [edge.id, edge]));
  edges.get(whole.incoming.id).target = structuredClone(segments[0].incoming.target);
  segments.forEach((segment, index) => {
    edges.get(segment.outgoing.id).target = structuredClone(index + 1 < segments.length ? segments[index + 1].incoming.target : whole.outgoing.target);
  });
  return { protocol: next, plan };
}

// Restore from the original snapshot and saved seed, never from the current editor.
export function createGroupExecutionSnapshot(sourceProtocol, groupIds, seed, registry) {
  const prepared = prepareGroupSequence(sourceProtocol, groupIds, seed, registry);
  return {
    schemaVersion: '1.0.0',
    sourceProtocol: structuredClone(sourceProtocol),
    selectedGroupIds: [...groupIds],
    plan: prepared.plan,
    executionGraph: prepared.protocol.graph,
  };
}

export function restoreGroupExecutionSnapshot(snapshot, registry) {
  if (snapshot?.schemaVersion !== '1.0.0' || !snapshot.sourceProtocol || !Array.isArray(snapshot.selectedGroupIds)) throw new Error('Unsupported or incomplete group execution snapshot');
  const expected = createGroupExecutionSnapshot(snapshot.sourceProtocol, snapshot.selectedGroupIds, snapshot.plan?.seed, registry);
  if (JSON.stringify(snapshot.plan) !== JSON.stringify(expected.plan) || JSON.stringify(snapshot.executionGraph) !== JSON.stringify(expected.executionGraph)) {
    throw new Error('Group execution snapshot does not match its source, seed and plan');
  }
  return { sourceProtocol: structuredClone(snapshot.sourceProtocol), protocol: { ...structuredClone(snapshot.sourceProtocol), graph: structuredClone(snapshot.executionGraph) }, plan: structuredClone(snapshot.plan) };
}
