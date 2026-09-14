import { parseResponseOptions } from '../core/responseOptions.js';

export default function ResponseOptionsEditor({ value, onChange }) {
  const options = parseResponseOptions(value);
  const update = (index, field, next) => onChange(options.map((option, position) => position === index ? { ...option, [field]: next } : option));
  const duplicateValues = options.some((option, index) => options.findIndex(other => other.value === option.value) !== index);
  const duplicateKeys = options.some((option, index) => option.key && options.findIndex(other => other.key?.toLowerCase() === option.key.toLowerCase()) !== index);
  return <section className="response-options-editor" aria-label="Response options">
    <p>Set what participants see, what is saved, and the response key. Leave the list empty to accept free-form keys.</p>
    {options.map((option, index) => <fieldset key={index}>
      <legend>Option {index + 1}</legend>
      <label>Display label<input aria-label={`Option ${index + 1} label`} value={option.label} onChange={event => update(index, 'label', event.target.value)} /></label>
      <label>Recorded value<input aria-label={`Option ${index + 1} value`} value={option.value} onChange={event => update(index, 'value', event.target.value)} /></label>
      <label>Key (optional)<input aria-label={`Option ${index + 1} key`} value={option.key || ''} placeholder="e.g. f, j, space" onChange={event => update(index, 'key', event.target.value.trim().toLowerCase())} /></label>
      <button type="button" onClick={() => onChange(options.filter((_, position) => position !== index))}>Remove option {index + 1}</button>
    </fieldset>)}
    {duplicateValues && <p role="alert">Recorded values are duplicated. Use distinct values to distinguish responses in exported data.</p>}
    {duplicateKeys && <p role="alert">Response keys are duplicated. The same key cannot uniquely select these options.</p>}
    {options.some(option => !option.value.trim()) && <p role="alert">Enter a recorded value for every option.</p>}
    <button type="button" onClick={() => {
      let next = options.length + 1;
      while (options.some(option => option.value === String(next))) next++;
      onChange([...options, { value: String(next), label: `Option ${next}` }]);
    }}>Add response option</button>
  </section>;
}
