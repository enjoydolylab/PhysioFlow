import { composerStrings } from './composerStrings.js';
export const isIdentifier = value => typeof value === 'string' && /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*$/.test(value);

export function humanizeIssueCode(value, labels = {}, language = 'ja') {
  if (!value || isIdentifier(value)) return labels[value] || (composerStrings[language]?.['Please check this setting.'] || 'Please check this setting.');
  return value;
}
