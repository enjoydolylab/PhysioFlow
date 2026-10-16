import { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n';
import { downloadJson } from '../composer/toolbox.js';
import { parseScreenTemplate, screenTemplateSnapshot, SCREEN_TEMPLATE_MAX_BYTES } from './screenTemplateFile.js';

export function ScreenTemplateTools({ schema, valid, onImport }) {
  const t = useT();
  const input = useRef(null);
  const feedback = useRef(null);
  const current = useRef(schema);
  current.current = schema;
  const request = useRef(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);
  useEffect(() => () => { request.current += 1; }, []);
  useEffect(() => {
    if (error || done) feedback.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [error, done]);

  const importFile = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const id = ++request.current;
    const before = JSON.stringify(current.current);
    setBusy(true); setError(null); setDone(null);
    try {
      if (file.size > SCREEN_TEMPLATE_MAX_BYTES) throw new Error('Screen template files must be no larger than 5 MB.');
      const source = await file.text();
      if (id !== request.current) return;
      const next = parseScreenTemplate(source);
      if (JSON.stringify(current.current) !== before) throw new Error('The screen changed while reading the file. Import again after finishing your edits.');
      if (!window.confirm(t('Replace the current screen with this template? You can undo this.'))) return;
      const result = onImport(next);
      setDone(result || {});
    } catch (caught) {
      if (id === request.current) setError(caught);
    } finally {
      if (id === request.current) setBusy(false);
    }
  };

  return <section className="ui-template-tools">
    <h3>{t('Your screen templates')}</h3>
    <p>{t('Template files contain screen configuration. Media files and experiment variables are not included.')}</p>
    <button type="button" disabled={busy || !valid} title={!valid ? t('Fix the screen configuration before using it as a template.') : undefined} onClick={() => {
      try {
        setDone(null);
        const snapshot = screenTemplateSnapshot(schema);
        if (new TextEncoder().encode(JSON.stringify(snapshot, null, 2)).byteLength > SCREEN_TEMPLATE_MAX_BYTES) throw new Error('Screen template files must be no larger than 5 MB.');
        downloadJson('PhysioFlow-screen.participant-ui.json', snapshot); setError(null);
      }
      catch (caught) { setError(caught); }
    }}>{t('Export screen template')}</button>
    <button type="button" disabled={busy} onClick={() => input.current?.click()}>{t(busy ? 'Reading template…' : 'Import screen template')}</button>
    <input ref={input} hidden type="file" accept=".json,application/json" aria-label={t('Screen template file')} onChange={importFile} />
    {error && <div ref={feedback} role="alert"><p>{t(error.message)}</p>{error.issues?.slice(0, 5).map((issue, index) => <small key={index}>{t(issue.message)}</small>)}</div>}
    {done && <p ref={feedback} role="status">{t('Screen template imported. Review its media and bindings before running.')}{done.adapted && ` ${t('Responsive template now uses the current canvas size: {width} × {height}.').replace('{width}', done.width).replace('{height}', done.height)}`}</p>}
  </section>;
}
