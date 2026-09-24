// Compare content across versions without treating version identity as an edit.
const versionFields = new Set(['protocolId', 'projectId', 'version', 'audit', 'freeze', 'collaboration']);
const canonical = value => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
};

export function protocolGraphDiff(previous, next) {
  const keys = [...new Set([...Object.keys(previous), ...Object.keys(next)])].filter(key => !versionFields.has(key)).sort();
  const changes = keys.filter(key => JSON.stringify(canonical(previous[key])) !== JSON.stringify(canonical(next[key]))).map(key => `${key}: configuration changed`);
  return { identical: changes.length === 0, changes };
}
