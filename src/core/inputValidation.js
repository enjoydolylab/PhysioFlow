// Shared runtime validation; zero is a real answer, blank is not.
export function responseValueError(value, { required = false, type = 'text', min, max } = {}) {
  const missing = value == null || value === '' || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && value.length === 0);
  if (required && (missing || (type === 'checkbox' && !value))) return 'Required';
  if (missing) return null;
  if (['number', 'rating', 'likert', 'vas_slider', 'sam_valence', 'sam_arousal', 'sam_dominance'].includes(type)) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return 'Enter a valid number';
    if ((min != null && value < Number(min)) || (max != null && value > Number(max))) return `Enter a value between ${min ?? '−∞'} and ${max ?? '∞'}`;
  }
  return null;
}

// Button scales use unit steps. Bound allocation so malformed drafts remain editable.
export function discreteScaleValues(min, max, limit = 1000) {
  if (min == null || max == null || min === '' || max === '') return null;
  const lo = Number(min), hi = Number(max);
  const count = hi - lo + 1;
  if (!Number.isSafeInteger(lo) || !Number.isSafeInteger(hi) || count < 2 || count > limit) return null;
  return Array.from({ length: count }, (_, index) => lo + index);
}
