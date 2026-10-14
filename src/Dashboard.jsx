import EmotionTemplateConfig from './EmotionTemplateConfig.jsx';
import { useGuideCopy } from './TaskGuide.jsx';
import { materializePlaceholderMedia } from './core/mediaReadiness.js';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { LanguageToggle, DarkModeToggle, useT } from './i18n';
import BioDBSettings from './BioDBSettings.jsx';
import DataPanel from './DataPanel.jsx';
import { loadSettings, saveSettings } from './fsStorage.js';
import { createNextProtocolVersion, duplicateProtocolAsProject, hashProtocol, protocolDiff, validateProtocol } from './domain';
import { verifyProtocolAssets } from './assetStore.js';
import { ConfirmDialog, AlertDialog } from './Modal.jsx';
import { assessProtocolReadiness, summarizeWorkspaceReadiness } from './readiness.js';
import TemplateButton from './TemplateConfig.jsx';
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
  protocolVersionLabelOf,
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

function estimateDuration(protocol) {
  if (isGraphProtocol(protocol)) {
    return protocol.graph.nodes.reduce((total, node) => {
      const duration = node.config?.completion?.durationMs ?? node.config?.durationMs ?? 0;
      return total + (Number(duration) || 0);
    }, 0);
  }
  return protocol.blocks.reduce((sum, b) => {
    const br = Math.max(0, Number(b.repeat_count ?? 1));
    return sum + br * b.trials.reduce((ts, t) => {
      const tr = Math.max(0, Number(t.repeat_count ?? 1));
      return ts + tr * t.steps.reduce((ss, s) => ss + (s.duration_mode === 'fixed' ? (Number(s.planned_duration_ms) || 0) : 0), 0);
    }, 0);
  }, 0);
}

function formatDuration(ms) {
  if (!ms) return '';
  const m = Math.round(ms / 60000);
  const s = Math.round((ms % 60000) / 1000);
  return m > 0 ? `~${m}m ${s}s` : `~${s}s`;
}

export default function Dashboard({ initialPage = 'projects', initialSessionId = null, protocols, sessions, onOpen, onNew, onTemplate, onImport, onRun, onNextVersion, onDuplicate, onArchive, onRemoveVersion, onRestoreVersion, onRenameProject, onMigrate, onAnalytics, storageInfo, onChooseDataDirectory, onOpenDataFolder, onGuide, onStroopTemplate, onGonogoTemplate }) {
  const t = useT();
  const guide = useGuideCopy();
  const input = useRef(null);
  const [page, setPage] = useState(initialPage);
  const [projectSearch, setProjectSearch] = useState('');
  const projects = groupProjects(protocols);
  const recentProject = projects.map(versions => versions.find(item => protocolStatusOf(item) === 'draft') || versions[0]).sort((a, b) => String(b.audit?.updatedAt || b.updated_at || '').localeCompare(String(a.audit?.updatedAt || a.updated_at || '')))[0];
  const frozenCount = protocols.filter(item => protocolStatusOf(item) === 'frozen').length;
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

  return <main className="dashboard dashboard-redesign">
    <aside className="workspace-sidebar"><div className="workspace-wordmark"><span>pf.</span><b>PhysioFlow<small>RESEARCH WORKSPACE</small></b></div><nav aria-label="Workspace navigation">{[['projects', 'Projects', '01'], ['sessions', 'Sessions', '02'], ['tools', 'Data & settings', '03']].map(([id, label, number]) => <button key={id} aria-current={page === id ? 'page' : undefined} onClick={() => setPage(id)}><span>{number}</span>{t(label)}{id === 'projects' && <small>{projects.length}</small>}</button>)}<a className="workspace-desk-link" href="/admin"><span>↗</span> {t('Devices & connections')}</a></nav><div className="sidebar-bottom"><span className="sidebar-dot" /> Local workspace<p>Your experiments.<br />Your research.</p><button onClick={() => onGuide?.('workflow')}>Help & documentation ↗</button></div></aside>
    <div className="workspace-content">
    <header className="workspace-topbar"><span>Workspace <span className="breadcrumb-divider">/</span> <b>{page === 'projects' ? 'Projects' : page === 'sessions' ? 'Sessions' : 'Data & settings'}</b></span><div className="header-tools"><button onClick={() => onGuide?.('workflow')}>{guide.help}</button><button onClick={() => setPage('sessions')}>{t('Manage sessions')}</button><DarkModeToggle /><LanguageToggle /></div></header>
    {bioDBOpen && <BioDBSettings settings={bioDBSettings || {}} onSave={handleBioDBSave} onClose={() => setBioDBOpen(false)} />}
    {dataOpen && <DataPanel settings={bioDBSettings} onClose={() => setDataOpen(false)} />}

    {page === 'projects' && <>
    <section className="workspace-intro"><div><span className="eyebrow">PHYSIOFLOW</span><h1>{t('Experiment projects')}</h1><p>{t('Design your protocol, prepare a participant, then review the results.')}</p></div><div className="workspace-overview"><span><b>{projects.length}</b> projects</span><span><b>{frozenCount}</b> frozen versions</span><span><b>{sessions.length}</b> sessions</span></div></section>
    {recentProject && <section className="workspace-resume" aria-label={t('Recent project')}><div><small>{t('Recent project')}</small><b>{protocolNameOf(recentProject)}</b></div><button onClick={() => onOpen(recentProject)}>{t(protocolStatusOf(recentProject) === 'draft' ? 'Continue editing' : 'Open project')}</button>{protocolStatusOf(recentProject) === 'frozen' && <button className="primary" onClick={() => onRun(recentProject)}>{t('Prepare collection')}</button>}</section>}
    <section className="workspace-create"><div className="create-symbol" aria-hidden="true">＋</div><div><h2>Create an experiment</h2><p>Choose a blank protocol or a template.</p></div><button className="primary" onClick={onNew}>New protocol <span aria-hidden="true">↗</span></button><button onClick={() => input.current.click()}>Import JSON</button><details className="workspace-templates"><summary>Start from a template</summary><div><EmotionTemplateConfig onCreate={onTemplate} />{onStroopTemplate && <TemplateButton label="Stroop" onCreate={onStroopTemplate} templateKey="stroop" />}{onGonogoTemplate && <TemplateButton label="Go/No-Go" onCreate={onGonogoTemplate} templateKey="gonogo" />}</div></details></section>
    <input ref={input} hidden type="file" accept="application/json,.json" onChange={ev => { const file = ev.target.files?.[0]; if (file) importFile(file); ev.target.value = ''; }} />
    <section>
      <div className="section-title">
        <h2>Your projects <small>{projects.length}</small></h2>
        <input className="project-search" aria-label="Search projects" placeholder="Search projects…" value={projectSearch} onChange={event => setProjectSearch(event.target.value)} />
      </div>
      <div className="protocol-grid">
        {projects.filter(versions => protocolNameOf(versions[0]).toLowerCase().includes(projectSearch.toLowerCase().trim())).map(versions => <ProjectCard key={projectIdOf(versions[0])} versions={versions} sessions={sessions} storageInfo={storageInfo} onOpen={onOpen} onRun={onRun} onNextVersion={onNextVersion} onDuplicate={onDuplicate} onArchive={onArchive} onRemoveVersion={onRemoveVersion} onRenameProject={onRenameProject} onMigrate={onMigrate} />)}
        {projects.length > 0 && !projects.some(versions => protocolNameOf(versions[0]).toLowerCase().includes(projectSearch.toLowerCase().trim())) && <p className="empty">No projects match your search.</p>}{!projects.length && <div className="empty">
          <div className="empty-project-mark" aria-hidden="true">↗</div><h3 className="empty-title">Your first study starts here</h3><p>Use “New protocol” above to create your first experiment.</p>
        </div>}
      </div>
    </section>
    <details className="project-version-history">
      <summary>Removed / archived versions ({protocols.filter(protocolArchivedAtOf).length})</summary>
      <p>Removed versions remain recoverable. Session data is retained.</p>
      {protocols.filter(protocolArchivedAtOf).map(version => <div className="card-actions" key={protocolIdOf(version)}>
        <span>{protocolNameOf(version)} · v{protocolVersionOf(version)} · {protocolStatusOf(version)}</span>
        <button onClick={() => onRestoreVersion(version)}>Restore {protocolNameOf(version)} v{protocolVersionOf(version)}</button>
      </div>)}
    </details>

    </>}
    {page === 'sessions' && <section className="workspace-sessions"><div className="workspace-page-title"><span className="eyebrow">RESEARCH RECORDS</span><h1>{t('Experiment records')}</h1><p>{t('Review saved data, verify database results, and analyze this session.')}</p></div><Suspense fallback={<p>{t('Loading sessions...')}</p>}><SessionManager embedded initialSessionId={initialSessionId} onClose={() => setPage('projects')} onAnalyze={onAnalytics} /></Suspense></section>}
    {page === 'tools' && <section className="workspace-tools"><div className="workspace-page-title"><span className="eyebrow">WORKSPACE TOOLS</span><h1>Data & settings</h1><p>Keep storage, analysis and integrations in one place.</p></div>    <section className={`status-bar ${statusTone}`}>
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

<div className="workspace-tool-grid">{onAnalytics && <button onClick={onAnalytics}><span>01 / ANALYSIS</span><b>Analytics ↗</b><p>Explore results and compare recorded sessions.</p></button>}<button onClick={() => setDataOpen(true)}><span>02 / DATA</span><b>Browse data ↗</b><p>Open your data viewer and inspect saved signals.</p></button><details><summary>Legacy BioDB connection</summary><button onClick={() => setBioDBOpen(true)}>BioDB settings ↗</button><p>For the older JWT server.</p></details></div><div className="workspace-db-entry"><div><b>PhysioDB · Experiment desk</b><p>Check signals, read recorded data, and export analysis.</p></div><a href="/admin">Open experiment desk ↗</a></div></section>}
    <footer className="workspace-footer"><span>PhysioFlow · Experiment workspace</span><button onClick={() => setPage('tools')}>{storageInfo?.selected ? storageInfo.name || 'Local folder connected' : 'Storage settings'} ↗</button></footer>
    </div>
    {confirmState && <ConfirmDialog {...confirmState} />}
    {alertState && <AlertDialog {...alertState} onClose={() => setAlert(null)} />}
  </main>;
}

function ProjectCard({ versions, sessions, storageInfo, onOpen, onRun, onNextVersion, onDuplicate, onArchive, onRemoveVersion, onRenameProject, onMigrate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const latest = versions[0], draft = versions.find(item => protocolStatusOf(item) === 'draft');
  const activeProtocol = draft || latest;
  const readiness = assessProtocolReadiness(activeProtocol, { sessions, storageInfo });
  const graphProtocol = isGraphProtocol(latest);
  const stepTypes = new Set(graphProtocol
    ? latest.graph.nodes.map(node => node.component.type).filter(type => !type.startsWith('core.'))
    : latest.blocks.flatMap(b => b.trials.flatMap(t => t.steps.map(s => s.type))));
  const questionnaireCount = graphProtocol ? 0 : latest.blocks.reduce((c, b) => c + b.trials.reduce((tc, t) => tc + t.steps.filter(s => s.type === 'questionnaire').length, 0), 0);
  const totalMs = estimateDuration(latest);
  const missingMedia = graphProtocol
    ? latest.graph.nodes.some(node => node.component.type === 'display.media' && !node.config?.assetId && !node.config?.sourceUrl && !node.config?.stimulusPoolId && !node.config?.stimulusPool?.enabled)
    : latest.blocks.some(b => b.trials.some(t => t.steps.some(s => ['video', 'audio', 'image'].includes(s.type) && !s.source_url && !s.asset_id && !(latest.stimuli || []).some(r => r.stimulus_id === s.stimulus_id && (r.source_url || r.asset_id)))));
  const status = protocolStatusOf(latest);
  return <article className="protocol-card project-card">
    <div className="protocol-card-top">
      <span className={`badge ${status}`}>{status}</span>
      <span className={`readiness-pill ${readiness.status}`}>{readiness.status === 'ready' ? 'Ready to run' : readiness.status === 'blocked' ? 'Needs setup' : 'Review setup'}</span>
      <div className="card-menu-wrap">
        <button className="card-menu" onClick={() => setMenuOpen(value => !value)} aria-label="Project actions">⋯</button>
        {menuOpen && <div className="card-menu-pop">
          <button onClick={() => onRenameProject(latest)}>Rename</button>
          {!graphProtocol && onMigrate && <button onClick={() => onMigrate(latest)}>Migrate to Composer V2</button>}
          <button onClick={() => onDuplicate(latest)}>Duplicate project</button>
          <button onClick={() => onArchive(latest)}>Archive project</button>
        </div>}
      </div>
    </div>
    <button className="card-main" onClick={() => onOpen(activeProtocol)}>
      <h3>{protocolNameOf(latest)}</h3>
      <p>{graphProtocol ? `${latest.graph.nodes.length} nodes · ${latest.graph.edges.length} connections` : `${latest.blocks.length} blocks · ${latest.blocks.reduce((total, b) => total + b.trials.length, 0)} trials`}</p>
      <div className="protocol-summary">
        {[...stepTypes].slice(0, 5).map(t => <span key={t}>{t.replace(/^[^.]+\./, '').replaceAll('-', ' ')}</span>)}
        {questionnaireCount > 0 && <span>☷ {questionnaireCount} Q</span>}
        {formatDuration(totalMs) && <span>⏱ {formatDuration(totalMs)}</span>}
        {missingMedia && <span style={{ background: '#ffe9e6', color: '#922b24' }}>⚠ missing media</span>}
        {stepTypes.size > 5 && <span>+{stepTypes.size - 5} more</span>}
      </div>
      <small>{graphProtocol && <span className="composer-v2-tag">Composer V2 · </span>}v{protocolVersionOf(latest)} · {protocolVersionLabelOf(latest)} · {versions.length} version{versions.length > 1 ? 's' : ''}</small>
    </button>
    <div className="card-actions">
      {draft ? <button className="primary" onClick={() => onOpen(draft)}>Edit draft</button>
        : <button className="primary" onClick={() => (status === 'frozen' ? onRun(latest) : onOpen(latest))}>{status === 'frozen' ? 'Run latest' : 'Open'}</button>}
      {!draft && <button onClick={() => onNextVersion(latest)}>New version</button>}
    </div>
    <details className="project-version-history">
      <summary>Version history ({versions.length})</summary>
      {versions.map(version => <div className="card-actions" key={`${protocolIdOf(version)}:${protocolVersionOf(version)}`}>
        <span>v{protocolVersionOf(version)} · {protocolStatusOf(version)}</span>
        <button onClick={() => onOpen(version)}>Open v{protocolVersionOf(version)}</button>
        {onRemoveVersion && <button onClick={() => onRemoveVersion(version)}>Remove v{protocolVersionOf(version)}</button>}
      </div>)}
    </details>
  </article>;
}
