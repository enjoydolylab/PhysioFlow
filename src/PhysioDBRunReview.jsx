import { buildPhysioDBRunExport } from './physioDBRunExport.js';
import { downloadBundle } from './exporter.js';
import { useEffect, useState } from 'react';
import { buildPhysioDBReview } from './physioDBReview.js';
import { useT, useLanguage } from './i18n';
export default function PhysioDBRunReview({ events, runId, client }) {
  const t = useT(), { language } = useLanguage(); const [snapshot, setSnapshot] = useState(null), [page, setPage] = useState(0), [error, setError] = useState(''), [query, setQuery] = useState(''), [answersOnly, setAnswersOnly] = useState(false), [exporting, setExporting] = useState(false);
  useEffect(() => { let active = true; setSnapshot(null); setError(''); setPage(0); if (runId) client.runSnapshot(runId).then(r => { if (active) setSnapshot(r); }).catch(e => { if (active && e.status !== 404) setError(e.message); }); return () => { active = false; }; }, [client, runId]);
  const exportRun = async () => {
    setExporting(true); setError('');
    try {
      const current = await client.runSnapshot(runId);
      const latest = await client.events(current.destination.experimentId, current.destination.participantId);
      const files = buildPhysioDBRunExport({ events: latest, run: current, retrievedAt: new Date().toISOString(), language });
      downloadBundle(files, `physiodb_${runId}`, t);
    } catch (e) { setError(e.message); } finally { setExporting(false); }
  };
  const rows = buildPhysioDBReview(events, { runId, protocol: snapshot?.protocolSnapshot, language, query, answersOnly });
  const lastPage = Math.max(0, Math.ceil(rows.length / 25) - 1), currentPage = Math.min(page, lastPage);
  return <section className="pf-panel pf-run-review"><h2>{t('Run timeline and answers')} · {rows.length}</h2>
    {snapshot && <p>{snapshot.protocolSnapshot.metadata?.name || snapshot.protocolSnapshot.name || snapshot.provenance.protocol_id} · v{snapshot.provenance.protocol_version} · <small>{t('Design fingerprint')}: {snapshot.provenance.protocol_sha256.slice(0, 12)}</small></p>}
    <button className="primary" disabled={!runId || !snapshot || exporting} onClick={exportRun}>{t(exporting ? 'Retrieving export data…' : 'Export this run')}</button>
    <p className="pf-muted">{t('Select a run to export all its events, answers and saved design. Search and pagination do not limit the export. Raw signals are exported separately.')}</p>
    {error && <p role="alert" className="pf-error">{t(error)}</p>}
    <div className="pf-run-selectors"><label>{t('Find a question or observation')}<input type="search" value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} /></label><label><span>{t('Answers only')}</span><input type="checkbox" checked={answersOnly} onChange={e => { setAnswersOnly(e.target.checked); setPage(0); }} /></label></div>
    <ul className="pf-event-list">{rows.slice(currentPage * 25, (currentPage + 1) * 25).map(row => <li key={row.id}><time>{new Date(row.time).toLocaleString()}</time><b>{row.nodeLabel || t(row.type)}</b><span>{t(row.questionLabel || row.type)}</span>{row.responseValue !== undefined && <span>{Array.isArray(row.responseValue) ? (row.responseValue.length ? row.responseValue.join(', ') : t('None')) : typeof row.responseValue === 'object' ? JSON.stringify(row.responseValue) : String(row.responseValue)}</span>}{row.questionId && <small>{row.questionId}</small>}{row.superseded && <small>{t('Superseded response')}</small>}{row.description && <span>{row.description}</span>}</li>)}</ul>
    <div className="pf-analysis-toolbar"><button disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>{t('Previous')}</button><span>{currentPage + 1} / {lastPage + 1}</span><button disabled={currentPage === lastPage} onClick={() => setPage(currentPage + 1)}>{t('Next')}</button></div>
  </section>;
}
