import { useT } from './i18n';
import { experimentPreflight } from './operator/experimentPreflight.js';
import { signalReadiness, canStartWithSignals } from './operator/signalReadiness.js';
import useRuntimeMonitor from './operator/useRuntimeMonitor.js';
import { liveSignalQuality } from './analysis/signal/liveQuality.js';
import './admin-monitor.css';
import { presentationAssetReferences } from './runtime/mediaResources.js';
import PhysioDBTestResult from './PhysioDBTestResult.jsx';
import TestRunExitButton from './TestRunExitButton.jsx';
import { recordTestVisit, previousTestVisit, supersedeTestResponses } from './runtime/testNavigation.js';
import useOperatorControls from './runtime/useOperatorControls.js';
import { restoreGroupExecutionSnapshot } from './core/groupSequence.js';
import { BRAINFLOW_CONNECTOR_ID, createBrainFlowAdapter, trimBrainFlowPreview } from './devices/brainflowConnector.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ParticipantRenderer from './ParticipantRenderer.jsx';
import QuestionnaireForm from './QuestionnaireFormV2.jsx';
import CognitiveTaskRunner from './CognitiveTaskRunner.jsx';
import AttentionCheckRunner from './AttentionCheckRunner.jsx';
import ResponseRunner from './ResponseRunner.jsx';
import CalibrationRunner from './CalibrationRunner.jsx';
import BrainFlowSignalChart from './analysis/BrainFlowSignalChart.jsx';
import { protocolNameOf, protocolStatusOf, protocolVersionOf, resolveStimulusAssignments, withStimulusAssignment } from './core/index.js';
import {
  completeCurrentNode,
  createCoreControlHandlerRegistry,
  createDeviceSampler,
  createRuntimeState,
  maxInputSampleRateHz,
  pauseRuntime,
  recordRuntimeEvent,
  resolveDeviceConnector,
  restoreRuntime,
  resumeRuntime,
  retryCurrentNode,
  skipCurrentNode,
  snapshotRuntime,
  startRuntime,
} from './runtime/index.js';
import { localResourceManifest, schemaForNode } from './runtime/nodeSchema.js';
import { DeviceConnectorSession, createMuseDeviceAdapter, createSimulatedDeviceAdapter } from './devices/index.js';
import { clearCurrentRun, saveCurrentRun, saveSession, loadSession } from './storage.js';
import { persistFinishedSession } from './runtime/sessionPersistence.js';
import { buildGraphBidsBundle, buildGraphSessionFiles } from './data/index.js';
import { downloadBundle } from './exporter.js';
import { createProjectComponentRegistry } from './sdk/index.js';
import { HostedRuntimeSync } from './hosted/index.js';
import { loadAsset, verifyAssetContent, verifyGraphProtocolAssets } from './assetStore.js';

function runtimeServices() {
  return {
    idFactory: prefix => `${prefix}_${crypto.randomUUID()}`,
    clock: { now: () => { const epochMs = Date.now(); return { epochMs, monotonicMs: performance.timeOrigin + performance.now(), iso: new Date(epochMs).toISOString() }; } },
    controlHandlers: createCoreControlHandlerRegistry(),
  };
}

// Pick the adapter that can drive an installed connector. Unknown transports yield
// null and are handled by the required/optional device preflight below.
function createDeviceAdapter(connector, options) {
  if (connector.connectorId === BRAINFLOW_CONNECTOR_ID) return createBrainFlowAdapter({ ...options, connector });
  if (connector.transport === 'simulated') return createSimulatedDeviceAdapter();
  if (connector.transport === 'bluetooth' && connector.connectorId.startsWith('org.physioflow.muse')) return createMuseDeviceAdapter();
  return null;
}

function packagePermissions(protocol, node) {
  const componentPackage = (protocol.componentPackages || []).find(item => item.components?.some(component => component.type === node.component.type && component.version === node.component.version));
  return componentPackage ? new Set(componentPackage.approvedPermissions || []) : null;
}



export default function GraphRuntimeRunnerPage({ data, onDone, onExitTest, renderPreparation, beforeStart }) {
  const t = useT();
  const participantOnly = data.participantOnly === true;
  const exitingTest = useRef(false);
  const deviceCheckedAt = useRef(Date.now());
  const [signalChecks, setSignalChecks] = useState([]);
  const sourceProtocol = data.protocol;
  const protocol = useMemo(() => {
    if (!data.session.group_execution_snapshot) {
      if (sourceProtocol.groupRandomization?.enabled) throw new Error('This randomized-group session has no saved execution plan. Return to preparation before starting.');
      return sourceProtocol;
    }
    const restored = restoreGroupExecutionSnapshot(data.session.group_execution_snapshot, createProjectComponentRegistry(sourceProtocol));
    if (JSON.stringify(restored.sourceProtocol) !== JSON.stringify(sourceProtocol)) throw new Error('Saved randomized group source does not match this session protocol');
    return restored.protocol;
  }, [sourceProtocol, data.session.group_execution_snapshot]);
  const registry = useMemo(() => createProjectComponentRegistry(protocol), [protocol]);
  const services = useRef(runtimeServices());
  const initialState = useMemo(() => ({
    stimulus_shuffle_version: data.restore ? (data.restore.stimulus_shuffle_version || data.restore.runtime?.stimulus_shuffle_version || 'legacy-lcg-v1') : 'mulberry32-v2',
    stimulus_assignment_policy: data.restore ? (data.restore.stimulus_assignment_policy || data.restore.runtime?.stimulus_assignment_policy || 'legacy-stride') : 'global-completion-v1',
    ...(data.restore?.runtime?.protocolSchemaVersion
    ? restoreRuntime(data.restore.runtime, protocol)
    : createRuntimeState(protocol, { sessionId: data.session.session_id, startedAtEpochMs: Date.now(), startedAtMonotonicMs: performance.timeOrigin + performance.now() })),
  }), [data.restore, data.session.session_id, protocol]);
  const [runtime, setRuntime] = useState(initialState);
  const testRun = !data.hosted && data.session.run_mode === 'preview';
  const testRunRef = useRef(testRun);
  const testHistoryRef = useRef(testRun && Array.isArray(data.restore?.test_navigation_history) ? data.restore.test_navigation_history : []);
  const [navigationError, setNavigationError] = useState('');
  const operatorVisible = useOperatorControls(!participantOnly && !['ready', 'completed', 'failed'].includes(runtime.status));
  const [events, setEvents] = useState(data.restore?.events || []);
  const [responses, setResponses] = useState(data.restore?.responses || []);
  const deviceEventsRef = useRef(data.restore?.device_events || []);
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [brainflowEndpoint, setBrainflowEndpoint] = useState('http://127.0.0.1:8765');
  const [brainflowToken, setBrainflowToken] = useState('');
  const latestDeviceValues = useRef({});
  const previewPolicy = useRef({ maxSamples: 20000, droppedSamples: data.restore?.device_preview_policy?.droppedSamples || 0, source: 'BrainFlow agent samples.jsonl' });
  const previewCount = useRef((data.restore?.device_events || []).filter(event => event.connector?.id === BRAINFLOW_CONNECTOR_ID && event.eventType === 'device_sample_received').length);

  const hasBrainflow = protocol.graph.nodes.some(node => node.config?.deviceConnectorId === BRAINFLOW_CONNECTOR_ID);

  // BrainFlow live chart inputs. Channels and rate come from the installed connector
  // manifest (the same manifest the sampler uses), so they stay in sync for free.
  const brainflowConnector = protocol.deviceConnectors?.find(connector => connector.connectorId === BRAINFLOW_CONNECTOR_ID);
  const brainflowChannels = useMemo(
    () => (brainflowConnector?.channels || []).filter(channel => channel.direction === 'input').map(channel => channel.id),
    [brainflowConnector],
  );
  const brainflowRate = brainflowConnector ? (maxInputSampleRateHz(brainflowConnector) || 250) : 250;
  const BRAINFLOW_PREVIEW_WINDOW_SECONDS = 10;

  // Reads the most recent preview window straight from the sample buffer ref. The
  // chart wraps this in a 250 ms poll; this function must stay allocation-cheap and
  // must never trigger a re-render of this page (it is a pure ref read).
  const getBrainFlowWindow = useCallback(() => {
    if (!brainflowChannels.length) return { times: [], values: {} };
    const maxPerChannel = Math.max(2, Math.round(BRAINFLOW_PREVIEW_WINDOW_SECONDS * brainflowRate));
    const values = Object.fromEntries(brainflowChannels.map(id => [id, []]));
    const times = [];
    let lastSequence = null;
    // The buffer is mostly sample events, so twice the needed capacity is a safe
    // margin for the handful of lifecycle events interleaved among them.
    const tail = deviceEventsRef.current.slice(-(maxPerChannel * brainflowChannels.length * 2));
    for (const event of tail) {
      if (event.eventType !== 'device_sample_received' || event.connector?.id !== BRAINFLOW_CONNECTOR_ID) continue;
      const payload = event.payload;
      const list = values[payload?.channelId];
      if (!list || !Number.isFinite(payload?.value)) continue;
      list.push(payload.value);
      if (payload.sampleSequence !== lastSequence) {
        times.push(payload.deviceTimestamp ?? null);
        lastSequence = payload.sampleSequence;
      }
    }
    for (const id of brainflowChannels) values[id] = values[id].slice(-maxPerChannel);
    return { times: times.slice(-maxPerChannel), values };
  }, [brainflowChannels, brainflowRate]);

  const deviceSessionRef = useRef(null);
  const samplerRef = useRef(null);
  const connectionsRef = useRef([]);
  const [started, setStarted] = useState(Boolean(data.restore?.runtime?.status && data.restore.runtime.status !== 'ready' && !protocol.graph.nodes.some(node => node.config?.deviceConnectorId)));
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');
  const [saved, setSaved] = useState(false);
  const [cleanupError, setCleanupError] = useState('');
  const [recoverySave, setRecoverySave] = useState({ status: 'idle', error: '' });
  const saveQueueRef = useRef(Promise.resolve());
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [localResources, setLocalResources] = useState(() => localResourceManifest(protocol.assets || []));
  const [resourceLoad, setResourceLoad] = useState({ status: 'loading', error: '', key: null });
  const verifiedMediaProtocol = useRef(null);
  const hostedSyncRef = useRef(null);
  if (data.hosted && !hostedSyncRef.current) hostedSyncRef.current = new HostedRuntimeSync(data.hosted);
  const [hostedStatus, setHostedStatus] = useState(() => hostedSyncRef.current?.status() || null);
  const finishing = useRef(false);
  const [saveAttempt, setSaveAttempt] = useState(0);
  const durationRef = useRef(data.restore?.recovery_timing || { key: null, remaining: 0 });
  const [checkpointTick, setCheckpointTick] = useState(0);
  const captureTiming = () => ({ key: durationRef.current.key, remaining: Math.max(0, durationRef.current.remaining - (durationRef.current.runningAt == null ? 0 : performance.now() - durationRef.current.runningAt)) });
  const runtimeRef = useRef(initialState);
  const nodeEnteredAt = useRef(performance.now());
  const nodePausedAt = useRef(null);
  const nodes = useMemo(() => new Map(protocol.graph.nodes.map(node => [node.id, node])), [protocol]);
  const currentNode = runtime.currentNodeId ? nodes.get(runtime.currentNodeId) : null;
  const attemptKey = `${runtime.currentNodeId}:${runtime.attempts?.[runtime.currentNodeId] || 0}`;
  // Completed/skipped presentations consume a draw; Retry retains it. Preserve the
  // previous policy for checkpoints created before this execution-history policy.
  const legacyStimulusOrder = initialState.stimulus_assignment_policy !== 'global-completion-v1';
  const stimulusShuffleVersion = initialState.stimulus_shuffle_version;
  const stimulusAssignments = useMemo(() => {
    const history = legacyStimulusOrder ? (runtime.completedNodeIds || []).reduce((counts, id) => ({ ...counts, [id]: (counts[id] || 0) + 1 }), {}) : [...runtime.completedNodeIds, ...runtime.skippedNodeIds];
    return resolveStimulusAssignments(protocol, runtime.randomSeed, history, { shuffleVersion: stimulusShuffleVersion });
  }, [protocol, runtime.randomSeed, runtime.completedNodeIds, runtime.skippedNodeIds, legacyStimulusOrder, stimulusShuffleVersion]);
  const currentStimulusAssignment = currentNode ? stimulusAssignments.get(currentNode.id) : null;
  const presentedNode = currentNode ? withStimulusAssignment(currentNode, currentStimulusAssignment) : null;
  const resourceKey = JSON.stringify(presentationAssetReferences(protocol, presentedNode));
  const mediaReady = Boolean(data.hosted) || (resourceLoad.status === 'ready' && resourceLoad.key === resourceKey);
  const draftCapture = useRef(null);
  const onQuestionnaireDraft = useCallback(capture => {
    draftCapture.current = capture ? { key: attemptKey, capture } : null;
    if (capture) setCheckpointTick(value => value + 1);
  }, [attemptKey]);
  const captureQuestionnaire = useCallback(() => draftCapture.current?.key === attemptKey
    ? { key: attemptKey, draft: draftCapture.current.capture() } : null, [attemptKey]);
  const currentDefinition = currentNode ? registry.get(currentNode.component.type, currentNode.component.version) : null;
  const currentPermissions = currentNode ? packagePermissions(protocol, currentNode) : null;
  const executableCount = protocol.graph.nodes.filter(node => registry.get(node.component.type, node.component.version)?.runtime?.kind === 'participant').length;
  // Participant progress measures distinct node coverage, not repeated visits.
  const coveredNodeCount = new Set([...runtime.completedNodeIds, ...runtime.skippedNodeIds]).size;
  const progress = { current: coveredNodeCount, total: executableCount, percent: executableCount ? Math.min(100, Math.round((coveredNodeCount / executableCount) * 100)) : 100 };
  const endedAt = events.findLast(event => ['protocol_completed', 'runtime_failed'].includes(event.eventType))?.timestampIso || null;
  const exportFiles = ['completed', 'failed'].includes(runtime.status) ? { ...buildGraphSessionFiles({ ...data.session, status: runtime.status, ended_at: endedAt, runtime_snapshot: runtime, events, responses, device_preview_policy: hasBrainflow ? previewPolicy.current : undefined, device_events: deviceEventsRef.current }, protocol, events, responses), ...buildGraphBidsBundle({ ...data.session, status: runtime.status, ended_at: endedAt }, protocol, events, responses) } : null;
  const participantResources = data.hosted?.resources || localResources;
  const assignmentLoggedRef = useRef(new Set((data.restore?.events || []).filter(event => event.eventType === 'stimulus_assigned').map(event => `${event.nodeId}:${event.payload?.attempt || 1}`)));
  const deviceNode = protocol.graph?.nodes?.find(node => node.config?.deviceConnectorId);
  const deviceRequired = protocol.graph.nodes.some(node => node.config?.deviceConnectorId && node.config.deviceRequired !== false);

  const signalChannels = useMemo(() => (protocol.deviceConnectors || []).flatMap(connector => {
    const references = protocol.graph.nodes.filter(node => node.config?.deviceConnectorId === connector.connectorId);
    if (!references.length) return [];
    return connector.channels.filter(channel => channel.direction === 'input').map(channel => ({ ...channel, connectorId: connector.connectorId, required: references.some(node => node.config.deviceRequired !== false) }));
  }), [protocol]);
  const formalRun = data.session.run_mode === 'formal' || Boolean(data.hosted && data.session.run_mode !== 'preview');
  const checkPreflight = () => experimentPreflight(protocol, checkSignals(), connectionsRef.current, { formal: formalRun });
  const checkSignals = () => signalReadiness(deviceEventsRef.current.filter(event => event.timestampEpochMs >= deviceCheckedAt.current), signalChannels);
  const liveQualityRef = useRef({ at: 0, value: null });
  const monitorUrl = useRuntimeMonitor(participantOnly ? null : data.session.session_id, () => {
    const preview = getBrainFlowWindow();
    // Device timestamps are seconds and may be absent. The monitor and the
    // quality assessment must read the same millisecond array, or the operator
    // sees one clock and the checks judge another.
    const times = preview.times.map(time => (Number.isFinite(time) ? time * 1000 : null));
    // The snapshot is published twice a second; assessing eight channels with a
    // spectrum costs a few milliseconds, which this page should not spend while
    // it is also presenting stimuli. Once per second is enough for a verdict.
    if (!liveQualityRef.current.value || Date.now() - liveQualityRef.current.at >= 1000) {
      liveQualityRef.current = {
        at: Date.now(),
        value: liveSignalQuality({
          times,
          sampleRateHz: brainflowRate,
          channels: brainflowChannels.map(id => ({
            name: brainflowConnector?.channels?.find(channel => channel.id === id)?.name || id,
            values: preview.values[id] || [],
          })),
        }),
      };
    }
    const quality = liveQualityRef.current.value;
    return { protocolName: protocolNameOf(protocol), status: runtimeRef.current.status, nodeLabel: nodes.get(runtimeRef.current.currentNodeId)?.label || '', completed: runtimeRef.current.completedNodeIds.length, total: executableCount, saveStatus: saved === true ? 'saved' : recoverySave.status, deviceError: deviceStatus?.error || deviceStatus?.markerError || '', signals: checkSignals().map(({ values: _values, ...signal }) => signal), preview: { times: times.slice(-400), values: Object.fromEntries(Object.entries(preview.values).map(([id, values]) => [id, values.slice(-400)])) }, quality };
  }, command => {
    if (command === 'pause' && runtimeRef.current.status === 'waiting') apply(pauseRuntime(runtimeRef.current, protocol, services.current));
    if (command === 'resume' && runtimeRef.current.status === 'paused' && mediaReady && (!deviceRequired || (deviceStatus?.connected === true && checkPreflight().every(check => check.ready)))) apply(resumeRuntime(runtimeRef.current, protocol, services.current));
  });
  const readinessRef = useRef(null);
  readinessRef.current = () => {
    const checks = checkSignals(); setSignalChecks(checks);
    if (started && deviceRequired && runtimeRef.current.status === 'waiting' && !canStartWithSignals(checks)) {
      setDeviceStatus(current => ({ ...current, error: 'Required signal is stale, missing or flat. Check the operator monitor before resuming.' }));
      apply(pauseRuntime(runtimeRef.current, protocol, services.current, 'Required signal unavailable'));
    }
  };
  useEffect(() => { const timer = setInterval(() => readinessRef.current?.(), 500); return () => clearInterval(timer); }, []);

  const apply = result => {
    if (exitingTest.current) return;
    setNavigationError('');
    for (const connection of connectionsRef.current.filter(item => item.session.connector.connectorId === BRAINFLOW_CONNECTOR_ID)) {
      for (const event of result.events || []) {
        const marker = JSON.stringify({ sequence: event.sequence, eventType: event.eventType, nodeId: event.nodeId, timestampEpochMs: event.timestampEpochMs });
        connection.markers = connection.markers.then(() => connection.session.write('marker', marker)).catch(error => setDeviceStatus(current => ({ ...current, markerError: error.message })));
      }
    }

    if (result.history) testHistoryRef.current = result.history;
    if (!result.history && testRunRef.current && result.events?.some(event => event.eventType === 'component_entered')) {
      const prior = result.events.some(event => event.eventType === 'component_retried') ? testHistoryRef.current.slice(0, -1) : testHistoryRef.current;
      testHistoryRef.current = recordTestVisit(prior, result.state, 'preview');
    }
    runtimeRef.current = result.state;
    setRuntime(result.state);
    if (result.events?.length) setEvents(current => [...current, ...result.events]);
  };

  const exitTest = async () => {
    if (!testRun || !onExitTest || starting || exitingTest.current) return;
    if (runtimeRef.current.status === 'waiting') apply(pauseRuntime(runtimeRef.current, protocol, services.current));
    exitingTest.current = true;
    try {
      for (const connection of connectionsRef.current) {
        await connection.sampler?.stop(); await connection.markers;
        await connection.session.disconnect('preview exited');
      }
      await saveQueueRef.current.catch(() => {});
      await clearCurrentRun({ strict: true });
      await onExitTest();
    } catch (error) { exitingTest.current = false; throw error; }
  };

  const previousPage = () => {
    if (!testRun || runtimeRef.current.status !== 'waiting' || testHistoryRef.current.length < 2) return;
    try {
      const result = previousTestVisit({ history: testHistoryRef.current, state: runtimeRef.current, protocol, services: services.current, mode: data.session.run_mode });
      setResponses(current => supersedeTestResponses(current, result.events[0]));
      apply(result);
    } catch (error) {
      setNavigationError(error.message);
    }
  };

  const beginImpl = async (startExperiment = true) => {
    if (starting || !mediaReady) return;
    if (participantOnly && deviceRequired) { setStartError('Ask the operator to prepare the required devices on the acquisition computer.'); return; }
    if ((data.session.run_mode === 'formal' || (data.hosted && data.session.run_mode !== 'preview')) && signalChannels.some(channel => channel.required && protocol.deviceConnectors.some(connector => connector.connectorId === channel.connectorId && (connector.transport === 'simulated' || connector.brainflow?.boardId < 0)))) { setStartError(t("Simulated devices cannot start a formal experiment. Select real hardware or use a test run.")); return; }
    if (startExperiment && connectionsRef.current.length && connectionsRef.current.every(connection => connection.session.status === 'connected')) {
      const blocked = checkPreflight().find(check => !check.ready);
      if (blocked) { setStartError(blocked.reason); return; }
      setStartError(''); setStarted(true);
      if (runtimeRef.current.status === 'ready') apply(startRuntime(runtimeRef.current, protocol, registry, services.current));
      return;
    }
    setStarting(true);
    setStartError('');
    for (const connection of connectionsRef.current) { await connection.sampler?.stop(); await connection.markers; await connection.session.disconnect('reconnect').catch(() => {}); }
    connectionsRef.current = [];
    deviceCheckedAt.current = Date.now(); setSignalChecks([]);
    const deviceNodes = protocol.graph.nodes.filter(node => node.config?.deviceConnectorId);
    const uniqueDevices = [...new Map(deviceNodes.map(node => [`${node.config.deviceConnectorId}:${node.config.deviceConnectorVersion || ''}`, node])).values()];
    let required = deviceRequired;
    try {
      for (const deviceNode of uniqueDevices) {
        required = deviceNodes.some(node => node.config.deviceConnectorId === deviceNode.config.deviceConnectorId && node.config.deviceRequired !== false);
        const connectionRequired = required;
        try {
        const resolved = resolveDeviceConnector(protocol, deviceNode);
        const adapter = resolved ? createDeviceAdapter(resolved.connector, { endpoint: brainflowEndpoint, token: brainflowToken, session: { sessionId: data.session.session_id, participantId: data.session.participant_id, experimentId: protocol.biodb?.experimentId || '', protocolId: protocol.protocolId } }) : null;
        if (!resolved?.connector) throw new Error(`Device connector ${deviceNode.config.deviceConnectorId} is unavailable`);
        if (!adapter) throw new Error(`No runtime adapter is installed for ${resolved.connector.transport}`);
        deviceSessionRef.current = new DeviceConnectorSession({
          connector: { ...resolved.connector, approvedPermissions: resolved.connector.approvedPermissions },
          adapter,
          sessionId: data.session.session_id,
          services: services.current,
          onEvent: event => {
            deviceEventsRef.current.push(event);
            if (event.eventType === 'device_sample_received') {
              latestDeviceValues.current[event.payload.channelId] = event.payload.value;
              if (event.connector.id === BRAINFLOW_CONNECTOR_ID && ++previewCount.current > 21000) {
                const trimmed = trimBrainFlowPreview(deviceEventsRef.current);
                deviceEventsRef.current = trimmed.events;
                previewCount.current -= trimmed.dropped;
                previewPolicy.current.droppedSamples += trimmed.dropped;
              }
            }
          },
        });
        await deviceSessionRef.current.connect({ source: resolved.connector.transport });
        samplerRef.current = createDeviceSampler({
          session: deviceSessionRef.current,
          channels: resolved.connector.channels.filter(channel => channel.direction === 'input'),
          sampleRateHz: maxInputSampleRateHz(resolved.connector),
          onError: (channelId, error) => {
            setDeviceStatus({ connected: false, error: `${channelId}: ${error.message || String(error)}` });
            if (connectionRequired && runtimeRef.current.status === 'waiting') apply(pauseRuntime(runtimeRef.current, protocol, services.current, 'Required device sampling failed'));
          },
        });
        connectionsRef.current.push({ session: deviceSessionRef.current, sampler: samplerRef.current, markers: Promise.resolve() });
        samplerRef.current.start();
        setDeviceStatus({ connected: true });
        } catch (error) {
          if (required) throw error;
          setDeviceStatus({ connected: false, error: `${deviceNode.config.deviceConnectorId}: ${error.message || String(error)}` });
        }
      }
    } catch (error) {
      const message = error.message || String(error);
      setDeviceStatus({ connected: false, error: message });
      if (required) {
        for (const connection of connectionsRef.current) { connection.sampler.stop(); await connection.session.disconnect('preflight failed').catch(() => {}); }
        connectionsRef.current = [];
        setStartError(`Required device is not ready: ${message}`);
        setStarting(false);
        return;
      }
    }
    if (!startExperiment || checkPreflight().some(check => !check.ready)) { setStarting(false); return; }
    setStarted(true);
    if (runtimeRef.current.status === 'ready') apply(startRuntime(runtimeRef.current, protocol, registry, services.current));
    setStarting(false);
  };

  const beginLock = useRef(false);
  const begin = async (startExperiment = true) => {
    if (beginLock.current || starting || !mediaReady) return;
    beginLock.current = true;
    try {
      if (startExperiment && beforeStart) { setStarting(true); await beforeStart(data.session); setStarting(false); }
      await beginImpl(startExperiment);
    } catch (error) { setStartError(error.message || String(error)); }
    finally { beginLock.current = false; setStarting(false); }
  };
  const leavePreparation = async () => {
    if (beginLock.current || starting) throw new Error(t("Wait for device preparation to finish."));
    for (const connection of connectionsRef.current) { await connection.sampler?.stop(); await connection.markers; await connection.session.disconnect('preparation edited'); }
    connectionsRef.current = [];
  };

  const complete = result => {
    const activeRuntime = runtimeRef.current;
    const activeNode = activeRuntime.currentNodeId ? nodes.get(activeRuntime.currentNodeId) : null;
    if (!activeNode || activeRuntime.status !== 'waiting' || `${activeRuntime.currentNodeId}:${activeRuntime.attempts?.[activeRuntime.currentNodeId] || 0}` !== attemptKey || !started || !mediaReady) return;
    const values = result?.values || {};
    const nodeDurationMs = Math.max(0, Math.round(performance.now() - nodeEnteredAt.current));
    // An explicit null means an omission, not a request to substitute dwell time.
    const reactionTimeMs = Object.hasOwn(result || {}, 'reactionTimeMs')
      ? (Number.isFinite(result.reactionTimeMs) ? Math.max(0, result.reactionTimeMs) : null)
      : nodeDurationMs;
    const rows = Object.entries(values).map(([name, value]) => ({
      responseId: `response_${crypto.randomUUID()}`,
      eventSequence: activeRuntime.eventSequence + 1,
      sessionId: data.session.session_id,
      participantId: data.session.participant_id,
      protocolId: protocol.protocolId,
      nodeId: activeNode.id,
      componentType: activeNode.component.type,
      name,
      value,
      reactionTimeMs,
      nodeDurationMs,
      timestampIso: new Date().toISOString(),
    }));
    if (rows.length) setResponses(current => [...current, ...rows]);
    const submitted = rows.length
      ? recordRuntimeEvent(activeRuntime, protocol, services.current, 'response_submitted', { payload: { fields: rows.map(row => row.name), values, reactionTimeMs, nodeDurationMs } })
      : { state: activeRuntime, events: [] };
    // Performance-variable backfill: if the designer declared these names as protocol
    // variables, the runtime feeds live response metrics into them so Condition nodes
    // can branch adaptively (legacy last_rt_ms / last_response semantics, new-arch style).
    const declared = new Set((protocol.variables || []).map(variable => variable.name));
    const performanceValues = {};
    if (rows.length) {
      if (declared.has('last_rt_ms')) performanceValues.last_rt_ms = rows[0].reactionTimeMs;
      if (declared.has('last_response')) performanceValues.last_response = rows[0].value;
    }
    const requestedVariables = { ...(result?.variables || values), ...performanceValues };
    const completed = completeCurrentNode(submitted.state, protocol, registry, services.current, { outputs: result?.outputs || values, metadata: result?.metadata || {}, variables: currentPermissions && !currentPermissions.has('session.variables.write') ? {} : requestedVariables });
    apply({ state: completed.state, events: [...submitted.events, ...completed.events] });
  };

  const record = (eventType, payload) => {
    const active = runtimeRef.current;
    if (!started || !mediaReady || active.status !== 'waiting' || `${active.currentNodeId}:${active.attempts?.[active.currentNodeId] || 0}` !== attemptKey) return;
    if (currentPermissions && eventType === 'ui_action' && !currentPermissions.has('events.emit')) return;
    apply(recordRuntimeEvent(runtimeRef.current, protocol, services.current, eventType, { payload }));
  };

  const syncHosted = useCallback(() => {
    if (!hostedSyncRef.current) return Promise.resolve(null);
    return hostedSyncRef.current.enqueue({ events, runtime, complete: ['completed', 'failed'].includes(runtime.status) })
      .then(status => { setHostedStatus(status); return status; })
      .catch(error => { setHostedStatus({ ...hostedSyncRef.current.status(), error: error.message || String(error) }); throw error; });
  }, [events, runtime]);

  useEffect(() => {
    if (currentNode?.id && started && mediaReady) { nodeEnteredAt.current = performance.now(); nodePausedAt.current = null; }
  }, [currentNode?.id, attemptKey, started, mediaReady]);

  useEffect(() => {
    if (runtime.status === 'paused') nodePausedAt.current = performance.now();
    else if (nodePausedAt.current != null) { nodeEnteredAt.current += performance.now() - nodePausedAt.current; nodePausedAt.current = null; }
  }, [runtime.status]);

  useEffect(() => {
    if (data.hosted) return undefined;
    let active = true;
    const objectUrls = [];
    setResourceLoad({ status: 'loading', error: '' });
    const assetsById = new Map((protocol.assets || []).map(asset => [asset.id || asset.assetId, asset]));
    (async () => {
      if (verifiedMediaProtocol.current !== protocol) {
        const result = await verifyGraphProtocolAssets(protocol);
        if (!active) return [];
        if (!result.valid) throw new Error(result.issues.map(issue => issue.message).join('\n'));
        verifiedMediaProtocol.current = protocol;
      }
      return Promise.all(JSON.parse(resourceKey).map(async reference => {
      const asset = assetsById.get(reference.asset_id);
      if (!asset) throw new Error(`Asset ${reference.asset_id} is referenced but missing from the media library`);
      if (reference.source_url) return null;
      const assetId = reference.asset_id;
      const stored = await loadAsset(assetId);
      if (!active) return null;
      if (!stored?.file) throw new Error(`Missing local asset ${asset.name || assetId}`);
      if (!(await verifyAssetContent(stored, asset.checksum || asset.hash))) throw new Error(`Checksum mismatch for ${asset.name || assetId}`);
      if (!active) return null;
      const url = URL.createObjectURL(stored.file);
      objectUrls.push(url);
      return { assetId, nodeId: null, name: asset.name || stored.name || assetId, mediaType: asset.mediaType || stored.type?.split('/')[0] || null, checksum: asset.checksum || stored.checksum || null, status: 'ready', delivery: { url } };
    }));
    })().then(loaded => {
      if (!active) return;
      setLocalResources([...localResourceManifest(protocol.assets || []), ...loaded.filter(Boolean)]);
      setResourceLoad({ status: 'ready', error: '', key: resourceKey });
    }).catch(error => { if (active) setResourceLoad({ status: 'error', error: error.message || String(error) }); });
    return () => { active = false; objectUrls.forEach(url => URL.revokeObjectURL(url)); };
  }, [data.hosted, protocol, resourceKey]);

  useEffect(() => {
    if (!started || runtime.status !== 'waiting' || !currentStimulusAssignment || !currentNode) return;
    const key = `${currentNode.id}:${currentStimulusAssignment.attempt}`;
    if (assignmentLoggedRef.current.has(key)) return;
    assignmentLoggedRef.current.add(key);
    apply(recordRuntimeEvent(runtimeRef.current, protocol, services.current, 'stimulus_assigned', { node: currentNode, payload: currentStimulusAssignment }));
  }, [currentNode, currentStimulusAssignment, protocol, started, runtime.status]);

  useEffect(() => () => {
    for (const connection of connectionsRef.current) { connection.sampler.stop().then(() => connection.markers).then(() => connection.session.disconnect('runner closed')).catch(() => {}); }
  }, []);

  // Release the acquisition agent as soon as the page is torn down. Without this a
  // refresh or tab close mid-run left the agent holding a session that would never
  // poll again. pagehide (not visibilitychange) is the right event: switching tabs
  // must not drop a running experiment. The agent's stale-owner timeout remains the
  // fallback for a crash or force-quit, where no handler can run.
  useEffect(() => {
    const release = () => { for (const connection of connectionsRef.current) connection.session.detachOnUnload(); };
    window.addEventListener('pagehide', release);
    return () => window.removeEventListener('pagehide', release);
  }, []);

  useEffect(() => {
    if (!started || !['waiting', 'paused'].includes(runtime.status)) return undefined;
    const timer = setInterval(() => {
      setDeviceStatus(current => (current?.connected ? { ...current, sampleCount: deviceEventsRef.current.filter(event => event.eventType === 'device_sample_received').length } : current));
    }, 500);
    return () => clearInterval(timer);
  }, [runtime.status, started]);

  useEffect(() => {
    if (!started || !mediaReady || !currentNode || runtime.status !== 'waiting') return undefined;
    const duration = currentDefinition?.runtime?.completion === 'durationMs'
      ? currentNode.config?.durationMs
      : currentNode.config?.completion?.mode === 'fixed' ? currentNode.config.completion.durationMs : null;
    if (duration === null || duration === undefined) return undefined;
    if (durationRef.current.key !== attemptKey) durationRef.current = { key: attemptKey, remaining: Math.max(0, Number(duration)) };
    const clockStart = performance.now();
    durationRef.current.runningAt = clockStart;
    const timer = setTimeout(() => complete({}), durationRef.current.remaining);
    return () => { clearTimeout(timer); durationRef.current.remaining = Math.max(0, durationRef.current.remaining - (performance.now() - clockStart)); durationRef.current.runningAt = null; };
  }, [attemptKey, runtime.status, started, mediaReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (exitingTest.current || !started || !mediaReady || ['completed', 'failed'].includes(runtime.status)) return;
    const snapshot = structuredClone({ session: data.session, protocol: sourceProtocol, runtime: snapshotRuntime(runtime), test_navigation_history: testRun ? testHistoryRef.current : undefined, stimulus_assignment_policy: legacyStimulusOrder ? 'legacy-stride' : 'global-completion-v1', stimulus_shuffle_version: stimulusShuffleVersion, recovery_timing: captureTiming(), questionnaire_draft: captureQuestionnaire(), events, responses, device_preview_policy: hasBrainflow ? previewPolicy.current : undefined, device_events: deviceEventsRef.current, saved_at: new Date().toISOString(), runtime_version: 2 });
    setRecoverySave({ status: 'saving', error: '' });
    const queued = saveQueueRef.current.catch(() => {}).then(() => saveCurrentRun(snapshot));
    saveQueueRef.current = queued;
    queued.then(() => { if (saveQueueRef.current === queued) setRecoverySave({ status: 'saved', error: '' }); }).catch(error => { if (saveQueueRef.current === queued) setRecoverySave({ status: 'error', error: error.message || String(error) }); });
  }, [data.session, events, protocol, sourceProtocol, responses, mediaReady, runtime, started, checkpointTick, legacyStimulusOrder, hasBrainflow, stimulusShuffleVersion, testRun, captureQuestionnaire]);

  useEffect(() => {
    if (!started || ['completed', 'failed'].includes(runtime.status)) return undefined;
    const timer = setInterval(() => setCheckpointTick(value => value + 1), 2000);
    return () => clearInterval(timer);
  }, [started, runtime.status]);

  useEffect(() => {
    if (!started || !hostedSyncRef.current) return;
    syncHosted().catch(() => {});
  }, [started, syncHosted]);

  useEffect(() => {
    if (!['completed', 'failed'].includes(runtime.status) || finishing.current) return;
    finishing.current = true;
    const closeDevices = Promise.all(connectionsRef.current.map(async connection => { await connection.sampler.stop(); await connection.markers; await connection.session.disconnect('session end').catch(error => connection.session.emit('device_disconnect_failed', { message: error.message })); }));
    const finished = {
      ...data.session,
      protocol_id: protocol.protocolId,
      protocol_version: protocolVersionOf(protocol),
      protocol_name: protocolNameOf(protocol),
      run_mode: data.hosted ? 'hosted' : protocolStatusOf(protocol) === 'frozen' ? 'formal' : 'preview',
      status: runtime.status,
      ended_at: endedAt,
      event_count: events.length,
      protocol_snapshot: sourceProtocol,
      runtime_snapshot: runtime,
      events,
      responses,
      device_preview_policy: hasBrainflow ? previewPolicy.current : undefined, device_events: deviceEventsRef.current,
      data_contract_version: '2.0.0-alpha.1',
      stimulus_assignment_policy: legacyStimulusOrder ? 'legacy-stride' : 'global-completion-v1', stimulus_shuffle_version: stimulusShuffleVersion,
    };
    Promise.all([saveQueueRef.current.catch(() => {}), closeDevices]).then(() => persistFinishedSession({ ...finished, device_events: deviceEventsRef.current }, { saveSession, clearCurrentRun: () => clearCurrentRun({ strict: true }) })).then(result => { setSaved(true); setCleanupError(result.cleanupError); }).catch(error => setSaved(error.message || 'Save failed'));
  }, [data.session, data.hosted, events, protocol, sourceProtocol, responses, runtime, saveAttempt, legacyStimulusOrder, hasBrainflow, stimulusShuffleVersion, endedAt]);

  if (!mediaReady) return <main className="graph-runner"><div className="graph-runner-ready"><span className="eyebrow">{t("MEDIA PREFLIGHT")}</span><h1>{resourceLoad.status !== 'error' ? t("Preparing media…") : t("Media needs attention")}</h1><p>{resourceLoad.error || t("Loading referenced local files and checking their integrity.")}</p>{resourceLoad.status === 'error' && <button onClick={onDone}>{t("Return to protocol")}</button>}</div></main>;
  if (!started && participantOnly) return <main className="graph-runner"><section className="graph-runner-ready pf-preflight"><h1>{protocolNameOf(protocol)}</h1><p>{t('Please wait for the operator, then begin when instructed.')}</p>{deviceRequired && <p role="status">{t('Ask the operator to prepare the required devices on the acquisition computer.')}</p>}<button className="primary" disabled={starting || deviceRequired} onClick={() => begin(true)}>{t('Begin experiment')}</button>{startError && <p role="alert">{t(startError)}</p>}</section></main>;
  if (!started) { const preparation = <div className="graph-runner-ready pf-preflight">
    <span className="eyebrow">{t("PREPARE")}</span><h1>{protocolNameOf(protocol)}</h1><p>{data.session.participant_id} · {executableCount} {t('steps')}</p><details><summary>{t('Session identifiers')}</summary><p>{t('PF session ID')}: {data.session.session_id}</p><p>{t('PF protocol ID')}: {protocol.protocolId} · v{protocol.version?.number}</p></details>
    <ol className="pf-preflight-steps"><li><span>1</span><b>{t('Preparation')}</b><small>{t('Media checked')}</small></li><li><span>2</span><b>{t('Signal check')}</b><small>{deviceNode ? t('Check devices before starting') : t('No devices required')}</small></li><li><span>3</span><b>{t('Start experiment')}</b><small>{t('Participant display')}</small></li></ol>
    {monitorUrl && <a className="pf-monitor-link" href={monitorUrl} target="_blank" rel="noreferrer">{t('Open operator monitor')} ↗</a>}
    {hasBrainflow && <details open={!deviceStatus?.connected} className="pf-panel"><summary>{t('Device connection')}</summary><fieldset disabled={starting}><label>{t('Agent URL')}<input aria-label={t("BrainFlow agent URL")} value={brainflowEndpoint} onChange={event => setBrainflowEndpoint(event.target.value)} /></label><label>{t('Agent token')}<input aria-label={t("BrainFlow agent token")} type="password" autoComplete="off" value={brainflowToken} onChange={event => setBrainflowToken(event.target.value)} /></label></fieldset></details>}
    {deviceNode && <><ul className="pf-event-list">{checkPreflight().map(check => <li key={check.connectorId}><b>{check.connectorId}</b><span>{t(check.reason || 'Destination verified')}</span><small>{check.channels} {t('Channel')} · {check.sampleRateHz ? `${check.sampleRateHz} Hz` : '—'} · {t(check.recordingActive ? 'Recording active' : 'Recording not confirmed')}</small></li>)}</ul><button disabled={starting} onClick={() => begin(false)}>{starting ? t('Connecting…') : t('Check signals')}</button><div className="pf-signal-grid">{signalChecks.map(check => <div key={`${check.connectorId}:${check.id}`} className="pf-signal-item"><b>{check.name}</b><span className={`pf-tag ${check.ready ? 'ready' : 'warning'}`}>{t(check.status)}</span><small>{check.value == null ? '—' : check.value.toFixed(2)} {check.unit}</small></div>)}</div>{hasBrainflow && deviceStatus?.connected && <BrainFlowSignalChart channels={brainflowChannels} sampleRateHz={brainflowRate} windowSeconds={BRAINFLOW_PREVIEW_WINDOW_SECONDS} getWindow={getBrainFlowWindow} />}</>}
    {startError && <div className="setup-note error" role="alert">{t(startError)}</div>}
    <p className="pf-muted">{t('Keep monitoring on the operator display. Only stimuli and questions appear during the experiment.')}</p>
    <button className="primary" disabled={starting} onClick={() => begin(true)}>{starting ? t('Connecting…') : startError ? t('Retry device and begin') : t('Begin experiment')}</button>{testRun && !starting && <TestRunExitButton onExit={onExitTest && exitTest} />}
  </div>; return renderPreparation ? renderPreparation(preparation, { busy: starting, leavePreparation }) : <main className="graph-runner">{preparation}</main>; }
  if (participantOnly && ['completed', 'failed'].includes(runtime.status)) return <main className="graph-runner"><section className="graph-runner-ready"><h1>{t(runtime.status === 'completed' ? 'Thank you' : 'Experiment stopped')}</h1><p role="status">{t(saved === true && (!hostedSyncRef.current || hostedStatus?.completed) ? 'Your experiment is finished. Please contact the operator.' : 'Please wait while your experiment record is saved.')}</p>{(typeof saved === 'string' || hostedStatus?.error) && <p role="alert">{t('The operator needs to check data saving. Please keep this window open.')}</p>}{typeof saved === 'string' && <button onClick={() => { finishing.current = false; setSaved(false); setSaveAttempt(value => value + 1); }}>{t('Try saving again')}</button>}{hostedStatus?.error && <button onClick={() => syncHosted().catch(() => {})}>{t('Try saving again')}</button>}</section></main>;
  if (runtime.status === 'completed') {
    const hostedReady = !hostedSyncRef.current || hostedStatus?.completed;
    const deviceSampleCount = deviceEventsRef.current.filter(event => event.eventType === 'device_sample_received').length;
    return <main className="graph-runner"><div className="graph-runner-ready pf-completion"><span className="eyebrow">{t("SESSION COMPLETE")}</span><h1>{t('Collection complete')}</h1><p>{data.session.participant_id} · {protocolNameOf(protocol)}</p><details className="setup-note"><summary>{t('Record details')}</summary><p>{events.length} {t("events ·")} {responses.length} {t("responses ·")} {deviceSampleCount} {t("device samples ·")} {Object.keys(exportFiles).length} {t("export files")}</p></details><p role={typeof saved === 'string' ? 'alert' : 'status'}>{saved === true ? t("Session data saved.") : typeof saved === 'string' ? 'Session data not saved: ' + saved : t("Saving session data…")}</p>{cleanupError && <div role="alert" className="setup-note"><p>{t("Session data is saved, but the recovery checkpoint could not be removed:")} {t(cleanupError)}</p><button onClick={() => clearCurrentRun({ strict: true }).then(() => setCleanupError('')).catch(error => setCleanupError(error.message || String(error)))}>{t("Retry checkpoint cleanup")}</button></div>}{hasBrainflow && <p>{t("BrainFlow preview exported; full raw recording remains on the acquisition computer.")}</p>}{deviceStatus?.markerError && <p role="alert">{t("Marker delivery failed:")} {t(deviceStatus.markerError)}</p>}{hostedSyncRef.current && <p>{hostedStatus?.completed ? t("Hosted sync complete · revision {n}").replace('{n}', hostedStatus.revision) : hostedStatus?.error ? t("Hosted sync failed: {name}").replace('{name}', t(hostedStatus.error)) : t("Syncing hosted session…")}</p>}{hostedStatus?.error && <button onClick={() => syncHosted().catch(() => {})}>{t("Retry hosted sync")}</button>}
      {testRun && data.session.db_test_run && saved === true && <PhysioDBTestResult session={data.session} protocol={protocol} events={events} deviceEvents={deviceEventsRef.current} onReport={async report => { const local = await loadSession(data.session.session_id); if (!local) throw new Error(t("Local test session could not be loaded")); await saveSession({ ...local, db_test_report: report }); }} />}
      <button className="primary" disabled={saved !== true} onClick={() => downloadBundle(exportFiles, data.session.participant_id)}>{t("Export complete data package")}</button>{typeof saved === 'string' && <button onClick={() => { finishing.current = false; setSaved(false); setSaveAttempt(value => value + 1); }}>{t("Retry local save")}</button>}<button disabled={saved !== true || !hostedReady} onClick={onDone}>{t("Return to projects")}</button></div></main>;
  }
  if (runtime.status === 'failed') return <main className="graph-runner"><div className="graph-runner-ready"><span className="eyebrow">{t("RUNTIME FAILED")}</span><h1>{t("Experiment stopped")}</h1><p>{t(runtime.error)}</p><p role={typeof saved === 'string' ? 'alert' : 'status'}>{saved === true ? t("Session data saved.") : typeof saved === 'string' ? 'Session data not saved: ' + saved : t("Saving session data…")}</p>{cleanupError && <div role="alert" className="setup-note"><p>{t("Session data is saved, but the recovery checkpoint could not be removed:")} {t(cleanupError)}</p><button onClick={() => clearCurrentRun({ strict: true }).then(() => setCleanupError('')).catch(error => setCleanupError(error.message || String(error)))}>{t("Retry checkpoint cleanup")}</button></div>}<button onClick={() => downloadBundle(exportFiles, data.session.participant_id)}>{t("Export failure data")}</button>{typeof saved === 'string' && <button onClick={() => { finishing.current = false; setSaved(false); setSaveAttempt(value => value + 1); }}>{t("Retry local save")}</button>}{hostedSyncRef.current && <p>{hostedStatus?.completed ? t("Hosted failure recorded · revision {n}").replace('{n}', hostedStatus.revision) : hostedStatus?.error ? t("Hosted sync failed: {name}").replace('{name}', t(hostedStatus.error)) : t("Recording hosted failure…")}</p>}{hostedStatus?.error && <button onClick={() => syncHosted().catch(() => {})}>{t("Retry hosted sync")}</button>}<button disabled={saved !== true || Boolean(hostedSyncRef.current && !hostedStatus?.completed)} onClick={onDone}>{t("Return to projects")}</button></div></main>;
  if (!currentNode) return null;

  return <main className={`graph-runner${operatorVisible ? "" : " participant-only"}`}>
    {operatorVisible && <div className="graph-operator" role="toolbar" aria-label={t("Operator controls")}><div><b>{protocolNameOf(protocol)}</b><span>{currentNode.label} · {currentNode.component.type}</span>{deviceStatus && <span>{deviceStatus.connected ? t("Device connected · {count} samples").replace('{count}', deviceStatus.sampleCount || 0) : t("Device warning · {name}").replace('{name}', t(deviceStatus.error))}</span>}<span role="status">{runtime.status === 'paused' ? t("Paused") : 'Running'} · {recoverySave.status === 'saved' ? t("Checkpoint saved") : recoverySave.status === 'saving' ? t("Saving checkpoint…") : recoverySave.status === 'idle' ? t("Awaiting first checkpoint") : t("Checkpoint not saved")}</span>{recoverySave.status === 'error' && <span role="alert">{t("Recovery save failed ·")} {t(recoverySave.error)}</span>}</div><div>{runtime.completedNodeIds.length} {t("completed visits ·")} {runtime.skippedNodeIds.length} {t("skipped")}</div><div>
      {recoverySave.status === 'error' && <button onClick={() => { const snapshot = { session: data.session, protocol: sourceProtocol, runtime: snapshotRuntime(runtimeRef.current), test_navigation_history: testRun ? testHistoryRef.current : undefined, recovery_timing: captureTiming(), questionnaire_draft: captureQuestionnaire(), stimulus_assignment_policy: legacyStimulusOrder ? 'legacy-stride' : 'global-completion-v1', stimulus_shuffle_version: stimulusShuffleVersion, events, responses, device_preview_policy: hasBrainflow ? previewPolicy.current : undefined, device_events: deviceEventsRef.current, saved_at: new Date().toISOString(), runtime_version: 2 }; setRecoverySave({ status: 'saving', error: '' }); const queued = saveQueueRef.current.catch(() => {}).then(() => saveCurrentRun(snapshot)); saveQueueRef.current = queued; queued.then(() => { if (saveQueueRef.current === queued) setRecoverySave({ status: 'saved', error: '' }); }).catch(error => { if (saveQueueRef.current === queued) setRecoverySave({ status: 'error', error: error.message || String(error) }); }); }}>{t("Retry save")}</button>}
      {monitorUrl && <a href={monitorUrl} target="_blank" rel="noreferrer">{t('Open operator monitor')} ↗</a>}
      <button className={inspectorOpen ? "active" : ''} onClick={() => setInspectorOpen(open => !open)} title={t("Live variables, outputs and flow state")}>{t("⌄ Inspect")}</button>
      {deviceStatus?.error && <button disabled={starting} onClick={() => begin(true)}>{t("Reconnect devices")}</button>}
      <button disabled={runtime.status === 'paused' && deviceRequired && (deviceStatus?.connected !== true || !canStartWithSignals(signalChecks))} onClick={() => apply(runtime.status === 'paused' ? resumeRuntime(runtimeRef.current, protocol, services.current) : pauseRuntime(runtimeRef.current, protocol, services.current))}>{runtime.status === 'paused' ? t("Resume") : t("Pause")}</button>
      {testRun && <TestRunExitButton onExit={onExitTest && exitTest} />}
      {testRun && <button disabled={runtime.status !== 'waiting' || testHistoryRef.current.length < 2} onClick={previousPage}>{t("Previous page (test)")}</button>}
      {navigationError && <span role="alert">{t('Cannot return to the previous page: {name}').replace('{name}', t(navigationError))}</span>}
      <button disabled={runtime.status !== 'waiting'} onClick={() => apply(retryCurrentNode(runtimeRef.current, protocol, services.current, 'operator retry'))}>{t("Retry")}</button>
      <button disabled={runtime.status !== 'waiting'} onClick={() => apply(skipCurrentNode(runtimeRef.current, protocol, registry, services.current, 'operator skip'))}>{t("Skip")}</button>
    </div></div>}
    {operatorVisible && hasBrainflow && <aside className="setup-note" aria-label={t("BrainFlow live preview")}><b>{t("BrainFlow EEG preview (µV)")}</b><p>{Object.entries(latestDeviceValues.current).map(([key, value]) => `${key}: ${Number(value).toFixed(2)}`).join(' · ') || t("Waiting for samples")}</p>{brainflowChannels.length > 0 && <BrainFlowSignalChart channels={brainflowChannels} sampleRateHz={brainflowRate} windowSeconds={BRAINFLOW_PREVIEW_WINDOW_SECONDS} getWindow={getBrainFlowWindow} />}<small>{t("Preview channels only; browser retains about 20,000 recent channel samples. Complete raw recording stays on the acquisition computer.")}</small>{deviceStatus?.markerError && <p role="alert">{t("Marker failed:")} {t(deviceStatus.markerError)}</p>}{deviceStatus?.error && <div><label>{t('Agent URL')}<input aria-label={t("BrainFlow agent URL")} value={brainflowEndpoint} onChange={event => setBrainflowEndpoint(event.target.value)} /></label><label>{t('Agent token')}<input aria-label={t("BrainFlow agent token")} type="password" autoComplete="off" value={brainflowToken} onChange={event => setBrainflowToken(event.target.value)} /></label></div>}</aside>}
    {operatorVisible && hostedSyncRef.current && <aside className="setup-note" aria-label={t("Server synchronization")}><p role="status">{hostedStatus?.error ? t("Server synchronization needs attention: {name}").replace('{name}', t(hostedStatus.error)) : t("Server acknowledged {count} runtime events · {total} recorded in this browser").replace('{count}', Math.max(0, (hostedStatus?.nextEventSequence || 1) - 1)).replace('{total}', events.length)}</p>{hostedStatus?.error && <button onClick={() => syncHosted().catch(() => {})}>{t("Retry server synchronization")}</button>}{deviceNode && <p>{t("Device samples are kept in this browser's session package; runtime synchronization does not upload the device sample stream.")}</p>}</aside>}
    {operatorVisible && inspectorOpen && <RuntimeInspector runtime={runtime} protocol={protocol} nodes={nodes} />}
    <section key={attemptKey} inert={runtime.status === 'paused'} className="graph-participant" aria-label={t("Participant view")}>
      {runtime.status === 'paused' && <div className="pause-overlay">{t("Paused")}</div>}
      {currentNode.component.type === 'stimulus.attention-check'
        ? <AttentionCheckRunner config={currentNode.config} language={data.session.participant_language || 'en'} disabled={runtime.status === 'paused'} onSubmit={complete} />
        : currentNode.component.type === 'input.response'
        ? <ResponseRunner config={currentNode.config} language={data.session.participant_language || 'en'} disabled={runtime.status === 'paused'} onSubmit={complete} />
        : currentNode.component.type === 'stimulus.screen-calibration'
        ? <CalibrationRunner config={currentNode.config} language={data.session.participant_language || 'en'} disabled={runtime.status === 'paused'} onSubmit={complete} />
        : currentNode.component.type === 'experiment.cognitive-task'
        ? <CognitiveTaskRunner config={currentNode.config} disabled={runtime.status === 'paused'} onSubmit={complete} onTrialEvent={(eventType, payload) => record(eventType, payload)} />
        : currentNode.component.type === 'input.questionnaire' && currentNode.config?.questionnaire?.questions?.length
        ? <QuestionnaireForm initialDraft={data.restore?.questionnaire_draft?.key === attemptKey ? data.restore.questionnaire_draft.draft : undefined} onDraftChange={onQuestionnaireDraft} questionnaire={currentNode.config.questionnaire} language={data.session.participant_language || 'en'} randomSeed={runtime.randomSeed} disabled={runtime.status === 'paused'} onSubmit={(answers, metadata) => {
            const scoreValues = metadata?.score?.total > 0 ? {
              questionnaire_score_correct: metadata.score.correct,
              questionnaire_score_total: metadata.score.total,
              questionnaire_score_pct: metadata.score.pct,
            } : {};
            const values = { ...answers, ...scoreValues, questionnaire_timed_out_question_ids: metadata?.timedOutQuestionIds || [] };
            complete({ values, outputs: values, variables: scoreValues, reactionTimeMs: null, metadata: { questionnaire: metadata } });
          }} />
        : <ParticipantRenderer key={`${currentNode.id}:${currentStimulusAssignment?.assetId || ''}`} schema={schemaForNode(presentedNode, currentDefinition, participantResources, t)} disabled={runtime.status === 'paused'} context={{ participant: data.session, variables: currentPermissions && !currentPermissions.has('session.variables.read') ? {} : runtime.variables, outputs: runtime.outputs, progress, timer: { elapsedMs: 0 } }} onSubmit={complete} onValueChange={payload => record('value_changed', payload)} onAction={action => record('ui_action', action)} onMediaEvent={(eventType, payload) => {
          record(eventType, currentStimulusAssignment ? { ...payload, assetId: currentStimulusAssignment.assetId, stimulusPoolGroup: currentStimulusAssignment.group } : payload);
          if (eventType === 'media_ended' && currentNode.config?.completion?.mode === 'media-ended') complete({});
        }} />}
    </section>
  </main>;
}

// Live operator-facing inspector: reconstructed variables, data outputs and
// flow state straight from the Runtime V2 state machine (W5).
function RuntimeInspector({ runtime, protocol, nodes }) {
  const t = useT();
  const format = value => value === null || value === undefined ? '—'
    : typeof value === 'object' ? JSON.stringify(value) : String(value);
  const variableRows = (protocol.variables || []).map(variable => ({ name: variable.name, type: variable.type, value: runtime.variables?.[variable.name] }));
  const outputRows = Object.entries(runtime.outputs || {}).map(([key, value]) => ({ name: key, value }));
  const loopRows = Object.entries(runtime.loopCounts || {}).map(([key, value]) => ({ name: key, value }));
  return <section className="runtime-inspector" aria-label={t("Runtime variables, outputs and flow state")}>
    <div className="ri-section">
      <h4>{t("Variables")} <small>{variableRows.length}</small></h4>
      {variableRows.length ? <table><thead><tr><th>{t("Name")}</th><th>{t("Type")}</th><th>{t("Value")}</th></tr></thead>
        <tbody>{variableRows.map(row => <tr key={row.name}><td><code>{row.name}</code></td><td>{row.type}</td><td><code>{format(row.value)}</code></td></tr>)}</tbody></table>
        : <p className="muted">{t("No protocol variables declared.")}</p>}
    </div>
    <div className="ri-section">
      <h4>{t("Outputs")} <small>{outputRows.length}</small></h4>
      {outputRows.length ? <table><thead><tr><th>{t("Port")}</th><th>{t("Value")}</th></tr></thead>
        <tbody>{outputRows.map(row => <tr key={row.name}><td><code>{row.name}</code></td><td><code>{format(row.value)}</code></td></tr>)}</tbody></table>
        : <p className="muted">{t("No node outputs yet.")}</p>}
    </div>
    <div className="ri-section ri-flow">
      <h4>{t("Flow state")}</h4>
      <p><span>{t("Status")}</span><b>{t(runtime.status)}</b></p>
      <p><span>{t("Current node")}</span><b>{runtime.currentNodeId ? nodes.get(runtime.currentNodeId)?.label || runtime.currentNodeId : '—'}</b></p>
      <p><span>{t("Completed")}</span><b>{runtime.completedNodeIds.length}</b></p>
      <p><span>{t("Skipped")}</span><b>{runtime.skippedNodeIds.length}</b></p>
      <p><span>{t("Total attempts")}</span><b>{Object.values(runtime.attempts || {}).reduce((total, count) => total + count, 0)}</b></p>
      {loopRows.length > 0 && <p><span>{t("Loop counts")}</span><b>{loopRows.map(row => `${row.name}×${format(row.value)}`).join(', ')}</b></p>}
    </div>
  </section>;
}
