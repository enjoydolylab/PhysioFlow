import { powerSpectralDensity, dominantFrequency } from './signal/spectrum.js';

export const MAX_DB_WINDOW_MS = 5 * 60 * 1000;
export const MAX_DB_SAMPLES = 100000;
export function validateDBWindow(start, end) {
  const first = Date.parse(start), last = Date.parse(end);
  if (!Number.isFinite(first) || !Number.isFinite(last) || first >= last) throw new Error('Choose a valid start and end time.');
  if (last - first > MAX_DB_WINDOW_MS) throw new Error('Select at most five minutes at a time.');
  return { start: new Date(first).toISOString(), end: new Date(last).toISOString() };
}

function stats(values) {
  let n = 0, mean = 0, m2 = 0, energy = 0, min = Infinity, max = -Infinity;
  for (const value of values) if (Number.isFinite(value)) {
    n += 1; const delta = value - mean; mean += delta / n; m2 += delta * (value - mean);
    energy += value * value; min = Math.min(min, value); max = Math.max(max, value);
  }
  return { n, mean: n ? mean : null, sd: n > 1 ? Math.sqrt(m2 / (n - 1)) : n ? 0 : null, rms: n ? Math.sqrt(energy / n) : null, min: n ? min : null, max: n ? max : null };
}

/** Do not interpolate missing values or compress time gaps into a uniform signal. */
export function analysePhysioDBWindow(stream, samples, { processing = 'raw' } = {}) {
  if (!['raw', 'demean'].includes(processing)) throw new Error('Unsupported processing.');
  if (!Array.isArray(samples) || samples.length > MAX_DB_SAMPLES) throw new Error('This window is too large; choose a shorter interval.');
  const fields = stream?.fields;
  if (!Array.isArray(fields)) throw new Error('Stream fields are unavailable.');
  const times = samples.map(sample => Date.parse(sample.time));
  if (times.some((time, i) => !Number.isFinite(time) || (i > 0 && time <= times[i - 1]))) throw new Error('Sample times must be valid and strictly increasing.');
  if (samples.some(sample => !Array.isArray(sample.values) || sample.values.length !== fields.length)) throw new Error('Samples do not match the stream schema.');
  const intervals = times.slice(1).map((time, i) => time - times[i]);
  const sorted = [...intervals].sort((a, b) => a - b);
  const interval = sorted.length ? sorted[Math.floor(sorted.length / 2)] : null;
  // ISO timestamps commonly have millisecond precision. Use conservative timing checks before estimating a spectrum.
  const regular = Boolean(interval && intervals.every(value => Math.abs(value - interval) <= Math.max(0.5, interval * 0.05)));
  const sampleRateHz = regular ? 1000 / interval : null;
  const channels = fields.flatMap((field, index) => {
    if (!['float', 'integer'].includes(field.type)) return [];
    const raw = samples.map(sample => Number.isFinite(sample.values[index]) ? sample.values[index] : null);
    const originalStats = stats(raw);
    const values = processing === 'demean' ? raw.map(value => value === null ? null : value - originalStats.mean) : raw;
    const summary = stats(values);
    const spectrum = regular && values.length >= 64 && values.every(Number.isFinite)
      ? powerSpectralDensity(values.slice(-8192), sampleRateHz) : null;
    return [{ index, name: field.name, unit: field.unit || null, values, ...summary, missing: samples.length - summary.n, dominantFrequencyHz: spectrum ? dominantFrequency(spectrum) : null }];
  });
  return { streamId: stream.id, experimentId: stream.experiment_id, participantId: stream.participant_id, processing, times, count: samples.length, start: samples[0]?.time || null, end: samples.at(-1)?.time || null, regular, sampleRateHz, channels };
}

function csvCell(value) {
  let text = String(value ?? '');
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function physioDBWindowCSV(analysis) {
  const rows = [['time', ...analysis.channels.map(channel => `${channel.name}${channel.unit ? ` (${channel.unit})` : ''}`)]];
  analysis.times.forEach((time, i) => rows.push([new Date(time).toISOString(), ...analysis.channels.map(channel => channel.values[i] ?? '')]));
  // Numeric cells use numbers directly so negative signal values remain numeric.
  return rows.map(row => row.map(value => typeof value === 'number' && Number.isFinite(value) ? String(value) : csvCell(value)).join(',')).join('\r\n');
}

export function waveformPoints(times, values, width = 900, height = 180, maximumPoints = 900) {
  if (!times.length) return [];
  const summary = stats(values), range = summary.max - summary.min || 1, span = times.at(-1) - times[0] || 1;
  const bucket = Math.max(1, Math.ceil(times.length / maximumPoints));
  const points = [];
  for (let i = 0; i < times.length; i += bucket) {
    const end = Math.min(i + bucket, times.length);
    let low = i, high = i, missing = false;
    for (let j = i; j < end; j += 1) {
      if (!Number.isFinite(values[j])) { missing = true; continue; }
      if (!Number.isFinite(values[low]) || values[j] < values[low]) low = j;
      if (!Number.isFinite(values[high]) || values[j] > values[high]) high = j;
    }
    if (missing) points.push(null);
    for (const j of [...new Set([low, high])].sort((a, b) => a - b)) {
      if (Number.isFinite(values[j])) points.push({ x: 12 + (times[j] - times[0]) / span * (width - 24), y: 12 + (1 - (values[j] - summary.min) / range) * (height - 24) });
    }
  }
  return points;
}
