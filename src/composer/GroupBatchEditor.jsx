import { useState } from 'react';
import { applyGroupWaitDuration, applyQuestionnaireToKind, applyVideoScreenToAll, getSharedQuestionnaireTargets, getSharedVideoTargets } from '../core/sharedNodeEdits.js';

export default function GroupBatchEditor({ protocol, node, onApply }) {
  const [error, setError] = useState('');
  const group = protocol.graph.groups?.find(item => item.nodeIds.includes(node.id));
  const wait = node.component.type === 'timing.wait';
  const questionnaire = node.component.type === 'input.questionnaire';
  const candidates = wait ? protocol.graph.nodes.filter(item => item.id !== node.id && item.component.type === 'timing.wait') : questionnaire ? getSharedQuestionnaireTargets(protocol, node.id) : getSharedVideoTargets(protocol, node.id);
  const targets = candidates.filter(item => group?.nodeIds.includes(item.id));
  if (!group || !candidates.length) return null;
  const apply = () => {
    try {
      const options = { targetNodeIds: targets.map(item => item.id) };
      const result = wait ? applyGroupWaitDuration(protocol, node.id, options) : questionnaire ? applyQuestionnaireToKind(protocol, node.id, null, options) : applyVideoScreenToAll(protocol, node.id, options);
      onApply(result);
      setError('');
    } catch (failure) { setError(failure.message); }
  };
  return <section className="inspector-card" aria-label="Apply content within group">
    <h3>Apply content within group</h3>
    <p>{group.name}: copy {wait ? `wait duration (${node.config.durationMs} ms)` : questionnaire ? 'questionnaire content' : 'screen appearance'} from {node.label} to {targets.length} compatible nodes.</p>
    <ul>{targets.map(item => <li key={item.id}>{item.label}</li>)}</ul>
    <p>{wait ? 'Only the wait duration is copied. Display content is preserved.' : questionnaire ? 'Question IDs remain specific to each target. Only matching questionnaire kinds are included.' : 'Each target keeps its own stimulus, timing and pool.'} Other groups are unchanged. Undo restores the whole batch.</p>
    {error && <p role="alert">{error}</p>}
    <button disabled={!targets.length} onClick={apply}>Apply to {targets.length} nodes in this group</button>
  </section>;
}
