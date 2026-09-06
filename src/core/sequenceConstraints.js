// Capacity check for a sequence of condition labels with a maximum run length.
export function canCompleteSequence(items, limit, previous, run = 0) {
  const counts = new Map();
  for (const item of items) counts.set(item, (counts.get(item) || 0) + 1);
  return [...counts].every(([label, count]) => {
    const others = items.length - count;
    const capacity = limit * (others + 1) - (label === previous ? run : 0);
    return count <= capacity;
  });
}

export function constrainedOrder(items, key, limit, random) {
  const remaining = [...items], result = [];
  let previous, run = 0;
  if (!canCompleteSequence(remaining.map(key), limit)) throw new Error('Impossible condition order: reduce repetitions or relax the consecutive-condition constraint.');
  while (remaining.length) {
    const labels = remaining.map(key);
    const allowed = new Set([...new Set(labels)].filter(label => {
      const nextRun = label === previous ? run + 1 : 1, index = labels.indexOf(label);
      return nextRun <= limit && canCompleteSequence(labels.filter((_, i) => i !== index), limit, label, nextRun);
    }));
    const candidates = remaining.map((item, index) => ({ item, index })).filter(({ item }) => allowed.has(key(item)));
    if (!candidates.length) throw new Error('Impossible condition order: no valid continuation.');
    const { item, index } = candidates[random() % candidates.length];
    const label = key(item);
    run = label === previous ? run + 1 : 1;
    previous = label;
    result.push(item);
    remaining.splice(index, 1);
  }
  return result;
}
