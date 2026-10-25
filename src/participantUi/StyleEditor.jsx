import { useBuilderT } from './useBuilderT.js';
import { useEffect, useRef } from 'react';
import { UI_STYLE_KEYS } from '../core/index.js';

function StyleField({ propKey, value, theme, tokenNames, onChange }) {
  const t = useBuilderT();
  const isToken = Boolean(value) && typeof value === 'object' && !Array.isArray(value) && typeof value.$token === 'string';
  const tokenValue = isToken ? value.$token : '';
  const literalValue = isToken ? '' : String(value ?? '');
  return <div className="ui-style-field">
    <span>{propKey}</span>
    <select aria-label={t('{name} source').replace('{name}', propKey)} value={isToken ? `token:${tokenValue}` : 'literal'} onChange={event => {
      if (event.target.value.startsWith('token:')) onChange({ $token: event.target.value.slice(6) });
      else onChange(literalValue || '');
    }}>
      <option value="literal">{t("literal")}</option>
      {tokenNames.map(name => <option key={name} value={`token:${name}`}>{name}</option>)}
    </select>
    {isToken ? <code>{theme[tokenValue] ?? tokenValue}</code> : <input value={literalValue} onChange={event => onChange(event.target.value)} />}
    <button className="danger" aria-label={t('Remove {name} style').replace('{name}', propKey)} onClick={() => onChange(undefined)}>×</button>
  </div>;
}

export function StyleEditor({ element, theme, onSetStyle, forceOpen = false, onToggle }) {
  const t = useBuilderT();
  const style = element.style || {};
  const detailsRef = useRef(null);
  const setKey = (key, value) => {
    const next = { ...style };
    if (value === undefined) delete next[key];
    else next[key] = value;
    onSetStyle(next);
  };
  const activeKeys = UI_STYLE_KEYS.filter(key => key in style);
  const availableKeys = UI_STYLE_KEYS.filter(key => !(key in style));
  const tokenNames = Object.keys(theme);
  useEffect(() => {
    if (forceOpen && detailsRef.current && !detailsRef.current.open) detailsRef.current.open = true;
  }, [forceOpen, element.id]);
  return <details ref={detailsRef} className="ui-style-editor" onToggle={event => { if (!event.currentTarget.open && onToggle) onToggle(false); }}>
    <summary>{t('Advanced appearance')} ({activeKeys.length})</summary>
    {activeKeys.map(key => <StyleField key={key} propKey={key} value={style[key]} theme={theme} tokenNames={tokenNames} onChange={value => setKey(key, value)} />)}
    {availableKeys.length > 0 && <label className="ui-style-add">{t("Add style")}<select value="" onChange={event => event.target.value && setKey(event.target.value, '')}><option value="">{t('Choose style')}</option>{availableKeys.map(key => <option key={key} value={key}>{key}</option>)}</select></label>}
    <small>{t("Dynamic bindings (variables.*) win over static style for color and background.")}</small>
  </details>;
}
