// Previews only need the files reachable from the currently inspected screen.
// URLs embedded directly in the protocol still come from localResourceManifest.
export function previewResourceIds(protocol, nodes = []) {
  const ids = new Set();
  const pools = new Map((protocol.stimulusPools || []).map(pool => [pool.id, pool]));
  const visitUi = element => {
    if (!element) return;
    if (element.type === 'Media' && element.props?.assetId) ids.add(element.props.assetId);
    for (const child of element.children || []) visitUi(child);
  };
  for (const node of nodes) {
    if (!node) continue;
    const config = node.config || {};
    if (config.assetId) ids.add(config.assetId);
    if (node.component?.type === 'display.media') {
      for (const id of config.stimulusPool?.assetIds || []) ids.add(id);
      for (const id of pools.get(config.stimulusPoolId)?.assetIds || []) ids.add(id);
    }
    visitUi(config.ui?.root);
  }
  return ids;
}
