const OPERATORS = new Set(['equals', 'not_equals', 'contains', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal', 'is_truthy', 'is_falsy']);

function valuesEqual(actual, expected) {
  if (typeof actual === 'number' && Number.isFinite(actual)) {
    const numericExpected = (typeof expected === 'number' || (typeof expected === 'string' && expected.trim() !== '')) && Number.isFinite(Number(expected));
    return numericExpected && actual === Number(expected);
  }
  return String(actual ?? '') === String(expected ?? '');
}

function numericOperand(value, message) {
  if ((typeof value !== 'number' && typeof value !== 'string') || (typeof value === 'string' && !value.trim()) || !Number.isFinite(Number(value))) throw new Error(message);
  return Number(value);
}

export function evaluateExpression(expression, actualValue, expectedOverride) {
  const operator = expression?.operator || 'equals';
  if (!OPERATORS.has(operator)) throw new Error(`Unsupported expression operator ${operator}`);
  const expected = expectedOverride !== undefined ? expectedOverride : expression?.expected;
  if (operator === 'is_truthy') return Boolean(actualValue);
  if (operator === 'is_falsy') return !actualValue;
  if (operator === 'not_equals') return !valuesEqual(actualValue, expected);
  if (operator === 'contains') {
    if (Array.isArray(actualValue)) return actualValue.some(value => String(value) === String(expected));
    return String(actualValue ?? '').includes(String(expected ?? ''));
  }
  if (['greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'].includes(operator)) {
    const actualNumber = numericOperand(actualValue, 'The actual comparison value must be a finite number. Check the input variable or upstream response.');
    const expectedNumber = numericOperand(expected, 'The expected comparison value must be a finite number. Check the comparison configuration or bound value.');
    if (operator === 'greater_than') return actualNumber > expectedNumber;
    if (operator === 'greater_than_or_equal') return actualNumber >= expectedNumber;
    if (operator === 'less_than') return actualNumber < expectedNumber;
    return actualNumber <= expectedNumber;
  }
  return valuesEqual(actualValue, expected);
}

export function resolveBinding(binding, state, fallback) {
  if (!binding) return fallback;
  if (binding.kind === 'literal') return binding.value;
  if (binding.kind === 'variable') return state.variables[binding.variable];
  if (binding.kind === 'output') return state.outputs[binding.nodeId]?.[binding.portId];
  throw new Error(`Unsupported binding kind ${binding.kind}`);
}
