import { useEffect, useRef, useState } from 'react';
import { ScreenChecks } from './participantUi/ScreenChecks.jsx';
import { PositionFields } from './participantUi/PositionFields.jsx';
import { SelectionInspector } from './participantUi/SelectionInspector.jsx';
import { pathTo } from './participantUi/tree.js';
import { SCREEN_PRESETS, createScreenPreset } from './participantUi/screenPresets.js';
import ParticipantUiCanvas from './ParticipantUiCanvas.jsx';
import { mapUiElement, participantUiTemplate, resolveUiStyle } from './core/index.js';
import { LIBRARY_GROUPS, TEMPLATE_KINDS, TYPE_HINTS } from './participantUi/constants.js';
import { ThemeEditor } from './participantUi/ThemeEditor.jsx';
import { StyleEditor } from './participantUi/StyleEditor.jsx';
import { UiPropertyEditor } from './participantUi/UiPropertyEditor.jsx';
import { UiIcon } from './participantUi/UiIcon.jsx';
import { StructureTree } from './participantUi/tree/StructureTree.jsx';
import { ParticipantPreview } from './participantUi/preview/ParticipantPreview.jsx';
import { useParticipantUiState } from './participantUi/useParticipantUiState.js';

export default function ParticipantUiBuilder({ schema, onChange, defaultTemplate }) {
  const [boundsIssues, setBoundsIssues] = useState([]);
  const [focusRequest, setFocusRequest] = useState(null);
  const builderRef = useRef(null);
  const s = useParticipantUiState({ schema, onChange, defaultTemplate });
  const {
    normalized, theme, commit, canUndo, canRedo, undo, redo,
    templateKind, setTemplateKind, selectElement,
    viewportCenter, zoomAt, zoom, fitView, resetView,
    snapEnabled, setSnapEnabled, preview, setPreview, structureOpen, setStructureOpen,
    addToRoot, viewportRef, handleViewportPointerDown, closeContextMenu,
    pan, panRef, deviceWidth, deviceHeight,
    selectedId, selectedIds, dropElement, moveElement, moveElements, removeElement,
    duplicateElementById, moveStep, resizeElement, updateText, updateProp,
    openContextMenu, removeSelected, duplicateSelected, alignSelected,
    marquee, contextMenu, elements, copySelected, pasteClipboard, clipboardRef,
    zOrderSelected, focusStyle, selected, crumbs, updateProps, toggleFree,
    showPosition, setStyle, styleForceOpen, bindingTarget, validation,
    reorderFlow, arrangeContainer, selectedParentElement,
  } = s;
  const appearance = resolveUiStyle(selected, theme);
  const locateIssue = (id, field) => {
    setPreview(false);
    selectElement(id);
    setStructureOpen(true);
    const ancestors = new Set(pathTo(normalized.root, id)?.map(element => element.id));
    s.setCollapsed(previous => new Set([...previous].filter(key => !ancestors.has(key))));
    setFocusRequest({id, field});
  };
  useEffect(() => {
    if (!focusRequest || preview || selected.id !== focusRequest.id) return;
    const frame = requestAnimationFrame(() => {
      const inspector = builderRef.current?.querySelector('.ui-inspector');
      const field = inspector?.querySelector(`[aria-label="${focusRequest.field}"]`);
      (field || inspector)?.scrollIntoView({block:'nearest', inline:'nearest'});
      field?.focus({preventScroll:true});
      field?.select?.();
    });
    return () => cancelAnimationFrame(frame);
  }, [focusRequest, preview, selected.id]);
  const replaceTemplate = kind => {
    if (!window.confirm('Replace the current participant screen with this template? You can still undo this change.')) return;
    const next = participantUiTemplate(kind);
    if (normalized.root.props?.screenWidth) {
      next.root.props.screenWidth = deviceWidth;
      next.root.props.screenHeight = deviceHeight;
    }
    setTemplateKind(kind);
    commit(next);
    selectElement(next.root.id);
  };
  return <section className="participant-ui-builder" ref={builderRef}>
    <div className="ui-builder-toolbar">
      <b className="ui-builder-title">Participant interface</b>
      <div className="ui-device-switch" role="group" aria-label="Canvas editing mode">
        <button type="button" disabled={preview} aria-pressed={elements.filter(item => ['Screen', 'Layout'].includes(item.element.type)).every(item => item.element.props?.free)} onClick={() => s.setCanvasLayoutMode(true)}>自由编辑</button>
        <button type="button" disabled={preview} aria-pressed={elements.filter(item => ['Screen', 'Layout'].includes(item.element.type)).every(item => !item.element.props?.free)} onClick={() => s.setCanvasLayoutMode(false)}>自动排版</button>
      </div>
      <select aria-label="Template" value={templateKind} onChange={event => replaceTemplate(event.target.value)}>
        {TEMPLATE_KINDS.map(kind => <option key={kind} value={kind}>{kind}</option>)}
      </select>
      <button onClick={() => replaceTemplate(templateKind)}>Reset template</button>
      <span className="ui-toolbar-sep" />
      <button className="ui-history-btn" disabled={!canUndo} onClick={undo} title="Undo (Ctrl+Z)">↶</button>
      <button className="ui-history-btn" disabled={!canRedo} onClick={redo} title="Redo (Ctrl+Shift+Z)">↷</button>
      <span className="ui-toolbar-sep" />
      <label className="ui-screen-size">Screen size<select aria-label="Screen size" value={normalized.root.props?.screenWidth ? deviceWidth + 'x' + deviceHeight : 'legacy'} onChange={event => {
        if (event.target.value === 'legacy') return;
        const [screenWidth, screenHeight] = event.target.value.split('x').map(Number);
        commit(mapUiElement(normalized, normalized.root.id, root => ({ ...root, props: { ...root.props, screenWidth, screenHeight } })));
      }}><option value="legacy" disabled>Existing responsive screen</option>{['1280x720','1920x1080','1024x768','768x1024'].map(size => <option key={size} value={size}>{size.replace('x',' × ')}</option>)}</select></label>
      <span className="ui-toolbar-sep" />
      <div className="ui-zoom-controls" role="group" aria-label="Canvas zoom">
        <button type="button" onClick={() => { const c = viewportCenter(); zoomAt(c.x, c.y, 0.9); }} title="Zoom out (Ctrl+wheel)">−</button>
        <span className="ui-zoom-value">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => { const c = viewportCenter(); zoomAt(c.x, c.y, 1.1); }} title="Zoom in (Ctrl+wheel)">+</button>
        <button type="button" onClick={fitView} title="Fit to view">Fit</button>
        <button type="button" onClick={resetView} title="Reset to 100%">1:1</button>
      </div>
      <label className="ui-snap-toggle" title="Snap to 8px grid while dragging"><input type="checkbox" checked={snapEnabled} onChange={event => setSnapEnabled(event.target.checked)} /> Snap</label>
      <button onClick={() => setPreview(value => !value)}>{preview ? 'Edit' : 'Preview'}</button>
      <button onClick={() => setStructureOpen(value => !value)}>Layers</button>
      <ThemeEditor schema={normalized} theme={theme} onChange={commit} />
    </div>

    {preview ? <ParticipantPreview schema={normalized} width={deviceWidth} />
      : <div className="ui-canvas-layout">
        <div className="ui-element-library">
          <details className="ui-preset-menu"><summary>Experiment layouts</summary>{SCREEN_PRESETS.map(preset => <button key={preset.id} type="button" title={preset.hint} onClick={() => {
            if (!window.confirm('Replace this screen with ' + preset.label + '? You can undo this change.')) return;
            const next = createScreenPreset(preset.id); commit(next); selectElement(next.root.id);
          }}>{preset.label}</button>)}</details>
          <details className="ui-layers-panel" open={structureOpen} onToggle={event => setStructureOpen(event.currentTarget.open)}><summary>Layers</summary>{structureOpen && <StructureTree s={s} />}</details>
          <b className="ui-library-title">Elements</b>
          {LIBRARY_GROUPS.map(group => <div key={group.label} className="ui-library-group">
            <span className="ui-library-label">{group.label}</span>
            {group.types.map(type => (
              <div key={type} className="ui-library-block" draggable
                onClick={() => addToRoot(type)}
                onDragStart={event => {
                  event.dataTransfer.setData('application/x-physioflow-ui', JSON.stringify({ action: 'add', type }));
                  event.dataTransfer.effectAllowed = 'copy';
                }}
                title={TYPE_HINTS[type]}>
                <UiIcon name={type} />
                <span className="ui-library-name">{type}</span>
                <small>{TYPE_HINTS[type]}</small>
              </div>
            ))}
          </div>)}
          <small className="ui-library-tip">Click to insert after the selection (or inside a selected container) · drag for precise placement · Del to remove</small>
        </div>
        <div className="ui-canvas-wrap" ref={viewportRef} onPointerDown={handleViewportPointerDown} onContextMenu={event => { if (event.target === event.currentTarget || !event.target.closest('[data-ui-id]')) closeContextMenu(); }}>
          <div className="ui-canvas-pan" ref={panRef} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
            <div className="ui-canvas-device" style={{ width: deviceWidth, height: deviceHeight }}>
              <ParticipantUiCanvas schema={normalized} selectedId={selectedId} selectedIds={selectedIds} zoom={zoom} snapEnabled={snapEnabled}
                onSelect={selectElement} onDropElement={dropElement} onMoveElement={moveElement} onMoveElements={moveElements}
                onRemoveElement={removeElement} onDuplicateElement={duplicateElementById} onMoveStep={moveStep} onResizeElement={resizeElement}
                onUpdateText={updateText} onUpdateProp={updateProp} onContextMenu={openContextMenu} onRemoveSelected={removeSelected} onDuplicateSelected={duplicateSelected} onAlignSelected={alignSelected} onReorderFlow={reorderFlow} onBoundsIssues={setBoundsIssues} />
            </div>
          </div>
          {marquee && <div className="ui-marquee" style={{ left: Math.min(marquee.x0, marquee.x1) * zoom + pan.x, top: Math.min(marquee.y0, marquee.y1) * zoom + pan.y, width: Math.abs(marquee.x1 - marquee.x0) * zoom, height: Math.abs(marquee.y1 - marquee.y0) * zoom }} />}
          {contextMenu && (() => {
            const menuElement = elements.find(item => item.element.id === contextMenu.elementId)?.element;
            return <div className="ui-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} onMouseDown={event => event.stopPropagation()} onPointerDown={event => event.stopPropagation()}>
              <b>{menuElement?.type || 'Element'}</b>
              <button type="button" onClick={() => { duplicateElementById(contextMenu.elementId); closeContextMenu(); }}>Duplicate</button>
              <button type="button" onClick={() => { copySelected(); closeContextMenu(); }}>Copy</button>
              <button type="button" disabled={!clipboardRef.current} onClick={() => { pasteClipboard(); closeContextMenu(); }}>Paste</button>
              <button type="button" onClick={() => { moveStep(contextMenu.elementId, -1); closeContextMenu(); }}>Move up</button>
              <button type="button" onClick={() => { moveStep(contextMenu.elementId, 1); closeContextMenu(); }}>Move down</button>
              <button type="button" onClick={() => { zOrderSelected('front', [contextMenu.elementId]); closeContextMenu(); }}>Bring to front</button>
              <button type="button" onClick={() => { zOrderSelected('back', [contextMenu.elementId]); closeContextMenu(); }}>Send to back</button>
              <button type="button" onClick={() => { focusStyle(contextMenu.elementId); closeContextMenu(); }}>Edit style</button>
              <button type="button" className="danger" onClick={() => { removeElement(contextMenu.elementId); closeContextMenu(); }}>Delete</button>
            </div>;
          })()}
        </div>
        <aside className="ui-inspector">
          {selectedIds.size > 1 ? <SelectionInspector s={s} /> : <>
          <div className="ui-inspector-head">
            <UiIcon name={selected.type} />
            <span className="ui-inspector-name">
              <b>{selected.type}</b>
              {crumbs.length > 1 && <small>{crumbs.slice(0, -1).map(item => item.type).join(' / ')}</small>}
            </span>
            {selected.id !== normalized.root.id && <div className="ui-inspector-actions">
              <button title="Duplicate (Ctrl+D)" onClick={duplicateSelected}>⧉</button>
              <button className="danger" title="Delete (Del)" onClick={removeSelected}>×</button>
            </div>}
          </div>
          {(() => {
            const isContainer = selected.type === 'Screen' || selected.type === 'Layout';
            const inFreeContainer = selectedParentElement && (selectedParentElement.type === 'Screen' || selectedParentElement.type === 'Layout') && selectedParentElement.props?.free;
            const arrangeTarget = (isContainer && selected.props?.free) ? selected.id : inFreeContainer ? selectedParentElement.id : null;
            if (!arrangeTarget) return null;
            return <button type="button" className="ui-arrange-btn" onClick={() => arrangeContainer(arrangeTarget)} title="Re-lay this screen's elements as a tidy, aligned column on the 8px grid">Auto arrange</button>;
          })()}
          <div className="ui-mode-help"><b>{(selected.type === 'Screen' || selected.type === 'Layout' ? selected : selectedParentElement)?.props?.free ? 'Free canvas' : 'Auto layout'}</b><p>{(selected.type === 'Screen' || selected.type === 'Layout' ? selected : selectedParentElement)?.props?.free ? 'Drag to position. Arrow keys move by 1 px; Shift by 10 px.' : 'Drag to reorder. Select the container to change layout mode.'}</p></div>
          {selected.type !== 'Screen' && <button type="button" aria-pressed={Boolean(selected.props?.locked)} onClick={() => updateProps({locked: !selected.props?.locked})}>{selected.props?.locked ? 'Unlock element' : 'Lock element'}</button>}
          <fieldset className="ui-editable-properties" disabled={s.isLocked(selected.id)}>
          {showPosition && <PositionFields key={selected.id} element={selected} onUpdate={updateProps} />}
          <section className="ui-content-fields"><b>{['Screen', 'Layout'].includes(selected.type) ? 'Layout' : 'Content'}</b><UiPropertyEditor element={selected} onUpdate={updateProps} onToggleFree={toggleFree} /></section>
          {selected.type !== 'Screen' && <div className="ui-property-grid"><b>Appearance</b>
            <label>Color<input type="color" value={/^#[\da-f]{6}$/i.test(appearance.color || '') ? appearance.color : '#17231d'} onChange={event => setStyle({...selected.style, color:event.target.value})} /></label>
            <label>Text alignment<select value={appearance.textAlign || 'center'} onChange={event => setStyle({...selected.style, textAlign:event.target.value})}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
          </div>}
          <StyleEditor element={selected} theme={theme} onSetStyle={setStyle} forceOpen={styleForceOpen} onToggle={open => { if (!open) s.setStyleForceOpen(false); }} />
          <details className="ui-advanced"><summary>Bindings and actions</summary>
          {bindingTarget && <label className="ui-binding-field">Runtime binding for {bindingTarget}<input value={selected.bindings?.[bindingTarget] || ''} placeholder="e.g. variables.score" onChange={event => commit(mapUiElement(normalized, selected.id, element => ({ ...element, bindings: { ...element.bindings, [bindingTarget]: event.target.value } })))} /></label>}
          {selected.type === 'Button' && <div className="ui-property-grid">
            <label>Click action<select value={selected.actions?.[0]?.action || 'submit'} onChange={event => commit(mapUiElement(normalized, selected.id, element => ({ ...element, actions: [{ ...(element.actions?.[0] || { event: 'click' }), action: event.target.value }] })))}><option value="submit">submit</option><option value="next">next</option><option value="setVariable">setVariable</option></select></label>
            {selected.actions?.[0]?.action === 'setVariable' && <><label>Variable name<input value={selected.actions[0].name || ''} onChange={event => commit(mapUiElement(normalized, selected.id, element => ({ ...element, actions: [{ ...element.actions[0], name: event.target.value }] })))} /></label><label>Value<input value={selected.actions[0].value ?? ''} onChange={event => commit(mapUiElement(normalized, selected.id, element => ({ ...element, actions: [{ ...element.actions[0], value: event.target.value }] })))} /></label></>}
          </div>}
          </details>
          </fieldset>
          </>}
        </aside>
      </div>}

    <ScreenChecks elements={elements} boundsIssues={boundsIssues} fixedSize={Boolean(normalized.root.props?.screenWidth)} preview={preview} onLocate={locateIssue} onPreview={() => setPreview(value => !value)} />
    {elements.some(item => item.element.props?.free) && <p className="ui-layout-notice" role="note">{normalized.root.props?.screenWidth ? 'Fixed screen: positions use design pixels. Editor and preview scale proportionally; content outside the screen is clipped.' : 'Existing responsive screen: choose a screen size for fixed-resolution editing and presentation.'}</p>}

    <small className={validation.valid ? 'ui-valid' : 'ui-invalid'}>{validation.valid ? `${elements.length} elements · schema valid` : validation.errors[0]?.message}</small>
  </section>;
}
