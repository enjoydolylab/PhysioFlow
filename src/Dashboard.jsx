import TemplateButton from './TemplateConfig.jsx';
import WorkspaceShell from './WorkspaceShell.jsx';
import { materializePlaceholderMedia } from './core/mediaReadiness.js';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useT } from './i18n';
import BioDBSettings from './BioDBSettings.jsx';
import DataPanel from './DataPanel.jsx';
import { loadSettings, saveSettings } from './fsStorage.js';
import { createNextProtocolVersion, duplicateProtocolAsProject, hashProtocol, protocolDiff, validateProtocol } from './domain';
import { verifyProtocolAssets } from './assetStore.js';
import { ConfirmDialog, AlertDialog } from './Modal.jsx';
import { summarizeWorkspaceReadiness } from './readiness.js';
import { projectStage } from './projectStage.js';
import {
  createNextGraphProtocolVersion,
  duplicateGraphProtocolAsProject,
  hashProtocolGraph,
  isGraphProtocol,
  projectIdOf,
  protocolArchivedAtOf,
  protocolIdOf,
  protocolNameOf,
  protocolStatusOf,
  protocolVersionOf,
  validateProtocolGraphConfiguration,
} from './core/index.js';
import { createProjectComponentRegistry } from './sdk/index.js';
import { protocolGraphDiff } from './core/protocolGraphDiff.js';

const SessionManager = lazy(() => import('./SessionManager.jsx'));

const groupProjects = protocols => Object.values(protocols
  .filter(item => protocolStatusOf(item) !== 'retired' && !protocolArchivedAtOf(item))
  .reduce((groups, item) => { (groups[projectIdOf(item)] ??= []).push(item); return groups; }, {}))
  .map(versions => versions.sort((left, right) => protocolVersionOf(right) - protocolVersionOf(left)));

export default function Dashboard({ initialPage = 'projects', initialSessionId = null, protocols, sessions, onOpen, onNew, onTemplate, onImport, onRun, onNextVersion, onDuplicate, onArchive, onRemoveVersion, onRestoreVersion, onRenameProject, onMigrate, onAnalytics, storageInfo, onChooseDataDirectory, onOpenDataFolder, onGuide, onStroopTemplate, onGonogoTemplate }) {
  const t = useT();

  const input = useRef(null);
  const [page, setPage] = useState(initialPage);
  const [projectSearch, setProjectSearch] = useState('');
  const projects = groupProjects(protocols);
  const workspaceReadiness = useMemo(() => summarizeWorkspaceReadiness(protocols, sessions, storageInfo), [protocols, sessions, storageInfo]);
  const statusTone = workspaceReadiness.blocked ? 'blocked' : workspaceReadiness.attention ? 'attention' : 'ready';
  const [confirmState, setConfirm] = useState(null);
  const [alertState, setAlert] = useState(null);
  const [bioDBOpen, setBioDBOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [bioDBSettings, setBioDBSettings] = useState(null);
  useEffect(() => {
    if (bioDBOpen) loadSettings().then(setBioDBSettings).catch(() => setBioDBSettings({}));
  }, [bioDBOpen]);
  const handleBioDBSave = (next) => {
    setBioDBSettings(next);
    saveSettings(next).catch(() => {});
  };

  const importFile = async file => {
    try {
      const parsed = JSON.parse(await file.text());
      const candidate = isGraphProtocol(parsed) ? materializePlaceholderMedia(parsed) : parsed;
      const graphCandidate = isGraphProtocol(candidate);
      const check = graphCandidate
        ? validateProtocolGraphConfiguration(candidate, createProjectComponentRegistry(candidate))
        : validateProtocol(candidate);
      if (!check.valid) throw new Error(check.errors.slice(0, 8).map(error => error.message || error).join('\n'));
      if (!graphCandidate && candidate.status === 'frozen') {
        if (!candidate.config_hash) throw new Error('Frozen protocol has no config_hash.');
        const actualHash = await hashProtocol(candidate);
        if (actualHash !== candidate.config_hash) throw new Error(`Frozen protocol hash mismatch.\nExpected ${candidate.config_hash}\nActual ${actualHash}`);
      }
      if (graphCandidate && protocolStatusOf(candidate) === 'frozen') {
        if (!candidate.freeze?.configHash) throw new Error('Frozen Protocol Graph has no config hash.');
        const actualHash = await hashProtocolGraph(candidate);
        if (actualHash !== candidate.freeze.configHash) throw new Error(`Frozen Protocol Graph hash mismatch.\nExpected ${candidate.freeze.configHash}\nActual ${actualHash}`);
      }
      const assets = graphCandidate
        ? { valid: !(candidate.assets || []).some(asset => asset.required && !asset.sourceUrl && !asset.assetId), issues: (candidate.assets || []).filter(asset => asset.required && !asset.sourceUrl && !asset.assetId).map(asset => ({ message: `Missing required asset ${asset.name || asset.id}` })) }
        : await verifyProtocolAssets(candidate);
      let forceDraft = false;
      if (!assets.valid) {
        const proceed = await new Promise(resolve => {
          setConfirm({ title: 'Missing assets', message: `Some uploaded resources are unavailable or changed in this browser:\n\n${assets.issues.map(i => `• ${i.message}`).join('\n')}\n\nImport as an editable draft and reassign those files?`, confirmLabel: 'Import as draft', danger: false, onConfirm: () => { setConfirm(null); resolve(true); }, onCancel: () => { setConfirm(null); resolve(false); } });
        });
        if (!proceed) return;
        forceDraft = true;
      }
      const related = protocols.filter(item => projectIdOf(item) === projectIdOf(candidate)).sort((a, b) => protocolVersionOf(b) - protocolVersionOf(a));
      let imported = structuredClone(candidate);
      if (related.length) {
        const comparison = graphCandidate
          ? protocolGraphDiff(related[0], candidate)
          : protocolDiff(related[0], candidate);
        const asVersion = await new Promise(resolve => {
          setConfirm({ title: 'Existing project', message: `A project with this project_id already exists.\n\nDifferences from latest version:\n${comparison.identical ? 'No content differences' : comparison.changes.join('\n') || 'Detailed configuration changed'}\n\nChoose how to import, or cancel without making changes.`, confirmLabel: 'Import as version', secondaryLabel: 'Import as new project', danger: false, onConfirm: () => { setConfirm(null); resolve(true); }, onSecondary: () => { setConfirm(null); resolve(false); }, onCancel: () => { setConfirm(null); resolve(null); } });
        });
        if (asVersion === null) return;
        if (asVersion) {
          imported = graphCandidate ? createNextGraphProtocolVersion(candidate, { existingProtocols: protocols }) : createNextProtocolVersion(candidate, { existingProtocols: protocols });
          if (graphCandidate) imported.projectId = projectIdOf(related[0]);
          else imported.project_id = projectIdOf(related[0]);
        } else imported = graphCandidate ? duplicateGraphProtocolAsProject(candidate) : duplicateProtocolAsProject(candidate);
      }
      else if (protocols.some(item => protocolIdOf(item) === protocolIdOf(candidate))) imported = graphCandidate ? duplicateGraphProtocolAsProject(candidate) : duplicateProtocolAsProject(candidate);
      if (forceDraft) {
        if (graphCandidate) {
          imported.version = { ...imported.version, status: 'draft' };
          imported.audit = { ...imported.audit, frozenAt: null };
          delete imported.freeze;
        } else {
          imported.status = 'draft'; imported.frozen_at = null; imported.config_hash = null;
        }
      }
      onImport(imported);
    } catch (error) {
      setAlert({ title: 'Import failed', message: error.message });
    }
  };

  return <WorkspaceShell page={page} onNavigate={setPage} onGuide={onGuide} storageInfo={storageInfo}>
    {bioDBOpen && <BioDBSettings settings={bioDBSettings || {}} onSave={handleBioDBSave} onClose={() => setBioDBOpen(false)} />}
    {dataOpen && <DataPanel settings={bioDBSettings} onClose={() => setDataOpen(false)} />}

    {page === 'projects' && <>
    <section className="project-heading"><div><h1>{t('Experiment projects')}</h1><p>{projects.length} {t('projects')} · {sessions.length} {t('Records')} · {t('Storage')}: {storageInfo?.selected ? storageInfo.name || t('Local folder') : t('No folder selected')}</p></div>
      <div className="project-heading-actions"><input className="project-search" aria-label={t('Search projects')} placeholder={t('Search projects')} value={projectSearch} onChange={event => setProjectSearch(event.target.value)} />
      <details className="project-menu project-new"><summary className="primary">{t('New')} ▾</summary><div className="project-menu-pop">
        <button onClick={onNew}>{t('Blank protocol')}</button><span>{t('From template')}</span><button onClick={onTemplate}>{t('Emotion')}</button>
        {onStroopTemplate && <TemplateButton label={t('Stroop')} onCreate={onStroopTemplate} templateKey="stroop" />}
        {onGonogoTemplate && <TemplateButton label={t('Go/No-Go')} onCreate={onGonogoTemplate} templateKey="gonogo" />}
        <button onClick={() => input.current.click()}>{t('Import JSON')}</button>
      </div></details></div>
    </section>
    <input ref={input} hidden type="file" accept="application/json,.json" onChange={ev => { const file = ev.target.files?.[0]; if (file) importFile(file); ev.target.value = ''; }} />
    <ProjectList projects={projects} protocols={protocols} sessions={sessions} storageInfo={storageInfo} search={projectSearch} onOpen={onOpen} onRun={onRun} onNextVersion={onNextVersion} onDuplicate={onDuplicate} onArchive={onArchive} onRemoveVersion={onRemoveVersion} onRestoreVersion={onRestoreVersion} onRenameProject={onRenameProject} onMigrate={onMigrate} />
    </>}
    {page === 'sessions' && <section className="workspace-sessions"><div className="workspace-page-title"><span className="eyebrow">RESEARCH RECORDS</span><h1>{t('Experiment records')}</h1><p>{t('Review saved data, verify database results, and analyze this session.')}</p></div><Suspense fallback={<p>{t('Loading sessions...')}</p>}><SessionManager embedded initialSessionId={initialSessionId} onClose={() => setPage('projects')} onAnalyze={onAnalytics} /></Suspense></section>}
    {page === 'tools' && <section className="workspace-tools"><div className="workspace-page-title"><span className="eyebrow">WORKSPACE TOOLS</span><h1>{t('Settings')}</h1><p>Keep storage, analysis and integrations in one place.</p></div>    <section className={`status-bar ${statusTone}`}>
      <span className="status-dot" />
      <div className="status-text">
        <b>{storageInfo?.selected ? storageInfo.name : storageInfo?.supported ? 'Choose a local data folder' : 'Formal storage needs Chrome, Edge, or the desktop app'}</b>
        <span>{workspaceReadiness.blocked ? `${workspaceReadiness.blocked} blocked · fix before formal collection` : storageInfo?.selected ? `${workspaceReadiness.ready} ready · ${sessions.length} sessions recorded` : 'Data files stay in a folder you can back up and move.'}</span>
      </div>
      <div className="status-actions">
        {storageInfo?.selected && storageInfo?.data_dir && <button className="hint" onClick={onOpenDataFolder}>Open folder</button>}
        {storageInfo?.supported && <button className="hint" onClick={onChooseDataDirectory}>{storageInfo?.selected ? 'Change folder' : 'Select folder'}</button>}
        {!storageInfo?.supported && <button className="hint" onClick={() => onGuide?.('storage')}>Storage guide</button>}
      </div>
    </section>

<div className="workspace-tool-grid">{onAnalytics && <button onClick={onAnalytics}><span>01 / ANALYSIS</span><b>Analytics ↗</b><p>Explore results and compare recorded sessions.</p></button>}<button onClick={() => setDataOpen(true)}><span>02 / DATA</span><b>Browse data ↗</b><p>Open your data viewer and inspect saved signals.</p></button><details><summary>Legacy BioDB connection</summary><button onClick={() => setBioDBOpen(true)}>BioDB settings ↗</button><p>For the older JWT server.</p></details></div></section>}
    {confirmState && <ConfirmDialog {...confirmState} />}
    {alertState && <AlertDialog {...alertState} onClose={() => setAlert(null)} />}
  </WorkspaceShell>;
}

function ProjectList({ projects, protocols, search, ...actions }) {
  const t = useT();
  const filtered = projects.filter(versions => protocolNameOf(versions[0]).toLowerCase().includes(search.toLowerCase().trim()));
  const archived = protocols.filter(protocolArchivedAtOf);
  return <section className="project-list">
    <div className="project-list-header"><span>{t('Name')}</span><span>{t('State')}</span><span>{t('Last updated')}</span><span /></div>
    {filtered.map(versions => <ProjectRow key={projectIdOf(versions[0])} versions={versions} {...actions} />)}
    {!filtered.length && <div className="empty"><h2>{t(projects.length ? 'No projects match your search.' : 'No projects yet')}</h2>{!projects.length && <p>{t('Start with a blank protocol')}</p>}</div>}
    {archived.length > 0 && <details className="project-archive"><summary>{t('Removed / archived versions')}</summary>{archived.map(version => <div key={protocolIdOf(version)}><span>{protocolNameOf(version)} · {protocolVersionOf(version)}</span><button onClick={() => actions.onRestoreVersion(version)}>{t('Restore')}</button></div>)}</details>}
  </section>;
}
function ProjectRow({ versions, sessions, storageInfo, onOpen, onRun, onNextVersion, onDuplicate, onArchive, onRemoveVersion, onRenameProject, onMigrate }) {
  const t = useT();
  const [historyOpen, setHistoryOpen] = useState(false);
  const latest = versions[0];
  const active = versions.find(item => protocolStatusOf(item) === 'draft') || latest;
  const state = projectStage(active, { sessions, storageInfo });
  const frozen = protocolStatusOf(active) === 'frozen';
  const date = state.updatedAt ? state.updatedAt.slice(5, 10) : t('Unknown date');
  return <div className="project-row-wrap"><div className="project-row">
    <strong>{protocolNameOf(latest)}</strong>
    <span className="project-state">{t({ preparing: 'preparing', ready: 'ready to run', recorded: 'recorded' }[state.stage])}{state.reason && <small> · {t(state.reason.label === 'Frozen reproducible version' ? 'not frozen' : state.reason.label)}</small>}</span>
    <span className="project-updated">{date} · {state.sessions} {t('Records')}</span>
    <div className="project-row-actions"><button className="primary" onClick={() => frozen ? onRun(active) : onOpen(active)}>{t(frozen ? 'Prepare collection' : 'Edit')}</button>
      <details className="project-menu"><summary aria-label={t('Project actions')}>⋯</summary><div className="project-menu-pop" onClick={event => { if (event.target.closest('button')) event.currentTarget.closest('details').open = false; }}>
        <button onClick={() => setHistoryOpen(value => !value)}>{t('Version history')}</button>
        <button onClick={() => onNextVersion(active)}>{t('New version')}</button><button onClick={() => onRenameProject(latest)}>{t('Rename')}</button><button onClick={() => onDuplicate(latest)}>{t('Duplicate')}</button><button onClick={() => onArchive(latest)}>{t('Archive')}</button>
        {!isGraphProtocol(active) && onMigrate && <button onClick={() => onMigrate(active)}>{t('Migrate to Composer V2')}</button>}
      </div></details>
    </div>
  </div>{historyOpen && <div className="project-history" aria-label={t('Version history')}>{versions.map(version => <div key={protocolIdOf(version)}><span>{t('Version')} {protocolVersionOf(version)}</span><button onClick={() => onOpen(version)}>{t('Open')}</button>{onRemoveVersion && <button onClick={() => onRemoveVersion(version)}>{t('Remove')}</button>}</div>)}</div>}</div>;
}

