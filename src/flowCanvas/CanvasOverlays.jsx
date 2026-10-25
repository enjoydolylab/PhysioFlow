import { useT as useDisplayT } from '../i18n.jsx';
// Canvas overlays: the node search bar and the "steps outside flow" panel.
export default function CanvasOverlays({ searchQuery, setSearchQuery, filteredNodes, setSelectedNodeIds, setPan, setZoom, unplacedSteps, disabled, focusHighlightStepId, placeExistingStep, setFocusHighlightStepId, setFocusMessage, removeUnplacedStep, viewMode }) {
  const tDisplay = useDisplayT();
  if (viewMode !== 'canvas') return null;
  return <>
    {searchQuery !== '' && (
      <div className="node-search-bar">
        <input autoFocus value={searchQuery} placeholder="Find node by name..." onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setSearchQuery(''); if (e.key === 'Enter' && filteredNodes.length > 0) { const node = filteredNodes[0]; setSelectedNodeIds(new Set([node.id])); setPan({ x: 120 - node.x, y: 160 - node.y }); setZoom(1); } }} />
        <span>{searchQuery ? tDisplay("{0} match{1}", [filteredNodes.length, filteredNodes.length !== 1 ? 'es' : '']) : ''}</span>
      </div>
    )}
    {unplacedSteps.length > 0 && !disabled && (
      <div className={`unplaced-step-panel${focusHighlightStepId ? ' focus-active' : ''}`} role="status">
        <b>{tDisplay("Steps outside flow ·")} {unplacedSteps.length}</b>
        <span>{focusHighlightStepId ? tDisplay("Located the steps below. Click Insert to place them in the flow.") : tDisplay("These steps exist in the Trial but will not run until placed in the graph.")}</span>
        <div>
          {unplacedSteps.map(step => (
            <article key={step.step_id} className={focusHighlightStepId === step.step_id ? 'focus-highlight' : ''}>
              <i>{step.type}</i>
              <strong>{step.name || step.type}</strong>
              <button onClick={() => { placeExistingStep(step); setFocusHighlightStepId(null); setFocusMessage(''); }}>Insert</button>
              <button className="danger" onClick={() => removeUnplacedStep(step.step_id)}>Remove unused</button>
            </article>
          ))}
        </div>
      </div>
    )}
  </>;
}
