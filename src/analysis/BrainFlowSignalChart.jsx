import { useEffect, useMemo, useState } from 'react';
import LiveChart from './LiveChart.jsx';
import { bandPowers, EEG_BANDS, nextPowerOfTwoDown, powerSpectralDensity } from './signal/spectrum.js';
import { seriesColor } from './chartGeometry.js';

const BAND_ORDER = ['delta', 'theta', 'alpha', 'beta', 'gamma'];

// Leaf wrapper that polls a caller-supplied window reader on a throttle and feeds
// the result to LiveChart in replay (static) mode, plus a compact average band
// power row.
//
// Why this shape matters: the runtime keeps the BrainFlow sample stream in a ref
// (deviceEventsRef) precisely so that ~250 Hz sampling does not re-render the
// runtime page. LiveChart's own streaming mode runs on requestAnimationFrame and
// cannot keep up with 250 Hz, so this component instead re-reads the last window
// every 250 ms (matching the agent's batch pull cadence) and re-renders only this
// small subtree. The main runtime page never re-renders on samples.
export default function BrainFlowSignalChart({ channels = [], sampleRateHz = 250, windowSeconds = 10, getWindow }) {
  const [window, setWindow] = useState(() => ({ times: [], values: Object.fromEntries(channels.map(id => [id, []])) }));

  useEffect(() => {
    if (!channels.length || typeof getWindow !== 'function') return undefined;
    const poll = () => {
      const next = getWindow();
      if (next && next.values) setWindow(next);
    };
    poll();
    const timer = setInterval(poll, 250);
    return () => clearInterval(timer);
  }, [channels, getWindow]);

  // Average power spectrum across the preview channels, then band powers. One
  // FFT per channel on a power-of-two segment is cheap at 250 ms cadence.
  const bands = useMemo(() => {
    const active = channels.filter(id => (window.values[id]?.length || 0) >= 64);
    if (!active.length) return null;
    const size = Math.min(...active.map(id => nextPowerOfTwoDown(window.values[id].length)));
    if (size < 2) return null;
    let frequencies = null;
    let sum = null;
    for (const id of active) {
      const psd = powerSpectralDensity(window.values[id].slice(-size), sampleRateHz);
      if (!psd.power.length) continue;
      frequencies = frequencies || psd.frequencies;
      if (!sum) sum = psd.power.slice();
      else for (let k = 0; k < sum.length; k += 1) sum[k] += psd.power[k];
    }
    if (!sum) return null;
    for (let k = 0; k < sum.length; k += 1) sum[k] /= active.length;
    return bandPowers({ frequencies, power: sum }, EEG_BANDS);
  }, [window.values, channels, sampleRateHz]);

  const bandEntries = bands ? BAND_ORDER.filter(name => bands[name]) : [];
  const bandTotal = bandEntries.reduce((sum, name) => sum + (bands?.[name]?.relative || 0), 0) || 1;

  return (
    <>
      <LiveChart
        channels={channels}
        samples={window.values}
        times={window.times}
        sampleRateHz={sampleRateHz}
        windowSeconds={windowSeconds}
        width={720}
        height={200}
        running
      />
      {bands && (
        <div className="viz-block">
          <h5>EEG bands · relative (avg)</h5>
          <div className="viz-bandbar">
            {bandEntries.map((name, i) => (
              <span
                key={name}
                className="viz-band"
                style={{ width: `${((bands[name].relative || 0) / bandTotal) * 100}%`, background: seriesColor(i) }}
                title={`${name}: ${((bands[name].relative || 0) * 100).toFixed(1)}%`}
              />
            ))}
          </div>
          <div className="viz-band-legend">
            {bandEntries.map((name, i) => (
              <span key={name}>
                <i style={{ background: seriesColor(i) }} />
                {name} {((bands[name].relative || 0) * 100).toFixed(1)}%
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
