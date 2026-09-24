import { graphProtocolAssetReferences } from '../assetStore.js';

// Once a pool has assigned one item, only that item's bytes are needed for this
// presentation. Keep nested UI media references, but do not retain whole pools.
export function presentationAssetReferences(protocol, presentedNode) {
  if (!presentedNode) return [];
  const node = { ...presentedNode, config: { ...presentedNode.config, stimulusPoolId: null, stimulusPool: null } };
  return graphProtocolAssetReferences({ assets: protocol.assets, graph: { nodes: [node] } });
}
