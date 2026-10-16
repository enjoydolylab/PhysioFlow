export function formatUiText(value) {
  if (value == null) return '';
  if (['string', 'number', 'boolean'].includes(typeof value)) return String(value);
  if (typeof value === 'object') {
    try { return JSON.stringify(value) ?? ''; } catch { return ''; }
  }
  return '';
}
