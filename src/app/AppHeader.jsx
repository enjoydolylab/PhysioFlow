import { DarkModeToggle, LanguageToggle, useT } from '../i18n';

export default function Header({ hasUnsaved, canUndo, canRedo, onUndo, onRedo, onSave, saveAnim, onGuide }) {
  const tr = useT();
  return <header>
    <div className="brand"><span>PF</span> PhysioFlow{hasUnsaved && <small className="unsaved-dot">●</small>}</div>
    <div className="header-tools">
      <div className="local">{tr("● Local-first workspace")}</div>
      {onGuide && <button className="hint" onClick={() => onGuide('workflow')}>{tr("Help")}</button>}
      {onSave && <button className={`hint${saveAnim ? ' saved' : ''}`} onClick={onSave} title={tr("Ctrl+S")}>{saveAnim ? tr('✓ Saved') : tr('Save')}</button>}
      {canUndo !== undefined && <button className="hint" disabled={!canUndo} onClick={onUndo} title={tr("Ctrl+Z")}>↩</button>}
      {canRedo !== undefined && <button className="hint" disabled={!canRedo} onClick={onRedo} title={tr("Ctrl+Shift+Z")}>↪</button>}
      <DarkModeToggle />
      <LanguageToggle />
    </div>
  </header>;
}
