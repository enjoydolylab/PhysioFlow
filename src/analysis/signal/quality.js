// Recording quality assessment.
//
// The analysis pipeline already computes statistics and a spectrum. This module
// answers the question those numbers do not: is this recording usable, and if
// not, why not? Everything is pure and operates on plain arrays.
//
// The verdict is deliberately conservative. A recording is only `good` when no
// check fires; anything else lists the specific issue so an operator can decide
// whether to re-record rather than guess from a single word like "irregular".

/** Severity ordering used when rolling channel issues up to the recording. */
const SEVERITY_ORDER = { info: 0, warning: 1, error: 2 };

/** Quantile of a sorted copy; interpolation-free, which is fine for timing. */
function quantile(sorted, q) {
  if (!sorted.length) return null;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))));
  return sorted[index];
}

/**
 * Sample interval behaviour.
 *
 * `jitterRatio` is the share of intervals that deviate from the median by more
 * than the tolerance. A few outliers are normal (scheduler hiccups); a large
 * share means the timestamps are not a reliable clock.
 *
 * `minDeviationMs` is the smallest interval change counted as jitter. Millisecond
 * timestamps quantise a 250 Hz clock into 4 and 5 ms steps, which is a 25 %
 * deviation on paper and no jitter at all in practice, so a live caller passes a
 * tick-sized floor instead of trusting the ratio alone.
 */
export function timingSummary(times, { tolerance = 0.05, minDeviationMs = 0.5 } = {}) {
  const issues = { duplicates: 0, backwards: 0 };
  if (!Array.isArray(times) || times.length < 2) {
    return { count: times?.length ?? 0, medianIntervalMs: null, jitterRatio: null, maxGapMs: null, issues };
  }
  const intervals = [];
  for (let i = 1; i < times.length; i += 1) {
    const delta = times[i] - times[i - 1];
    if (delta === 0) issues.duplicates += 1;
    else if (delta < 0) issues.backwards += 1;
    else intervals.push(delta);
  }
  if (!intervals.length) {
    return { count: times.length, medianIntervalMs: null, jitterRatio: null, maxGapMs: null, issues };
  }
  const sorted = [...intervals].sort((a, b) => a - b);
  const median = quantile(sorted, 0.5);
  const limit = Math.max(minDeviationMs, median * tolerance); // sub-millisecond ISO timestamps are common
  const deviating = intervals.filter(value => Math.abs(value - median) > limit).length;
  return {
    count: times.length,
    medianIntervalMs: median,
    nominalHz: median > 0 ? 1000 / median : null,
    jitterRatio: deviating / intervals.length,
    maxGapMs: sorted[sorted.length - 1],
    p95IntervalMs: quantile(sorted, 0.95),
    issues,
  };
}

/** Longest run of identical consecutive values (a stuck electrode looks like this). */
export function longestFlatRun(values) {
  // A single sample is trivially a run of one; only equal neighbours extend it.
  let best = values.length ? 1 : 0;
  let run = 1;
  let bestStart = 0;
  let start = 0;
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] !== null && values[i] === values[i - 1]) {
      run += 1;
      if (run > best) { best = run; bestStart = start; }
    } else {
      run = 1;
      start = i;
    }
  }
  return values.length ? { length: best, startIndex: bestStart } : { length: 0, startIndex: 0 };
}

/** Count of finite values sitting exactly on the observed extremes for >= minRun in a row. */
export function clippingRuns(values, { minRun = 3 } = {}) {
  const finite = values.filter(Number.isFinite);
  if (!finite.length) return { low: 0, high: 0 };
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const count = target => {
    let best = 0;
    let run = 0;
    for (const value of values) {
      if (value === target) { run += 1; best = Math.max(best, run); }
      else run = 0;
    }
    return best >= minRun ? best : 0;
  };
  // A single extreme value is normal; a plateau on the extreme is not.
  return { low: count(min), high: count(max) };
}

/** Number of null/NaN entries and the longest consecutive block of them. */
export function missingSummary(values) {
  let total = 0;
  let best = 0;
  let run = 0;
  for (const value of values) {
    if (Number.isFinite(value)) { run = 0; continue; }
    total += 1;
    run += 1;
    if (run > best) best = run;
  }
  return { total, longestRun: best, ratio: values.length ? total / values.length : 0 };
}

/**
 * Mains hum: a narrow peak at 50 or 60 Hz that dominates the spectrum is almost
 * always interference, not physiology. Reported as the peak's share of total power.
 */
export function mainsInterference(psd, { nominalHz = [50, 60], bandHz = 2 } = {}) {
  if (!psd?.frequencies?.length || !psd?.power?.length) return { peaks: [], ratio: null };
  const total = psd.power.reduce((sum, value) => sum + value, 0);
  if (!(total > 0)) return { peaks: [], ratio: null };
  const peaks = [];
  for (const target of nominalHz) {
    let index = -1;
    for (let i = 0; i < psd.frequencies.length; i += 1) {
      if (Math.abs(psd.frequencies[i] - target) <= bandHz) { index = i; break; }
    }
    if (index < 0) continue;
    let bandPower = 0;
    for (let i = 0; i < psd.frequencies.length; i += 1) {
      if (Math.abs(psd.frequencies[i] - target) <= bandHz) bandPower += psd.power[i];
    }
    peaks.push({ hz: target, share: bandPower / total });
  }
  if (!peaks.length) return { peaks: [], ratio: null };
  return { peaks, ratio: Math.max(...peaks.map(peak => peak.share)) };
}

function issue(code, severity, title, detail) {
  return { code, severity, title, detail };
}

/**
 * Roll a list of issues up to one verdict. An empty issue list is the only path
 * to `good`; any error makes the recording `unusable`, anything softer `caveat`.
 */
export function rollUpVerdict(issues) {
  const worst = issues.reduce(
    (acc, item) => (SEVERITY_ORDER[item.severity] > SEVERITY_ORDER[acc] ? item.severity : acc),
    'info',
  );
  return issues.length === 0 ? 'good' : worst === 'error' ? 'unusable' : 'caveat';
}

/**
 * Assess one channel. `times` is optional; pass it to include timing-dependent
 * checks (flatline duration in seconds rather than samples). `clippingMinRun` is
 * the shortest plateau counted as clipping: a quantised integer signal repeats
 * its peak a few times normally, so a live caller asks for a longer run.
 */
export function channelQuality(values, { times = null, nominalHz = null, clippingMinRun = 3 } = {}) {
  const issues = [];
  const missing = missingSummary(values);
  const flat = longestFlatRun(values);
  const clip = clippingRuns(values, { minRun: clippingMinRun });

  if (missing.ratio > 0) {
    issues.push(issue(
      'missing', missing.ratio > 0.2 ? 'error' : 'warning',
      `${(missing.ratio * 100).toFixed(1)}% of samples are missing`,
      `longest consecutive block: ${missing.longestRun} samples`,
    ));
  }

  // Prefer real timestamps over the nominal rate: with an irregular clock the
  // sample count alone gives the wrong duration.
  const flatEnd = flat.startIndex + flat.length - 1;
  const timedSpan = times && flat.length > 1
    && Number.isFinite(times[flat.startIndex]) && Number.isFinite(times[flatEnd])
    ? (times[flatEnd] - times[flat.startIndex]) / 1000
    : null;
  const flatSeconds = timedSpan !== null
    ? timedSpan
    : nominalHz && nominalHz > 0 ? flat.length / nominalHz : null;
  if (flat.length >= 2 && (flatSeconds === null || flatSeconds >= 0.5)) {
    issues.push(issue(
      'flatline', flatSeconds !== null && flatSeconds >= 5 ? 'error' : 'warning',
      flatSeconds !== null
        ? `value unchanged for ${flatSeconds.toFixed(1)} s`
        : `value unchanged for ${flat.length} samples`,
      `starts at sample ${flat.startIndex}; a detached or saturated electrode looks like this`,
    ));
  }

  if (clip.low >= clippingMinRun || clip.high >= clippingMinRun) {
    const edge = clip.high >= clip.low ? 'maximum' : 'minimum';
    issues.push(issue(
      'clipping', 'warning',
      `signal plateaus on its ${edge} for up to ${Math.max(clip.low, clip.high)} samples`,
      'a clipped signal loses amplitude information and biases every derived feature',
    ));
  }

  return {
    missing,
    flat: { ...flat, seconds: flatSeconds },
    clipping: clip,
    issues,
  };
}

/**
 * Assess a whole recording.
 *
 * `channels` is `[{ name, values, psd? }]`. `psd` is optional; when present the
 * mains-hum check runs. Returns a verdict plus every issue found, each tagged
 * with the channel it came from so the UI can point at a row.
 */
export function assessRecording({ times = null, channels = [], sampleRateHz = null } = {}) {
  const timing = times ? timingSummary(times) : null;
  const issues = [];

  if (timing) {
    if (timing.issues.backwards || timing.issues.duplicates) {
      issues.push(issue(
        'timestamps', 'error',
        'timestamps are not strictly increasing',
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
    if (timing.maxGapMs !== null && timing.medianIntervalMs > 0 && timing.maxGapMs > timing.medianIntervalMs * 10) {
      issues.push(issue(
        'gap', 'warning',
        `a gap of ${(timing.maxGapMs / 1000).toFixed(2)} s breaks the recording`,
        'downstream filters and spectra assume a continuous clock',
      ));
    }
  } else {
    issues.push(issue('timestamps', 'warning', 'no timestamps available', 'timing regularity cannot be checked'));
  }

  const channelsOut = channels.map(channel => {
    const result = channelQuality(channel.values || [], {
      times,
      nominalHz: sampleRateHz || timing?.nominalHz || null,
    });
    if (channel.psd) {
      const mains = mainsInterference(channel.psd);
      if (mains.ratio !== null && mains.ratio > 0.2) {
        const peak = mains.peaks.reduce((a, b) => (a.share > b.share ? a : b));
        result.issues.push(issue(
          'mains', mains.ratio > 0.5 ? 'error' : 'warning',
          `mains interference at ${peak.hz} Hz carries ${(peak.share * 100).toFixed(0)}% of the power`,
          'check electrode contact and cable routing before using this channel',
        ));
      }
      result.mains = mains;
    }
    for (const item of result.issues) issues.push({ ...item, channel: channel.name ?? null });
    return { name: channel.name ?? null, ...result };
  });

  const verdict = rollUpVerdict(issues);

  return { verdict, issues, timing, sampleRateHz: sampleRateHz ?? timing?.nominalHz ?? null, channels: channelsOut };
}

/** One-line summary for a toolbar; null when there is nothing to report. */
export function verdictLabel(assessment) {
  if (!assessment || assessment.verdict === 'good' || !assessment.issues.length) return null;
  const errors = assessment.issues.filter(item => item.severity === 'error').length;
  const warnings = assessment.issues.length - errors;
  return `${assessment.verdict}: ${[errors ? `${errors} error(s)` : null, warnings ? `${warnings} warning(s)` : null].filter(Boolean).join(', ')}`;
}
