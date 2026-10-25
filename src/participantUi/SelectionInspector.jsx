import { useBuilderT } from './useBuilderT.js';
import { elementLabel, findParentAndIndex } from './tree.js';

export function SelectionInspector({ s }) {
  const t = useBuilderT();
  const items = s.elements.map(item => item.element).filter(element => s.selectedIds.has(element.id));
  const movable = items.filter(element => !s.isLocked(element.id) && element.props?.x != null && element.props?.y != null);
  const sameParent = new Set(movable.map(element => findParentAndIndex(s.normalized.root, element.id)?.parentId)).size === 1;
  const canAlign = movable.length === items.length && movable.length > 1 && sameParent;
  return <div className="ui-selection-inspector">
    <div className="ui-inspector-head"><b>{items.length} {t('elements selected')}</b></div>
    <p>{t("Shift-click to add or remove an element. Dragging moves selected siblings together.")}</p>
    <div className="ui-selection-actions"><button type="button" onClick={s.duplicateSelected}>{t("Duplicate")}</button><button type="button" disabled={items.every(element => s.isLocked(element.id))} onClick={s.removeSelected}>{t("Delete")}</button></div>
    <fieldset disabled={!canAlign}><legend>{t("Align selection")}</legend><div className="ui-selection-actions">
      {[['left','Left'],['centerX','Center'],['right','Right'],['top','Top'],['centerY','Middle'],['bottom','Bottom']].map(([action,label]) => <button type="button" key={action} onClick={() => s.alignSelected(action)}>{t(label)}</button>)}
    </div></fieldset>
    {!canAlign && <small>{t("Alignment needs unlocked elements in the same free-layout container.")}</small>}
    <div className="ui-selection-items">{items.map(element => <button type="button" key={element.id} onClick={() => s.selectElement(element.id)}>{t(element.type)} · {elementLabel(element) || t('Untitled')}{s.isLocked(element.id) ? ' · ' + t('Locked') : ''}</button>)}</div>
    <button type="button" onClick={() => s.selectElement(s.normalized.root.id)}>{t("Deselect")}</button>
  </div>;
}
