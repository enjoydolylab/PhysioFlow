export function validateTemplateConfig(kind, config) {
 const errors = [];
 const numeric = value => value !== '' && value !== null && value !== undefined && Number.isFinite(Number(value));
 const count = Number(config.trials), unit = kind === 'stroop' ? 4 : 10, maximum = kind === 'stroop' ? 64 : 100;
 if (!numeric(config.trials) || !Number.isInteger(count) || count < unit || count > maximum || count % unit !== 0) errors.push(kind === 'stroop' ? 'Use 4–64 trials in multiples of 4.' : 'Use 10–100 trials in multiples of 10.');
 if (!numeric(config.jitter) || Number(config.jitter) < 0 || Number(config.jitter) > 1000) errors.push('Use an ITI jitter from 0 to 1,000 ms.');
 if (kind === 'gonogo' && (!numeric(config.goRatio) || Number(config.goRatio) < 50 || Number(config.goRatio) > 90)) errors.push('Use a Go ratio from 50% to 90%.');
 const go = kind === 'gonogo' && !errors.length ? Math.round(count * Number(config.goRatio) / 100) : null;
 return { valid: !errors.length, errors, mainTrials: count, practiceTrials: config.practice ? (kind === 'stroop' ? 8 : 10) : 0, goTrials: go, nogoTrials: go === null ? null : count - go };
}
