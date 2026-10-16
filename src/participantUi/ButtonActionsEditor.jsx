import { useEffect, useState } from 'react';
import { useT } from '../i18n';

function ActionValue({ value, onChange }) {
  const t = useT();
  const [draft, setDraft] = useState(() => JSON.stringify(value ?? null));
  const [invalid, setInvalid] = useState(false);
  useEffect(() => { setDraft(JSON.stringify(value ?? null)); setInvalid(false); }, [value]);
  return <label>{t('Value (JSON)')}<textarea aria-label="Action value JSON" value={draft} onChange={event => {
    const text = event.target.value;
    setDraft(text);
    try { const next = JSON.parse(text); setInvalid(false); onChange(next); }
    catch { setInvalid(true); }
  }} aria-invalid={invalid} />
    <small>{t('Use 0 for a number, false for a boolean, or "yes" for text.')}</small>
    {invalid && <small role="alert">{t('Invalid JSON. The last valid value is kept.')}</small>}
  </label>;
}

export function ButtonActionsEditor({ actions = [], onChange }) {
  const t = useT();
  const update = (index, patch) => onChange(actions.map((action, i) => i === index ? { ...action, ...patch } : action));
  const move = (index, delta) => {
    const next = [...actions];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange(next);
  };
  return <div className="ui-button-actions">
    <p>{t('Assignments run in order. Submit and next validate the final values before continuing.')}</p>
    {!actions.length && <p>{t('This button has no action.')}</p>}
    {actions.map((action, index) => <fieldset key={index} className="ui-button-action">
      <legend>{t('Action')} {index + 1}</legend>
      <label>{t('Click action')}<select aria-label={`Button action ${index + 1}`} value={action.action} onChange={event => update(index, { action: event.target.value, ...(event.target.value === 'setVariable' && !Object.hasOwn(action, 'value') ? { value: null } : {}) })}>
        {['submit', 'next', 'setVariable'].map(type => <option key={type} value={type}>{type}</option>)}
      </select></label>
      {action.action === 'setVariable' && <><label>{t('Variable name')}<input aria-label={`Action variable ${index + 1}`} value={action.name || ''} onChange={event => update(index, { name: event.target.value })} /></label>
        <ActionValue value={action.value} onChange={value => update(index, { value })} />
      </>}
      <div className="ui-action-order">
        <button type="button" disabled={index === 0} aria-label={t('Move action up')} onClick={() => move(index, -1)}>↑</button>
        <button type="button" disabled={index === actions.length - 1} aria-label={t('Move action down')} onClick={() => move(index, 1)}>↓</button>
        <button type="button" onClick={() => onChange(actions.filter((_, i) => i !== index))}>{t('Remove action')}</button>
      </div>
    </fieldset>)}
    <button type="button" onClick={() => onChange([...actions, { event: 'click', action: 'submit' }])}>{t('Add action')}</button>
  </div>;
}
