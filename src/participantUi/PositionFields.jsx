import { useBuilderT } from './useBuilderT.js';
import { useState } from 'react';

function NumberField({ label, value, optional, min, onCommit }) {
  const t = useBuilderT();
  const [draft, setDraft] = useState(null);
  const save = () => {
    if (draft == null) return;
    const text = draft.trim();
    const number = Number(text);
    if (!text && optional) onCommit(undefined);
    else if (text && Number.isFinite(number) && (min == null || number >= min)) onCommit(number);
    setDraft(null);
  };
  return <label>{t(label)}<input aria-label={t('Element {name}').replace('{name}', t(label))} type="number" min={min} step="1" placeholder={optional ? 'auto' : undefined}
    value={draft ?? value ?? ''} onChange={event => setDraft(event.target.value)} onBlur={save}
    onKeyDown={event => {
      if (event.key === 'Enter') { event.preventDefault(); save(); }
      if (event.key === 'Escape') { event.preventDefault(); setDraft(null); }
    }} /></label>;
}

export function PositionFields({ element, onUpdate }) {
  const t = useBuilderT();
  return <section className="ui-position-fields"><b>{t("Position & size")}</b><div className="ui-position-grid">
    {['X', 'Y', 'Width', 'Height'].map(label => {
      const key = label.toLowerCase();
      const optional = key === 'width' || key === 'height';
      return <NumberField key={key} label={label} value={element.props?.[key] ?? (optional ? undefined : 0)} optional={optional} min={optional ? 1 : undefined} onCommit={value => onUpdate({[key]:value})} />;
    })}
  </div><small>{t("Enter or leave the field to apply. Escape cancels.")}</small></section>;
}
