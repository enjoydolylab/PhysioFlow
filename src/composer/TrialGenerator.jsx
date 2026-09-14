import { useState } from 'react';
import { generateGonogoTrials, generateStroopTrials } from '../core/index.js';

export default function TrialGenerator({ config, onChange }) {
  const kind = config.taskKind === 'gonogo' ? 'gonogo' : 'stroop';
  const [count, setCount] = useState(config.trials?.length || (kind === 'gonogo' ? 40 : 16));
  const [error, setError] = useState('');
  const minimum = kind === 'gonogo' ? 10 : 4;
  const valid = Number.isInteger(Number(count)) && Number(count) >= minimum && Number(count) <= 10000 && (kind !== 'stroop' || Number(count) % 4 === 0);
  return <section className="cognitive-generate" aria-label="Trial generation">
    <label>Number of trials<input aria-label="Number of trials" type="number" min={minimum} max={10000} step={kind === 'stroop' ? 4 : 1} value={count} onChange={event => setCount(event.target.value)} /></label>
    <p>{kind === 'stroop' ? 'Choose a multiple of 4 (4–10,000). Use a multiple of 8 for equal congruent/incongruent counts within each ink color.' : 'Choose 10–10,000 trials. The Go ratio is applied to this total and rounded to whole trials.'}</p>
    <p>Generation uses the current paradigm, seed, jitter and Go ratio. Existing trials are replaced only when you click the button.</p>
    <button type="button" disabled={!valid} onClick={() => {
      try {
        const generator = kind === 'gonogo' ? generateGonogoTrials : generateStroopTrials;
        const trials = generator({ trials: Number(count), goRatio: Number(config.goRatio ?? 70), seed: Number(config.seed ?? 1), jitter: Number(config.jitterMs ?? 0) });
        onChange({ ...config, trials });
        setError('');
      } catch (cause) { setError(cause.message || String(cause)); }
    }}>{config.trials?.length ? 'Replace trials with generated set' : 'Generate trials'}</button>
    <p role="status">{config.trials?.length || 0} trials currently saved</p>
    {error && <p role="alert">{error}</p>}
    {!!config.trials?.length && <details><summary>Preview saved trials</summary><ol>{config.trials.slice(0, 20).map((trial, index) => <li key={trial.trialId || index}>{trial.word || trial.stimulus} · {trial.ink || trial.trialType} · {trial.expectedKey || 'no response'}</li>)}</ol>{config.trials.length > 20 && <small>Showing the first 20 of {config.trials.length} trials.</small>}</details>}
  </section>;
}
