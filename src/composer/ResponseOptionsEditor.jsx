import { parseResponseOptions } from '../core/responseOptions.js';

export default function ResponseOptionsEditor({ value, onChange, showKeys = true, allowEmpty = true }) {
  const options = parseResponseOptions(value);
  const update = (index, field, next) => onChange(options.map((option, position) => position === index ? { ...option, [field]: next } : option));
  const duplicateValues = options.some((option, index) => options.findIndex(other => other.value === option.value) !== index);
  const duplicateKeys = options.some((option, index) => option.key && options.findIndex(other => other.key?.toLowerCase() === option.key.toLowerCase()) !== index);
  return <section className="response-options-editor" tabIndex={-1} aria-label={allowEmpty ? "Response options" : "Choice options"}>
    <p>{allowEmpty ? 'Set what participants see, what is saved, and the response key. Leave the list empty to accept free-form keys.' : 'Set the display label and recorded value for each choice. At least one choice is required.'}</p>
    {options.map((option, index) => <fieldset key={index}>
      <legend>Option {index + 1}</legend>
      <label>Display label<input aria-label={`Option ${index + 1} label`} value={option.label} onChange={event => update(index, 'label', event.target.value)} /></label>
      <label>Recorded value<input aria-label={`Option ${index + 1} value`} value={option.value} onChange={event => update(index, 'value', event.target.value)} /></label>
      {showKeys && <label>Key (optional)<input aria-label={`Option ${index + 1} key`} value={option.key || ''} placeholder="e.g. f, j, space" onChange={event => update(index, 'key', event.target.value.trim().toLowerCase())} /></label>}
      <button type="button" onClick={() => onChange(options.filter((_, position) => position !== index))}>Remove option {index + 1}</button>
    </fieldset>)}
    {duplicateValues && <p role="alert">Recorded values are duplicated. Use distinct values to distinguish responses in exported data.</p>}
    {showKeys && duplicateKeys && <p role="alert">Response keys are duplicated. The same key cannot uniquely select these options.</p>}
    {!allowEmpty && options.length === 0 && <p role="alert">Add at least one choice.</p>}
    {options.some(option => !option.value.trim()) && <p role="alert">Enter a recorded value for every option.</p>}
    <button type="button" onClick={() => {
      let next = options.length + 1;
      while (options.some(option => option.value === String(next))) next++;
      onChange([...options, { value: String(next), label: `Option ${next}` }]);
    }}>Add response option</button>
  </section>;
}
