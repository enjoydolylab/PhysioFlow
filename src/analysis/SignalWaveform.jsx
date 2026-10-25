import { useT as useDisplayT } from '../i18n.jsx';
import { useMemo } from 'react';
import { waveformPoints } from './physioDBWindow.js';

export default function SignalWaveform({ times, values, label, unit }) {
  const tDisplay = useDisplayT();
  const paths = useMemo(() => {
    const points = waveformPoints(times, values);
    const paths = []; let segment = '';
    for (const point of points) {
      if (!point) { if (segment) paths.push(segment); segment = ''; continue; }
      segment += `${segment ? 'L' : 'M'}${point.x.toFixed(2)},${point.y.toFixed(2)} `;
    }
    if (segment) paths.push(segment);
    return paths;
  }, [times, values]);
  return <figure className="pf-waveform"><figcaption><b>{label}</b><span>{unit || '—'}</span></figcaption>
    <svg viewBox="0 0 900 180" role="img" aria-label={tDisplay("{0} waveform", [label])} preserveAspectRatio="none">
      {[45, 90, 135].map(y => <line key={y} x1="0" x2="900" y1={y} y2={y} stroke="currentColor" opacity=".08" />)}
      {paths.map((path, i) => <path key={i} d={path} fill="none" stroke="currentColor" strokeWidth="1.5" />)}
    </svg>
  </figure>;
}
