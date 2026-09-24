// Adapted from the lab snapshot. File identity is preserved when placeholder
// paths become library entries; ambiguous filenames are never guessed.
export const mediaBasename = value => String(value || '').replaceAll('\\', '/').split('/').pop().toLowerCase();
const isPlaceholder = (protocol, node) => protocol?.metadata?.migrationSpecification?.sourcePathsArePlaceholders === true
  && node.component?.type === 'display.media' && node.config?.sourceUrl && !node.config.assetId
  && !node.config.stimulusPoolId && !node.config.stimulusPool?.enabled && !/^[a-z][a-z0-9+.-]*:/i.test(node.config.sourceUrl.replace(/^[a-z]:[\\/]/i, ''));

export function materializePlaceholderMedia(protocol) {
  if (protocol.version?.status === 'frozen') return protocol;
  const next = structuredClone(protocol);
  next.assets ||= [];
  for (const node of next.graph?.nodes || []) {
    if (!isPlaceholder(protocol, node)) continue;
    const path = node.config.sourceUrl;
    const name = path.replaceAll('\\', '/').split('/').pop();
    const matches = next.assets.filter(asset => asset.originalSourceUrl === path);
    let asset = matches.length === 1 ? matches[0] : null;
    if (!asset) {
      const stem = `placeholder_${name.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      let id = stem;
      for (let i = 2; next.assets.some(item => (item.id || item.assetId) === id); i++) id = `${stem}_${i}`;
      asset = { id, name, fileName: name, mediaType: node.config.mediaType || 'video', category: node.metadata?.emotionCategory || '', condition: node.metadata?.stimulusCondition || '', originalSourceUrl: path, sourceMode: 'manifest' };
      next.assets.push(asset);
    }
    node.config = { ...node.config, assetId: asset.id || asset.assetId, sourceUrl: '' };
  }
  return next;
}

export function matchUploadedMedia(assets, file, targetId = null) {
  const matches = targetId ? assets.filter(asset => (asset.id || asset.assetId) === targetId)
    : assets.filter(asset => !asset.sourceUrl && !asset.url && mediaBasename(asset.fileName || asset.name) === mediaBasename(file.name));
  if (matches.length > 1) throw new Error(`Multiple media entries match ${file.name}. Use the upload button beside the intended entry.`);
  if (targetId && !matches.length) throw new Error('Media entry no longer exists');
  const target = matches[0] || null;
  const type = file.type.split('/')[0];
  if (!['image', 'audio', 'video'].includes(type)) throw new Error('Choose a supported image, audio or video file.');
  if (target?.mediaType && target.mediaType !== type) throw new Error(`Expected ${target.mediaType}, received ${type}`);
  return target;
}

export function pendingMediaIssues(protocol) {
  const ids = new Set();
  const visit = element => { if (element?.props?.assetId) ids.add(element.props.assetId); for (const child of element?.children || []) visit(child); };
  const issues = [];
  for (const node of protocol.graph?.nodes || []) {
    if (isPlaceholder(protocol, node)) issues.push({ code: 'config.media_placeholder_path', nodeId: node.id, message: `${node.label || node.id}: bind the placeholder path to a media file before freezing or running.` });
    if (node.config?.assetId) ids.add(node.config.assetId);
    visit(node.config?.ui?.root);
    const pool = node.config?.stimulusPoolId ? protocol.stimulusPools?.find(p => p.id === node.config.stimulusPoolId) : node.config?.stimulusPool?.enabled ? node.config.stimulusPool : null;
    for (const id of pool?.assetIds || []) ids.add(id);
  }
  for (const asset of protocol.assets || []) if (ids.has(asset.id || asset.assetId) && asset.sourceMode === 'manifest') issues.push({ code: 'config.media_upload_required', message: `${asset.fileName || asset.name || asset.id}: upload required`, asset_id: asset.id || asset.assetId });
  return issues;
}
