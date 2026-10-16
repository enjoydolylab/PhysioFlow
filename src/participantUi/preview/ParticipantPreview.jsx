import ParticipantRenderer from '../../ParticipantRenderer.jsx';
import { useState } from 'react';
import { useT } from '../../i18n';

export function ParticipantPreview({ schema, width }) {
  return <PreviewSession key={JSON.stringify(schema)} schema={schema} width={width} />;
}

function PreviewSession({ schema, width }) {
  const t = useT();
  const [interactive, setInteractive] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [submission, setSubmission] = useState(null);
  const reset = () => { setSubmission(null); setAttempt(value => value + 1); };
  return <div className="ui-builder-preview">
    <section className="ui-preview-tools" aria-label={t('Preview controls')}>
      <p>{t('Preview answers stay here. They do not start a run or save experiment records.')}</p>
      <button type="button" aria-pressed={interactive} onClick={() => { setInteractive(value => !value); reset(); }}>{t(interactive ? 'Appearance only' : 'Try answering')}</button>
      {interactive && <button type="button" onClick={reset}>{t('Reset answers')}</button>}
    </section>
    <div style={{ width: '100%', maxWidth: width, margin: 'auto' }}><ParticipantRenderer key={attempt} schema={schema} context={{ progress: { percent: 40 } }} preview previewInteractions={interactive} onSubmit={setSubmission} onAction={() => setSubmission(null)} onValueChange={() => setSubmission(null)} /></div>
    {submission && <section className="ui-preview-result" aria-label={t('Preview response values')}><p role="status">{t('Preview submission accepted')}</p><pre>{JSON.stringify(submission.values, null, 2)}</pre></section>}
  </div>;
}
