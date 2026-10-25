import { useState } from 'react';
import { useT } from './i18n';

export const guideCopy = { en: {
  "title": "User guide",
  "intro": "Choose what you want to do, then follow the steps.",
  "welcome": "Start your first experiment",
  "path": "Design → Check → Run → Review",
  "create": "Create a blank experiment",
  "example": "Open an emotion example",
  "later": "Explore the workspace",
  "help": "User guide",
  "reference": "Advanced reference",
  "hint": "Add a step, set its content, then run a test. Freeze a version before formal collection.",
  "tasks": [
    [
      "Create and edit",
      [
        "Create a blank protocol or choose an Emotion, Stroop or Go/No-Go template.",
        "Select a step, then click a component on the left to add the next step.",
        "Set content, duration and responses on the right. Use the flow graph for branches.",
        "Save, then choose Preview run with a test participant to check the content."
      ],
      "Drafts can run tests. Freeze for formal collection; create an editable version to make changes."
    ],
    [
      "Prepare participants and devices",
      [
        "Choose Preview run in the editor or prepare collection from a frozen version.",
        "Enter participant ID and language, then check media and the data destination.",
        "Start the acquisition service and check fresh signals on every required channel.",
        "Keep the operator monitor on the operator display and the experiment on the participant display."
      ],
      "For missing signals, check devices, electrodes, the acquisition service and connection address. Formal collection needs real devices and writable storage."
    ],
    [
      "Run and verify",
      [
        "Confirm the run details and signals, then begin the experiment.",
        "Participants see stimuli and questions; operators monitor and pause or resume separately.",
        "At completion, confirm that session data was saved, then export the complete package.",
        "When PhysioDB test verification is enabled, wait for upload and database read-back checks."
      ],
      "Local saving and database verification are separate. Tests without devices explicitly use a synthetic signal. Formal raw recordings currently require explicit upload."
    ],
    [
      "Review and analyze",
      [
        "Open Sessions in the workspace and select the participant record.",
        "Review saving, events and the PhysioDB verification report.",
        "Analyze this session to inspect the timeline and answers; return to the same saved record.",
        "Database reads database time windows, displays waveforms and statistics, and exports CSV."
      ],
      "Save researcher notes and validity reviews. Automatic integrity checks do not replace researcher judgment."
    ]
  ]
} };
function localize(value, t) {
  if (typeof value === 'string') return t(value);
  if (Array.isArray(value)) return value.map(item => localize(item, t));
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localize(item, t)]));
}
export function useGuideCopy() { const t = useT(); return localize(guideCopy.en, t); }
export default function TaskGuide({ initialTask = 0 }) {
  const copy = useGuideCopy();
  const [task, setTask] = useState(initialTask);
  const current = copy.tasks[task];
  return <div className="task-guide"><p>{copy.intro}</p><nav aria-label={copy.title}>{copy.tasks.map(([title], index) => <button key={index} aria-pressed={task === index} onClick={() => setTask(index)}>{title}</button>)}</nav><section aria-live="polite"><h3>{current[0]}</h3><ol>{current[1].map(step => <li key={step}>{step}</li>)}</ol><p className="guide-note">{current[2]}</p></section></div>;
}
