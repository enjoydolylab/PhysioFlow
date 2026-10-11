import test from 'node:test';
import assert from 'node:assert/strict';
import { analysePhysioDBWindow, validateDBWindow, physioDBWindowCSV, waveformPoints } from '../src/analysis/physioDBWindow.js';
const stream = { id: 's', fields: [{ name: '=EEG', type: 'float', unit: 'µV' }, { name: 'label', type: 'string' }] };
const time = i => new Date(Date.UTC(2026, 9, 4) + i * 10).toISOString();

test('API analysis preserves raw values and gaps, and exports numeric negatives safely', () => {
  const samples = [{ time: time(0), values: [-2, 'baseline'] }, { time: time(1), values: [null, 'task'] }, { time: time(2), values: [4, 'end'] }];
  const copy = structuredClone(samples);
  const raw = analysePhysioDBWindow(stream, samples);
  assert.equal(raw.channels.length, 1); assert.equal(raw.channels[0].n, 2); assert.equal(raw.channels[0].missing, 1); assert.equal(raw.channels[0].mean, 1);
  assert.equal(raw.channels[0].dominantFrequencyHz, null);
  const processed = analysePhysioDBWindow(stream, samples, { processing: 'demean' });
  assert.deepEqual(processed.channels[0].values, [-3, null, 3]); assert.deepEqual(samples, copy);
  assert.match(physioDBWindowCSV(raw), /"'=EEG/); assert.match(physioDBWindowCSV(raw), /,-2/);
  assert(waveformPoints(raw.times, raw.channels[0].values).includes(null));
});

test('frequency estimate recovers 10Hz, but irregular timing and missing values suppress it', () => {
  const samples = Array.from({ length: 512 }, (_, i) => ({ time: time(i), values: [Math.sin(i * 2 * Math.PI * 10 / 100) + 15, 'signal'] }));
  const analysis = analysePhysioDBWindow(stream, samples);
  assert.equal(analysis.sampleRateHz, 100); assert(Math.abs(analysis.channels[0].dominantFrequencyHz - 10) < 0.3);
  const irregular = structuredClone(samples); irregular[300].time = new Date(Date.parse(irregular[300].time) + 4).toISOString();
  assert.equal(analysePhysioDBWindow(stream, irregular).channels[0].dominantFrequencyHz, null);
  samples[300].values[0] = null;
  assert.equal(analysePhysioDBWindow(stream, samples).channels[0].dominantFrequencyHz, null);
});

test('request windows and response schemas are validated', () => {
  assert.throws(() => validateDBWindow(time(1), time(0)));
  assert.throws(() => validateDBWindow(time(0), new Date(Date.parse(time(0)) + 301000).toISOString()));
  assert.throws(() => analysePhysioDBWindow(stream, [{ time: time(0), values: [1] }]));
  assert.throws(() => analysePhysioDBWindow(stream, [{ time: time(0), values: [1, 'a'] }, { time: time(0), values: [2, 'b'] }]));
  const empty = analysePhysioDBWindow(stream, []); assert.equal(empty.count, 0); assert.equal(empty.channels[0].mean, null);
});

test('waveform decimation preserves spikes with a bounded point count', () => {
  const times = Array.from({ length: 100000 }, (_, i) => i * 4), values = times.map(() => 0); values[999] = 100;
  const points = waveformPoints(times, values);
  assert(points.length <= 1800); assert(points.some(point => point && point.y === 12));
});
