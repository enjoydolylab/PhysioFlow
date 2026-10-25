import { nodeDisplayLabel } from './catalogLabels.js';
import { useLanguage } from '../i18n.jsx';
import { translateComposer as translate } from './translate.js';
import { useState } from 'react';
import { inspectRepeatSegment, wrapRepeatSegment } from '../core/repeatSegment.js';

export default function RepeatSequenceEditor({ protocol, registry, selectedIds, onApply }) {
  const { language } = useLanguage();
  const t = key => translate(key, language);
  const [count, setCount] = useState('3');
  const [lastId, setLastId] = useState('');
  const [error, setError] = useState('');
  const choices = [];
  if (selectedIds.length === 1) {
    const visited = new Set();
    let id = selectedIds[0];
    while (id && !visited.has(id)) {
      visited.add(id);
      const node = protocol.graph.nodes.find(item => item.id === id);
      if (!node || registry.get(node.component.type, node.component.version)?.runtime?.kind !== 'participant') break;
      choices.push(node);
      const exits = protocol.graph.edges.filter(edge => edge.kind === 'control' && edge.source.nodeId === id);
      id = exits.length === 1 ? exits[0].target.nodeId : null;
    }
  }
  const endIndex = Math.max(0, choices.findIndex(node => node.id === lastId));
  const ids = choices.length ? choices.slice(0, endIndex + 1).map(node => node.id) : selectedIds;
  const segment = inspectRepeatSegment(protocol, ids, registry);
  const validCount = Number.isInteger(Number(count)) && Number(count) >= 1 && Number(count) <= 10000;
  return <section className="repeat-sequence-editor" aria-label={t("Repeat a sequence")}>
    <h3>{t("Repeat a sequence")}</h3>
    <p>{t("Repeat these steps in execution order. The count includes the first pass.")}</p>
    {choices.length > 1 && <label>{t("Repeat through")}<select aria-label={t("Last step to repeat")} value={choices[endIndex].id} onChange={event => setLastId(event.target.value)}>{choices.map(node => <option key={node.id} value={node.id}>{nodeDisplayLabel(node, language)}</option>)}</select></label>}
    <label>{t("Total repetitions")}<input aria-label={t("Total repetitions")} type="number" min="1" max="10000" value={count} onChange={event => setCount(event.target.value)} /></label>
    {segment.valid ? <><ol>{segment.ordered.map(id => <li key={id}>{nodeDisplayLabel(protocol.graph.nodes.find(node => node.id === id), language)}</li>)}</ol><p role="status">{validCount ? t('{steps} steps × {count} passes = {visits} step visits, then continue to the next step.').replace('{steps}', segment.ordered.length).replace('{count}', count).replace('{visits}', segment.ordered.length * Number(count)) : t('Enter a whole number from 1 to 10,000.')}</p></> : <p>{t(segment.message)}</p>}
    <small>{t("This keeps the step order. Media pools draw on each completed or skipped visit; a retry keeps its stimulus. Operator actions can change the actual visit count.")}</small>
    <button type="button" disabled={!segment.valid || !validCount} onClick={() => {
      try { onApply(wrapRepeatSegment(protocol, ids, Number(count), registry)); setError(''); }
      catch (cause) { setError(cause.message || String(cause)); }
    }}>{t("Create repeat sequence")}</button>
    {error && <p role="alert">{error}</p>}
    </section>;
}
