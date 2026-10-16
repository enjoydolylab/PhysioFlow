import { isJsonValue } from '../../core/jsonValue.js';
import ParticipantRenderer from '../../ParticipantRenderer.jsx';
import { useState } from 'react';
import { useT } from '../../i18n';

export function ParticipantPreview({ schema, width }) {
  return <PreviewSession key={JSON.stringify(schema)} schema={schema} width={width} />;
}

const EXAMPLE_CONTEXT = { participant: { participant_id: 'PREVIEW' }, variables: { score: 0 }, outputs: {}, progress: { percent: 40 }, timer: { elapsedMs: 0 } };

function PreviewSession({ schema, width }) {
  const t = useT();
  const [interactive, setInteractive] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [submission, setSubmission] = useState(null);
  const [context, setContext] = useState(() => structuredClone(EXAMPLE_CONTEXT));
  const [contextText, setContextText] = useState(() => JSON.stringify(EXAMPLE_CONTEXT, null, 2));
  const [contextError, setContextError] = useState(false);
  const [contextApplied, setContextApplied] = useState(false);
  const reset = () => { setSubmission(null); setAttempt(value => value + 1); };
  return <div className="ui-builder-preview">
    <section className="ui-preview-tools" aria-label={t('Preview controls')}>
      <p>{t('Preview answers stay here. They do not start a run or save experiment records.')}</p>
      <button type="button" aria-pressed={interactive} onClick={() => { setInteractive(value => !value); reset(); }}>{t(interactive ? 'Appearance only' : 'Try answering')}</button>
      {interactive && <button type="button" onClick={reset}>{t('Reset answers')}</button>}
    </section>
    <details className="ui-preview-context">
      <summary>{t('Preview binding data')}</summary>
      <p>{t('Use example participant, variables, outputs, progress and timer data to check bindings. This data is temporary and is not saved in the plan or experiment records.')}</p>
      <label>{t('Example context (JSON)')}<textarea aria-label="Preview context JSON" value={contextText} aria-invalid={contextError} onChange={event => { setContextText(event.target.value); setContextError(false); setContextApplied(false); }} /></label>
      <button type="button" onClick={() => {
        let next;
        try { next = JSON.parse(contextText); } catch { setContextError(true); return; }
        if (!next || Array.isArray(next) || typeof next !== 'object' || !isJsonValue(next)) { setContextError(true); return; }
        setContext(next); setContextError(false); setContextApplied(true); reset();
      }}>{t('Apply preview data')}</button>
      <button type="button" onClick={() => { const next = structuredClone(EXAMPLE_CONTEXT); setContext(next); setContextText(JSON.stringify(next, null, 2)); setContextError(false); setContextApplied(true); reset(); }}>{t('Restore example data')}</button>
      {contextError && <p role="alert">{t('Preview context must be a JSON object with finite numbers. The previous preview data is kept.')}</p>}
      {contextApplied && <p role="status">{t('Preview data applied. Preview answers were reset.')}</p>}
    </details>
    <div style={{ width: '100%', maxWidth: width, margin: 'auto' }}><ParticipantRenderer key={attempt} schema={schema} context={context} preview previewInteractions={interactive} onSubmit={setSubmission} onAction={() => setSubmission(null)} onValueChange={() => setSubmission(null)} /></div>
    {submission && <section className="ui-preview-result" aria-label={t('Preview response values')}><p role="status">{t('Preview submission accepted')}</p><pre>{JSON.stringify(submission.values, null, 2)}</pre></section>}
  </div>;
}
