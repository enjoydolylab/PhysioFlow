import { useT as useDisplayT } from '../i18n.jsx';
import { useLanguage } from '../i18n.jsx';
import { translateComposer as translate } from './translate.js';
import { parseResponseOptions } from '../core/responseOptions.js';

export default function ResponseOptionsEditor({ value, onChange }) {
  const tDisplay = useDisplayT();
  const { language } = useLanguage();
  const t = key => translate(key, language);
  const options = parseResponseOptions(value);
  const update = (index, field, next) => onChange(options.map((option, position) => position === index ? { ...option, [field]: next } : option));
  const duplicateValues = options.some((option, index) => options.findIndex(other => other.value === option.value) !== index);
  const duplicateKeys = options.some((option, index) => option.key && options.findIndex(other => other.key?.toLowerCase() === option.key.toLowerCase()) !== index);
  return <section className="response-options-editor" aria-label={t("Response options")}>
    <p>{t("Set what participants see, what is saved, and the response key. Leave the list empty to accept free-form keys.")}</p>
    {options.map((option, index) => <fieldset key={index}>
    <legend>{t("Option")}{index + 1}</legend>
    <label>{t("Display label")}<input aria-label={tDisplay("Option {0} label", [index + 1])} value={option.label} onChange={event => update(index, 'label', event.target.value)} /></label>
    <label>{t("Recorded value")}<input aria-label={tDisplay("Option {0} value", [index + 1])} value={option.value} onChange={event => update(index, 'value', event.target.value)} /></label>
    <label>{t("Key (optional)")}<input aria-label={tDisplay("Option {0} key", [index + 1])} value={option.key || ''} placeholder={t("e.g. f, j, space")} onChange={event => update(index, 'key', event.target.value.trim().toLowerCase())} /></label>
    <button type="button" onClick={() => onChange(options.filter((_, position) => position !== index))}>{t("Remove option")}{index + 1}</button>
    </fieldset>)}
    {duplicateValues && <p role="alert">{t("Recorded values are duplicated. Use distinct values to distinguish responses in exported data.")}</p>}
    {duplicateKeys && <p role="alert">{t("Response keys are duplicated. The same key cannot uniquely select these options.")}</p>}
    {options.some(option => !option.value.trim()) && <p role="alert">{t("Enter a recorded value for every option.")}</p>}
    <button type="button" onClick={() => {
      let next = options.length + 1;
      while (options.some(option => option.value === String(next))) next++;
      onChange([...options, { value: String(next), label: `Option ${next}` }]);
    }}>{t("Add response option")}</button>
    </section>;
}
