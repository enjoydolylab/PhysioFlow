// Live signal quality for in-flight recordings.
//
// `quality.js` answers the question after the fact, over a window read back from
// PhysioDB. During an experiment the buffer is short, still filling, and arrives
// through a 1-second poll, so the analysis thresholds would raise alarms that
// mean nothing to an operator: a half-second buffer has no flatline, and a
// millisecond-quantised 250 Hz clock looks like 25 % jitter on paper.
//
// This module reuses the analysis taxonomy (see quality.js for what each check
// means) and changes only what live monitoring needs:
//   * `pending` until a channel has enough samples to judge anything;
//   * a jitter floor of one timestamp tick, so a quantised device clock is not
//     reported as unstable;
//   * a longer clipping plateau bound, because quantised integer samples repeat
//     at a peak without the signal being clipped;
//   * no "no timestamps available" warning — a source without timestamps simply
//     reports `timing: null` instead of an issue it cannot act on.

import { channelQuality, mainsInterference, rollUpVerdict, timingSummary } from './quality.js';
import { powerSpectralDensity } from './spectrum.js';

/** Shortest buffer (in finite samples) that supports a verdict on one channel. */
export const LIVE_MIN_SAMPLES = 64;

/** Jitter floor: one millisecond-level tick on a quantised device clock. */
const TIMESTAMP_TICK_MS = 1.5;

/** A stall shorter than this is not worth interrupting an operator over. */
const MIN_REPORTED_GAP_MS = 100;

const issue = (code, severity, title, detail) => ({ code, severity, title, detail });

/** Shared timestamps, only when every value is a real number. */
function usableTimes(times, minSamples) {
  if (!Array.isArray(times) || times.length < minSamples) return null;
  return times.every(Number.isFinite) ? times : null;
}

/**
 * Assess a live buffer.
 *
 * `channels` is `[{ name, values, psd? }]`; `times` is the shared timestamp
 * array in milliseconds. Returns a verdict (`pending` / `good` / `caveat` /
 * `unusable`), every issue tagged with its channel, and how many channels were
 * too short to judge.
 */
export function liveSignalQuality({
  times = null,
  channels = [],
  sampleRateHz = null,
  minSamples = LIVE_MIN_SAMPLES,
  clippingMinRun = null,
  spectrum = true,
  psdMaxSamples = 1024,
} = {}) {
  const prepared = channels.map(channel => ({
    name: channel.name ?? null,
    values: Array.isArray(channel.values) ? channel.values : [],
    psd: channel.psd ?? null,
  }));
  const assessable = prepared.filter(channel => channel.values.filter(Number.isFinite).length >= minSamples);
  const skippedCount = prepared.length - assessable.length;
  const usable = usableTimes(times, minSamples);
  const timing = usable ? timingSummary(usable, { tolerance: 0.05, minDeviationMs: TIMESTAMP_TICK_MS }) : null;
  const hz = Number.isFinite(sampleRateHz) && sampleRateHz > 0 ? sampleRateHz : timing?.nominalHz ?? null;

  if (!assessable.length) {
    return { verdict: 'pending', issues: [], timing, channels: [], assessedCount: 0, skippedCount, sampleRateHz: hz };
  }

  const issues = [];
  if (timing) {
    if (timing.issues.backwards || timing.issues.duplicates) {
      issues.push(issue(
        'timestamps', 'error', 'timestamps are not strictly increasing',
        `${timing.issues.backwards} backwards and ${timing.issues.duplicates} duplicate interval(s)`,
      ));
    }
    if (timing.jitterRatio !== null && timing.jitterRatio > 0.05) {
      issues.push(issue(
        'jitter', timing.jitterRatio > 0.2 ? 'error' : 'warning',
        `${(timing.jitterRatio * 100).toFixed(1)}% of sample intervals deviate from the median`,
        `median ${timing.medianIntervalMs?.toFixed(2)} ms, longest gap ${timing.maxGapMs?.toFixed(0)} ms`,
      ));
    }
    if (timing.maxGapMs !== null && timing.medianIntervalMs > 0) {
      const stall = Math.max(timing.medianIntervalMs * 10, MIN_REPORTED_GAP_MS);
      if (timing.maxGapMs > stall) {
        issues.push(issue(
          'gap', 'warning',
          `a gap of ${(timing.maxGapMs / 1000).toFixed(2)} s breaks the live stream`,
          'samples were dropped; features computed across the gap are not valid',
        ));
      }
    }
  }

  const samplesPerSecond = hz ?? null;
  const clipRun = clippingMinRun ?? (samplesPerSecond ? Math.max(4, Math.round(samplesPerSecond * 0.02)) : 4);
  const channelsOut = assessable.map(channel => {
    const result = channelQuality(channel.values, {
      times: usable,
      nominalHz: samplesPerSecond,
      clippingMinRun: clipRun,
    });
    let mains = null;
    const psd = channel.psd ?? (spectrum && samplesPerSecond && channel.values.every(Number.isFinite)
      ? powerSpectralDensity(channel.values.slice(-psdMaxSamples), samplesPerSecond)
      : null);
    if (psd) {
      mains = mainsInterference(psd);
      if (mains.ratio !== null && mains.ratio > 0.2) {
        const peak = mains.peaks.reduce((a, b) => (a.share > b.share ? a : b));
        result.issues.push(issue(
          'mains', mains.ratio > 0.5 ? 'error' : 'warning',
          `mains interference at ${peak.hz} Hz carries ${(peak.share * 100).toFixed(0)}% of the power`,
          'check electrode contact and cable routing before continuing',
        ));
      }
    }
    for (const item of result.issues) issues.push({ ...item, channel: channel.name });
    return { name: channel.name, ...result, mains };
  });

  return {
    verdict: rollUpVerdict(issues),
    issues,
    timing,
    channels: channelsOut,
    assessedCount: assessable.length,
    skippedCount,
    sampleRateHz: hz,
  };
}
