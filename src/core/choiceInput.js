import { parseResponseOptions } from './responseOptions.js';

export function choiceOptionsError(value) {
  const options = parseResponseOptions(value);
  if (!options.length || options.length > 1000) return 'Choice inputs need between 1 and 1000 options';
  if (options.some(option => !option.value.trim() || !option.label.trim())) return 'Every choice needs a display label and recorded value';
  if (new Set(options.map(option => option.value)).size !== options.length) return 'Choice recorded values must be unique';
  return null;
}
