import { validateProtocol, stepContentIssues } from './domain.js';
import { Modal } from './Modal.jsx';
import { useT } from './i18n.jsx';

const parseTarget = message => {
  const text = String(message || '');
  // Format: "Block N / Trial M / Step K: message" or "Block N / Trial M: message"
  let match = text.match(/Block\s+(\d+)\s*\/\s*Trial\s+(\d+)\s*\/\s*Step\s+(\d+)/i);
  if (match) return { blockIndex: Number(match[1]) - 1, trialIndex: Number(match[2]) - 1, stepIndex: Number(match[3]) - 1 };
  // Format: "Block N / Trial M: message"
  match = text.match(/Block\s+(\d+)\s*\/\s*Trial\s+(\d+)/i);
  if (match) return { blockIndex: Number(match[1]) - 1, trialIndex: Number(match[2]) - 1, stepIndex: null };
  // Format: "Step name (step_id)" — try to find by name reference
  match = text.match(/"([^"]+)"/);
  if (match) return { blockIndex: null, trialIndex: null, stepIndex: null, stepName: match[1] };
  return null;
};

const issueAdvice = message => {
  const text = String(message || '');
  // ── Questionnaire ──
  if (/Prompt.*empty|question title|no question title/i.test(text)) return {
    title: 'Questionnaire item has no prompt',
    summary: 'One question in this questionnaire has an empty prompt in every language, so participants cannot tell what to answer.',
    steps: ['Press "Locate and fix" to open the questionnaire node.', 'Find the question in the inspector on the right (Question 1, 2, …).', 'Fill in the prompt in at least one language (Japanese / English / Chinese).'],
  };
  if (/Options.*required|add at least one/i.test(text)) return {
    title: 'Choice question has no options',
    summary: 'A single- or multiple-choice question needs at least one option, otherwise participants cannot answer it.',
    steps: ['Press "Locate and fix" to open the questionnaire node.', 'Add at least one option to that question.'],
  };
  if (/external questionnaire URL/i.test(text)) return {
    title: 'External questionnaire link is missing',
    summary: 'External form mode needs a link to Google Forms, Qualtrics or another questionnaire service.',
    steps: ['Press "Locate and fix" to open the questionnaire node.', 'Paste the full form URL (https://…) into External form URL.'],
  };
  // ── Flow ──
  if (/not placed in the flow/i.test(text)) return {
    title: 'Step is not placed in the flow',
    summary: 'This step exists in the trial but has no matching event node in the flow, so it is skipped at run time.',
    steps: ['Add an event node of the matching type from the "Add to flow" panel.', 'Or press Insert in the "Steps outside flow" panel.', 'If the step is not needed, press Remove unused.'],
  };
  // ── Media ──
  if (/Source URL|uploaded file|media source|No media source/i.test(text)) return {
    title: 'Media source is missing',
    summary: 'This video, audio or image node has no file or link to play.',
    steps: ['Press "Locate and fix" to open the media node.', 'Enter a URL under Media source in the inspector, or upload a local file.'],
  };
  // ── Duration / end mode ──
  if (/Manual continue/i.test(text)) return {
    title: 'End mode must be manual',
    summary: 'This node (an external questionnaire, for example) must be finished by the participant or operator, not skipped on a timer.',
    steps: ['Press "Locate and fix" to open the node.', 'Switch End mode to Manual continue.'],
  };
  if (/Duration.*required|Fixed time.*duration/i.test(text)) return {
    title: 'Fixed duration is missing',
    summary: 'This node uses Fixed time mode but has no duration in milliseconds.',
    steps: ['Press "Locate and fix" to open the node.', 'Enter a duration greater than 0 under Duration (ms).'],
  };
  // ── Response ──
  if (/Response variable.*empty|response.*variable.*required/i.test(text)) return {
    title: 'Response variable name is missing',
    summary: 'A response step needs a variable name (such as response or rating) so a condition node can reference it.',
    steps: ['Press "Locate and fix" to open the response node.', 'Enter the variable name under Response variable.'],
  };
  if (/response options/i.test(text)) return {
    title: 'Response options are missing',
    summary: 'A response step needs at least one option in the value | label | key format.',
    steps: ['Press "Locate and fix" to open the response node.', 'Add at least one line under Options.'],
  };
  // ── Content ──
  if (/Content is empty|No instruction text/i.test(text)) return {
    title: 'Participant content is empty',
    summary: 'Participant content is empty in every language for this step. A test run still works, but participants may see no instructions.',
    steps: ['Press "Locate and fix" to open the node.', 'Fill in Participant content in at least one language.'],
  };
  // ── Analysis ──
  if (/analysis window/i.test(text)) return {
    title: 'No analysis window is set',
    summary: 'No step in this protocol enables Generate analysis window, so the exported analysis_windows.csv will be empty.',
    steps: ['Select a baseline, stimulus, task or recovery node.', 'Tick ↗ analysis and set a suitable Role.'],
  };
  // ── Looping ──
  if (/looping.*never ends|loop.*media/i.test(text)) return {
    title: 'Looping conflicts with the end mode',
    summary: 'This media node loops but its end mode is "When media ends", so playback would never stop.',
    steps: ['Press "Locate and fix" to open the media node.', 'Turn Loop off, or change End mode to Fixed time / Manual continue.'],
  };
  // ── Controls ──
  if (/controls.*hidden|participant.*click.*controls/i.test(text)) return {
    title: 'Manual start conflicts with hidden controls',
    summary: 'Start mode is "Participant click" but the player controls are hidden, so participants cannot start playback.',
    steps: ['Press "Locate and fix" to open the media node.', 'Turn on Show player controls, or change Start mode to Automatic.'],
  };
  // ── ITI Jitter ──
  if (/ITI jitter.*non-negative|Jitter distribution/i.test(text)) return {
    title: 'ITI jitter settings are invalid',
    summary: 'The trial\'s ITI jitter value is not valid. Jitter must be a number ≥ 0 and the distribution must be fixed, uniform, normal or exponential.',
    steps: ['This setting can only be changed in the text editor.', 'Press "Go to trial" to jump to that trial.', 'Open ⋯ → Advanced settings to switch to the text editor.', 'Find the trial and make sure ITI jitter ms ≥ 0 and the distribution is one of the allowed values.'],
  };
  // ── Structural ──
  if (/Protocol name|protocol name/i.test(text)) return {
    title: 'Protocol name is missing',
    summary: 'Give the protocol a name so it is easy to tell apart in the project list.',
    steps: ['Enter a name in the title bar at the top of the editor.'],
  };
  if (/At least one block/i.test(text)) return {
    title: 'Protocol structure is empty',
    summary: 'This protocol has no blocks yet. Build the Block → Trial → Step hierarchy first.',
    steps: ['Press "+ Add block" to create the first block.', 'Then add trials and steps inside it.'],
  };
  if (/no Trials|no Steps|trial.*no Step/i.test(text)) return {
    title: 'Hierarchy is incomplete',
    summary: 'A block has no trials, or a trial has no steps.',
    steps: ['Press "Locate and fix" to jump to the right place.', 'Add the missing trial or step.'],
  };
  // ── Default ──
  return {
    title: 'This setting needs attention',
    summary: text,
    steps: ['Press "Locate and fix" to jump to the right place.', 'Fill in the missing field following the inspector on the right.'],
  };
};

const enrichTarget = (protocol, target) => {
  if (!target) return null;
  // If we only have a step name, search the protocol to resolve indices
  let blockIndex = target.blockIndex;
  let trialIndex = target.trialIndex;
  let stepIndex = target.stepIndex;
  if (target.stepName && (blockIndex == null || trialIndex == null)) {
    for (let bi = 0; bi < (protocol.blocks || []).length; bi++) {
      for (let ti = 0; ti < (protocol.blocks[bi].trials || []).length; ti++) {
        const si = (protocol.blocks[bi].trials[ti].steps || []).findIndex(s => s.name === target.stepName || s.type === target.stepName);
        if (si >= 0) { blockIndex = bi; trialIndex = ti; stepIndex = si; break; }
      }
      if (blockIndex != null) break;
    }
  }
  if (blockIndex == null) {
    // Can't resolve — return partial info
    return { ...target, blockName: '', trialName: '', stepName: target.stepName || '' };
  }
  const block = protocol.blocks?.[blockIndex];
  const trial = block?.trials?.[trialIndex];
  const step = stepIndex == null ? null : trial?.steps?.[stepIndex];
  return {
    blockIndex, trialIndex, stepIndex,
    block_id: block?.block_id,
    trial_id: trial?.trial_id,
    step_id: step?.step_id,
    blockName: block?.name || `Block ${blockIndex + 1}`,
    trialName: trial?.name || `Trial ${trialIndex + 1}`,
    stepName: step?.name || step?.type || (stepIndex == null ? '' : `Step ${stepIndex + 1}`),
  };
};

function FixCard({ severity = 'error', title, summary, steps = [], location, raw, onFix }) {
  const canFix = Boolean(onFix && location);
  const handleFix = () => {
    if (onFix && location) {
      onFix({ ...location, issueMessage: raw || title });
    }
  };
  // Has a specific step to navigate to
  const hasStepTarget = location?.stepIndex != null || location?.step_id;
  return <article className={`fix-card ${severity}`}>
    <div className="fix-card-main">
      <b>{title}</b>
      <p>{summary}</p>
      {location && <small>{location.blockName} → {location.trialName}{location.stepName ? ` → ${location.stepName}` : ''}</small>}
    </div>
    {steps.length > 0 && <ol>{steps.map((step, index) => <li key={index}>{step}</li>)}</ol>}
    <div className="fix-card-actions">
      {canFix && <button className="primary" onClick={handleFix}>{hasStepTarget ? 'Locate and fix' : 'Go to trial'}</button>}
      {raw && <details><summary>View raw message</summary><code>{raw}</code></details>}
    </div>
  </article>;
}

export default function PreRunChecklist({ protocol, storageInfo, onChooseDataDirectory, onClose, onContinue, onFix }) {
  const t = useT();
  const check = validateProtocol(protocol);
  const stimuli = protocol.stimuli || [];
  const questionnaires = protocol.questionnaires || [];
  const requiresLocalStorage = protocol.status === 'frozen';
  const storageBlocked = requiresLocalStorage && (!storageInfo?.selected || storageInfo.permission !== 'granted');

  const stepIssues = [];
  protocol.blocks.forEach((block, bi) => {
    block.trials.forEach((trial, ti) => {
      trial.steps.forEach((step, si) => {
        const issues = stepContentIssues(step, stimuli, questionnaires);
        if (issues.length) {
          stepIssues.push({
            location: enrichTarget(protocol, { blockIndex: bi, trialIndex: ti, stepIndex: si }),
            issues,
          });
        }
      });
    });
  });

  const protocolErrors = check.errors.map(message => ({
    message,
    location: enrichTarget(protocol, parseTarget(message)),
    advice: issueAdvice(message),
  }));
  const protocolWarnings = check.warnings.map(message => ({
    message,
    location: enrichTarget(protocol, parseTarget(message)),
    advice: issueAdvice(message),
  }));
  const coveredByProtocolError = (location, issue) => (
    issue.key === 'empty_prompt'
    && protocolErrors.some(item => item.location?.step_id === location?.step_id && /Prompt/i.test(item.message))
  );
  const cleanedWarningStepIssues = stepIssues
    .map(item => ({ ...item, issues: item.issues.filter(issue => issue.kind === 'warn' && !coveredByProtocolError(item.location, issue)) }))
    .filter(item => item.issues.length);

  const blockingStepIssues = stepIssues.filter(item => item.issues.some(issue => issue.kind === 'error'));
  const totalIssues = protocolErrors.length + blockingStepIssues.length + (storageBlocked ? 1 : 0);
  const totalWarnings = protocolWarnings.length + cleanedWarningStepIssues.length;

  return (
    <Modal open onClose={onClose}>
      <div className="pre-run-checklist">
        <span className="pre-run-icon">{totalIssues > 0 ? '!' : 'i'}</span>
        <h3>{totalIssues > 0 ? t('{n} issues must be fixed before running').replace('{n}', totalIssues) : 'Ready for a test run'}</h3>
        <p className="pre-run-lead">
          {totalIssues > 0
            ? 'Each item below says why it blocks the run and where to change it. Fix the required ones first; suggestions can wait.'
            : `This protocol passed the pre-run checks.${totalWarnings > 0 ? ` ${t('{n} suggestions remain, which do not block a test run.').replace('{n}', totalWarnings)}` : ''}`}
        </p>

        {protocolErrors.length > 0 && <section className="fix-section">
          <h4>Must fix</h4>
          {protocolErrors.map((item, index) => (
            <FixCard
              key={`error-${index}`}
              severity="error"
              title={item.advice.title}
              summary={item.advice.summary}
              steps={item.advice.steps}
              location={item.location}
              raw={item.message}
              onFix={onFix}
            />
          ))}
        </section>}

        {storageBlocked && <section className="fix-section">
          <h4>Must fix</h4>
          <FixCard
            severity="error"
            title="Choose a local data folder"
            summary="Formal collection must be written to a local folder you choose, not only to browser-managed cache."
            steps={['Press the button below to select your PhysioFlow Data folder.', 'Start the formal session once the folder is selected.']}
          />
          {onChooseDataDirectory && <button className="primary" onClick={onChooseDataDirectory}>Choose a local data folder</button>}
        </section>}

        {blockingStepIssues.length > 0 && <section className="fix-section">
          <h4>Step content issues</h4>
          {blockingStepIssues.map((item, index) => item.issues.filter(issue => issue.kind === 'error').map((issue, issueIndex) => {
            const advice = issueAdvice(issue.message);
            return <FixCard key={`step-error-${index}-${issueIndex}`} severity="error" title={advice.title} summary={advice.summary} steps={advice.steps} location={item.location} raw={issue.message} onFix={onFix} />;
          }))}
        </section>}

        {(protocolWarnings.length > 0 || cleanedWarningStepIssues.length > 0) && <section className="fix-section notes">
          <h4>Suggestions</h4>
          {protocolWarnings.map((item, index) => (
            <FixCard key={`warning-${index}`} severity="warning" title={item.advice.title} summary={item.advice.summary} steps={item.advice.steps} location={item.location} raw={item.message} onFix={onFix} />
          ))}
          {cleanedWarningStepIssues.map((item, index) => item.issues.map((issue, issueIndex) => {
            const advice = issueAdvice(issue.message);
            return <FixCard key={`step-warning-${index}-${issueIndex}`} severity="warning" title={advice.title} summary={advice.summary} steps={advice.steps} location={item.location} raw={issue.message} onFix={onFix} />;
          }))}
        </section>}

        <div className="modal-actions">
          {totalIssues === 0 && <button className="primary" onClick={onContinue} autoFocus>Continue to session setup</button>}
          <button onClick={onClose}>{totalIssues > 0 ? 'Close' : 'Cancel'}</button>
        </div>
      </div>
    </Modal>
  );
}
