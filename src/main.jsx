import React from 'react';
import { createRoot } from 'react-dom/client';
import { isParticipantEntryLocation } from './hosted/participantRoute.js';
import { DEFAULT_LANGUAGE, LanguageProvider, translate } from './i18n';
import './theme/tokens.css';
import './theme/base.css';
import './theme/runtime.css';
import './theme/modals.css';
import './theme/chrome.css';
import './theme/flow-nodes.css';
import './theme/responsive.css';
import './i18n.css';
import './questionnaire.css';
import './flow/flow-editor.css';
import './flow/flow-panels.css';
import './flow/flow-canvas.css';
import './flow/flow-context.css';
import './flow/flow-views.css';
import './flow-controls.css';
import './runner-extra.css';
import './dashboard.css';
import './analytics.css';
import './sessions.css';
import './composer/composer-v2.css';
import './composer/questionnaire-v2.css';
import './participant-ui.css';
import './participant-launch.css';
import './pf-workflow.css';

// The experiment desk is reachable as /admin?view=devices|database (works on any
// static host) and as /devices, /database for direct links.
function isDeskLocation(location) {
  return /^\/(admin|devices|database)\/?$/.test(location.pathname);
}
function deskPageOf(location) {
  if (/^\/database\/?$/.test(location.pathname)) return 'database';
  const view = new URLSearchParams(location.search).get('view');
  return view === 'database' ? 'database' : 'devices';
}

const startupLanguage = () => localStorage.getItem('physioflow.ui-language') || DEFAULT_LANGUAGE;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('PhysioFlow crashed:', error, info);
  }
  render() {
    if (this.state.error) {
      return React.createElement('div', {
        style: {
          padding: '2rem', margin: '2rem auto', maxWidth: 600,
          background: '#fff3f2', borderRadius: 8, border: '1px solid #ffcdcb',
          fontFamily: 'system-ui, sans-serif',
        }
      },
        React.createElement('h2', { style: { color: '#a32e25', marginTop: 0 } }, translate('App Error', startupLanguage())),
        React.createElement('pre', {
          style: { whiteSpace: 'pre-wrap', fontSize: '.8rem', color: '#5a2e25', lineHeight: 1.5 }
        }, this.state.error?.stack || this.state.error?.message || String(this.state.error)),
        React.createElement('button', {
          onClick: () => { this.setState({ error: null }); window.location.reload(); },
          style: { marginTop: '1rem', padding: '.6rem 1.2rem', border: '1px solid #a32e25', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#a32e25' }
        }, translate('Reload', startupLanguage())),
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById('root');
if (!root) {
  const panel = document.createElement('div');
  panel.style.cssText = 'padding:2rem;font-family:system-ui,sans-serif;color:#a32e25';
  const heading = document.createElement('h2');
  heading.textContent = translate('Fatal Error', startupLanguage());
  const detail = document.createElement('p');
  detail.textContent = translate('Root element #root not found. Ensure index.html loads before this script.', startupLanguage());
  panel.append(heading, detail);
  document.body.replaceChildren(panel);
  throw new Error('#root element not found');
}

// Toast container rendered outside React tree for global availability
const toastRoot = document.createElement('div');
toastRoot.className = 'toast-container';
toastRoot.id = 'toast-root';
document.body.appendChild(toastRoot);

// Dark mode init — apply before React renders to avoid flash
if (localStorage.getItem('physioflow.dark-mode') === '1') {
  document.documentElement.classList.add('dark-mode');
  document.documentElement.classList.remove('light-mode');
} else {
  document.documentElement.classList.add('light-mode');
  document.documentElement.classList.remove('dark-mode');
}

const App = React.lazy(() => import('./App.jsx'));
const OperatorMonitorPage = React.lazy(() => import('./OperatorMonitorPage.jsx'));
const AdminMonitorPage = React.lazy(() => import('./AdminMonitorPage.jsx'));
const ParticipantLaunchPage = React.lazy(() => import('./ParticipantLaunchPage.jsx'));
const entry = isParticipantEntryLocation(window.location)
  ? React.createElement(React.Suspense, { fallback: React.createElement('main', { className: 'participant-launch' }, React.createElement('section', null, 'Loading…')) }, React.createElement(ParticipantLaunchPage))
  : React.createElement(React.Suspense, { fallback: React.createElement('main', null, 'Loading…') }, React.createElement(isDeskLocation(window.location) ? AdminMonitorPage : /^\/operator\/?$/.test(window.location.pathname) ? OperatorMonitorPage : App, { page: deskPageOf(window.location) }));

createRoot(root).render(
  React.createElement(React.StrictMode, null,
    React.createElement(ErrorBoundary, null,
      React.createElement(LanguageProvider, null,
        entry
      )
    )
  )
);

// Register service worker for PWA offline support (web only)
if (import.meta.env.PROD && 'serviceWorker' in navigator && !window.__TAURI_INTERNALS__) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
