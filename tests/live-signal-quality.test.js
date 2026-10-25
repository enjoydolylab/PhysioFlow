import test from 'node:test';
import assert from 'node:assert/strict';
import { LIVE_MIN_SAMPLES, liveSignalQuality } from '../src/analysis/signal/liveQuality.js';
import { powerSpectralDensity } from '../src/analysis/signal/spectrum.js';
import { timingSummary } from '../src/analysis/signal/quality.js';
import { normalizeDeviceSnapshot } from '../src/operator/deviceSnapshot.js';

const HZ = 250;
const start = Date.parse('2026-10-01T00:00:00Z');
const regularTimes = (n, hz = HZ) => Array.from({ length: n }, (_, i) => start + Math.round((i * 1000) / hz));
const sine = (n, hz, amplitude = 1, hzRate = HZ) => Array.from({ length: n }, (_, i) => amplitude * Math.sin((2 * Math.PI * hz * i) / hzRate));
const codes = assessment => assessment.issues.map(item => item.code);

test('a buffer shorter than the live minimum is pending, not broken', () => {
  const result = liveSignalQuality({ times: regularTimes(10), channels: [{ name: 'Fz', values: sine(10, 4) }], sampleRateHz: HZ });
  assert.equal(result.verdict, 'pending');
  assert.deepEqual(result.issues, []);
  assert.equal(result.assessedCount, 0);
  assert.equal(result.skippedCount, 1);
  assert.equal(result.sampleRateHz, HZ);
});

test('a clean 10 s live buffer is good', () => {
  const result = liveSignalQuality({ times: regularTimes(2500), channels: [{ name: 'Fz', values: sine(2500, 8) }], sampleRateHz: HZ });
  assert.equal(result.verdict, 'good');
  assert.deepEqual(result.issues, []);
  assert.equal(result.assessedCount, 1);
  assert.ok(Math.abs(result.sampleRateHz - HZ) < 1);
});

test('a millisecond-quantised clock is not reported as jitter', () => {
  // 256 Hz cannot land on whole milliseconds: 3.906 ms becomes 4/3 ms steps,
  // and the analysis default (0.5 ms floor) counts that as jitter.
  const n = 1000;
  const quantised = Array.from({ length: n }, (_, i) => start + Math.round((i * 1000) / 256));
  const analysis = timingSummary(quantised, { tolerance: 0.05, minDeviationMs: 0.5 });
  assert.ok(analysis.jitterRatio > 0.05, 'the analysis floor does see quantisation');
  const result = liveSignalQuality({
    times: quantised,
    channels: [{ name: 'Fz', values: sine(n, 8, 1, 256) }],
    sampleRateHz: 256,
  });
  assert.ok(!codes(result).includes('jitter'));
  assert.ok(!codes(result).includes('timestamps'));
  assert.equal(result.verdict, 'good');
});

test('a stuck channel is an error once the flat run reaches five seconds', () => {
  const n = HZ * 6;
  const result = liveSignalQuality({
    times: regularTimes(n),
    channels: [{ name: 'Fz', values: new Array(n).fill(12.5) }],
    sampleRateHz: HZ,
  });
  const flatline = result.issues.find(item => item.code === 'flatline');
  assert.ok(flatline);
  assert.equal(flatline.severity, 'error');
  assert.equal(flatline.channel, 'Fz');
  assert.match(flatline.title, /value unchanged for \d+\.\d s/);
  assert.equal(result.verdict, 'unusable');
});

test('quantised plateaus below 20 ms are not clipping, longer ones are', () => {
  const base = Array.from({ length: 400 }, (_, i) => Math.round(50 * Math.sin(i / 5)));
  const short = [...base];
  for (let i = 0; i < 3; i += 1) short[100 + i] = 60;
  const shortResult = liveSignalQuality({ times: regularTimes(400), channels: [{ name: 'Fz', values: short }], sampleRateHz: HZ });
  assert.ok(!codes(shortResult).includes('clipping'), 'a 12 ms peak plateau is normal for an integer channel');

  const long = [...base];
  for (let i = 0; i < 25; i += 1) long[100 + i] = 60;
  const longResult = liveSignalQuality({ times: regularTimes(400), channels: [{ name: 'Fz', values: long }], sampleRateHz: HZ });
  const clipping = longResult.issues.find(item => item.code === 'clipping');
  assert.ok(clipping);
  assert.equal(clipping.severity, 'warning');
  assert.equal(longResult.verdict, 'caveat');
});

test('a source without timestamps reports no timing instead of warning about it', () => {
  const result = liveSignalQuality({
    times: null,
    channels: [{ name: 'EEG 1', values: new Array(200).fill(0.2) }],
    sampleRateHz: 250,
  });
  assert.equal(result.timing, null);
  assert.ok(!codes(result).includes('timestamps'));
  assert.ok(codes(result).includes('flatline'), 'flatline still uses the declared rate');
});

test('dropped samples and a real stall stay visible', () => {
  const values = sine(1500, 8).map((value, i) => (i % 4 === 0 ? null : value));
  const result = liveSignalQuality({ times: regularTimes(1500), channels: [{ name: 'Fz', values }], sampleRateHz: HZ });
  const missing = result.issues.find(item => item.code === 'missing');
  assert.ok(missing);
  assert.equal(missing.severity, 'error');
  assert.equal(result.verdict, 'unusable');

  const stalled = regularTimes(1500);
  for (let i = 1200; i < 1500; i += 1) stalled[i] += 418; // 1.7 s hole
  const gapResult = liveSignalQuality({ times: stalled, channels: [{ name: 'Fz', values: sine(1500, 8) }], sampleRateHz: HZ });
  const gap = gapResult.issues.find(item => item.code === 'gap');
  assert.ok(gap);
  assert.equal(gap.severity, 'warning');
});

test('mains hum is reported with its share of the power', () => {
  const values = sine(2000, 50, 5);
  const psd = powerSpectralDensity(values, HZ);
  const result = liveSignalQuality({ times: regularTimes(2000), channels: [{ name: 'Fz', values, psd }], sampleRateHz: HZ });
  const mains = result.issues.find(item => item.code === 'mains');
  assert.ok(mains);
  assert.equal(mains.severity, 'error');
  assert.match(mains.title, /50 Hz/);
  assert.equal(result.verdict, 'unusable');
});

test('channels too short to judge are counted, not silently dropped', () => {
  const result = liveSignalQuality({
    times: regularTimes(500),
    channels: [
      { name: 'Fz', values: sine(500, 8) },
      { name: 'Heart rate', values: [62, 63, 61] },
    ],
    sampleRateHz: HZ,
  });
  assert.equal(result.assessedCount, 1);
  assert.equal(result.skippedCount, 1);
  assert.deepEqual(result.channels.map(channel => channel.name), ['Fz']);
  assert.ok(LIVE_MIN_SAMPLES > 3);
});

test('a normalized device snapshot feeds the assessment without reshaping', () => {
  // The signal check panel hands over exactly this shape: normalized snapshots,
  // one shared millisecond clock for BrainFlow and none at all for Koguchi.
  const samples = Array.from({ length: 500 }, (_, i) => ({ timestamp: i / HZ, values: { eeg: 30 * Math.sin(i / 10) } }));
  const brainflow = normalizeDeviceSnapshot({
    source: 'brainflow',
    snapshot: { boardId: 1, sampleRateHz: HZ, lastSampleAgeMs: 100, manifest: { channels: [{ id: 'eeg', direction: 'input', name: 'Fz' }] }, samples },
  });
  const good = liveSignalQuality({
    times: brainflow.signals[0].times,
    sampleRateHz: brainflow.rate,
    channels: brainflow.signals.map(signal => ({ name: signal.name, values: signal.values })),
  });
  assert.equal(good.verdict, 'good');
  assert.equal(good.assessedCount, 1);

  const koguchi = normalizeDeviceSnapshot({
    source: 'koguchi',
    snapshot: { openbci: { health: 'ok', source: 'udp', last_packet_age_sec: 0.2, received_channels: 1, configured_channels: 1, waveforms: [sine(300, 8)] }, mybeat: { health: 'ok', hr_fresh: true, heart_rate_bpm: 64 } },
  });
  const withoutClock = liveSignalQuality({
    times: koguchi.signals.find(signal => signal.times.length)?.times ?? null,
    sampleRateHz: koguchi.rate ?? null,
    channels: koguchi.signals.map(signal => ({ name: signal.name, values: signal.values })),
  });
  assert.equal(withoutClock.timing, null);
  assert.ok(!codes(withoutClock).includes('timestamps'));
  assert.equal(withoutClock.skippedCount, 1, 'the scalar heart-rate channel has no buffer to judge');
});
