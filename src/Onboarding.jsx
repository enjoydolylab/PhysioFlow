import { useRef } from 'react';
import useGuideDialog from './useGuideDialog.js';
import { useGuideCopy } from './TaskGuide.jsx';
export default function Onboarding({ onClose, onCreate, onExample }) {
  const copy = useGuideCopy();
  const close = useRef(null);
  useGuideDialog(close, onClose);
  return <div className="guide-backdrop" role="dialog" aria-modal="true" aria-label={copy.welcome}><section className="welcome-guide"><h1>{copy.welcome}</h1><p>{copy.path}</p><ol>{copy.tasks.map(([title]) => <li key={title}>{title}</li>)}</ol><div><button className="primary" onClick={onCreate}>{copy.create}</button><button onClick={onExample}>{copy.example}</button><button ref={close} onClick={onClose}>{copy.later}</button></div></section></div>;
}
