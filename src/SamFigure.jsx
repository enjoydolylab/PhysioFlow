// The supplied SAM illustrations are bundled with this version of PhysioFlow.
// All nine values are selectable. The shared "middle" illustration fills 2/4/6/8.
export function samImagePath(type, value) {
  const dimension = { sam_valence: 'valence', sam_arousal: 'arousal', sam_dominance: 'dominance' }[type];
  if (!dimension || !Number.isInteger(value) || value < 1 || value > 9) return null;
  return `/sam-images/${value % 2 === 0 ? 'middle' : `${dimension}_${value}`}.png`;
}

export default function SamFigure({ type, value }) {
  const source = samImagePath(type, value);
  if (!source) return <span>{value}</span>;
  return <span className="sam-picture"><img src={source} alt="" aria-hidden="true" draggable="false" /><span className="sam-picture-number">{value}</span></span>;
}
