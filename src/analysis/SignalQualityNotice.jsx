import { useT } from '../i18n';

// One verdict, then the specific findings. Kept presentational so the live
// monitor and the signal check show the same words for the same state: the
// operator should not have to learn two vocabularies for one recording.

const TAG = { pending: 'Collecting', good: 'Signal good', caveat: 'Check signal', unusable: 'Signal unusable' };
const TONE = { pending: '', good: 'ready', caveat: 'warning', unusable: 'warning' };

export default function SignalQualityNotice({ assessment, limit = 6 }) {
  const t = useT();
  if (!assessment) return null;
  const issues = assessment.issues.slice(0, limit);
  const errors = assessment.issues.filter(item => item.severity === 'error').length;
  const warnings = assessment.issues.length - errors;
  const summary = assessment.verdict === 'pending'
    ? t('Waiting for enough samples to assess the signal.')
    : [
      assessment.assessedCount ? `${assessment.assessedCount} ${t('assessed channels')}` : null,
      assessment.skippedCount ? `${assessment.skippedCount} ${t('channels still collecting')}` : null,
      errors ? `${errors} ${t('errors')}` : null,
      warnings ? `${warnings} ${t('warnings')}` : null,
    ].filter(Boolean).join(' · ');
  return <>
    <div className="pf-analysis-toolbar"><span className={`pf-tag ${TONE[assessment.verdict] || ''}`}>{t(TAG[assessment.verdict] || TAG.pending)}</span><span className="pf-muted">{summary}</span></div>
    {issues.length > 0 && <div className="pf-note"><b>{t('Signal quality')}</b><ul>{issues.map((item, index) => <li key={`${item.code}-${item.channel ?? ''}-${index}`}>{item.channel ? `${item.channel}: ` : ''}{item.title}<br /><small className="pf-muted">{item.detail}</small></li>)}</ul>{assessment.issues.length > issues.length && <small className="pf-muted">{assessment.issues.length - issues.length} {t('more findings')}</small>}</div>}
  </>;
}
