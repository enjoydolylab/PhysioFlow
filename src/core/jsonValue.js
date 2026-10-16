// Values that can survive JSON storage without losing fields or becoming null.
export function isJsonValue(value) {
  const active = new WeakSet();
  const stack = [{ value, exit: false }];
  while (stack.length) {
    const item = stack.pop();
    const current = item.value;
    if (item.exit) { active.delete(current); continue; }
    if (current === null || typeof current === 'string' || typeof current === 'boolean') continue;
    if (typeof current === 'number') { if (!Number.isFinite(current)) return false; continue; }
    if (typeof current !== 'object' || active.has(current)) return false;
    const array = Array.isArray(current);
    if (!array && ![Object.prototype, null].includes(Object.getPrototypeOf(current))) return false;
    const keys = Object.keys(current);
    if (array && (keys.length !== current.length || keys.some((key, i) => key !== String(i)))) return false;
    if (Object.getOwnPropertySymbols(current).some(key => Object.getOwnPropertyDescriptor(current, key).enumerable)) return false;
    active.add(current);
    stack.push({ value: current, exit: true });
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(current, key);
      if (!Object.hasOwn(descriptor, 'value')) return false;
      stack.push({ value: descriptor.value, exit: false });
    }
  }
  return true;
}
