import test from 'node:test';
import assert from 'node:assert/strict';
import { signalReadiness, canStartWithSignals } from '../src/operator/signalReadiness.js';
import { openRuntimeMonitor, OPERATOR_PROTOCOL } from '../src/operator/runtimeMonitor.js';
import { normalizeDeviceSnapshot } from '../src/operator/deviceSnapshot.js';
import { createDeviceMonitorBridge } from '../server/deviceMonitorBridge.mjs';

const channels = [{ id: 'eeg', connectorId: 'brainflow', required: true }, { id: 'optional', connectorId: 'other', required: false }];
const samples = Array.from({ length: 10 }, (_, i) => ({ eventType: 'device_sample_received', connector: { id: 'brainflow' }, timestampEpochMs: 1000 + i, payload: { channelId: 'eeg', value: i } }));
test('required signal checks reject stale, missing and flat channels separately', () => {
  assert(canStartWithSignals(signalReadiness(samples, channels, 1010)));
  assert.equal(signalReadiness(samples, channels, 6000)[0].status, 'stale');
  assert(!canStartWithSignals(signalReadiness([], channels, 1010)));
  assert.equal(signalReadiness(samples.map(s => ({ ...s, payload: { ...s.payload, value: 3 } })), channels, 1010)[0].status, 'flat');
  assert(!canStartWithSignals(signalReadiness(samples, [...channels, { id: 'ecg', connectorId: 'heart', required: true }], 1010)));
});

test('operator commands are bounded, deduplicated and restricted to pause/resume', () => {
  const commands = [], messages = [], channel = { postMessage: value => messages.push(value), close() {} };
  const monitor = openRuntimeMonitor({ sessionId: 'session', origin: 'https://pf.test', key: 'private-key', getSnapshot: () => ({ status: 'waiting' }), onCommand: c => commands.push(c), channelFactory: () => channel });
  assert.equal(new URL(monitor.url).pathname, '/operator'); assert.equal(new URL(monitor.url).search, '');
  const message = { protocol: OPERATOR_PROTOCOL, type: 'command', command: 'pause', id: '1', sentAt: Date.now() };
  channel.onmessage({ data: message }); channel.onmessage({ data: message });
  channel.onmessage({ data: { ...message, id: '2', command: 'delete' } });
  channel.onmessage({ data: { ...message, id: '3', sentAt: Date.now() - 10000 } });
  assert.deepEqual(commands, ['pause']); assert.equal(messages[0].status, 'waiting');
});

test('passive signal normalization identifies synthetic data and stale readings', () => {
  const input = { source: 'brainflow', snapshot: { boardId: -1, sampleRateHz: 250, lastSampleAgeMs: 4000, manifest: { channels: [{ id: 'eeg', direction: 'input' }] }, samples: Array.from({ length: 10 }, (_, i) => ({ timestamp: i, values: { eeg: i } })) } };
  const result = normalizeDeviceSnapshot(input); assert(result.synthetic); assert(!result.signals[0].ready);
  const legacy = normalizeDeviceSnapshot({ source: 'koguchi', snapshot: { openbci: { health: 'ok', source: 'udp', last_packet_age_sec: 0.2, received_channels: 2, configured_channels: 4, waveforms: [[1, 2, 3, 4, 5]] }, mybeat: { health: 'ok', hr_fresh: true, heart_rate_bpm: 0 } } });
  assert(!legacy.signals[0].ready); assert(!legacy.signals[1].ready);
});

test('configured device bridge isolates tenants and never forwards credentials in results', async () => {
  let requested;
  const bridge = createDeviceMonitorBridge({ sources: [{ actorId: 'a', tenantId: 'lab', kind: 'koguchi', baseUrl: 'http://127.0.0.1:8765', token: 'secret' }], fetchImpl: async (url, options) => { requested = { url, options }; return new Response(JSON.stringify({ recording: { active: true } })); } });
  await assert.rejects(bridge({ actorId: 'a', tenantId: 'other' }, 'koguchi'), e => e.status === 503);
  const result = await bridge({ actorId: 'a', tenantId: 'lab' }, 'koguchi');
  assert.equal(requested.url.pathname, '/api/snapshot'); assert.equal(requested.url.searchParams.get('token'), 'secret');
  assert(!JSON.stringify(result).includes('secret'));
});

test('formal preflight verifies all required connectors, sample rate and raw recording', async () => {
  const { experimentPreflight } = await import('../src/operator/experimentPreflight.js');
  const connector = { connectorId: 'org.physioflow.brainflow', transport: 'network', brainflow: { boardId: 0 }, channels: [{ id: 'eeg', direction: 'input', sampleRateHz: 250 }] };
  const protocol = { graph: { nodes: [{ config: { deviceConnectorId: connector.connectorId } }] }, deviceConnectors: [connector] };
  const checks = [{ connectorId: connector.connectorId, required: true, ready: true }];
  const session = { connector, status: 'connected', deviceDescriptor: { boardId: 0, sampleRateHz: 250, recordingActive: true } };
  const preflight = () => experimentPreflight(protocol, checks, [{ session }], { formal: true })[0];
  assert.equal(preflight().ready, true);
  session.deviceDescriptor.recordingActive = false;
  assert.match(preflight().reason, /recording/);
  session.deviceDescriptor.recordingActive = true; session.deviceDescriptor.sampleRateHz = 125;
  assert.match(preflight().reason, /sampling rate/);
  session.deviceDescriptor.boardId = -1;
  assert.match(preflight().reason, /Simulated/);
  assert.equal(experimentPreflight({ ...protocol, deviceConnectors: [] }, [], [], { formal: true })[0].ready, false);
});
test('a fresh steady heart rate is valid while flat EEG is blocked', () => {
  const hr = { id: 'hr', connectorId: 'heart', unit: 'bpm', required: true };
  const samples = [{ eventType: 'device_sample_received', connector: { id: 'heart' }, timestampEpochMs: 1000, payload: { channelId: 'hr', value: 70 } }];
  assert.equal(signalReadiness(samples, [hr], 1010)[0].ready, true);
});
