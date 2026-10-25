import { useBuilderT } from './useBuilderT.js';
import { COLOR_TOKENS, FONT_TOKENS, SPACING_TOKENS, THEME_PRESETS_V2 } from './constants.js';
import { normalizeColor } from './tree.js';

export function ThemeEditor({ schema, theme, onChange }) {
  const t = useBuilderT();
  const updateToken = (key, value) => onChange({ ...schema, theme: { ...(schema.theme || {}), [key]: value } });
  const reset = () => { const next = { ...schema }; delete next.theme; onChange(next); };
  const applyPreset = name => onChange({ ...schema, theme: { ...(schema.theme || {}), ...THEME_PRESETS_V2[name] } });
  const colorInput = key => <label key={key} className="ui-theme-token"><span>{t(key)}</span>
    <input type="color" value={normalizeColor(theme[key])} onChange={event => updateToken(key, event.target.value)} />
    <input value={theme[key] || ''} onChange={event => updateToken(key, event.target.value)} /></label>;
  const textInput = key => <label key={key} className="ui-theme-token"><span>{t(key)}</span>
    <input value={theme[key] || ''} onChange={event => updateToken(key, event.target.value)} /></label>;
  return <details className="ui-theme-editor">
    <summary>{t('Theme')} ({t(schema.theme ? 'custom' : 'defaults')})</summary>
    <div className="ui-theme-presets">{Object.keys(THEME_PRESETS_V2).map(name => <button key={name} type="button" onClick={() => applyPreset(name)}>{t(name)}</button>)}</div>
    <div className="ui-theme-group"><b>{t("Colors")}</b>{COLOR_TOKENS.map(colorInput)}</div>
    <div className="ui-theme-group"><b>{t("Fonts")}</b>{FONT_TOKENS.map(textInput)}</div>
    <div className="ui-theme-group"><b>{t("Spacing")}</b>{SPACING_TOKENS.map(textInput)}</div>
    {schema.theme && <button onClick={reset}>{t("Reset to defaults")}</button>}
  </details>;
}
