import { presentationAssetReferences } from './runtime/mediaResources.js';
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
import { clearCurrentRun, saveCurrentRun, saveSession } from './storage.js';
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



export default function GraphRuntimeRunnerPage({ data, onDone, onExitTest }) {
  const exitingTest = useRef(false);
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
  const operatorVisible = useOperatorControls(!['ready', 'completed', 'failed'].includes(runtime.status));
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
      setNavigationError(`Cannot return to the previous page: ${error.message}`);
    }
  };

  const begin = async () => {
    if (starting || !mediaReady) return;
    setStarting(true);
    setStartError('');
    for (const connection of connectionsRef.current) { await connection.sampler?.stop(); await connection.markers; await connection.session.disconnect('reconnect').catch(() => {}); }
    connectionsRef.current = [];
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
    setStarted(true);
    if (runtimeRef.current.status === 'ready') apply(startRuntime(runtimeRef.current, protocol, registry, services.current));
    setStarting(false);
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
    const snapshot = structuredClone({ session: data.session, protocol: sourceProtocol, runtime: snapshotRuntime(runtime), test_navigation_history: testRun ? testHistoryRef.current : undefined, stimulus_assignment_policy: legacyStimulusOrder ? 'legacy-stride' : 'global-completion-v1', stimulus_shuffle_version: stimulusShuffleVersion, recovery_timing: captureTiming(), events, responses, device_preview_policy: hasBrainflow ? previewPolicy.current : undefined, device_events: deviceEventsRef.current, saved_at: new Date().toISOString(), runtime_version: 2 });
    setRecoverySave({ status: 'saving', error: '' });
    const queued = saveQueueRef.current.catch(() => {}).then(() => saveCurrentRun(snapshot));
    saveQueueRef.current = queued;
    queued.then(() => { if (saveQueueRef.current === queued) setRecoverySave({ status: 'saved', error: '' }); }).catch(error => { if (saveQueueRef.current === queued) setRecoverySave({ status: 'error', error: error.message || String(error) }); });
  }, [data.session, events, protocol, sourceProtocol, responses, mediaReady, runtime, started, checkpointTick, legacyStimulusOrder, hasBrainflow, stimulusShuffleVersion, testRun]);

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

  if (!mediaReady) return <main className="graph-runner"><div className="graph-runner-ready"><span className="eyebrow">MEDIA PREFLIGHT</span><h1>{resourceLoad.status !== 'error' ? 'Preparing media…' : 'Media needs attention'}</h1><p>{resourceLoad.error || 'Loading referenced local files and checking their integrity.'}</p>{resourceLoad.status === 'error' && <button onClick={onDone}>Return to protocol</button>}</div></main>;
  if (!started) return <main className="graph-runner"><div className="graph-runner-ready"><span className="eyebrow">RUNTIME V2 READY</span><h1>{protocolNameOf(protocol)}</h1><p>{data.session.participant_id} · {executableCount} participant components</p>{deviceNode && <p>{deviceRequired ? 'A device connection is required before this run can start.' : 'Device connection is optional for this run.'}</p>}{hasBrainflow && <fieldset disabled={starting}><legend>BrainFlow local agent</legend><label>Agent URL<input aria-label="BrainFlow agent URL" value={brainflowEndpoint} onChange={event => setBrainflowEndpoint(event.target.value)} /></label><label>Agent token<input aria-label="BrainFlow agent token" type="password" autoComplete="off" value={brainflowToken} onChange={event => setBrainflowToken(event.target.value)} /></label><p>Start the acquisition agent first. Raw recording continues independently of this browser. The token is not saved in the protocol or exports.</p></fieldset>}{startError && <div className="setup-note error" role="alert">{startError}</div>}<p>Operator controls are hidden during the experiment. Press Ctrl+Shift+O (Mac: ⌘⇧O) to show or hide them.</p><button className="primary" disabled={starting} onClick={begin}>{starting ? 'Connecting…' : startError ? 'Retry device and begin' : 'Begin experiment'}</button>{testRun && !starting && <TestRunExitButton onExit={onExitTest && exitTest} />}</div></main>;
  if (runtime.status === 'completed') {
    const hostedReady = !hostedSyncRef.current || hostedStatus?.completed;
    const deviceSampleCount = deviceEventsRef.current.filter(event => event.eventType === 'device_sample_received').length;
    return <main className="graph-runner"><div className="graph-runner-ready"><span className="eyebrow">SESSION COMPLETE</span><h1>Thank you</h1><p>{events.length} events · {responses.length} responses · {deviceSampleCount} device samples · {Object.keys(exportFiles).length} export files</p><p role={typeof saved === 'string' ? 'alert' : 'status'}>{saved === true ? 'Session data saved.' : typeof saved === 'string' ? 'Session data not saved: ' + saved : 'Saving session data…'}</p>{cleanupError && <div role="alert" className="setup-note"><p>Session data is saved, but the recovery checkpoint could not be removed: {cleanupError}</p><button onClick={() => clearCurrentRun({ strict: true }).then(() => setCleanupError('')).catch(error => setCleanupError(error.message || String(error)))}>Retry checkpoint cleanup</button></div>}{hasBrainflow && <p>BrainFlow preview exported; full raw recording remains on the acquisition computer.</p>}{deviceStatus?.markerError && <p role="alert">Marker delivery failed: {deviceStatus.markerError}</p>}{hostedSyncRef.current && <p>{hostedStatus?.completed ? `Hosted sync complete · revision ${hostedStatus.revision}` : hostedStatus?.error ? `Hosted sync failed: ${hostedStatus.error}` : 'Syncing hosted session…'}</p>}{hostedStatus?.error && <button onClick={() => syncHosted().catch(() => {})}>Retry hosted sync</button>}
      <button className="primary" disabled={saved !== true} onClick={() => downloadBundle(exportFiles, data.session.participant_id)}>Export complete data package</button>{typeof saved === 'string' && <button onClick={() => { finishing.current = false; setSaved(false); setSaveAttempt(value => value + 1); }}>Retry local save</button>}<button disabled={saved !== true || !hostedReady} onClick={onDone}>Return to projects</button></div></main>;
  }
  if (runtime.status === 'failed') return <main className="graph-runner"><div className="graph-runner-ready"><span className="eyebrow">RUNTIME FAILED</span><h1>Experiment stopped</h1><p>{runtime.error}</p><p role={typeof saved === 'string' ? 'alert' : 'status'}>{saved === true ? 'Session data saved.' : typeof saved === 'string' ? 'Session data not saved: ' + saved : 'Saving session data…'}</p>{cleanupError && <div role="alert" className="setup-note"><p>Session data is saved, but the recovery checkpoint could not be removed: {cleanupError}</p><button onClick={() => clearCurrentRun({ strict: true }).then(() => setCleanupError('')).catch(error => setCleanupError(error.message || String(error)))}>Retry checkpoint cleanup</button></div>}<button onClick={() => downloadBundle(exportFiles, data.session.participant_id)}>Export failure data</button>{typeof saved === 'string' && <button onClick={() => { finishing.current = false; setSaved(false); setSaveAttempt(value => value + 1); }}>Retry local save</button>}{hostedSyncRef.current && <p>{hostedStatus?.completed ? `Hosted failure recorded · revision ${hostedStatus.revision}` : hostedStatus?.error ? `Hosted sync failed: ${hostedStatus.error}` : 'Recording hosted failure…'}</p>}{hostedStatus?.error && <button onClick={() => syncHosted().catch(() => {})}>Retry hosted sync</button>}<button disabled={saved !== true || Boolean(hostedSyncRef.current && !hostedStatus?.completed)} onClick={onDone}>Return to projects</button></div></main>;
  if (!currentNode) return null;

  return <main className={`graph-runner${operatorVisible ? "" : " participant-only"}`}>
    {operatorVisible && <div className="graph-operator" role="toolbar" aria-label="Operator controls"><div><b>{protocolNameOf(protocol)}</b><span>{currentNode.label} · {currentNode.component.type}</span>{deviceStatus && <span>{deviceStatus.connected ? `Device connected · ${deviceStatus.sampleCount || 0} samples` : `Device warning · ${deviceStatus.error}`}</span>}<span role="status">{runtime.status === 'paused' ? 'Paused' : 'Running'} · {recoverySave.status === 'saved' ? 'Checkpoint saved' : recoverySave.status === 'saving' ? 'Saving checkpoint…' : recoverySave.status === 'idle' ? 'Awaiting first checkpoint' : 'Checkpoint not saved'}</span>{recoverySave.status === 'error' && <span role="alert">Recovery save failed · {recoverySave.error}</span>}</div><div>{runtime.completedNodeIds.length} completed visits · {runtime.skippedNodeIds.length} skipped</div><div>
      {recoverySave.status === 'error' && <button onClick={() => { const snapshot = { session: data.session, protocol: sourceProtocol, runtime: snapshotRuntime(runtimeRef.current), test_navigation_history: testRun ? testHistoryRef.current : undefined, recovery_timing: captureTiming(), stimulus_assignment_policy: legacyStimulusOrder ? 'legacy-stride' : 'global-completion-v1', stimulus_shuffle_version: stimulusShuffleVersion, events, responses, device_preview_policy: hasBrainflow ? previewPolicy.current : undefined, device_events: deviceEventsRef.current, saved_at: new Date().toISOString(), runtime_version: 2 }; setRecoverySave({ status: 'saving', error: '' }); const queued = saveQueueRef.current.catch(() => {}).then(() => saveCurrentRun(snapshot)); saveQueueRef.current = queued; queued.then(() => { if (saveQueueRef.current === queued) setRecoverySave({ status: 'saved', error: '' }); }).catch(error => { if (saveQueueRef.current === queued) setRecoverySave({ status: 'error', error: error.message || String(error) }); }); }}>Retry save</button>}
      <button className={inspectorOpen ? 'active' : ''} onClick={() => setInspectorOpen(open => !open)} title="Live variables, outputs and flow state">⌄ Inspect</button>
      {deviceStatus?.error && <button disabled={starting} onClick={begin}>Reconnect devices</button>}
      <button disabled={runtime.status === 'paused' && deviceRequired && deviceStatus?.connected !== true} onClick={() => apply(runtime.status === 'paused' ? resumeRuntime(runtimeRef.current, protocol, services.current) : pauseRuntime(runtimeRef.current, protocol, services.current))}>{runtime.status === 'paused' ? 'Resume' : 'Pause'}</button>
      {testRun && <TestRunExitButton onExit={onExitTest && exitTest} />}
      {testRun && <button disabled={runtime.status !== 'waiting' || testHistoryRef.current.length < 2} onClick={previousPage}>Previous page (test)</button>}
      {navigationError && <span role="alert">{navigationError}</span>}
      <button disabled={runtime.status !== 'waiting'} onClick={() => apply(retryCurrentNode(runtimeRef.current, protocol, services.current, 'operator retry'))}>Retry</button>
      <button disabled={runtime.status !== 'waiting'} onClick={() => apply(skipCurrentNode(runtimeRef.current, protocol, registry, services.current, 'operator skip'))}>Skip</button>
    </div></div>}
    {operatorVisible && hasBrainflow && <aside className="setup-note" aria-label="BrainFlow live preview"><b>BrainFlow EEG preview (µV)</b><p>{Object.entries(latestDeviceValues.current).map(([key, value]) => `${key}: ${Number(value).toFixed(2)}`).join(' · ') || 'Waiting for samples'}</p><small>Preview channels only; browser retains about 20,000 recent channel samples. Complete raw recording stays on the acquisition computer.</small>{deviceStatus?.markerError && <p role="alert">Marker failed: {deviceStatus.markerError}</p>}{deviceStatus?.error && <div><label>Agent URL<input aria-label="BrainFlow agent URL" value={brainflowEndpoint} onChange={event => setBrainflowEndpoint(event.target.value)} /></label><label>Agent token<input aria-label="BrainFlow agent token" type="password" autoComplete="off" value={brainflowToken} onChange={event => setBrainflowToken(event.target.value)} /></label></div>}</aside>}
    {operatorVisible && hostedSyncRef.current && <aside className="setup-note" aria-label="Server synchronization"><p role="status">{hostedStatus?.error ? `Server synchronization needs attention: ${hostedStatus.error}` : `Server acknowledged ${Math.max(0, (hostedStatus?.nextEventSequence || 1) - 1)} runtime events · ${events.length} recorded in this browser`}</p>{hostedStatus?.error && <button onClick={() => syncHosted().catch(() => {})}>Retry server synchronization</button>}{deviceNode && <p>Device samples are kept in this browser's session package; runtime synchronization does not upload the device sample stream.</p>}</aside>}
    {operatorVisible && inspectorOpen && <RuntimeInspector runtime={runtime} protocol={protocol} nodes={nodes} />}
    <section key={attemptKey} inert={runtime.status === 'paused'} className="graph-participant" aria-label="Participant view">
      {runtime.status === 'paused' && <div className="pause-overlay">Paused</div>}
      {currentNode.component.type === 'stimulus.attention-check'
        ? <AttentionCheckRunner config={currentNode.config} language={data.session.participant_language || 'en'} disabled={runtime.status === 'paused'} onSubmit={complete} />
        : currentNode.component.type === 'input.response'
        ? <ResponseRunner config={currentNode.config} language={data.session.participant_language || 'en'} disabled={runtime.status === 'paused'} onSubmit={complete} />
        : currentNode.component.type === 'stimulus.screen-calibration'
        ? <CalibrationRunner config={currentNode.config} language={data.session.participant_language || 'en'} disabled={runtime.status === 'paused'} onSubmit={complete} />
        : currentNode.component.type === 'experiment.cognitive-task'
        ? <CognitiveTaskRunner config={currentNode.config} disabled={runtime.status === 'paused'} onSubmit={complete} onTrialEvent={(eventType, payload) => record(eventType, payload)} />
        : currentNode.component.type === 'input.questionnaire' && currentNode.config?.questionnaire?.questions?.length
        ? <QuestionnaireForm questionnaire={currentNode.config.questionnaire} language={data.session.participant_language || 'en'} randomSeed={runtime.randomSeed} disabled={runtime.status === 'paused'} onSubmit={(answers, metadata) => {
            const scoreValues = metadata?.score?.total > 0 ? {
              questionnaire_score_correct: metadata.score.correct,
              questionnaire_score_total: metadata.score.total,
              questionnaire_score_pct: metadata.score.pct,
            } : {};
            const values = { ...answers, ...scoreValues, questionnaire_timed_out_question_ids: metadata?.timedOutQuestionIds || [] };
            complete({ values, outputs: values, variables: scoreValues, reactionTimeMs: null, metadata: { questionnaire: metadata } });
          }} />
        : <ParticipantRenderer key={`${currentNode.id}:${currentStimulusAssignment?.assetId || ''}`} schema={schemaForNode(presentedNode, currentDefinition, participantResources)} disabled={runtime.status === 'paused'} context={{ participant: data.session, variables: currentPermissions && !currentPermissions.has('session.variables.read') ? {} : runtime.variables, outputs: runtime.outputs, progress, timer: { elapsedMs: 0 } }} onSubmit={complete} onValueChange={payload => record('value_changed', payload)} onAction={action => record('ui_action', action)} onMediaEvent={(eventType, payload) => {
          record(eventType, currentStimulusAssignment ? { ...payload, assetId: currentStimulusAssignment.assetId, stimulusPoolGroup: currentStimulusAssignment.group } : payload);
          if (eventType === 'media_ended' && currentNode.config?.completion?.mode === 'media-ended') complete({});
        }} />}
    </section>
  </main>;
}

// Live operator-facing inspector: reconstructed variables, data outputs and
// flow state straight from the Runtime V2 state machine (W5).
function RuntimeInspector({ runtime, protocol, nodes }) {
  const format = value => value === null || value === undefined ? '—'
    : typeof value === 'object' ? JSON.stringify(value) : String(value);
  const variableRows = (protocol.variables || []).map(variable => ({ name: variable.name, type: variable.type, value: runtime.variables?.[variable.name] }));
  const outputRows = Object.entries(runtime.outputs || {}).map(([key, value]) => ({ name: key, value }));
  const loopRows = Object.entries(runtime.loopCounts || {}).map(([key, value]) => ({ name: key, value }));
  return <section className="runtime-inspector" aria-label="Runtime variables, outputs and flow state">
    <div className="ri-section">
      <h4>Variables <small>{variableRows.length}</small></h4>
      {variableRows.length ? <table><thead><tr><th>Name</th><th>Type</th><th>Value</th></tr></thead>
        <tbody>{variableRows.map(row => <tr key={row.name}><td><code>{row.name}</code></td><td>{row.type}</td><td><code>{format(row.value)}</code></td></tr>)}</tbody></table>
        : <p className="muted">No protocol variables declared.</p>}
    </div>
    <div className="ri-section">
      <h4>Outputs <small>{outputRows.length}</small></h4>
      {outputRows.length ? <table><thead><tr><th>Port</th><th>Value</th></tr></thead>
        <tbody>{outputRows.map(row => <tr key={row.name}><td><code>{row.name}</code></td><td><code>{format(row.value)}</code></td></tr>)}</tbody></table>
        : <p className="muted">No node outputs yet.</p>}
    </div>
    <div className="ri-section ri-flow">
      <h4>Flow state</h4>
      <p><span>Status</span><b>{runtime.status}</b></p>
      <p><span>Current node</span><b>{runtime.currentNodeId ? nodes.get(runtime.currentNodeId)?.label || runtime.currentNodeId : '—'}</b></p>
      <p><span>Completed</span><b>{runtime.completedNodeIds.length}</b></p>
      <p><span>Skipped</span><b>{runtime.skippedNodeIds.length}</b></p>
      <p><span>Total attempts</span><b>{Object.values(runtime.attempts || {}).reduce((total, count) => total + count, 0)}</b></p>
      {loopRows.length > 0 && <p><span>Loop counts</span><b>{loopRows.map(row => `${row.name}×${format(row.value)}`).join(', ')}</b></p>}
    </div>
  </section>;
}
