function hashSeed(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function shuffle(values, seed) {
  const result = [...values];
  let state = hashSeed(seed);
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    const target = state % (index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function stimulusPoolOf(node, protocol) {
  const shared = node?.config?.stimulusPoolId
    ? (protocol?.stimulusPools || []).find(pool => pool.id === node.config.stimulusPoolId)
    : null;
  if (shared) return { group: shared.id, assetIds: [...new Set((shared.assetIds || []).filter(Boolean))] };
  const pool = node?.config?.stimulusPool;
  if (!pool?.enabled) return null;
  return {
    group: String(pool.group || node.id),
    assetIds: [...new Set((pool.assetIds || []).filter(Boolean))],
  };
}

/**
 * Assign pool assets to fixed media nodes for one session.
 *
 * @param protocol          frozen/draft protocol graph
 * @param randomSeed        session seed (protocolId:version:sessionId)
 * @param priorPresentations Array of completed/skipped node IDs for global pool
 *   consumption. Passing a count object retains the legacy stride policy for old
 *   checkpoints and nominal editor previews. New runtime runs pass an array.
 *   A node's draw is keyed to its *presentation ordinal* (prior + 1), NOT to raw entry
 *   attempts: an operator retry re-presents the same un-completed occurrence (prior
 *   count unchanged) so it keeps the same stimulus, while a loop re-entry follows a
 *   completion and advances to the next item. drawIndex keeps sibling slots distinct
 *   (index + (ordinal - 1) * entries.length) and cycles the pool after exhaustion.
 */
export function resolveStimulusAssignments(protocol, randomSeed, priorPresentations = {}) {
  const assets = new Map((protocol?.assets || []).map(asset => [asset.id || asset.assetId, asset]));
  const groups = new Map();
  for (const node of protocol?.graph?.nodes || []) {
    if (node.component?.type !== 'display.media') continue;
    const pool = stimulusPoolOf(node, protocol);
    if (!pool || !pool.assetIds.length) continue;
    if (!groups.has(pool.group)) groups.set(pool.group, []);
    groups.get(pool.group).push({ node, pool });
  }

  const assignments = new Map();
  for (const [group, entries] of groups) {
    const assetIds = shuffle(entries[0].pool.assetIds, `${randomSeed}:${group}`);
    const history = Array.isArray(priorPresentations) ? priorPresentations : null;
    const memberIds = new Set(entries.map(entry => entry.node.id));
    const consumed = history ? history.filter(id => memberIds.has(id)).length : null;
    entries.forEach(({ node }, index) => {
      const ordinal = history ? history.filter(id => id === node.id).length + 1 : (Number(priorPresentations[node.id] || 0)) + 1;
      const drawIndex = consumed ?? index + (ordinal - 1) * entries.length;
      const assetId = assetIds[drawIndex % assetIds.length];
      const asset = assets.get(assetId);
      if (!asset) return;
      assignments.set(node.id, {
        group,
        attempt: ordinal,
        drawIndex,
        assetId,
        sourceUrl: asset.sourceUrl || asset.url || '',
        mediaType: asset.mediaType || asset.type || node.config?.mediaType || 'image',
        name: asset.name || asset.fileName || assetId,
      });
    });
  }
  return assignments;
}

export function withStimulusAssignment(node, assignment) {
  if (!assignment) return node;
  return { ...node, config: { ...node.config, assetId: assignment.assetId, sourceUrl: assignment.sourceUrl, mediaType: assignment.mediaType } };
}
