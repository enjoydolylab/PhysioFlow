import { createId } from './ids.js';

function hashSeed(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function shuffle(values, seed, version = 'mulberry32-v2') {
  const result = [...values];
  let state = hashSeed(seed);
  for (let index = result.length - 1; index > 0; index -= 1) {
    let target;
    if (version === 'legacy-lcg-v1') {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      target = state % (index + 1);
    } else {
      // Mix all state bits before choosing a Fisher–Yates index. Directly taking
      // the LCG low bits excludes half the permutations of a four-item pool.
      state = (state + 0x6D2B79F5) >>> 0;
      let mixed = Math.imul(state ^ (state >>> 15), state | 1);
      mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
      const random = ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
      target = Math.floor(random * (index + 1));
    }
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function stimulusPoolOf(node, protocol) {
  const shared = node?.config?.stimulusPoolId
    ? (protocol?.stimulusPools || []).find(pool => pool.id === node.config.stimulusPoolId)
    : null;
  if (shared) return { group: shared.id, mode: shared.randomizationMode || 'shuffle', assetIds: [...new Set((shared.assetIds || []).filter(Boolean))] };
  const pool = node?.config?.stimulusPool;
  if (!pool?.enabled) return null;
  return {
    group: String(pool.group || node.id),
    mode: pool.randomizationMode || 'shuffle',
    assetIds: [...new Set((pool.assetIds || []).filter(Boolean))],
  };
}

/** Split each category across two balanced halves, with no duplicated assets.
 * Categories with odd counts receive floor/ceil allocation; seeded category selection
 * makes the two halves equal when the requested slots permit it.
 * Returns a nodeId => assetId mapping for one ordinal (loops get a new mapping).
 */
export function balancedHalfAssignments(entries, poolAssetIds, assets, seed, shuffleVersion = 'mulberry32-v2') {
  const ordered = [...entries].sort((a, b) => Number(a.node.metadata?.trialIndex ?? Infinity) - Number(b.node.metadata?.trialIndex ?? Infinity));
  const first = ordered.filter(entry => Number(entry.node.metadata?.half) === 1);
  const second = ordered.filter(entry => Number(entry.node.metadata?.half) === 2);
  if (ordered.length !== poolAssetIds.length || first.length + second.length !== ordered.length) throw new Error('Balanced halves require one node per asset and metadata.half = 1 or 2 on every media node');
  const categories = new Map();
  for (const id of poolAssetIds) {
    const category = String(assets.get(id)?.category || '').trim();
    if (!category) throw new Error(`Balanced halves require an emotion category for asset ${id}`);
    if (!categories.has(category)) categories.set(category, []);
    categories.get(category).push(id);
  }
  const names = [...categories.keys()].sort();
  const minimum = names.reduce((sum, name) => sum + Math.floor(categories.get(name).length / 2), 0);
  const extras = first.length - minimum;
  const odd = names.filter(name => categories.get(name).length % 2 === 1);
  if (extras < 0 || extras > odd.length) throw new Error('The requested half sizes cannot balance these category counts');
  const extraFirst = new Set(shuffle(odd, `${seed}:odd-categories`, shuffleVersion).slice(0, extras));
  const front = [], back = [];
  for (const name of names) {
    const orderedAssets = shuffle(categories.get(name), `${seed}:${name}`, shuffleVersion);
    const frontCount = Math.floor(orderedAssets.length / 2) + Number(extraFirst.has(name));
    front.push(...orderedAssets.slice(0, frontCount));
    back.push(...orderedAssets.slice(frontCount));
  }
  const fronts = shuffle(front, `${seed}:first`, shuffleVersion), backs = shuffle(back, `${seed}:second`, shuffleVersion);
  return new Map([...first.map((entry, index) => [entry.node.id, fronts[index]]), ...second.map((entry, index) => [entry.node.id, backs[index]])]);
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
export function resolveStimulusAssignments(protocol, randomSeed, priorPresentations = {}, { shuffleVersion = 'mulberry32-v2' } = {}) {
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
    const balanced = entries[0].pool.mode === 'balanced-halves';
    const assetIds = balanced ? null : shuffle(entries[0].pool.assetIds, `${randomSeed}:${group}`, shuffleVersion);
    const balancedByOrdinal = new Map();
    const history = Array.isArray(priorPresentations) ? priorPresentations : null;
    const memberIds = new Set(entries.map(entry => entry.node.id));
    const consumed = history ? history.filter(id => memberIds.has(id)).length : null;
    entries.forEach(({ node }, index) => {
      const ordinal = history ? history.filter(id => id === node.id).length + 1 : (Number(priorPresentations[node.id] || 0)) + 1;
      const drawIndex = consumed ?? index + (ordinal - 1) * entries.length;
      if (balanced && !balancedByOrdinal.has(ordinal)) balancedByOrdinal.set(ordinal, balancedHalfAssignments(entries, entries[0].pool.assetIds, assets, `${randomSeed}:${group}:cycle:${ordinal}`, shuffleVersion));
      const assetId = balanced ? balancedByOrdinal.get(ordinal).get(node.id) : assetIds[drawIndex % assetIds.length];
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
        category: asset.category || null,
        condition: asset.condition || null,
      });
    });
  }
  return assignments;
}

export function withStimulusAssignment(node, assignment) {
  if (!assignment) return node;
  return { ...node, config: { ...node.config, assetId: assignment.assetId, sourceUrl: assignment.sourceUrl, mediaType: assignment.mediaType } };
}

/**
 * Create a stimulus pool, optionally binding it to a media node, as one pure step.
 * Both the pool catalog and the media-node shortcut go through here so their naming,
 * de-duplication and binding rules cannot drift apart.
 *
 * @param protocol      protocol graph to extend
 * @param name          pool name
 * @param mediaType     'image' | 'audio' | 'video'
 * @param assetIds      assets that make up the pool (de-duplicated)
 * @param bindNodeId    optional media node to point at the new pool
 * @returns {{ protocol, poolId, pool }}
 */
export function createStimulusPool(protocol, { name, mediaType = 'image', assetIds = [], bindNodeId = null } = {}, options = {}) {
  if (protocol.version?.status === 'frozen') throw new Error('Frozen protocols cannot be edited.');
  const idFactory = options.idFactory || createId;
  const poolId = idFactory('stimulus_pool');
  const pool = { id: poolId, name: String(name || 'Stimulus pool').trim(), mediaType, assetIds: [...new Set(assetIds.filter(Boolean))] };
  let next = { ...protocol, stimulusPools: [...(protocol.stimulusPools || []), pool] };
  if (bindNodeId) {
    next = {
      ...next,
      graph: {
        ...next.graph,
        nodes: next.graph.nodes.map(node => (node.id === bindNodeId
          ? { ...node, config: { ...node.config, stimulusPoolId: poolId, mediaType } }
          : node)),
      },
    };
  }
  return { protocol: next, poolId, pool };
}
