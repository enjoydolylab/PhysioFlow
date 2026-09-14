import { useState } from 'react';
import { inspectRepeatSegment, wrapRepeatSegment } from '../core/repeatSegment.js';

export default function RepeatSequenceEditor({ protocol, registry, selectedIds, onApply }) {
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
  return <section className="repeat-sequence-editor" aria-label="Repeat a sequence">
    <h3>Repeat a sequence</h3>
    <p>Repeat these steps in execution order. The count includes the first pass.</p>
    {choices.length > 1 && <label>Repeat through<select aria-label="Last step to repeat" value={choices[endIndex].id} onChange={event => setLastId(event.target.value)}>{choices.map(node => <option key={node.id} value={node.id}>{node.label}</option>)}</select></label>}
    <label>Total repetitions<input aria-label="Total repetitions" type="number" min="1" max="10000" value={count} onChange={event => setCount(event.target.value)} /></label>
    {segment.valid ? <><ol>{segment.ordered.map(id => <li key={id}>{protocol.graph.nodes.find(node => node.id === id).label}</li>)}</ol><p role="status">{validCount ? `${segment.ordered.length} steps × ${count} passes = ${segment.ordered.length * Number(count)} step visits, then continue to the next step.` : 'Enter a whole number from 1 to 10,000.'}</p></> : <p>{segment.message}</p>}
    <small>This keeps the step order. Media pools draw on each completed or skipped visit; a retry keeps its stimulus. Operator actions can change the actual visit count.</small>
    <button type="button" disabled={!segment.valid || !validCount} onClick={() => {
      try { onApply(wrapRepeatSegment(protocol, ids, Number(count), registry)); setError(''); }
      catch (cause) { setError(cause.message || String(cause)); }
    }}>Create repeat sequence</button>
    {error && <p role="alert">{error}</p>}
  </section>;
}
