import { unreviewedMigrationIssues } from '../core/migrationReview.js';
import GroupBatchEditor from './GroupBatchEditor.jsx';
import { NodeInspector } from './NodeInspector.jsx';
import { validationIssueMessage } from './toolbox.js';
import RepeatSequenceEditor from './RepeatSequenceEditor.jsx';
import GroupSequenceEditor from './GroupSequenceEditor.jsx';

export default function Inspector({ s, resources, nodeOnly = false, onEditParticipantUi }) {
  const {
    t, language, locked, editorMode, migrationReviewRequired,
    protocol, registry, selectedNode, selectedEdge,
    validation, showAllValidation, setShowAllValidation,
    dataOutputOptions, updateSelected, deleteSelection, duplicateSelection,
    setSelectedNodeId, setPreviewNodeId, actions,
  } = s;
  return <aside className="composer-inspector">
    {!nodeOnly && <>
    <h2>{t('Inspector')}</h2>
    <GroupSequenceEditor protocol={protocol} locked={locked} onChange={next => s.commit(next)} />
    {migrationReviewRequired && <div className="migration-review-warning"><b>{t('Migration review required')}</b><span>{t('Review {n} migration issues before freezing this draft.').replace('{n}', unreviewedMigrationIssues(protocol).length)}</span></div>}
    </>}
    {selectedNode && <fieldset disabled={locked} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}><NodeInspector deviceConnectors={protocol.deviceConnectors || []} node={selectedNode} definition={registry.get(selectedNode.component.type, selectedNode.component.version)} variables={protocol.variables || []} groups={protocol.graph.groups || []} mode={editorMode} onUpdate={updateSelected} onAssignGroup={actions.assignNodeToGroup} questionnaireLibrary={protocol.questionnaireLibrary || []} onLibraryChange={actions.updateLibrary} assets={protocol.assets || []} resources={resources} stimulusPools={protocol.stimulusPools || []} dataOutputOptions={dataOutputOptions} onCreateGroup={actions.createGroupFromSelection} onCreateStimulusPool={actions.createStimulusPool} onEditParticipantUi={onEditParticipantUi || (() => setPreviewNodeId(selectedNode.id))} /></fieldset>}
    {!nodeOnly && <>
    {!locked && selectedNode && <GroupBatchEditor key={`batch:${selectedNode.id}`} protocol={protocol} node={selectedNode} onApply={result => { s.commit(result.protocol); s.setMessage(t('Updated {n} nodes in this group').replace('{n}', result.count)); }} />}
    {selectedEdge && <div className="inspector-card"><b>{t(selectedEdge.kind)} {t('connection')}</b><code>{selectedEdge.source.portId} → {selectedEdge.target.portId}</code><button className="danger" disabled={locked} onClick={deleteSelection}>{t('Delete connection')}</button></div>}
    {!selectedNode && !selectedEdge && <p>{t('Select a node or connection to configure it.')}</p>}
    {!locked && selectedNode && !selectedEdge && registry.get(selectedNode.component.type, selectedNode.component.version)?.runtime?.kind === 'participant' && <RepeatSequenceEditor key={[...s.selectedSet()].sort().join(':')} protocol={protocol} registry={registry} selectedIds={[...s.selectedSet()]} onApply={result => { s.commit(result.protocol); s.setSelectedIds(new Set([result.node.id])); setSelectedNodeId(result.node.id); s.setMessage(t('Repeat sequence created. Edit Maximum iterations to change its total passes.')); }} />}
    {!locked && selectedNode && !['core.start', 'core.end'].includes(selectedNode.component.type) && <button onClick={duplicateSelection}>{t('Duplicate node')}</button>}
    {!locked && selectedNode && selectedNode.component.type !== 'core.start' && <button className="danger" onClick={deleteSelection}>{t('Delete node')}</button>}
    <section className={`composer-validation ${validation.valid ? 'valid' : 'invalid'}`}>
      <h3>{validation.valid ? `✓ ${t('Graph valid')}` : `${validation.errors.length} ${t('blocking issues')}`}</h3>
      {(() => {
        const allIssues = [...validation.errors, ...validation.warnings];
        const visible = showAllValidation ? allIssues : allIssues.slice(0, 8);
        return <>
          {visible.map((issue, index) => <button key={`${issue.code}-${index}`} onClick={() => issue.nodeId && setSelectedNodeId(issue.nodeId)}><span>{validationIssueMessage(issue, language, protocol)}</span></button>)}
          {!!visible.length && <details><summary>{t('Technical information')}</summary>{visible.map((issue, index) => <code key={index}>{issue.code}<br /></code>)}</details>}
          {allIssues.length > 8 && <button className="composer-validation-more" onClick={() => setShowAllValidation(show => !show)}>{showAllValidation ? `− ${t('Show fewer')}` : `+ ${t('Show all')} (${allIssues.length})`}</button>}
        </>;
      })()}
    </section>    </>}
  </aside>;
}
