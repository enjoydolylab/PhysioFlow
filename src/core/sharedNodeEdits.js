// Explicit, one-commit propagation of presentation/questionnaire edits.
// Never share questionnaire/element objects between mutable editor instances.
// Media identity (asset, pool, URL), trial metadata, markers and completion remain per node.

const isMediaNode = node => node?.component?.type === 'display.media' && ['video', 'image'].includes(node.config?.mediaType);

function mediaElement(root) {
  if (!root) return null;
  if (root.type === 'Media') return root;
  for (const child of root.children || []) {
    const found = mediaElement(child);
    if (found) return found;
  }
  return null;
}

/** Candidate lists are computed from the currently loaded graph, never a trial count. */
export function getSharedVideoTargets(protocol, nodeId) {
  const nodes = protocol.graph?.nodes || [];
  const source = nodes.find(node => node.id === nodeId);
  if (!isMediaNode(source)) return [];
  return nodes.filter(node => node.id !== nodeId && isMediaNode(node) && node.config.mediaType === source.config.mediaType);
}

export function countOtherVideoNodes(protocol, nodeId) {
  return getSharedVideoTargets(protocol, nodeId).length;
}

function selectedIds(options, candidates, defaultIds) {
  if (options.targetNodeIds === undefined) return new Set(defaultIds);
  if (!Array.isArray(options.targetNodeIds)) throw new Error('Target node IDs must be an array.');
  const eligible = new Set(candidates);
  for (const id of options.targetNodeIds) {
    if (!eligible.has(id)) throw new Error(`Invalid or incompatible target node: ${id}`);
  }
  return new Set(options.targetNodeIds);
}

/** Copy a VIDEO node's authored screen, but keep every destination's actual stimulus. */
export function applyVideoScreenToAll(protocol, sourceId, options = {}) {
  if (protocol.version?.status === 'frozen') throw new Error('Frozen protocols cannot be edited.');
  const source = protocol.graph?.nodes?.find(node => node.id === sourceId);
  if (!isMediaNode(source)) throw new Error('Select a video node or image node first.');
  if (!source.config?.ui?.root || !mediaElement(source.config.ui.root)) throw new Error('The source video screen has no Media element.');
  const candidates = getSharedVideoTargets(protocol, sourceId);
  const targets = selectedIds(options, candidates.map(node => node.id), candidates.map(node => node.id));
  let changed = 0;
  const nodes = protocol.graph.nodes.map(node => {
    if (!targets.has(node.id)) return node;
    const originalMedia = mediaElement(node.config?.ui?.root);
    const ui = structuredClone(source.config.ui);
    const nextMedia = mediaElement(ui.root);
    // Override stimulus identity after copying the visual schema; never transplant
    // one trial's source into another, including a random stimulus pool trial.
    nextMedia.props = {
      ...nextMedia.props,
      sourceUrl: node.config?.sourceUrl || originalMedia?.props?.sourceUrl || '',
      assetId: node.config?.assetId || originalMedia?.props?.assetId || null,
      mediaType: node.config?.mediaType || originalMedia?.props?.mediaType || 'video',
    };
    // Bindings override authored props during rendering, so retain the target's
    // identity bindings as well as its literal stimulus identity.
    nextMedia.bindings = { ...(nextMedia.bindings || {}) };
    for (const key of ['sourceUrl', 'assetId', 'mediaType']) {
      delete nextMedia.bindings[key];
      if (Object.prototype.hasOwnProperty.call(originalMedia?.bindings || {}, key)) {
        nextMedia.bindings[key] = structuredClone(originalMedia.bindings[key]);
      }
    }
    changed += 1;
    return { ...node, config: { ...node.config, ui } };
  });
  if (!changed) return { protocol, count: 0 };
  return {
    protocol: { ...protocol, graph: { ...protocol.graph, nodes }, audit: { ...protocol.audit, updatedAt: options.now || new Date().toISOString() } },
    count: changed,
  };
}

export function questionnaireKind(node) {
  return node?.component?.type === 'input.questionnaire' ? node.metadata?.questionnaireKind || null : null;
}

/** Tagged questionnaires only match their own kind. Untagged ones require manual selection in the UI. */
export function getSharedQuestionnaireTargets(protocol, nodeId) {
  const nodes = protocol.graph?.nodes || [];
  const source = nodes.find(node => node.id === nodeId);
  if (source?.component?.type !== 'input.questionnaire') return [];
  const kind = questionnaireKind(source);
  return nodes.filter(node => node.id !== nodeId && node.component?.type === 'input.questionnaire' && questionnaireKind(node) === kind);
}

export function countOtherQuestionnaires(protocol, nodeId) {
  return getSharedQuestionnaireTargets(protocol, nodeId).length;
}

const semanticId = id => String(id || '').replace(/^t\d+_/, 't*_');

/** Transplant wording/scale/layout but retain each trial's questionnaire and question IDs.
 * For reordering, prefer the original semantic suffix (t1_qa1_02 -> t2_qa1_02).
 * Conditional question references are mapped along with their source IDs.
 */
export function questionnaireContentForTarget(source, destination) {
  if (!source?.questions?.length || !destination?.questionnaire_id) throw new Error('Both questionnaires must be configured.');
  const existing = destination.questions || [];
  const semanticTargets = new Map(existing.map(question => [semanticId(question.question_id), question.question_id]));
  // Reserve semantic matches before generating IDs for new questions. Otherwise a
  // newly inserted question at the front could steal the original Q1 answer ID.
  const reserved = new Set(source.questions.map(question => semanticTargets.get(semanticId(question.question_id))).filter(Boolean));
  const used = new Set();
  const idMap = new Map();
  const questionIds = source.questions.map((question, index) => {
    const match = semanticTargets.get(semanticId(question.question_id));
    let id = (match && !used.has(match) ? match : null);
    if (!id && existing[index] && !reserved.has(existing[index].question_id) && !used.has(existing[index].question_id)) id = existing[index].question_id;
    if (!id) {
      const base = `${destination.questionnaire_id}_shared_${index + 1}`;
      id = base;
      let ordinal = 2;
      while (used.has(id) || reserved.has(id) || existing.some(item => item.question_id === id)) id = `${base}_${ordinal++}`;
    }
    used.add(id);
    idMap.set(question.question_id, id);
    return id;
  });
  const questions = source.questions.map((question, index) => {
    const copied = structuredClone(question);
    copied.question_id = questionIds[index];
    if (copied.show_if?.question_id) copied.show_if.question_id = idMap.get(copied.show_if.question_id) || copied.show_if.question_id;
    return copied;
  });
  const { questionnaire_id: _ignoredId, name: _ignoredName, sharedKind: _ignoredKind, ...content } = source;
  void _ignoredId;
  void _ignoredName;
  void _ignoredKind;
  return { ...destination, ...structuredClone(content), questionnaire_id: destination.questionnaire_id, name: destination.name, questions };
}

/** Tagged questionnaires match their kind; untagged questionnaires require explicit targets. */
export function applyQuestionnaireToKind(protocol, sourceId, template = null, options = {}) {
  if (protocol.version?.status === 'frozen') throw new Error('Frozen protocols cannot be edited.');
  const source = protocol.graph?.nodes?.find(node => node.id === sourceId);
  if (source?.component?.type !== 'input.questionnaire') throw new Error('Select a questionnaire node first.');
  const kind = questionnaireKind(source);
  const content = template || source.config?.questionnaire;
  if (template && (template.sharedKind || null) !== kind) throw new Error('Select a library item saved for this questionnaire type.');
  if (!content?.questions?.length) throw new Error('The source questionnaire has no questions.');
  if (!kind && options.targetNodeIds === undefined) throw new Error('Select the target nodes explicitly for an unclassified questionnaire.');
  const candidates = getSharedQuestionnaireTargets(protocol, sourceId).map(node => node.id);
  if (template) candidates.push(sourceId);
  const targets = selectedIds(options, candidates, candidates);
  let count = 0;
  const nodes = protocol.graph.nodes.map(node => {
    if (!targets.has(node.id)) return node;
    count += 1;
    return { ...node, config: { ...node.config, questionnaire: questionnaireContentForTarget(content, node.config.questionnaire) } };
  });
  if (!count) return { protocol, count: 0 };
  return {
    protocol: { ...protocol, graph: { ...protocol.graph, nodes }, audit: { ...protocol.audit, updatedAt: options.now || new Date().toISOString() } },
    count,
  };
}

/** Apply a wait duration only to explicitly chosen waits in the source's group. */
export function applyGroupWaitDuration(protocol, sourceId, options = {}) {
  if (protocol.version?.status === 'frozen') throw new Error('Frozen protocols cannot be edited.');
  const source = protocol.graph?.nodes?.find(node => node.id === sourceId);
  const group = protocol.graph?.groups?.find(item => item.nodeIds.includes(sourceId));
  if (source?.component?.type !== 'timing.wait' || !group) throw new Error('Select a grouped wait node first.');
  const duration = source.config?.durationMs;
  if (typeof duration !== 'number' || !Number.isFinite(duration) || duration < 0) throw new Error('Wait duration must be a finite non-negative number.');
  const candidates = protocol.graph.nodes.filter(node => node.id !== sourceId && group.nodeIds.includes(node.id) && node.component.type === 'timing.wait').map(node => node.id);
  const targets = selectedIds(options, candidates, candidates);
  if (!targets.size) return { protocol, count: 0 };
  return {
    protocol: { ...protocol, graph: { ...protocol.graph, nodes: protocol.graph.nodes.map(node => targets.has(node.id) ? { ...node, config: { ...node.config, durationMs: duration } } : node) }, audit: { ...protocol.audit, updatedAt: options.now || new Date().toISOString() } },
    count: targets.size,
  };
}
