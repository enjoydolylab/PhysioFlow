import { protocolNameOf } from '../core/index.js';

const MODE_HELP = {
  quick: 'Build the flow and edit essential node settings.',
  design: 'Add media, stimulus pools, variables, groups, and participant screens.',
  advanced: 'Configure SDK packages, devices, collaboration, deployment, and raw node details.',
};

export default function Header({ s, onSave, onBack, onExport, onPreview, onFreeze, onCreateDraft, onUndo, onRedo, canUndo, canRedo, hasUnsaved, saveAnim, onBioDB, onGuide }) {
  const {
    protocol, locked, t, validation, migrationReviewRequired, commit, actions,
    editorMode, setEditorMode, codeView, closeCodeView, openCodeView,
  } = s;
  return <header className="composer-header">
    <button onClick={onBack}>← {t('Projects')}</button>
    <input disabled={locked} className="composer-title" aria-label="Protocol name" value={protocolNameOf(protocol)} onChange={event => commit({ ...protocol, metadata: { ...protocol.metadata, name: event.target.value }, audit: { ...protocol.audit, updatedAt: new Date().toISOString() } })} />
    {hasUnsaved && <small className="unsaved-dot">●</small>}
    <div className="composer-mode-switch" aria-label={t('Editor mode')}>
      {['quick', 'design', 'advanced'].map(mode => <button key={mode} title={t(MODE_HELP[mode])} aria-pressed={editorMode === mode && !codeView} className={editorMode === mode && !codeView ? 'active' : ''} onClick={() => { if (!codeView || closeCodeView()) setEditorMode(mode); }}>{mode === 'advanced' ? t('Advanced settings') : t(mode[0].toUpperCase() + mode.slice(1))}</button>)}
      <button aria-pressed={codeView} className={codeView ? 'active' : ''} onClick={() => codeView ? closeCodeView() : openCodeView()}>{'{ } ' + t('Code')}</button>
    </div>
    <div className="header-tools">
      <button aria-label={t('Undo')} title={t('Undo')} disabled={locked || !canUndo} onClick={onUndo}>↩</button>
      <button aria-label={t('Redo')} title={t('Redo')} disabled={locked || !canRedo} onClick={onRedo}>↪</button>
      <button className={!hasUnsaved ? 'primary' : ''} disabled={!validation.valid} onClick={onPreview}>{t(locked ? 'Prepare collection' : 'Run preview')}</button>
      <button className={[hasUnsaved ? 'primary' : '', saveAnim ? 'saved' : ''].filter(Boolean).join(' ')} onClick={() => onSave(protocol)}>{saveAnim ? '✓ ' + t('Saved') : t('Save')}</button>
      <details className="composer-more"><summary aria-label={t('More actions')} title={t('More actions')}>⋯</summary><div>
        {locked ? <button onClick={onCreateDraft}>{t('Create new version')}</button> : <button disabled={!validation.valid || migrationReviewRequired} onClick={onFreeze}>{t('Freeze version')}</button>}
        <button onClick={onExport}>{t('Export')}</button>
        <button className="bio-btn" onClick={onBioDB} disabled={locked}>{t('Legacy BioDB connection')}</button>
        <button onClick={onGuide}>{t('Usage guide')}</button>
        {migrationReviewRequired && !locked && <><button onClick={actions.markMigrationReviewed}>{t('Mark migration reviewed')}</button><small className="pf-muted">{t('Review migrated settings before freezing this version.')}</small></>}
      </div></details>
    </div>
  </header>;
}
