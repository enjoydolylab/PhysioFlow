import test from 'node:test';
import assert from 'node:assert/strict';
import { assessRecording, channelQuality, clippingRuns, longestFlatRun, mainsInterference, missingSummary, timingSummary, verdictLabel } from '../src/analysis/signal/quality.js';
import { powerSpectralDensity } from '../src/analysis/signal/spectrum.js';

const HZ = 250;
const start = Date.parse('2026-10-01T00:00:00Z');
const regularTimes = n => Array.from({ length: n }, (_, i) => start + Math.round((i * 1000) / HZ));
const sine = (n, hz, amplitude = 1) => Array.from({ length: n }, (_, i) => amplitude * Math.sin((2 * Math.PI * hz * i) / HZ));

test('a clean regular recording has a good verdict and no issues', () => {
  const times = regularTimes(1000);
  const result = assessRecording({ times, channels: [{ name: 'Fz', values: sine(1000, 4) }] });
  assert.equal(result.verdict, 'good');
  assert.deepEqual(result.issues, []);
  assert.equal(verdictLabel(result), null);
  assert.ok(Math.abs(result.sampleRateHz - HZ) < 1);
});

test('duplicate and backwards timestamps are an error, not just "irregular"', () => {
  const times = regularTimes(50);
  times[10] = times[9];
  times[20] = times[19] - 50;
  const result = assessRecording({ times, channels: [{ name: 'Fz', values: new Array(50).fill(0.5) }] });
  const issue = result.issues.find(item => item.code === 'timestamps');
  assert.ok(issue);
  assert.equal(issue.severity, 'error');
  assert.equal(result.verdict, 'unusable');
  assert.match(issue.detail, /1 backwards and 1 duplicate/);
});

test('a jittery clock is reported with the share of deviating intervals', () => {
  const times = regularTimes(200);
  // Alternate the offset so consecutive intervals differ instead of moving together.
  for (let i = 1; i < times.length; i += 1) if (i % 2) times[i] += 3;
  const timing = timingSummary(times);
  assert.ok(timing.jitterRatio > 0.2, `jitterRatio was ${timing.jitterRatio}`);
  const result = assessRecording({ times, channels: [{ name: 'Fz', values: sine(200, 4) }] });
  const issue = result.issues.find(item => item.code === 'jitter');
  assert.ok(issue);
  assert.equal(result.verdict, 'unusable');
});

test('a single dropped packet shows up as a gap warning, not an error', () => {
  const times = regularTimes(200);
  for (let i = 120; i < times.length; i += 1) times[i] += 2000; // 2 s hole
  const result = assessRecording({ times, channels: [{ name: 'Fz', values: sine(200, 4) }] });
  const gap = result.issues.find(item => item.code === 'gap');
  assert.ok(gap);
  assert.equal(gap.severity, 'warning');
  // One hole is a single deviating interval, so the clock is still regular enough.
  assert.equal(result.issues.find(item => item.code === 'jitter'), undefined);
  assert.equal(result.verdict, 'caveat');
});

test('missing samples escalate from warning to error past twenty percent', () => {
  const values = sine(100, 4).map((v, i) => (i % 5 === 0 ? null : v));
  assert.equal(missingSummary(values).ratio, 0.2);
  const result = assessRecording({ times: regularTimes(100), channels: [{ name: 'Fz', values }] });
  const issue = result.issues.find(item => item.code === 'missing');
  assert.ok(issue);
  assert.equal(issue.severity, 'warning'); // exactly 20% is not past the limit

  const worse = sine(100, 4).map((v, i) => (i % 4 === 0 ? null : v));
  const second = assessRecording({ times: regularTimes(100), channels: [{ name: 'Fz', values: worse }] });
  assert.equal(second.issues.find(item => item.code === 'missing').severity, 'error');
});

test('a stuck electrode reads as a flatline with its duration in seconds', () => {
  const values = sine(1000, 4);
  for (let i = 500; i < 750; i += 1) values[i] = 12.5; // 1 s frozen
  const result = assessRecording({ times: regularTimes(1000), channels: [{ name: 'Fz', values }] });
  const issue = result.issues.find(item => item.code === 'flatline');
  assert.ok(issue);
  assert.match(issue.title, /1\.0 s/);
  assert.equal(issue.severity, 'warning');
});

test('a long flatline is an error because nothing can be recovered from it', () => {
  const values = sine(2000, 4);
  for (let i = 200; i < 1800; i += 1) values[i] = 3;
  const result = assessRecording({ times: regularTimes(2000), channels: [{ name: 'Fz', values }] });
  assert.equal(result.issues.find(item => item.code === 'flatline').severity, 'error');
  assert.equal(result.verdict, 'unusable');
});

test('clipping is detected as a plateau on the observed extreme', () => {
  const values = sine(500, 2, 10).map(v => Math.max(-8, Math.min(8, v))); // saturated at +-8
  const clip = clippingRuns(values);
  assert.ok(clip.high >= 3);
  assert.ok(clip.low >= 3);
  const result = assessRecording({ times: regularTimes(500), channels: [{ name: 'Fz', values }] });
  assert.ok(result.issues.find(item => item.code === 'clipping'));
});

test('a single extreme sample is not mistaken for clipping', () => {
  const values = sine(500, 2, 1);
  values[250] = 99;
  assert.deepEqual(clippingRuns(values), { low: 0, high: 0 });
});

test('mains hum is found from an existing PSD and reported as a power share', () => {
  const n = 2048;
  // 4 Hz signal plus a strong 50 Hz component.
  const values = Array.from({ length: n }, (_, i) =>
    Math.sin((2 * Math.PI * 4 * i) / HZ) + 3 * Math.sin((2 * Math.PI * 50 * i) / HZ));
  const psd = powerSpectralDensity(values, HZ);
  const mains = mainsInterference(psd);
  assert.ok(mains.ratio > 0.5, `expected 50 Hz to dominate, got ${mains.ratio}`);
  assert.equal(mains.peaks[0].hz, 50);

  const result = assessRecording({ times: regularTimes(n), channels: [{ name: 'Fz', values, psd }] });
  const issue = result.issues.find(item => item.code === 'mains');
  assert.ok(issue);
  assert.equal(issue.severity, 'error');
  assert.equal(issue.channel, 'Fz');
});

test('a clean spectrum produces no mains issue', () => {
  const n = 2048;
  const values = Array.from({ length: n }, (_, i) => Math.sin((2 * Math.PI * 4 * i) / HZ));
  const psd = powerSpectralDensity(values, HZ);
  const result = assessRecording({ times: regularTimes(n), channels: [{ name: 'Fz', values, psd }] });
  assert.equal(result.issues.find(item => item.code === 'mains'), undefined);
  assert.equal(result.verdict, 'good');
});

test('issues carry the channel name so the UI can point at a row', () => {
  const values = sine(500, 4);
  for (let i = 100; i < 400; i += 1) values[i] = 7;
  const result = assessRecording({
    times: regularTimes(500),
    channels: [{ name: 'Fz', values: sine(500, 4) }, { name: 'Cz', values }],
  });
  assert.equal(result.issues.find(item => item.code === 'flatline').channel, 'Cz');
  assert.equal(result.channels.length, 2);
});

test('a recording without timestamps is a caveat, not a silent pass', () => {
  const result = assessRecording({ channels: [{ name: 'Fz', values: sine(200, 4) }] });
  const issue = result.issues.find(item => item.code === 'timestamps');
  assert.ok(issue);
  assert.equal(issue.severity, 'warning');
  assert.equal(result.verdict, 'caveat');
});

test('channelQuality works on its own for the live monitor', () => {
  const values = sine(250, 4);
  const result = channelQuality(values, { nominalHz: HZ });
  assert.deepEqual(result.issues, []);
  assert.equal(result.missing.total, 0);
  assert.equal(longestFlatRun(values).length, 1);
});

test('verdictLabel condenses the counts for a toolbar', () => {
  const values = sine(2000, 4);
  for (let i = 100; i < 1400; i += 1) values[i] = 7; // 1300 samples = 5.2 s flat at 250 Hz
  const result = assessRecording({ times: regularTimes(2000), channels: [{ name: 'Fz', values }] });
  assert.equal(result.verdict, 'unusable');
  assert.match(verdictLabel(result), /^unusable: 1 error/);
});
