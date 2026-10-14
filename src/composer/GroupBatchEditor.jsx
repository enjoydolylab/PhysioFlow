import { useState } from 'react';
import { useT } from '../i18n.jsx';
import { applyGroupWaitDuration, applyQuestionnaireToKind, applyVideoScreenToAll, getSharedQuestionnaireTargets, getSharedVideoTargets, questionnaireKind } from '../core/sharedNodeEdits.js';

export default function GroupBatchEditor({ protocol, node, onApply }) {
  const t = useT();
  const [selectedIds, setSelectedIds] = useState(() => node.component.type === 'input.questionnaire' && !questionnaireKind(node) ? [] : null);
  const [error, setError] = useState('');
  const group = protocol.graph.groups?.find(item => item.nodeIds.includes(node.id));
  const wait = node.component.type === 'timing.wait';
  const questionnaire = node.component.type === 'input.questionnaire';
  const candidates = wait ? protocol.graph.nodes.filter(item => item.id !== node.id && item.component.type === 'timing.wait') : questionnaire ? getSharedQuestionnaireTargets(protocol, node.id) : getSharedVideoTargets(protocol, node.id);
  const targets = candidates.filter(item => group?.nodeIds.includes(item.id));
  const chosenTargets = selectedIds === null ? targets : targets.filter(item => selectedIds.includes(item.id));
  const invalidDuration = wait && (typeof node.config.durationMs !== 'number' || !Number.isFinite(node.config.durationMs) || node.config.durationMs < 0);
  if (!group || !candidates.length) return null;
  const apply = () => {
    try {
      const options = { targetNodeIds: chosenTargets.map(item => item.id) };
      const result = wait ? applyGroupWaitDuration(protocol, node.id, options) : questionnaire ? applyQuestionnaireToKind(protocol, node.id, null, options) : applyVideoScreenToAll(protocol, node.id, options);
      onApply(result);
      setError('');
    } catch (failure) { setError(failure.message); }
  };
  return <section className="inspector-card" aria-label={t('Apply content within group')}>
    <h3>{t('Apply content within group')}</h3>
    <p>{group.name} · {t('Copy from')}: {node.label} · {t(wait ? 'Wait duration' : questionnaire ? 'Questionnaire content' : 'Screen appearance')}{wait && ` (${node.config.durationMs} ms)`}</p>
    {questionnaire && !questionnaireKind(node) && <p>{t('This questionnaire has no type tag. Select its targets explicitly.')}</p>}
    <p>{t('Select the nodes to update')}: {chosenTargets.length} / {targets.length}</p>
    <button onClick={() => setSelectedIds(null)}>{t('Select all')}</button><button onClick={() => setSelectedIds([])}>{t('Clear selection')}</button>
    <ul>{targets.map(item => <li key={item.id}><label><input type="checkbox" checked={chosenTargets.some(target => target.id === item.id)} onChange={event => setSelectedIds(current => { const ids = current ?? targets.map(target => target.id); return event.target.checked ? [...new Set([...ids, item.id])] : ids.filter(id => id !== item.id); })} />{item.label}</label></li>)}</ul>
    {invalidDuration && <p role="alert">{t('Enter a valid wait duration before applying it to other nodes.')}</p>}
    <p>{t(wait ? 'Only the wait duration is copied. Display content is preserved.' : questionnaire ? 'Question IDs remain specific to each target. Only matching questionnaire kinds are included.' : 'Each target keeps its own stimulus, timing and pool.')} {t('Other groups are unchanged. Undo restores the whole batch.')}</p>
    {error && <p role="alert">{error}</p>}
    <button disabled={!chosenTargets.length || invalidDuration} onClick={apply}>{t('Apply to selected nodes')} ({chosenTargets.length})</button>
  </section>;
}
