import { nodeDisplayLabel } from './catalogLabels.js';
import { useLanguage } from '../i18n.jsx';
import { translateComposer as translate } from './translate.js';
import { useState } from 'react';
import { applyGroupWaitDuration, applyQuestionnaireToKind, applyVideoScreenToAll, getSharedQuestionnaireTargets, getSharedVideoTargets } from '../core/sharedNodeEdits.js';

export default function GroupBatchEditor({ protocol, node, onApply }) {
  const { language } = useLanguage();
  const t = key => translate(key, language);
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
  return <section className="inspector-card" aria-label={t("Apply content within group")}>
    <h3>{t("Apply content within group")}</h3>
    <p>{t('Copy {content} from {source} to {n} compatible nodes in {group}.').replace('{content}', wait ? t('wait duration ({n} ms)').replace('{n}', node.config.durationMs) : t(questionnaire ? 'questionnaire content' : 'screen appearance')).replace('{source}', nodeDisplayLabel(node, language)).replace('{n}', targets.length).replace('{group}', group.name)}</p>
    <ul>{targets.map(item => <li key={item.id}>{nodeDisplayLabel(item, language)}</li>)}</ul>
    <p>{t(wait ? 'Only the wait duration is copied. Display content is preserved.' : questionnaire ? 'Question IDs remain specific to each target. Only matching questionnaire kinds are included.' : 'Each target keeps its own stimulus, timing and pool.')}{t("Other groups are unchanged. Undo restores the whole batch.")}</p>
    {error && <p role="alert">{t(error)}</p>}
    <button disabled={!targets.length} onClick={apply}>{t("Apply to")}{targets.length}{t("nodes in this group")}</button>
    </section>;
}
