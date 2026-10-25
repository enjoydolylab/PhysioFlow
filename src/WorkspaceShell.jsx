import { LanguageToggle, DarkModeToggle, useT } from './i18n';

const navigation = [
  ['projects', 'Projects', '/'],
  ['sessions', 'Records', '/?page=sessions'],
  // Query form keeps the desk reachable on any static host; the paths
  // /devices and /database still resolve for direct links.
  ['devices', 'Devices', '/admin?view=devices'],
  ['database', 'Database', '/admin?view=database'],
  ['tools', 'Settings', '/?page=tools'],
];

export default function WorkspaceShell({ page, onNavigate, onGuide, storageInfo, children }) {
  const t = useT();
  const navigate = (event, id) => {
    if (onNavigate && ['projects', 'sessions', 'tools'].includes(id) && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      onNavigate(id);
    }
  };
  return <main className="dashboard dashboard-redesign">
    <aside className="workspace-sidebar">
      <div className="workspace-wordmark"><span>pf.</span><b>PhysioFlow<small>{t('Research workspace')}</small></b></div>
      <nav aria-label={t('Workspace navigation')}>{navigation.map(([id, label, href], index) => <a key={id} href={href} aria-current={page === id ? 'page' : undefined} onClick={event => navigate(event, id)}><span>0{index + 1}</span>{t(label)}</a>)}</nav>
      <div className="sidebar-bottom"><span className="sidebar-dot" /> {t('Local workspace')}{onGuide && <button onClick={() => onGuide('workflow')}>{t('Help & documentation')} ↗</button>}</div>
    </aside>
    <div className="workspace-content">
      <header className="workspace-topbar"><span>{t('Workspace')} <span className="breadcrumb-divider">/</span> <b>{t(navigation.find(([id]) => id === page)?.[1] || 'Projects')}</b></span><div className="header-tools"><DarkModeToggle /><LanguageToggle /></div></header>
      {children}
      <footer className="workspace-footer"><span>PhysioFlow · {t('Experiment workspace')}</span><a href="/?page=tools" onClick={event => navigate(event, 'tools')}>{storageInfo?.selected ? storageInfo.name || t('Local folder connected') : t('Storage settings')} ↗</a></footer>
    </div>
  </main>;
}
