import { useT } from './i18n.jsx';
import { useEffect, useRef, useState } from 'react';
import { CONTROL_NODE_GUIDE, DATA_FORMAT_GUIDE, OUTPUT_FILES, PALETTE, STEP_GUIDE, STORAGE_GUIDE } from './constants.js';

import useGuideDialog from './useGuideDialog.js';
import TaskGuide, { useGuideCopy } from './TaskGuide.jsx';

export default function GuidePanel({ onClose, initialTab = 'workflow' }) {
  const t = useT();
  const copy = useGuideCopy();
  const closeButton = useRef(null);
  useGuideDialog(closeButton, onClose);
  const taskFor = { prepare: 1, run: 2, results: 3 };
  const [tab, setTab] = useState(taskFor[initialTab] === undefined ? initialTab : 'workflow');
  useEffect(() => setTab(['prepare', 'run', 'results'].includes(initialTab) ? 'workflow' : initialTab), [initialTab]);
  const stepItems = PALETTE.flatMap(group => group.items.map(([type, icon, label]) => ({ type, icon, label, group: group.title })));

  return (
    <div className="guide-backdrop" role="dialog" aria-modal="true" aria-label={t("PhysioFlow built-in help center")}>
      <section className="guide-panel">
        <header className="guide-head">
          <div>
            <span>{t("PHYSIOFLOW HELP CENTER")}</span>
            <h2>{copy.title}</h2>
            <p>{copy.path}</p>
          </div>
          <button ref={closeButton} onClick={onClose} aria-label={t("Close guide")}>×</button>
        </header>

        <nav className="guide-tabs" aria-label={t("Guide sections")}>
          <button className={tab === 'workflow' ? 'active' : ''} onClick={() => setTab('workflow')}>{copy.help}</button>
          <button className={tab === 'nodes' ? 'active' : ''} onClick={() => setTab('nodes')}>Node manual</button>
          <button className={tab === 'data' ? 'active' : ''} onClick={() => setTab('data')}>Data format</button>
          <button className={tab === 'storage' ? 'active' : ''} onClick={() => setTab('storage')}>{t("Storage & sharing")}</button>
        </nav>

        {tab === 'workflow' && <div className="guide-content"><TaskGuide initialTask={taskFor[initialTab] || 0} /></div>}

        {tab === 'nodes' && (
          <div className="guide-content">
            <section className="guide-node-grid">
              {stepItems.map(item => {
                const guide = STEP_GUIDE[item.type];
                return (
                  <article key={item.type}>
                    <i>{item.icon}</i>
                    <div>
                      <small>{t(item.group)}</small>
                      <h3>{t(item.label)}</h3>
                      <p>{t(guide.summary)}</p>
                      <p><b>Setup:</b> {t(guide.setup)}</p>
                      <p><b>Export:</b> {t(guide.output)}</p>
                    </div>
                  </article>
                );
              })}
            </section>
            <section className="guide-control-list">
              {Object.entries(CONTROL_NODE_GUIDE).map(([type, guide]) => (
                <article key={type}>
                  <b>{type}</b>
                  <p>{t(guide.summary)}</p>
                  <small>{t(guide.setup)}</small>
                </article>
              ))}
            </section>
          </div>
        )}

        {tab === 'data' && (
          <div className="guide-content">
            <div className="guide-note">
              <h3>{t("Session ZIP contents")}</h3>
              <p>{t("Exports are local files. CSV files include a UTF-8 BOM for spreadsheet compatibility, and every ZIP includes both a human README and a machine-readable data dictionary.")}</p>
            </div>
            <section className="guide-control-list guide-data-list">
              {DATA_FORMAT_GUIDE.map(([file, description]) => (
                <article key={file}>
                  <b>{file}</b>
                  <p>{t(description)}</p>
                </article>
              ))}
            </section>
            <div className="guide-table">
              {OUTPUT_FILES.map(([file, description]) => (
                <div key={file}>
                  <code>{file}</code>
                  <span>{t(description)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'storage' && (
          <div className="guide-content">
            <div className="guide-note">
              <h3>{t("Click-to-use distribution")}</h3>
              <p>{t("Use the desktop build for the easiest handoff. It writes data to a normal local folder, so lab operators can back it up, inspect it, and move it without relying on browser cache.")}</p>
            </div>
            <section className="guide-control-list guide-storage-list">
              {STORAGE_GUIDE.map(([title, description]) => (
                <article key={t(title)}>
                  <b>{t(title)}</b>
                  <p>{t(description)}</p>
                </article>
              ))}
            </section>
            <div className="guide-callout">
              <b>{t("Default desktop data folder")}</b>
              <code>~/Documents/PhysioFlow Data</code>
              <span>{t("Use the available installer for your platform. The current development changes are separate from the published beta.6 installer.")}</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
