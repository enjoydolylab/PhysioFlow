import { elementLabel, findParentAndIndex } from './tree.js';

export function SelectionInspector({ s }) {
  const items = s.elements.map(item => item.element).filter(element => s.selectedIds.has(element.id));
  const movable = items.filter(element => !s.isLocked(element.id) && element.props?.x != null && element.props?.y != null);
  const sameParent = new Set(movable.map(element => findParentAndIndex(s.normalized.root, element.id)?.parentId)).size === 1;
  const canAlign = movable.length === items.length && movable.length > 1 && sameParent;
  return <div className="ui-selection-inspector">
    <div className="ui-inspector-head"><b>{items.length} elements selected</b></div>
    <p>Shift-click to add or remove an element. Dragging moves selected siblings together.</p>
    <div className="ui-selection-actions"><button type="button" onClick={s.duplicateSelected}>Duplicate</button><button type="button" disabled={items.every(element => s.isLocked(element.id))} onClick={s.removeSelected}>Delete</button></div>
    <fieldset disabled={!canAlign}><legend>Align selection</legend><div className="ui-selection-actions">
      {[['left','Left'],['centerX','Center'],['right','Right'],['top','Top'],['centerY','Middle'],['bottom','Bottom']].map(([action,label]) => <button type="button" key={action} onClick={() => s.alignSelected(action)}>{label}</button>)}
    </div></fieldset>
    {!canAlign && <small>Alignment needs unlocked elements in the same free-layout container.</small>}
    <div className="ui-selection-items">{items.map(element => <button type="button" key={element.id} onClick={() => s.selectElement(element.id)}>{element.type} · {elementLabel(element) || 'Untitled'}{s.isLocked(element.id) ? ' · Locked' : ''}</button>)}</div>
    <button type="button" onClick={() => s.selectElement(s.normalized.root.id)}>Deselect</button>
  </div>;
}
