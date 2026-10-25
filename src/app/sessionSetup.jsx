import { lazy, Suspense, useEffect, useState } from 'react';
import { protocolIdOf, protocolNameOf, protocolStatusOf, resolveStimulusAssignments, stimulusPoolOf, validateProtocolGraphConfiguration } from '../core/index.js';
import { createPhysioDBServiceClient } from '../physioDBServiceClient.js';
import { getPhysioDBConnection, setPhysioDBConnection } from '../physioDBConnection.js';
import { useT } from '../i18n';
import { useLanguage } from '../i18n';
import { createProjectComponentRegistry } from '../sdk/index.js';
import Header from './AppHeader.jsx';
import { verifyProtocolAssets } from '../fsStorage.js';
import { createGroupExecutionSnapshot } from '../core/groupSequence.js';

const GuidePanel = lazy(() => import('../GuidePanel.jsx'));

export function ResumeBanner({ snapshot, onResume, onDiscard }) {
  const tr = useT();
  return <div className="resume-banner">
    <div><span>{tr("UNFINISHED SESSION")}</span><b>{snapshot.session?.participant_id} · {snapshot.protocol ? protocolNameOf(snapshot.protocol) : snapshot.session?.protocol_name}</b><small>{tr("Saved")} {snapshot.saved_at}</small></div>
    <button className="primary" onClick={onResume}>{tr("Resume experiment")}</button>
    <button onClick={onDiscard}>{tr("Discard")}</button>
  </div>;
}

export function GraphSessionSetup({ protocol: p, onBack, onStart, storageInfo, onChooseDataDirectory, onGuide, guideOpen, guideTab, onCloseGuide, renderPreparedSession, onPrepare }) {
  const tr = useT();
  const { language } = useLanguage();
  const t = useT();
  const [preparedSession, setPreparedSession] = useState(null);
  const [connection] = useState(getPhysioDBConnection);
  const [dbEnabled, setDbEnabled] = useState(() => Boolean(connection) || window.location.port === '8787');
  const [dbToken, setDbToken] = useState(connection?.accessToken || '');
  const [dbUrl, setDbUrl] = useState(connection?.baseUrl || window.location.origin);
  const [preparing, setPreparing] = useState(false), [dbError, setDbError] = useState('');
  const start = async session => {
    if (preparing) return; setPreparing(true); setDbError('');
    try {
      await onPrepare?.(session);
      if (session.run_mode === 'preview' && dbEnabled) {
        const config = { baseUrl: dbUrl, accessToken: dbToken };
        const ready = await createPhysioDBServiceClient(config).prepareTestRun({ sessionId: session.session_id, protocolId: session.protocol_id, protocolVersion: session.protocol_version });
        setPhysioDBConnection(config); session.db_test_run = ready;
      }
      if (renderPreparedSession) setPreparedSession(session); else await onStart(session);
    } catch (e) { setDbError(e.message); } finally { setPreparing(false); }
  };
  const [participant, setParticipant] = useState('');
  const [operator, setOperator] = useState('');
  const [participantLanguage, setParticipantLanguage] = useState(language);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const isFormal = protocolStatusOf(p) === 'frozen';
  const storageBlocked = isFormal && (!storageInfo?.selected || storageInfo.permission !== 'granted');
  const check = validateProtocolGraphConfiguration(p, createProjectComponentRegistry(p));
  let groupExecution = null, groupError = '';
  if (p.groupRandomization?.enabled) {
    try { groupExecution = createGroupExecutionSnapshot(p, p.groupRandomization.groupIds, `${protocolIdOf(p)}:${p.version.number}:${sessionId}:groups`, createProjectComponentRegistry(p)); }
    catch (error) { groupError = error.message; }
  }
  const stimulusAssignments = check.valid ? resolveStimulusAssignments(p, `${protocolIdOf(p)}:${p.version.number}:${sessionId}`) : new Map();
  const poolModes = new Set(p.graph.nodes.filter(node => node.component?.type === 'display.media').map(node => stimulusPoolOf(node, p)?.mode).filter(Boolean));
  const [assetCheck, setAssetCheck] = useState({ status: 'checking', issues: [] });
  const [assetCheckAttempt, setAssetCheckAttempt] = useState(0);
  const deviceNodes = p.graph.nodes.filter(node => node.config?.deviceConnectorId);
  const requiredDevices = [...new Set(deviceNodes.filter(node => node.config.deviceRequired !== false).map(node => node.config.deviceConnectorId))];

  useEffect(() => {
    let active = true;
    setAssetCheck({ status: 'checking', issues: [] });
    verifyProtocolAssets(p)
      .then(result => { if (active) setAssetCheck({ status: result.valid ? 'ready' : 'error', issues: result.issues }); })
      .catch(error => { if (active) setAssetCheck({ status: 'error', issues: [{ message: error.message || String(error) }] }); });
    return () => { active = false; };
  }, [p, assetCheckAttempt]);
  const assetsBlocked = assetCheck.status !== 'ready';
  const blockers = [
    preparing && 'Preparing database test records…',
    !isFormal && dbEnabled && !dbToken.trim() && 'Enter your PF operator key for database verification.',
    !participant.trim() && 'Enter a participant ID.',
    storageBlocked && 'Select a local data folder.',
    !check.valid && 'Fix the protocol configuration.',
    groupError,
    assetsBlocked && (assetCheck.status === 'checking' ? 'Wait for the media check.' : 'Resolve the media issues and check again.'),
  ].filter(Boolean);

  const renderForm = (readyPanel, devicePreparation) => <main className="pf-preparation"><Header onGuide={tab => onGuide?.(tab === 'workflow' ? 'prepare' : tab)} /><div className="narrow">
    <button disabled={devicePreparation?.busy} onClick={onBack}>{tr("← Protocol")}</button>
    <nav aria-label={tr("Collection workflow")} className="setup-note">{tr("Design →")} <strong aria-current="step">{tr("Prepare")}</strong> {tr("→ Run → Review data")}</nav>
    <span className="eyebrow">{tr("PREPARE COLLECTION")}</span>
    <h1>{protocolNameOf(p)}</h1>
    <p>{tr("Check the participant, protocol, media and storage before opening the experiment.")}</p>
    <details className="setup-note" aria-label={tr("Run configuration")}><summary><b>{isFormal ? tr('Formal collection · frozen version') : tr('Test run · draft version')} {p.version.number}</b></summary><p>{isFormal ? tr('This session uses the frozen configuration below.') : tr('This session will be recorded as a preview. Return to the protocol and freeze a version for formal collection.')}</p><code style={{ overflowWrap: 'anywhere' }}>{p.freeze?.configHash || tr('No frozen configuration hash')}</code></details>
    {preparedSession && <section className="setup-note"><b>{preparedSession.participant_id} · {t(isFormal ? 'Formal collection' : 'Test run')}</b><p>{t('Run details confirmed. Check signals below, then begin the experiment.')}</p><button disabled={devicePreparation?.busy} onClick={async () => { try { await devicePreparation?.leavePreparation(); setPreparedSession(null); setDbError(''); } catch (error) { setDbError(error.message); } }}>{t('Edit run details')}</button></section>}
    <details className="preparation-details" open={!preparedSession}><summary>{t('Participant and data settings')}</summary><fieldset disabled={Boolean(preparedSession)}>
    <section className="preparation-participant" aria-label={t('Participant details')}><h2>{t('Participant details')}</h2><div className="preparation-fields">
    <label htmlFor="participant-id">{tr("Participant ID")}<input id="participant-id" autoFocus value={participant} onChange={event => setParticipant(event.target.value)} placeholder={tr("P001")} /></label>
    <label htmlFor="participant-lang">{tr("Participant language")}<select id="participant-lang" value={participantLanguage} onChange={event => setParticipantLanguage(event.target.value)}><option value="zh">{tr("中文")}</option><option value="ja">{tr("日本語")}</option><option value="en">{tr("English")}</option></select></label>
    <label htmlFor="operator-id">{tr("Operator ID")}<input id="operator-id" value={operator} onChange={event => setOperator(event.target.value)} placeholder={tr("optional")} /></label>
    </div></section>
    <h2 className="preparation-section-title">{t('Checks before collection')}</h2>
    {p.groupRandomization?.enabled && <section className="setup-note" aria-label={tr("Randomized group order")}><b>{tr("Randomized group order")}</b>{groupError ? <p role="alert">{tr(groupError)}</p> : <><p>{tr("Each group runs once in this order. Steps inside each group keep their execution order.")}</p><ol>{groupExecution.plan.groupOrder.map(id => <li key={id}>{p.graph.groups.find(group => group.id === id)?.name || id}</li>)}</ol><button type="button" onClick={() => setSessionId(crypto.randomUUID())}>{tr("Generate another group order")}</button></>}</section>}
    {stimulusAssignments.size > 0 && <details className="setup-note"><summary><b>{tr("Nominal stimulus order")}</b></summary>
      <p>{tr("This preview assumes each listed node runs once in the displayed order. Retry keeps the assigned stimulus.")}</p>
      {poolModes.has('shuffle') && <p>{tr("Shuffle pools draw in execution order: completion or Skip consumes one item. Branches and loops can change which node receives each item.")}</p>}
      {poolModes.has('balanced-halves') && <p>{tr("Balanced-half pools assign each node a stimulus within its configured half. Each category is split as evenly as possible between the two halves. Repeating a completed or skipped node uses its next assignment cycle; branching around nodes may leave some assigned stimuli unshown.")}</p>}
      {[...stimulusAssignments.entries()].map(([nodeId, assignment]) => <p key={nodeId}><span>{p.graph.nodes.find(node => node.id === nodeId)?.label || nodeId}</span> → <strong>{assignment.name}</strong></p>)}<button type="button" onClick={() => setSessionId(crypto.randomUUID())}>{tr("Generate another order")}</button></details>}
    <div className={`setup-note ${check.valid ? 'ok' : 'error'}`}><b>{tr("Protocol validation")}</b><p>{check.valid ? tr("{n} nodes · {n1} connections · configuration checked", { n: p.graph.nodes.length, n1: p.graph.edges.length }) : check.errors.map(error => t(error.message)).join(' ')}</p>{!check.valid && <button onClick={onBack}>{tr("Return to protocol to fix")}</button>}</div>
    <div className={`setup-note ${assetCheck.status === 'ready' ? 'ok' : assetCheck.status === 'error' ? 'error' : ''}`}><b>{tr("Media readiness")}</b><p>{assetCheck.status === 'checking' ? tr('Checking referenced local media…') : assetCheck.status === 'ready' ? tr('All referenced media are available.') : assetCheck.issues.slice(0, 3).map(issue => t(issue.message)).join(' ')}</p></div>
    {assetCheck.status === 'error' && <button onClick={() => setAssetCheckAttempt(value => value + 1)}>{tr("Check media again")}</button>}
    <section className="setup-note" aria-label={tr("Device requirements")}><b>{tr("Devices ·")} {deviceNodes.length ? tr('connection pending') : tr('none configured')}</b><p>{deviceNodes.length ? tr("Required: {n}. Device connection is checked when you begin the experiment; configuration does not confirm connectivity or timing accuracy.", { n: requiredDevices.join(', ') || tr('None') }) : tr('This protocol has no configured device connection.')}</p>{deviceNodes.length > 0 && <p>{tr("Configured:")} {[...new Set(deviceNodes.map(node => node.config.deviceConnectorId))].join(', ')}</p>}</section>
    <h2 className="preparation-section-title">{t('Data destination')}</h2>
    <div className={`setup-note storage-gate ${storageBlocked ? 'blocked' : storageInfo?.selected ? 'ready' : 'preview'}`}>
      <b>{storageBlocked ? tr('Local data folder required') : storageInfo?.selected ? tr("Local data folder: {n}", { n: storageInfo.name || tr('Selected') }) : tr('Preview storage')}</b>
      <p>{storageBlocked ? tr('Select a local data folder before formal collection.') : storageInfo?.selected ? tr('Checkpoints and final session data are written to this folder. Unsubmitted questionnaire answers and task progress may not be recoverable.') : tr('This test run uses browser-managed storage. Export a data package after the run to keep a separate copy.')}</p>
      {storageBlocked && onChooseDataDirectory && <button onClick={onChooseDataDirectory}>{tr("Select local data folder")}</button>}
    </div>
    {!isFormal && <section className="setup-note" aria-label={tr("Database test run")}><label><input type="checkbox" checked={dbEnabled} onChange={e => setDbEnabled(e.target.checked)} disabled={preparing} />{t('Verify test run with PhysioDB')}</label><p>{t('Create isolated test records, then upload and read back signals and runtime events. Test records are retained.')}</p>{dbEnabled && <details open={!connection}><summary>{t(connection ? 'Operator connection configured' : 'Configure operator connection')}</summary><label>{t('Operator access key')}<input type="password" autoComplete="off" value={dbToken} onChange={e => setDbToken(e.target.value)} disabled={preparing} /></label><details><summary>{t('Server settings')}</summary><label>{t('PF server URL')}<input type="url" value={dbUrl} onChange={e => setDbUrl(e.target.value)} disabled={preparing} /></label></details></details>}{dbError && <p role="alert">{t(dbError)}</p>}</section>}
    </fieldset></details>
    {!preparedSession && <><div role="status" className="setup-note"><b>{blockers.length ? tr('Before you continue') : tr('Ready to open the experiment')}</b>{blockers.map(message => <p key={message}>{tr(message)}</p>)}</div>
    <button className="primary wide" disabled={blockers.length > 0} onClick={() => start({
      session_id: sessionId,
      participant_id: participant.trim(),
      operator_id: operator.trim(),
      participant_language: participantLanguage,
      protocol_id: protocolIdOf(p),
      protocol_version: p.version.number,
      protocol_hash: p.freeze?.configHash || '',
      protocol_name: protocolNameOf(p),
      run_mode: isFormal ? 'formal' : 'preview',
      status: 'ready',
      started_at: new Date().toISOString(),
      ended_at: null,
      ...(groupExecution ? { group_execution_snapshot: groupExecution } : {}),
    })}>{isFormal ? tr('Continue to collection') : tr('Continue to test run')}</button></>}
    {preparedSession && dbError && <p role="alert">{t(dbError)}</p>}
    {readyPanel}
  </div>{guideOpen && <Suspense fallback={null}><GuidePanel initialTab={guideTab} onClose={onCloseGuide} /></Suspense>}</main>;
  return preparedSession && renderPreparedSession ? renderPreparedSession(preparedSession, renderForm) : renderForm(null);
}

export function SessionSetup({ protocol: p, onBack, onStart, storageInfo, onChooseDataDirectory, onGuide, guideOpen, guideTab, onCloseGuide }) {
  const tr = useT();
  const { language } = useLanguage();
  const [participant, setParticipant] = useState('');
  const [operator, setOperator] = useState('');
  const [device, setDevice] = useState('');
  const [index, setIndex] = useState(0);
  const [participantLanguage, setParticipantLanguage] = useState(language);
  const [manualText, setManualText] = useState({});
  const [sync, setSync] = useState({ sync_method: 'same_computer_clock', offset_ms: 0, device_time_column: '', device_time_format: 'epoch_ms', timezone: 'Asia/Tokyo', sampling_rate: '' });
  const isFormal = p.status === 'frozen';
  const storageBlocked = isFormal && (!storageInfo?.selected || storageInfo.permission !== 'granted');

  const manualOrders = Object.fromEntries(p.blocks.map(block => [block.block_id, (manualText[block.block_id] || '').split(',').map(token => token.trim()).filter(Boolean).map(token => { const position = Number(token); return Number.isInteger(position) && position > 0 ? block.trials[position - 1]?.trial_id : token; }).filter(id => block.trials.some(trial => trial.trial_id === id))]));

  const preview = block => {
    const trials = [...block.trials], manual = manualOrders[block.block_id];
    if (block.order_rule === 'latin_square' && trials.length) { const offset = ((index % trials.length) + trials.length) % trials.length; return [...trials.slice(offset), ...trials.slice(0, offset)]; }
    if (block.order_rule === 'random') { let seed = (index + 1) * 2654435761; for (let i = trials.length - 1; i > 0; i--) { seed = (seed * 1664525 + 1013904223) >>> 0; const j = seed % (i + 1); [trials[i], trials[j]] = [trials[j], trials[i]]; } }
    if (block.order_rule === 'manual' && manual.length) { const rank = new Map(manual.map((id, pos) => [id, pos])); trials.sort((a, b) => (rank.get(a.trial_id) ?? manual.length + block.trials.indexOf(a)) - (rank.get(b.trial_id) ?? manual.length + block.trials.indexOf(b))); }
    return trials;
  };

  return <main><Header onGuide={onGuide} /><div className="narrow">
    <button onClick={onBack}>{tr("← Protocol")}</button>
    <span className="eyebrow">{tr("SESSION SETUP")}</span>
    <h1>{p.name}</h1>
    <p>{tr("Bind this run to an anonymous participant and an exact protocol version.")}</p>
    <label htmlFor="participant-id">{tr("Participant ID")}<input id="participant-id" autoFocus value={participant} onChange={e => setParticipant(e.target.value)} placeholder={tr("P001")} /></label>
    <label htmlFor="participant-lang">{tr("Participant language")}<select id="participant-lang" value={participantLanguage} onChange={e => setParticipantLanguage(e.target.value)}><option value="zh">{tr("中文")}</option><option value="ja">{tr("日本語")}</option><option value="en">{tr("English")}</option></select></label>
    <label htmlFor="operator-id">{tr("Operator ID")}<input id="operator-id" value={operator} onChange={e => setOperator(e.target.value)} placeholder="optional" /></label>
    <label htmlFor="device-ref">{tr("Device start reference")}<input id="device-ref" value={device} onChange={e => setDevice(e.target.value)} placeholder={tr("MyBeat file / sync note")} /></label>
    <details className="setup-note">
      <summary><b>{tr("Device synchronization")}</b> {tr("(advanced)")}</summary>
      <label htmlFor="sync-method">{tr("Sync method")}<select id="sync-method" value={sync.sync_method} onChange={ev => setSync({ ...sync, sync_method: ev.target.value })}><option value="same_computer_clock">{tr("Same computer clock")}</option><option value="manual_offset">{tr("Manual offset")}</option><option value="manual_marker">{tr("Manual sync marker")}</option></select></label>
      <label htmlFor="sync-offset">{tr("Offset (ms)")}<input id="sync-offset" type="number" value={sync.offset_ms} onChange={ev => setSync({ ...sync, offset_ms: Number(ev.target.value) })} /></label>
      <label htmlFor="sync-col">{tr("Device time column")}<input id="sync-col" value={sync.device_time_column} placeholder="timestamp" onChange={ev => setSync({ ...sync, device_time_column: ev.target.value })} /></label>
      <label htmlFor="sync-fmt">{tr("Time format")}<select id="sync-fmt" value={sync.device_time_format} onChange={ev => setSync({ ...sync, device_time_format: ev.target.value })}><option value="epoch_ms">{tr("Epoch milliseconds")}</option><option value="epoch_s">{tr("Epoch seconds")}</option><option value="iso8601">{tr("ISO 8601")}</option><option value="relative_ms">{tr("Relative milliseconds")}</option></select></label>
      <label htmlFor="sync-tz">{tr("Timezone")}<input id="sync-tz" value={sync.timezone} onChange={ev => setSync({ ...sync, timezone: ev.target.value })} /></label>
      <label htmlFor="sync-rate">{tr("Sampling rate (Hz)")}<input id="sync-rate" type="number" min="0" value={sync.sampling_rate} onChange={ev => setSync({ ...sync, sampling_rate: ev.target.value === '' ? '' : Number(ev.target.value) })} /></label>
    </details>
    <label htmlFor="order-row">{tr("Order row")} <small title={tr("Starting offset for Latin square / random seed")}>{tr("(trial rotation index)")}</small><input id="order-row" type="number" min="0" value={index} onChange={e => setIndex(Number(e.target.value))} /></label>
    {p.blocks.filter(block => block.order_rule === 'manual').map(block => (
      <label key={block.block_id} htmlFor={`manual-${block.block_id}`}>{tr("Manual order ·")} {block.name}<input id={`manual-${block.block_id}`} value={manualText[block.block_id] || ''} placeholder={tr("e.g. 1, 2, 3 (position numbers)")} onChange={e => setManualText({ ...manualText, [block.block_id]: e.target.value })} /></label>
    ))}
    <div className="setup-note"><b>{tr("Actual Trial order preview")}</b>
      {p.blocks.map(block => <div key={block.block_id}><small>{block.name} · {block.order_rule}</small><p>{preview(block).map(trial => trial.name).join(' → ') || tr('(empty)')}</p></div>)}
    </div>
    <div className="setup-note"><b>{tr("Protocol integrity")}</b><code>{p.config_hash || tr('Draft test run — no frozen hash')}</code></div>
    <div className={`setup-note storage-gate ${storageBlocked ? 'blocked' : storageInfo?.selected ? 'ready' : 'preview'}`}>
      <b>{storageBlocked ? tr('Local data folder required') : storageInfo?.selected ? tr("Local data folder: {n}", { n: storageInfo.name || 'selected' }) : tr('Preview storage')}</b>
      <p>{storageBlocked ? tr('This is a frozen formal session. Select a local data folder before starting so data is not stored only in browser-managed storage.') : storageInfo?.selected ? tr('Session data, recovery snapshots, and exports can be written to the selected local folder.') : tr('Draft preview runs can continue without a local folder, but select one before formal collection.')}</p>
      {storageBlocked && onChooseDataDirectory && <button onClick={onChooseDataDirectory}>{tr("Select local data folder")}</button>}
    </div>
    <button className="primary wide" disabled={!participant.trim() || storageBlocked} onClick={() => onStart({ session_id: crypto.randomUUID(), participant_id: participant.trim(), operator_id: operator, device_start_reference: device, participant_language: participantLanguage, protocol_id: p.protocol_id, protocol_version: p.version, protocol_hash: p.config_hash || '', protocol_name: p.name, run_mode: p.status === 'frozen' ? 'formal' : 'preview', order_row: index, manual_orders: manualOrders, actual_trial_order: Object.fromEntries(p.blocks.map(block => [block.block_id, preview(block).map(trial => trial.trial_id)])), status: 'ready', started_at: null, ended_at: null, ...sync })}>{storageBlocked ? tr('Select data folder first') : tr('Start session')}</button>
  </div>{guideOpen && <Suspense fallback={null}><GuidePanel initialTab={guideTab} onClose={onCloseGuide} /></Suspense>}</main>;
}
