import { useGuideCopy } from '../TaskGuide.jsx';
import { protocolNameOf } from '../core/index.js';

const MODE_HELP = {
  quick: 'Build the flow and edit essential node settings.',
  design: 'Add media, stimulus pools, variables, groups, and participant screens.',
  advanced: 'Configure SDK packages, devices, collaboration, deployment, and raw node details.',
};

export default function Header({ s, onSave, onBack, onExport, onPreview, onFreeze, onCreateDraft, onUndo, onRedo, canUndo, canRedo, hasUnsaved, saveAnim, onBioDB, onGuide }) {
  const guide = useGuideCopy();
  const {
    protocol, locked, t, validation, migrationReviewRequired, commit, actions,
    editorMode, setEditorMode, codeView, closeCodeView, openCodeView,
  } = s;
  return <header className="composer-header">
    <div className="brand"><span>PF</span> Composer V2 {hasUnsaved && <small className="unsaved-dot">●</small>}</div>
    <input disabled={locked} className="composer-title" aria-label="Protocol name" value={protocolNameOf(protocol)} onChange={event => commit({ ...protocol, metadata: { ...protocol.metadata, name: event.target.value }, audit: { ...protocol.audit, updatedAt: new Date().toISOString() } })} />
    <div className="composer-mode-switch" aria-label={t('Editor mode')}>
      {['quick', 'design', 'advanced'].map(mode => <button key={mode} title={t(MODE_HELP[mode])} aria-pressed={editorMode === mode && !codeView} className={editorMode === mode && !codeView ? 'active' : ''} onClick={() => { if (!codeView || closeCodeView()) setEditorMode(mode); }}>{t(mode[0].toUpperCase() + mode.slice(1))}</button>)}
      <button aria-pressed={codeView} className={codeView ? 'active' : ''} onClick={() => codeView ? closeCodeView() : openCodeView()}>{'{ } ' + t('Code')}</button>
    </div>
    <div className="header-tools">
      <button onClick={onGuide}>{guide.help}</button>
      <button disabled={locked || !canUndo} onClick={onUndo}>↩ {t('Undo')}</button>
      <button disabled={locked || !canRedo} onClick={onRedo}>↪ {t('Redo')}</button>
      <button className="primary" disabled={!validation.valid} onClick={onPreview}>{t(locked ? 'Prepare collection' : 'Preview run')}</button>
      {migrationReviewRequired && !locked && <button onClick={actions.markMigrationReviewed}>Mark migration reviewed</button>}
      {locked ? <button onClick={onCreateDraft}>Create editable version</button> : <button disabled={!validation.valid || migrationReviewRequired} onClick={onFreeze}>{t('Freeze version')}</button>}
      <details className="composer-more"><summary>{t('More actions')}</summary><div><button onClick={onExport}>{t('Export')}</button><button className="bio-btn" onClick={onBioDB} disabled={locked}>{t('Legacy BioDB connection')}</button></div></details>
      <button className={saveAnim ? 'saved' : ''} onClick={() => onSave(protocol)}>{saveAnim ? '✓ ' + t('Saved') : t('Save')}</button>
      <button onClick={onBack}>← {t('Projects')}</button>
    </div>
  </header>;
}
